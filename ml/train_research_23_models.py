"""
ml/train_research_23_models.py - Augmented_23 Research Candidate Pipeline Serialization
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Fits and serializes the four provisional research candidate models on the 23-feature schema:
1. Cath: Soft Voting Ensemble (Logistic Regression + Random Forest + Gradient Boosting)
2. LAD:  Random Forest Classifier (Balanced, max_depth=5, min_samples_leaf=3)
3. LCX:  Random Forest Classifier (Balanced, max_depth=5, min_samples_leaf=3)
4. RCA:  Stacking Classifier (Logistic Regression meta-learner over LR + RF + GB)

STRICT SAFETY & GOVERNANCE RULES:
- Physical Isolation: Outputs strictly to ml/research_artifacts_23/.
- Invariant Guards: Zero assert statements; all validations use explicit exceptions (active under -O/-OO).
- Safe Publication: Writes to a unique tempfile-managed staging folder. Never deletes pre-existing dirs.
- Reload Sanity: Reloads each staged model from disk and verifies predict() and predict_proba() before publishing.
- Failure-Safe Rollback: If replacing existing artifacts under --overwrite, preserves recoverable backup until verified.
- Overwrite Refusal: Refuses overwrite by default; requires explicit --overwrite.
- Target Label Validation: Strictly verifies string labels in dataset before binarizing; fails closed on anomalies.
- Metadata Lineage: Records exact 23-feature order, dataset SHA-256, library versions, seed=42, and disclaimers.
- Delineation: Clearly identifies final refit on all 303 records as weight serialization, NOT prospective validation.
"""

import sys
import os
import json
import shutil
import hashlib
import tempfile
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple

import joblib
import pandas as pd
import numpy as np
import sklearn

from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    VotingClassifier,
    StackingClassifier
)
from sklearn.model_selection import StratifiedKFold
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.transformers import StringCastTransformer, FORBIDDEN_FEATURES

# Fixed repository paths
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "cad_clean.csv"
META_PATH = PROJECT_ROOT / "data" / "processed" / "feature_metadata.csv"
FEATURE_LISTS_PATH = (
    PROJECT_ROOT / "experiments" / "feature_selection" / "repeated_cv" / "results" / "feature_lists.json"
)
AUDIT_METRICS_PATH = (
    PROJECT_ROOT / "experiments" / "model_comparison_audit" / "audit_summary_metrics.csv"
)

# Protected artifact paths
PROD_ARTIFACTS_DIR = (PROJECT_ROOT / "ml" / "artifacts").resolve()
EXP_ARTIFACTS_DIR = (PROJECT_ROOT / "ml" / "experimental_artifacts").resolve()
RESEARCH_ARTIFACTS_DIR = (PROJECT_ROOT / "ml" / "research_artifacts_23").resolve()

# Target and estimator configurations selected by audit
CANDIDATE_CONFIG = {
    "Cath": {
        "positive_label": "CAD",
        "negative_label": "Normal",
        "model_type": "SoftVoting",
        "description": "Overall Coronary Artery Disease (Catheterization outcome)",
        "selection_rationale": "Soft Voting improves sensitivity to 89.81% (-42 missed CAD cases across 25 folds vs Production RF)."
    },
    "LAD": {
        "positive_label": "Stenotic",
        "negative_label": "Normal",
        "model_type": "RandomForest",
        "description": "Left Anterior Descending Stenosis (>=50% occlusion)",
        "selection_rationale": "Random Forest provides balanced anterior sensitivity (81.72%) without ensemble complexity; avoids Stacking sensitivity collapse."
    },
    "LCX": {
        "positive_label": "Stenotic",
        "negative_label": "Normal",
        "model_type": "RandomForest",
        "description": "Left Circumflex Stenosis (>=50% occlusion)",
        "selection_rationale": "Random Forest on 23 features improves sensitivity to 67.22% (-21 missed cases vs 54-feat RF) with lower Brier score than Stacking."
    },
    "RCA": {
        "positive_label": "Stenotic",
        "negative_label": "Normal",
        "model_type": "Stacking",
        "description": "Right Coronary Artery Stenosis (>=50% occlusion)",
        "selection_rationale": "Stacking achieves project-highest RCA discrimination (ROC-AUC 0.7463), cutting missed cases by 26 vs Prod RF. Exploratory result."
    }
}

SEED = 42


def compute_sha256(filepath: Path) -> str:
    """Computes SHA-256 hash of a file for lineage tracking."""
    if not filepath.exists():
        raise FileNotFoundError(f"Cannot compute hash; file does not exist: {filepath}")
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def enforce_isolation_guards(target_dir: Path):
    """
    Enforces strict physical directory isolation without assertions.
    Active regardless of Python optimization flags.
    """
    resolved_target = target_dir.resolve()

    if resolved_target == PROD_ARTIFACTS_DIR:
        raise PermissionError(
            f"SECURITY VIOLATION: Refusing to write to production artifacts directory: {resolved_target}"
        )
    if resolved_target == EXP_ARTIFACTS_DIR:
        raise PermissionError(
            f"SECURITY VIOLATION: Refusing to write to experimental artifacts directory: {resolved_target}"
        )
    if resolved_target != RESEARCH_ARTIFACTS_DIR:
        raise ValueError(
            f"CONFIGURATION ERROR: Destination '{resolved_target}' must strictly resolve to '{RESEARCH_ARTIFACTS_DIR}'."
        )

    # Ensure no hierarchical overlap
    if PROD_ARTIFACTS_DIR in resolved_target.parents or resolved_target in PROD_ARTIFACTS_DIR.parents:
        raise PermissionError("Path hierarchy collision with production artifacts directory.")
    if EXP_ARTIFACTS_DIR in resolved_target.parents or resolved_target in EXP_ARTIFACTS_DIR.parents:
        raise PermissionError("Path hierarchy collision with experimental artifacts directory.")


def load_and_validate_features(
    feature_lists_path: Path,
    meta_df: pd.DataFrame,
    df: pd.DataFrame
) -> Tuple[List[str], List[str], List[str]]:
    """
    Loads Augmented_23 features from manifest and performs strict schema validation:
    - Exactly 23 features.
    - No duplicates in manifest or metadata.
    - Zero forbidden or target feature leakage.
    - Unambiguous boolean categorical types.
    - Exactly 13 numerical and 10 categorical columns.
    - Verified numeric dtypes in pandas DataFrame.
    """
    if not feature_lists_path.exists():
        raise FileNotFoundError(f"Feature manifest missing: {feature_lists_path}")

    with open(feature_lists_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    if "Augmented_23" not in manifest:
        raise KeyError(f"'Augmented_23' feature list not found in {feature_lists_path}")

    features = manifest["Augmented_23"]

    if len(features) != 23:
        raise ValueError(f"Feature count mismatch: expected 23 features, found {len(features)}")

    if len(set(features)) != 23:
        duplicates = [x for x in features if features.count(x) > 1]
        raise ValueError(f"Duplicate features detected in Augmented_23 manifest: {set(duplicates)}")

    # Check forbidden feature leakage
    for forbidden in FORBIDDEN_FEATURES:
        if forbidden in features:
            raise ValueError(f"LEAKAGE DETECTED: Forbidden feature '{forbidden}' present in feature list!")

    # Check duplicate feature names in metadata
    if not meta_df["feature_name"].is_unique:
        dup_meta = meta_df[meta_df["feature_name"].duplicated()]["feature_name"].tolist()
        raise ValueError(f"Duplicate feature_name entries found in feature_metadata.csv: {dup_meta}")

    meta_indexed = meta_df.set_index("feature_name")

    # Verify every feature exists in dataset and metadata, with unambiguous categorical type
    num_cols = []
    cat_cols = []

    for feat in features:
        if feat not in df.columns:
            raise KeyError(f"Feature '{feat}' missing from dataset cad_clean.csv.")
        if feat not in meta_indexed.index:
            raise KeyError(f"Feature '{feat}' missing from metadata feature_metadata.csv.")

        val = meta_indexed.loc[feat, "is_categorical"]

        if isinstance(val, (bool, np.bool_)):
            is_cat = bool(val)
        elif str(val).strip().lower() in ("true", "1"):
            is_cat = True
        elif str(val).strip().lower() in ("false", "0"):
            is_cat = False
        else:
            raise TypeError(f"Ambiguous, missing, or non-boolean 'is_categorical' value for '{feat}': {val!r}")

        if is_cat:
            cat_cols.append(feat)
        else:
            num_cols.append(feat)

    if len(num_cols) != 13:
        raise ValueError(f"Expected 13 numerical features, but identified {len(num_cols)}: {num_cols}")
    if len(cat_cols) != 10:
        raise ValueError(f"Expected 10 categorical features, but identified {len(cat_cols)}: {cat_cols}")

    # Validate numeric column datatypes in pandas DataFrame
    for col in num_cols:
        if not np.issubdtype(df[col].dtype, np.number):
            raise TypeError(f"Numerical feature '{col}' has non-numeric dtype: {df[col].dtype}")

    return features, num_cols, cat_cols


def validate_and_binarize_target(df: pd.DataFrame, target: str, config: Dict[str, Any]) -> np.ndarray:
    """
    Validates actual unique values in the dataset against expected labels
    before creating binary target arrays. Never guesses or silently falls back.
    """
    if target not in df.columns:
        raise KeyError(f"Target column '{target}' not found in dataset columns.")

    series = df[target]
    if series.isnull().any():
        raise ValueError(f"Target column '{target}' contains {series.isnull().sum()} null values.")

    actual_values = set(series.unique())
    expected_values = {config["positive_label"], config["negative_label"]}

    if actual_values != expected_values:
        raise ValueError(
            f"Target label mismatch on '{target}': expected {expected_values}, "
            f"but found actual unique values: {actual_values}"
        )

    pos_label = config["positive_label"]
    neg_label = config["negative_label"]
    y = series.map({pos_label: 1, neg_label: 0}).values

    if set(np.unique(y)) != {0, 1}:
        raise ValueError(f"Binarization failed for '{target}'; unique binary classes: {set(np.unique(y))}")

    return y


def build_preprocessor(num_cols: List[str], cat_cols: List[str]) -> ColumnTransformer:
    """Constructs the exact leakage-safe ColumnTransformer verified in cross-validation."""
    transformers = [
        ("num", StandardScaler(), num_cols),
        ("cat", Pipeline([
            ("to_str", StringCastTransformer()),
            ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ]), cat_cols)
    ]
    return ColumnTransformer(transformers=transformers, remainder="drop")


def build_candidate_pipeline(
    model_type: str,
    num_cols: List[str],
    cat_cols: List[str],
    seed: int = SEED
) -> Pipeline:
    """Builds scikit-learn pipeline using verified estimator hyperparameters."""
    preprocessor = build_preprocessor(num_cols, cat_cols)

    lr_base = LogisticRegression(
        C=0.1,
        max_iter=1000,
        class_weight="balanced",
        random_state=seed
    )
    rf_base = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=seed
    )
    gb_base = GradientBoostingClassifier(
        learning_rate=0.05,
        n_estimators=100,
        max_depth=3,
        subsample=0.8,
        min_samples_leaf=3,
        random_state=seed
    )

    if model_type == "RandomForest":
        classifier = rf_base

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
        # Note: meta_lr uses default C=1.0 per audit benchmark
        meta_lr = LogisticRegression(
            class_weight="balanced",
            max_iter=1000,
            random_state=seed
        )
        classifier = StackingClassifier(
            estimators=[
                ("lr", lr_base),
                ("rf", rf_base),
                ("gb", gb_base)
            ],
            final_estimator=meta_lr,
            cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=seed),
            stack_method="predict_proba",
            passthrough=False
        )

    else:
        raise ValueError(f"Unsupported model_type: '{model_type}'")

    return Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier)
    ])


def load_exact_cv_metrics(audit_csv_path: Path) -> Dict[str, Dict[str, Any]]:
    """
    Loads matching 25-fold CV metrics from audit_summary_metrics.csv.
    Enforces exact single-row matches; errors if missing or duplicated.
    """
    if not audit_csv_path.exists():
        raise FileNotFoundError(f"Audit summary metrics missing: {audit_csv_path}")

    df_audit = pd.read_csv(audit_csv_path)
    required_cols = [
        "target", "architecture", "feature_set", "num_folds",
        "roc_auc_mean", "roc_auc_std", "average_precision_mean",
        "sensitivity_mean", "specificity_mean", "precision_mean",
        "f1_mean", "brier_score_mean", "total_fn", "total_positives",
        "overall_missed_rate"
    ]
    missing_cols = [c for c in required_cols if c not in df_audit.columns]
    if missing_cols:
        raise KeyError(f"Audit CSV missing required metric columns: {missing_cols}")

    metrics_by_target = {}

    for target, cfg in CANDIDATE_CONFIG.items():
        arch = cfg["model_type"]
        matches = df_audit[
            (df_audit["target"] == target) &
            (df_audit["architecture"] == arch) &
            (df_audit["feature_set"] == "Augmented_23")
        ]

        if len(matches) == 0:
            raise KeyError(
                f"Missing CV metric row for target '{target}', architecture '{arch}', "
                f"feature_set 'Augmented_23' in {audit_csv_path}"
            )
        if len(matches) > 1:
            raise ValueError(
                f"Duplicate CV metric rows ({len(matches)}) found for target '{target}', "
                f"architecture '{arch}', feature_set 'Augmented_23' in {audit_csv_path}"
            )

        row = matches.iloc[0]
        metrics_by_target[target] = {
            "num_outer_folds": int(row["num_folds"]),
            "roc_auc_mean": float(row["roc_auc_mean"]),
            "roc_auc_std": float(row["roc_auc_std"]),
            "average_precision_mean": float(row["average_precision_mean"]),
            "sensitivity_mean": float(row["sensitivity_mean"]),
            "specificity_mean": float(row["specificity_mean"]),
            "precision_mean": float(row["precision_mean"]),
            "f1_mean": float(row["f1_mean"]),
            "brier_score_mean": float(row["brier_score_mean"]),
            "total_fn": int(row["total_fn"]),
            "total_positives": int(row["total_positives"]),
            "missed_positive_rate": float(row["overall_missed_rate"])
        }

    return metrics_by_target


def verify_staged_artifact(
    staged_path: Path,
    df_sample: pd.DataFrame,
    features: List[str]
) -> None:
    """
    Reloads a serialized pipeline from disk and verifies that predict()
    and predict_proba() produce valid, bounded outputs.
    """
    if not staged_path.exists():
        raise FileNotFoundError(f"Staged artifact file not found: {staged_path}")
    if staged_path.stat().st_size == 0:
        raise IOError(f"Staged artifact is empty (0 bytes): {staged_path}")

    # Unpickle pipeline from disk to test integrity
    reloaded_pipeline = joblib.load(staged_path)
    X_sample = df_sample[features]
    n_samples = len(X_sample)

    preds = reloaded_pipeline.predict(X_sample)
    probs = reloaded_pipeline.predict_proba(X_sample)

    if preds.shape != (n_samples,):
        raise ValueError(f"Malformed prediction shape in {staged_path.name}: {preds.shape}")
    if not set(np.unique(preds)).issubset({0, 1}):
        raise ValueError(f"Invalid predicted class labels in {staged_path.name}: {set(np.unique(preds))}")

    if probs.shape != (n_samples, 2):
        raise ValueError(f"Malformed probability shape in {staged_path.name}: {probs.shape}")
    if not np.all((probs >= 0.0) & (probs <= 1.0)):
        raise ValueError(f"Probabilities out of bounds [0.0, 1.0] in {staged_path.name}")
    if not np.allclose(probs.sum(axis=1), 1.0):
        raise ValueError(f"Probabilities do not sum to 1.0 in {staged_path.name}")


def train_and_publish_research_models(overwrite: bool = False) -> None:
    print("=" * 85)
    print(" Multimodal AI - Augmented_23 Research Candidate Pipeline Training")
    print(" Track A: Cardiovascular Risk Visualization & Prediction")
    print("=" * 85)

    final_output_dir = RESEARCH_ARTIFACTS_DIR
    enforce_isolation_guards(final_output_dir)

    # 1. Overwrite check on final destination (default is to refuse)
    destination_exists_with_files = final_output_dir.exists() and any(final_output_dir.iterdir())
    if destination_exists_with_files and not overwrite:
        raise FileExistsError(
            f"REFUSAL: Target directory '{final_output_dir}' already exists and contains files. "
            "Use --overwrite to authorize replacement."
        )

    # 2. Source dataset & metadata verification
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Clean dataset missing: {DATA_PATH}")
    if not META_PATH.exists():
        raise FileNotFoundError(f"Feature metadata missing: {META_PATH}")

    clean_csv_hash = compute_sha256(DATA_PATH)
    df = pd.read_csv(DATA_PATH)
    meta_df = pd.read_csv(META_PATH)

    if len(df) != 303:
        raise ValueError(f"Cohort size mismatch: expected 303 patient records, found {len(df)}")

    # 3. Load & strictly validate 23 features
    feature_names, num_cols, cat_cols = load_and_validate_features(FEATURE_LISTS_PATH, meta_df, df)

    # 4. Load exact CV metrics
    cv_metrics = load_exact_cv_metrics(AUDIT_METRICS_PATH)

    print("Pre-training validations passed:")
    print(f"  Dataset:          {DATA_PATH} ({len(df)} rows)")
    print(f"  Clean SHA-256:    {clean_csv_hash}")
    print(f"  Features:         {len(feature_names)} validated (13 numerical, 10 categorical)")
    print(f"  Seed:             {SEED}")
    print(f"  Destination:      {final_output_dir}\n")

    # 5. Unique temporary staging directory via tempfile (never deletes existing folders)
    with tempfile.TemporaryDirectory(
        prefix=".staging_research_23_",
        dir=final_output_dir.parent
    ) as temp_dir_str:
        staging_dir = Path(temp_dir_str)
        models_metadata = {}
        staged_files = []

        # 6. Fit, serialize, and verify each candidate pipeline
        for target, config in CANDIDATE_CONFIG.items():
            arch = config["model_type"]
            pos_label = config["positive_label"]
            neg_label = config["negative_label"]

            print(f"--> Training candidate for {target} ({arch})...")
            y = validate_and_binarize_target(df, target, config)
            X = df[feature_names]

            pipeline = build_candidate_pipeline(arch, num_cols, cat_cols, seed=SEED)
            pipeline.fit(X, y)

            # Serialize artifact to staging directory
            artifact_filename = f"model_{target.lower()}.joblib"
            staged_artifact_path = staging_dir / artifact_filename
            joblib.dump(pipeline, staged_artifact_path)

            # Reload and verify artifact execution
            verify_staged_artifact(staged_artifact_path, df.iloc[:5], feature_names)
            staged_files.append(artifact_filename)

            models_metadata[target] = {
                "artifact_file": artifact_filename,
                "target_description": config["description"],
                "positive_label": pos_label,
                "negative_label": neg_label,
                "model_type": arch,
                "primary_threshold": 0.50,
                "training_seed": SEED,
                "selection_rationale": config["selection_rationale"],
                "audit_cv_metrics_25fold": cv_metrics[target],
                "final_refit_scope": "Trained on all 303 available records; scores reflect in-sample training."
            }
            print(f"    Staged & Verified: {artifact_filename} ({staged_artifact_path.stat().st_size:,} bytes)")

        # 7. Write metadata catalog to staging
        metadata_catalog = {
            "project": "Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction",
            "created_at": datetime.now().isoformat(),
            "is_production": False,
            "research_only": True,
            "isolation_directory": str(final_output_dir),
            "dataset_scope": "Z-Alizadeh Sani Cardiovascular Cohort (N=303, Single-Center Retrospective Research)",
            "dataset_rows": len(df),
            "dataset_clean_sha256": clean_csv_hash,
            "training_scope": (
                "Fitted on all 303 available records solely to construct serialized estimator weights for "
                "isolated research API testing. Training-set scores reflect in-sample memorization "
                "and MUST NOT be cited as clinical validation."
            ),
            "validation_disclaimer": (
                "RESEARCH ONLY. These models have NOT been prospectively or externally validated in clinical "
                "trials and must not be used for diagnosis, triage, or clinical decision-making. "
                "Unbiased out-of-fold generalization performance is documented under 'audit_cv_metrics_25fold'."
            ),
            "environment": {
                "python_version": sys.version,
                "scikit_learn_version": sklearn.__version__,
                "pandas_version": pd.__version__,
                "numpy_version": np.__version__,
                "joblib_version": joblib.__version__
            },
            "feature_schema": {
                "feature_set": "Augmented_23",
                "total_input_features": len(feature_names),
                "numerical_features_count": len(num_cols),
                "categorical_features_count": len(cat_cols),
                "ordered_features": feature_names,
                "numerical_features": num_cols,
                "categorical_features": cat_cols,
                "forbidden_features_excluded": FORBIDDEN_FEATURES
            },
            "models": models_metadata
        }

        staged_meta_path = staging_dir / "model_metadata.json"
        with open(staged_meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata_catalog, f, indent=2)

        # 8. Complete catalog verification
        expected_staged = {
            "model_cath.joblib", "model_lad.joblib", "model_lcx.joblib",
            "model_rca.joblib", "model_metadata.json"
        }
        actual_staged = {p.name for p in staging_dir.iterdir()}
        if actual_staged != expected_staged:
            raise RuntimeError(f"Staging incomplete. Missing files: {expected_staged - actual_staged}")

        # 9. Failure-Safe Publication
        backup_dir = None
        try:
            if destination_exists_with_files:
                backup_temp = tempfile.mkdtemp(prefix=".backup_research_23_", dir=final_output_dir.parent)
                backup_dir = Path(backup_temp)
                shutil.copytree(final_output_dir, backup_dir, dirs_exist_ok=True)
                shutil.rmtree(final_output_dir)

            final_output_dir.mkdir(parents=True, exist_ok=True)
            for item in staging_dir.iterdir():
                shutil.copy2(item, final_output_dir / item.name)

            # Verification of final destination
            published_files = {p.name for p in final_output_dir.iterdir()}
            if published_files != expected_staged:
                raise RuntimeError(f"Publication check failed: expected {expected_staged}, got {published_files}")

            # Clean up backup only after destination is fully confirmed
            if backup_dir and backup_dir.exists():
                shutil.rmtree(backup_dir, ignore_errors=True)

            print(f"\nSuccessfully published research artifacts to: {final_output_dir}")

        except Exception as pub_err:
            # Safe rollback: restore original directory if backup was created
            if backup_dir and backup_dir.exists():
                if final_output_dir.exists():
                    shutil.rmtree(final_output_dir, ignore_errors=True)
                shutil.copytree(backup_dir, final_output_dir)
                shutil.rmtree(backup_dir, ignore_errors=True)
            raise RuntimeError(f"Publication failed; rolled back to original state. Error: {pub_err}")


def parse_args():
    parser = argparse.ArgumentParser(description="Train and serialize Augmented_23 research candidate models.")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        default=False,
        help="Authorize replacement of existing research artifacts. Defaults to False."
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train_and_publish_research_models(overwrite=args.overwrite)
