"""
ml/tune_ensemble_models.py - Hyperparameter Optimization & Ensemble Model Experiments
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Performs nested cross-validation across all 4 targets (Cath, LAD, LCX, RCA):
- Outer 5-fold Stratified CV for model evaluation.
- Inner 3-fold Stratified CV for hyperparameter optimization using ROC-AUC objective.
- Strict isolation of preprocessing to avoid data leakage.
- Evaluates 5 model approaches:
  1. Logistic Regression (Tuned regularization C, penalty, solver)
  2. Random Forest (Tuned tree count, depth, min leaf size, max features)
  3. Gradient Boosting (Tuned learning rate, tree count, depth, subsampling, min leaf size)
  4. Soft Voting Ensemble (Averages probability outputs of tuned base models)
  5. Stacking Ensemble (Meta-model Logistic Regression trained on out-of-fold probability predictions)
- Saves results to:
  - reports/ensemble_tuning_fold_results.csv
  - reports/ensemble_tuning_summary.csv
  - reports/ensemble_tuning_fold_params.json
"""

import os
import sys
import json
import argparse
import warnings
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, GridSearchCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, brier_score_loss, confusion_matrix
)
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, StackingClassifier
from sklearn.pipeline import Pipeline
from sklearn.base import clone

# Suppress sklearn future warnings for clean console outputs
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# Robust base directory resolution (Multimodal project root)
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from ml.transformers import TARGET_CONFIG, FORBIDDEN_FEATURES, build_preprocessor, get_feature_lists


def resolve_output_path(base_dir: Path, rel_path: str) -> Path:
    """
    Resolves destination path. If file already exists, appends timestamp to prevent overwriting.
    """
    target = base_dir / rel_path
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        return target
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    stem = target.stem
    suffix = target.suffix
    new_name = f"{stem}_{timestamp}{suffix}"
    return target.parent / new_name


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, Any]:
    """Calculates all 6 evaluation metrics and confusion matrix counts."""
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    auc = roc_auc_score(y_true, y_prob)
    brier = brier_score_loss(y_true, y_prob)
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])

    return {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1": round(float(f1), 4),
        "roc_auc": round(float(auc), 4),
        "brier_score": round(float(brier), 4),
        "tn": int(cm[0, 0]),
        "fp": int(cm[0, 1]),
        "fn": int(cm[1, 0]),
        "tp": int(cm[1, 1])
    }


def get_search_spaces(num_cols: List[str], cat_cols: List[str]):
    """
    Defines pipelines and search spaces for candidate models.
    """
    # 1. Logistic Regression
    lr_pipe = Pipeline([
        ("prep", build_preprocessor(num_cols, cat_cols)),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42))
    ])
    lr_param_grid = [
        {
            "clf__C": [0.01, 0.1, 1.0, 10.0],
            "clf__penalty": ["l2"],
            "clf__solver": ["lbfgs"]
        },
        {
            "clf__C": [0.01, 0.1, 1.0, 10.0],
            "clf__penalty": ["l1"],
            "clf__solver": ["liblinear"]
        },
        {
            "clf__C": [0.01, 0.1, 1.0, 10.0],
            "clf__penalty": ["l2"],
            "clf__solver": ["liblinear"]
        }
    ]

    # 2. Random Forest
    rf_pipe = Pipeline([
        ("prep", build_preprocessor(num_cols, cat_cols)),
        ("clf", RandomForestClassifier(class_weight="balanced", random_state=42))
    ])
    rf_param_grid = {
        "clf__n_estimators": [50, 100],
        "clf__max_depth": [3, 5],
        "clf__min_samples_leaf": [2, 4],
        "clf__max_features": ["sqrt", "log2"]
    }

    # 3. Gradient Boosting
    gb_pipe = Pipeline([
        ("prep", build_preprocessor(num_cols, cat_cols)),
        ("clf", GradientBoostingClassifier(random_state=42))
    ])
    gb_param_grid = {
        "clf__learning_rate": [0.03, 0.1],
        "clf__n_estimators": [50, 100],
        "clf__max_depth": [2, 3],
        "clf__subsample": [0.8, 1.0],
        "clf__min_samples_leaf": [2, 4]
    }

    return (
        (lr_pipe, lr_param_grid, "LogisticRegression"),
        (rf_pipe, rf_param_grid, "RandomForest"),
        (gb_pipe, gb_param_grid, "GradientBoosting")
    )


def run_experiment(targets: List[str] = None, n_jobs: int = -1):
    """
    Executes nested CV hyperparameter tuning and ensemble experiments.
    """
    data_path = BASE_DIR / "data" / "processed" / "cad_clean.csv"
    meta_path = BASE_DIR / "data" / "processed" / "feature_metadata.csv"

    if not data_path.exists():
        raise FileNotFoundError(f"Cleaned dataset not found at: {data_path}")
    if not meta_path.exists():
        raise FileNotFoundError(f"Feature metadata not found at: {meta_path}")

    print("================================================================================")
    print(" Multimodal AI Research - Nested CV Hyperparameter Tuning & Ensemble Evaluation")
    print("================================================================================")
    print(f"Dataset: {data_path}")
    print(f"Metadata: {meta_path}")

    df = pd.read_csv(data_path)
    meta_df = pd.read_csv(meta_path)

    # 1. Verify permitted features and enforce zero leakage
    num_cols, cat_cols = get_feature_lists(meta_df)
    feature_cols = num_cols + cat_cols

    for f in FORBIDDEN_FEATURES:
        assert f not in feature_cols, f"CRITICAL LEAKAGE: Forbidden feature '{f}' found in features!"
        assert f not in num_cols, f"CRITICAL LEAKAGE: Forbidden feature '{f}' found in num_cols!"
        assert f not in cat_cols, f"CRITICAL LEAKAGE: Forbidden feature '{f}' found in cat_cols!"
    assert len(feature_cols) == 54, f"Expected 54 features, found {len(feature_cols)}"
    print(f"Verified input feature count: {len(feature_cols)} (Numerical: {len(num_cols)}, Categorical: {len(cat_cols)})")
    print("Target-leakage exclusions verified for Cath, LAD, LCX, RCA, and Exertional CP.\n")

    X = df[feature_cols]

    if targets is None:
        targets = list(TARGET_CONFIG.keys())

    outer_skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    fold_results: List[Dict[str, Any]] = []
    summary_results: List[Dict[str, Any]] = []
    best_params_record: Dict[str, Any] = {}

    for target_name in targets:
        target_info = TARGET_CONFIG[target_name]
        pos_val = target_info["positive_label"]
        neg_val = target_info["negative_label"]
        y = (df[target_name] == pos_val).astype(int).values

        pos_count = int(y.sum())
        total_count = len(y)
        pos_pct = (pos_count / total_count) * 100.0

        print(f"\n================================================================================")
        print(f" TARGET: {target_name} ({target_info['description']})")
        print(f" Distribution: '{pos_val}' (1) = {pos_count} ({pos_pct:.1f}%) | '{neg_val}' (0) = {total_count - pos_count} ({100 - pos_pct:.1f}%)")
        print(f"================================================================================")

        best_params_record[target_name] = {}

        # Dictionary tracking metrics per model across 5 folds
        target_model_metrics: Dict[str, List[Dict[str, Any]]] = {
            "LogisticRegression": [],
            "RandomForest": [],
            "GradientBoosting": [],
            "SoftVoting": [],
            "Stacking": []
        }

        for fold_idx, (train_idx, test_idx) in enumerate(outer_skf.split(X, y), 1):
            fold_key = f"fold_{fold_idx}"
            best_params_record[target_name][fold_key] = {}

            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y[train_idx], y[test_idx]

            print(f"\n--- [Target: {target_name}] Outer Fold {fold_idx}/5 (Train: {len(train_idx)}, Test: {len(test_idx)}) ---")

            inner_cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
            (lr_pipe, lr_grid, lr_name), (rf_pipe, rf_grid, rf_name), (gb_pipe, gb_grid, gb_name) = get_search_spaces(num_cols, cat_cols)

            # --- Base Model 1: Logistic Regression ---
            gs_lr = GridSearchCV(
                estimator=lr_pipe,
                param_grid=lr_grid,
                cv=inner_cv,
                scoring="roc_auc",
                n_jobs=n_jobs,
                refit=True
            )
            gs_lr.fit(X_train, y_train)
            best_lr = gs_lr.best_estimator_
            best_params_record[target_name][fold_key]["LogisticRegression"] = {
                "best_params": gs_lr.best_params_,
                "inner_cv_best_roc_auc": round(float(gs_lr.best_score_), 4)
            }

            # Evaluate LR on outer test fold
            prob_lr = best_lr.predict_proba(X_test)[:, 1]
            pred_lr = (prob_lr >= 0.5).astype(int)
            m_lr = compute_metrics(y_test, pred_lr, prob_lr)
            target_model_metrics["LogisticRegression"].append(m_lr)
            fold_results.append({
                "target": target_name, "model": "LogisticRegression", "fold": fold_idx, **m_lr
            })

            # --- Base Model 2: Random Forest ---
            gs_rf = GridSearchCV(
                estimator=rf_pipe,
                param_grid=rf_grid,
                cv=inner_cv,
                scoring="roc_auc",
                n_jobs=n_jobs,
                refit=True
            )
            gs_rf.fit(X_train, y_train)
            best_rf = gs_rf.best_estimator_
            best_params_record[target_name][fold_key]["RandomForest"] = {
                "best_params": gs_rf.best_params_,
                "inner_cv_best_roc_auc": round(float(gs_rf.best_score_), 4)
            }

            # Evaluate RF on outer test fold
            prob_rf = best_rf.predict_proba(X_test)[:, 1]
            pred_rf = (prob_rf >= 0.5).astype(int)
            m_rf = compute_metrics(y_test, pred_rf, prob_rf)
            target_model_metrics["RandomForest"].append(m_rf)
            fold_results.append({
                "target": target_name, "model": "RandomForest", "fold": fold_idx, **m_rf
            })

            # --- Base Model 3: Gradient Boosting ---
            gs_gb = GridSearchCV(
                estimator=gb_pipe,
                param_grid=gb_grid,
                cv=inner_cv,
                scoring="roc_auc",
                n_jobs=n_jobs,
                refit=True
            )
            gs_gb.fit(X_train, y_train)
            best_gb = gs_gb.best_estimator_
            best_params_record[target_name][fold_key]["GradientBoosting"] = {
                "best_params": gs_gb.best_params_,
                "inner_cv_best_roc_auc": round(float(gs_gb.best_score_), 4)
            }

            # Evaluate GB on outer test fold
            prob_gb = best_gb.predict_proba(X_test)[:, 1]
            pred_gb = (prob_gb >= 0.5).astype(int)
            m_gb = compute_metrics(y_test, pred_gb, prob_gb)
            target_model_metrics["GradientBoosting"].append(m_gb)
            fold_results.append({
                "target": target_name, "model": "GradientBoosting", "fold": fold_idx, **m_gb
            })

            # --- Model 4: Soft Voting Ensemble ---
            # Combines the three tuned base pipelines via equal-weighted average of predicted probabilities
            prob_vote = (prob_lr + prob_rf + prob_gb) / 3.0
            pred_vote = (prob_vote >= 0.5).astype(int)
            m_vote = compute_metrics(y_test, pred_vote, prob_vote)
            target_model_metrics["SoftVoting"].append(m_vote)
            fold_results.append({
                "target": target_name, "model": "SoftVoting", "fold": fold_idx, **m_vote
            })
            best_params_record[target_name][fold_key]["SoftVoting"] = {
                "combination_type": "Equal-weight Soft Voting (Mean predicted probability)",
                "base_models": ["LogisticRegression", "RandomForest", "GradientBoosting"],
                "weights": [0.3333, 0.3333, 0.3333]
            }

            # --- Model 5: Stacking Ensemble ---
            # Stacking combines tuned base models using Logistic Regression meta-model.
            # CRITICAL ZERO-LEAKAGE DESIGN:
            # 1. Base models are cloned so their hyperparameters are preserved.
            # 2. Meta-model is trained strictly on 3-fold out-of-fold probability predictions on X_train.
            # 3. Outer test fold (X_test, y_test) is NEVER used for fitting base models or meta-model.
            stacking_cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
            meta_clf = LogisticRegression(class_weight="balanced", random_state=42, max_iter=1000)

            stacking_pipe = StackingClassifier(
                estimators=[
                    ("lr", clone(best_lr)),
                    ("rf", clone(best_rf)),
                    ("gb", clone(best_gb))
                ],
                final_estimator=meta_clf,
                cv=stacking_cv,
                stack_method="predict_proba",
                n_jobs=n_jobs
            )
            stacking_pipe.fit(X_train, y_train)

            # Evaluate Stacking on outer test fold
            prob_stack = stacking_pipe.predict_proba(X_test)[:, 1]
            pred_stack = (prob_stack >= 0.5).astype(int)
            m_stack = compute_metrics(y_test, pred_stack, prob_stack)
            target_model_metrics["Stacking"].append(m_stack)
            fold_results.append({
                "target": target_name, "model": "Stacking", "fold": fold_idx, **m_stack
            })

            # Record meta-model coefficients
            meta_estimator = stacking_pipe.final_estimator_
            meta_coefs = meta_estimator.coef_[0].tolist() if hasattr(meta_estimator, "coef_") else []
            meta_intercept = float(meta_estimator.intercept_[0]) if hasattr(meta_estimator, "intercept_") else 0.0

            best_params_record[target_name][fold_key]["Stacking"] = {
                "meta_model_type": "LogisticRegression(class_weight='balanced')",
                "cv_method": "3-Fold Stratified Out-Of-Fold probability generation on X_train",
                "meta_coefficients": {
                    "lr_weight": round(float(meta_coefs[0]), 4) if len(meta_coefs) > 0 else None,
                    "rf_weight": round(float(meta_coefs[1]), 4) if len(meta_coefs) > 1 else None,
                    "gb_weight": round(float(meta_coefs[2]), 4) if len(meta_coefs) > 2 else None,
                    "intercept": round(meta_intercept, 4)
                }
            }

            print(f"  Fold {fold_idx} Test AUCs -> LR: {m_lr['roc_auc']:.3f} | RF: {m_rf['roc_auc']:.3f} | GB: {m_gb['roc_auc']:.3f} | Vote: {m_vote['roc_auc']:.3f} | Stack: {m_stack['roc_auc']:.3f}")

        # Compute summary statistics across 5 folds for this target
        print(f"\nTarget {target_name} - 5-Fold Summary (Mean ± Std):")
        print(f"{'Model':<20s} | {'ROC-AUC':<15s} | {'Accuracy':<15s} | {'Recall':<15s} | {'Precision':<15s} | {'F1-Score':<15s} | {'Brier':<10s}")
        print("-" * 105)

        for model_name, metrics_list in target_model_metrics.items():
            accs = [m["accuracy"] for m in metrics_list]
            precs = [m["precision"] for m in metrics_list]
            recs = [m["recall"] for m in metrics_list]
            f1s = [m["f1"] for m in metrics_list]
            aucs = [m["roc_auc"] for m in metrics_list]
            briers = [m["brier_score"] for m in metrics_list]
            tot_tn = sum(m["tn"] for m in metrics_list)
            tot_fp = sum(m["fp"] for m in metrics_list)
            tot_fn = sum(m["fn"] for m in metrics_list)
            tot_tp = sum(m["tp"] for m in metrics_list)

            m_acc, s_acc = float(np.mean(accs)), float(np.std(accs))
            m_prec, s_prec = float(np.mean(precs)), float(np.std(precs))
            m_rec, s_rec = float(np.mean(recs)), float(np.std(recs))
            m_f1, s_f1 = float(np.mean(f1s)), float(np.std(f1s))
            m_auc, s_auc = float(np.mean(aucs)), float(np.std(aucs))
            m_brier, s_brier = float(np.mean(briers)), float(np.std(briers))

            summary_results.append({
                "target": target_name,
                "model": model_name,
                "mean_accuracy": round(m_acc, 4),
                "std_accuracy": round(s_acc, 4),
                "mean_precision": round(m_prec, 4),
                "std_precision": round(s_prec, 4),
                "mean_recall": round(m_rec, 4),
                "std_recall": round(s_rec, 4),
                "mean_f1": round(m_f1, 4),
                "std_f1": round(s_f1, 4),
                "mean_roc_auc": round(m_auc, 4),
                "std_roc_auc": round(s_auc, 4),
                "mean_brier_score": round(m_brier, 4),
                "std_brier_score": round(s_brier, 4),
                "total_tn": tot_tn,
                "total_fp": tot_fp,
                "total_fn": tot_fn,
                "total_tp": tot_tp
            })

            print(f"{model_name:<20s} | {m_auc:.3f} ± {s_auc:.3f} | {m_acc:.3f} ± {s_acc:.3f} | {m_rec:.3f} ± {s_rec:.3f} | {m_prec:.3f} ± {s_prec:.3f} | {m_f1:.3f} ± {s_f1:.3f} | {m_brier:.3f}")

    # --- Write Outputs Strictly Without Overwriting Pre-existing Files ---
    fold_csv_path = resolve_output_path(BASE_DIR, "reports/ensemble_tuning_fold_results.csv")
    summary_csv_path = resolve_output_path(BASE_DIR, "reports/ensemble_tuning_summary.csv")
    params_json_path = resolve_output_path(BASE_DIR, "reports/ensemble_tuning_fold_params.json")

    df_folds = pd.DataFrame(fold_results)
    df_folds.to_csv(fold_csv_path, index=False)
    print(f"\nFold-by-fold results saved to: {fold_csv_path}")

    df_summary = pd.DataFrame(summary_results)
    df_summary.to_csv(summary_csv_path, index=False)
    print(f"Summary metrics saved to: {summary_csv_path}")

    with open(params_json_path, "w", encoding="utf-8") as f:
        json.dump(best_params_record, f, indent=2)
    print(f"Tuned hyperparameters per fold saved to: {params_json_path}")

    print("\n================================================================================")
    print(" Hyperparameter Optimization & Ensemble Evaluation Completed Successfully")
    print("================================================================================")
    return fold_csv_path, summary_csv_path, params_json_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Hyperparameter Optimization & Ensemble Model Experiments")
    parser.add_argument("--targets", nargs="+", choices=["Cath", "LAD", "LCX", "RCA"], default=None,
                        help="Specific target(s) to evaluate (default: all 4 targets)")
    parser.add_argument("--n-jobs", type=int, default=-1,
                        help="Number of parallel worker processes (-1 uses all cores)")
    args = parser.parse_args()

    run_experiment(targets=args.targets, n_jobs=args.n_jobs)
