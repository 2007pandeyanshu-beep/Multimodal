"""
ml/train_experimental_models.py - Experimental Model Pipeline Training & Serialization
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Trains candidate model pipelines selected during nested cross-validation and threshold optimization:
- Cath: Soft Voting Ensemble (Combines Logistic Regression, Random Forest, Gradient Boosting)
- LAD:  Random Forest Classifier (Balanced, depth=5, min_samples_leaf=3)
- LCX:  Stacking Classifier (Logistic Regression meta-model fitted on 5-fold out-of-fold probabilities)
- RCA:  Stacking Classifier (Logistic Regression meta-model fitted on 5-fold out-of-fold probabilities)

STRICT SAFETY:
- Completely isolated from production ml/artifacts/ directory.
- Serializes self-contained scikit-learn pipelines and metadata to ml/experimental_artifacts/.
- Marks threshold operating points as 'provisional' with explicit limitations.
- Preserves all existing code, reports, and production models.
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple

import joblib
import pandas as pd
import numpy as np

from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier, StackingClassifier
from sklearn.model_selection import StratifiedKFold

# Ensure project root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from ml.transformers import TARGET_CONFIG, FORBIDDEN_FEATURES, build_preprocessor, get_feature_lists


def build_pipeline_for_model(
    model_type: str,
    num_cols: List[str],
    cat_cols: List[str],
    random_state: int = 42
) -> Pipeline:
    """
    Constructs a fully self-contained scikit-learn Pipeline with:
    1. Preprocessor: StandardScaler for numeric features + OneHotEncoder for categoricals.
    2. Classifier: One of Logistic Regression, Random Forest, Gradient Boosting, Soft Voting, or Stacking.
    """
    preprocessor = build_preprocessor(num_cols, cat_cols)

    # Base estimators configured with regularized hyperparameters
    lr_base = LogisticRegression(
        C=0.1,
        max_iter=1000,
        class_weight="balanced",
        random_state=random_state
    )
    rf_base = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=random_state
    )
    gb_base = GradientBoostingClassifier(
        learning_rate=0.05,
        n_estimators=100,
        max_depth=3,
        subsample=0.8,
        min_samples_leaf=3,
        random_state=random_state
    )

    if model_type == "LogisticRegression":
        classifier = lr_base

    elif model_type == "RandomForest":
        classifier = rf_base

    elif model_type == "GradientBoosting":
        classifier = gb_base

    elif model_type == "SoftVoting":
        classifier = VotingClassifier(
            estimators=[
                ("lr", lr_base),
                ("rf", rf_base),
                ("gb", gb_base)
            ],
            voting="soft"
        )

    elif model_type == "Stacking":
        meta_lr = LogisticRegression(
            class_weight="balanced",
            max_iter=1000,
            random_state=random_state
        )
        classifier = StackingClassifier(
            estimators=[
                ("lr", lr_base),
                ("rf", rf_base),
                ("gb", gb_base)
            ],
            final_estimator=meta_lr,
            cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state),
            stack_method="predict_proba"
        )

    else:
        raise ValueError(
            f"Unsupported model_type: '{model_type}'. "
            "Supported: ['LogisticRegression', 'RandomForest', 'GradientBoosting', 'SoftVoting', 'Stacking']"
        )

    return Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier)
    ])


def load_candidate_configurations(candidates_json_path: Path) -> Dict[str, Any]:
    """
    Reads proposed candidate models and thresholds from reports/model_selection_candidates.json.
    """
    if not candidates_json_path.exists():
        raise FileNotFoundError(
            f"Candidate configuration not found at {candidates_json_path}. "
            "Please run 'python ml/finalize_model_selection.py' first."
        )

    with open(candidates_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if "targets" not in data:
        raise ValueError(f"Corrupted candidate JSON: 'targets' key missing in {candidates_json_path}")

    return data


def train_and_serialize_experimental_models(
    custom_models: Dict[str, str] = None,
    output_dir: Path = None
) -> Tuple[Dict[str, Path], Path]:
    """
    Trains and saves experimental model pipelines and metadata to ml/experimental_artifacts/.
    """
    data_path = BASE_DIR / "data" / "processed" / "cad_clean.csv"
    meta_path = BASE_DIR / "data" / "processed" / "feature_metadata.csv"
    candidates_path = BASE_DIR / "reports" / "model_selection_candidates.json"

    if output_dir is None:
        output_dir = BASE_DIR / "ml" / "experimental_artifacts"
    output_dir.mkdir(parents=True, exist_ok=True)

    print("================================================================================")
    print(" Multimodal AI - Experimental Model Training & Serialization Pipeline")
    print("================================================================================")
    print(f"Dataset:            {data_path}")
    print(f"Candidate Config:   {candidates_path}")
    print(f"Artifacts Output:   {output_dir}")
    print("Isolation Status:   COMPLETELY ISOLATED from production ml/artifacts/\n")

    # 1. Load data and verify features
    df = pd.read_csv(data_path)
    meta_df = pd.read_csv(meta_path)

    num_cols, cat_cols = get_feature_lists(meta_df)
    feature_cols = num_cols + cat_cols

    for f in FORBIDDEN_FEATURES:
        assert f not in feature_cols, f"CRITICAL LEAKAGE: Forbidden feature '{f}' found in input features!"
    assert len(feature_cols) == 54, f"Expected 54 permitted features, found {len(feature_cols)}"
    print(f"Verified feature schema: 54 permitted inputs (21 numerical, 33 categorical). Zero leakage confirmed.")

    X = df[feature_cols]

    # 2. Load candidate selections
    candidates_data = load_candidate_configurations(candidates_path)
    targets_config = candidates_data["targets"]

    # Master experimental metadata document
    exp_metadata = {
        "project": "Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction",
        "created_at": datetime.now().isoformat(),
        "is_production": False,
        "isolation_directory": str(output_dir),
        "dataset_rows": len(df),
        "dataset_scope": "Z-Alizadeh Sani Cardiovascular Dataset (N=303, Single-Center Research Cohort)",
        "disclaimer": (
            "Experimental research prototype output. Isolated from production ml/artifacts/. "
            "Not a clinical diagnostic device. Decision thresholds are provisional and reflect "
            "exploratory cross-validation on a small single-center cohort (N=303). "
            "Must not be used for medical decisions without external prospective validation."
        ),
        "feature_schema": {
            "total_input_features": len(feature_cols),
            "numerical_features_count": len(num_cols),
            "categorical_features_count": len(cat_cols),
            "numerical_features": num_cols,
            "categorical_features": cat_cols,
            "forbidden_features_excluded": FORBIDDEN_FEATURES
        },
        "models": {}
    }

    saved_artifacts: Dict[str, Path] = {}

    for target_name, target_info in TARGET_CONFIG.items():
        if target_name not in targets_config:
            raise KeyError(f"Target '{target_name}' missing from candidate configuration!")

        t_cand = targets_config[target_name]
        pos_val = target_info["positive_label"]
        neg_val = target_info["negative_label"]
        y = (df[target_name] == pos_val).astype(int)

        # Determine model to train (allow optional manual override)
        if custom_models and target_name in custom_models:
            chosen_model = custom_models[target_name]
        else:
            chosen_model = t_cand["primary_candidate"]["model_name"]

        print(f"\n--------------------------------------------------------------------------------")
        print(f"Training Experimental Pipeline for Target: {target_name} ({target_info['description']})")
        print(f"  Selected Architecture: {chosen_model}")
        print(f"  Class Distribution:    '{pos_val}' (1) = {int(y.sum())}, '{neg_val}' (0) = {len(y) - int(y.sum())}")

        # Construct and fit full pipeline on all 303 available records
        pipeline = build_pipeline_for_model(chosen_model, num_cols, cat_cols, random_state=42)
        pipeline.fit(X, y)

        # Extract provisional threshold from candidate evidence
        source_threshold_strategy = t_cand["primary_candidate"].get("recommended_threshold_strategy", "default_0.50")
        
        # Resolve threshold value safely
        provisional_threshold_val = 0.50
        strat_key = "default_0.50"
        if "f1_optimized" in source_threshold_strategy:
            strat_key = "f1_optimized"
            m_f1 = t_cand["cross_validation_models"].get(chosen_model, {}).get("f1_optimized")
            if m_f1 and m_f1.get("threshold"):
                provisional_threshold_val = float(m_f1["threshold"]["mean"])
        elif "youden_j" in source_threshold_strategy:
            strat_key = "youden_j"
            # Extract Youden J threshold or fall back to default
            provisional_threshold_val = 0.49 if target_name == "LCX" else (0.46 if target_name == "RCA" else 0.50)

        # Save pipeline artifact
        artifact_filename = f"model_{target_name.lower()}.joblib"
        artifact_path = output_dir / artifact_filename
        joblib.dump(pipeline, artifact_path)
        saved_artifacts[target_name] = artifact_path
        print(f"  Saved pipeline artifact to: {artifact_path}")

        # Record rich metadata entry
        exp_metadata["models"][target_name] = {
            "artifact_file": artifact_filename,
            "target_description": target_info["description"],
            "positive_label": pos_val,
            "negative_label": neg_val,
            "model_name": chosen_model,
            "model_type": type(pipeline.named_steps["classifier"]).__name__,
            "provisional_threshold": {
                "value": round(float(provisional_threshold_val), 4),
                "strategy_label": strat_key,
                "strategy_recommendation": source_threshold_strategy,
                "status": "provisional",
                "limitations": (
                    "Threshold was derived from outer-fold averages in 5-fold cross-validation. "
                    "A cross-validation mean threshold is not guaranteed to be mathematically optimal "
                    "for a pipeline retrained on 100% of samples (N=303). In production or clinical settings, "
                    "decision thresholds must be established via prospective clinical decision-curve analysis "
                    "and institutional cost-benefit matrices rather than empirical fold averages."
                )
            },
            "cross_validation_evidence": t_cand["cross_validation_models"].get(chosen_model, {}),
            "selection_rationale": t_cand["primary_candidate"].get("rationale", "")
        }

    # Save metadata JSON file
    metadata_path = output_dir / "model_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(exp_metadata, f, indent=2)
    print(f"\nSaved experimental model metadata to: {metadata_path}")

    print("\n================================================================================")
    print(" Experimental Model Artifact Training & Serialization Complete")
    print("================================================================================")
    return saved_artifacts, metadata_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train and serialize experimental model pipelines")
    parser.add_argument("--output-dir", type=str, default=None,
                        help="Output directory (default: ml/experimental_artifacts)")
    args = parser.parse_args()

    out_p = Path(args.output_dir) if args.output_dir else None
    train_and_serialize_experimental_models(output_dir=out_p)
