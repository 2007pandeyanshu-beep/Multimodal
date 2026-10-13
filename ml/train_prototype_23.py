"""
ml/train_prototype_23.py - Train and Serialize Isolated Augmented_23 Research Models
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Trains the 4 target inference pipelines for the isolated 23-feature prototype:
1. Cath (Overall CAD) - Soft Voting Ensemble (LR + RF + GB)
2. LAD Stenosis        - Balanced Random Forest Classifier
3. LCX Stenosis        - Stacking Ensemble (LR meta-learner with 5-fold OOF probabilities)
                         [NOTE: Experimental candidate focusing on marginal sensitivity (+0.82%).
                          In contrast, ml/train_research_23_models.py serializes Balanced Random Forest
                          (Candidate A: lower Brier error & operational simplicity) into ml/research_artifacts_23/
                          for the active /research-23/ API. Both remain valid research candidates without declaring a universal winner.]
4. RCA Stenosis        - Stacking Ensemble (LR meta-learner with 5-fold OOF probabilities)

Artifacts are serialized exclusively into ml/prototype_23_artifacts/.
The production ml/artifacts/ and experimental ml/experimental_artifacts/ directories remain untouched.
"""

import sys
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.transformers import TARGET_CONFIG, FORBIDDEN_FEATURES, StringCastTransformer

# Directory specifications
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "cad_clean.csv"
OUTPUT_DIR = PROJECT_ROOT / "ml" / "prototype_23_artifacts"
METADATA_FILE = OUTPUT_DIR / "model_metadata.json"

# Exactly 23 features verified against feature_lists.json
PROTOTYPE_23_FEATURES = [
    # 18 Clinical Baseline
    "Age", "Sex", "BMI", "BP", "PR", "DM", "HTN", "Current Smoker",
    "Typical Chest Pain", "St Elevation", "St Depression", "EF-TTE",
    "Region RWMA", "FBS", "CR", "LDL", "HDL", "TG",
    # 5 RCA / Inflammation Augmentation
    "ESR", "BUN", "Neut", "Dyspnea", "Poor R Progression"
]

NUMERICAL_COLS = [
    "Age", "BMI", "BP", "PR", "FBS", "CR", "TG", "LDL", "HDL",
    "BUN", "ESR", "Neut", "EF-TTE"
]

CATEGORICAL_COLS = [
    "Sex", "DM", "HTN", "Current Smoker", "Typical Chest Pain",
    "Dyspnea", "St Elevation", "St Depression", "Poor R Progression", "Region RWMA"
]

SEED = 42

PROTOTYPE_DISCLAIMER = (
    "EXPERIMENTAL RESEARCH PROTOTYPE (AUGMENTED_23). Output is for technical workflow "
    "demonstration and research evaluation only. This model is NOT a medical device, "
    "has NOT been clinically validated in prospective clinical trials, and MUST NOT "
    "be used for patient diagnosis or treatment decisions."
)


def build_prototype_preprocessor() -> ColumnTransformer:
    """Builds a leakage-safe ColumnTransformer for the exact 23 features."""
    cat_pipeline = Pipeline([
        ("to_str", StringCastTransformer()),
        ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_COLS),
            ("cat", cat_pipeline, CATEGORICAL_COLS)
        ],
        remainder="drop"
    )
    return preprocessor


def build_pipeline_for_target(target: str) -> Pipeline:
    """Constructs the approved model pipeline for the specified cardiovascular target."""
    preprocessor = build_prototype_preprocessor()

    lr_base = LogisticRegression(
        C=0.1,
        max_iter=1000,
        class_weight="balanced",
        random_state=SEED
    )
    rf_base = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=SEED
    )
    gb_base = GradientBoostingClassifier(
        learning_rate=0.05,
        n_estimators=100,
        max_depth=3,
        subsample=0.8,
        min_samples_leaf=3,
        random_state=SEED
    )

    if target == "Cath":
        # Soft Voting Ensemble
        classifier = VotingClassifier(
            estimators=[
                ("lr", lr_base),
                ("rf", rf_base),
                ("gb", gb_base)
            ],
            voting="soft"
        )
    elif target == "LAD":
        # Balanced Random Forest
        classifier = rf_base
    elif target in ("LCX", "RCA"):
        # Stacking Ensemble with out-of-fold probability estimation
        classifier = StackingClassifier(
            estimators=[
                ("lr", lr_base),
                ("rf", rf_base),
                ("gb", gb_base)
            ],
            final_estimator=LogisticRegression(
                C=1.0,
                max_iter=1000,
                class_weight="balanced",
                random_state=SEED
            ),
            cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED),
            stack_method="predict_proba"
        )
    else:
        raise ValueError(f"Unknown target: {target}")

    return Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier)
    ])


def main():
    print("=" * 80)
    print("Training Isolated Augmented_23 Research Prototype Models")
    print("=" * 80)

    # 1. Verification of inputs and paths
    assert DATA_PATH.exists(), f"Clean dataset not found at {DATA_PATH}"
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded dataset: {DATA_PATH} ({len(df)} rows, {len(df.columns)} columns)")

    # Assert exactly 23 features exist and are disjoint from targets
    assert len(PROTOTYPE_23_FEATURES) == 23, "PROTOTYPE_23_FEATURES must contain exactly 23 columns"
    assert set(PROTOTYPE_23_FEATURES).issubset(set(df.columns)), "All 23 features must exist in cad_clean.csv"
    assert set(PROTOTYPE_23_FEATURES).isdisjoint(set(TARGET_CONFIG.keys())), "Leakage error: target in features"
    assert set(PROTOTYPE_23_FEATURES).isdisjoint(set(FORBIDDEN_FEATURES)), "Leakage error: forbidden in features"
    assert len(NUMERICAL_COLS) + len(CATEGORICAL_COLS) == 23, "Mismatch in numerical + categorical partition"

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output directory initialized: {OUTPUT_DIR}")

    X = df[PROTOTYPE_23_FEATURES]
    models_metadata = {}

    # Target specific architecture descriptions
    architecture_info = {
        "Cath": {
            "model_name": "SoftVoting",
            "model_type": "VotingClassifier (LR + RF + GB)",
            "alternative_model": "RandomForest"
        },
        "LAD": {
            "model_name": "RandomForest",
            "model_type": "RandomForestClassifier (Balanced, max_depth=5)",
            "alternative_model": None
        },
        "LCX": {
            "model_name": "Stacking",
            "model_type": "StackingClassifier (LR + RF + GB -> Meta LR)",
            "alternative_model": "RandomForest (simpler operational alternative)"
        },
        "RCA": {
            "model_name": "Stacking",
            "model_type": "StackingClassifier (LR + RF + GB -> Meta LR)",
            "alternative_model": "RandomForest"
        }
    }

    # 2. Train each target pipeline
    for target, target_meta in TARGET_CONFIG.items():
        print(f"\n--- Training pipeline for target: {target} ---")
        arch_meta = architecture_info[target]
        print(f"  Architecture: {arch_meta['model_name']} ({arch_meta['model_type']})")

        y = (df[target] == target_meta["positive_label"]).astype(int).values
        pos_count = int(np.sum(y))
        neg_count = len(y) - pos_count
        print(f"  Class balance: Positive ({target_meta['positive_label']})={pos_count} ({pos_count/len(y):.1%}), Negative ({target_meta['negative_label']})={neg_count} ({neg_count/len(y):.1%})")

        pipe = build_pipeline_for_target(target)
        pipe.fit(X, y)

        # In-sample sanity check (ensures pipeline predict & predict_proba execute cleanly)
        sanity_preds = pipe.predict(X[:5])
        sanity_probs = pipe.predict_proba(X[:5])[:, 1]
        print(f"  Sanity check OK: sample predictions={sanity_preds.tolist()}, sample probs={[round(p, 4) for p in sanity_probs]}")

        # Serialize pipeline
        artifact_filename = f"model_{target.lower()}.joblib"
        artifact_path = OUTPUT_DIR / artifact_filename
        joblib.dump(pipe, artifact_path)
        print(f"  Saved artifact: {artifact_path}")

        models_metadata[target] = {
            "artifact_file": artifact_filename,
            "target_description": target_meta["description"],
            "positive_label": target_meta["positive_label"],
            "negative_label": target_meta["negative_label"],
            "model_name": arch_meta["model_name"],
            "model_type": arch_meta["model_type"],
            "alternative_model": arch_meta["alternative_model"],
            "decision_threshold": {
                "value": 0.50,
                "strategy_label": "fixed_standard_threshold",
                "status": "baseline_uncalibrated",
                "notes": (
                    "Standard threshold T=0.50 used across all 25 folds in repeated CV audit. "
                    "Threshold optimization was not performed on outer test folds to avoid optimistic bias."
                )
            },
            "calibration_status": {
                "is_calibrated": False,
                "score_interpretation": (
                    "Empirical ensemble statistical score in [0.0, 1.0]. Probabilities are uncalibrated "
                    "and do not represent verified epidemiological risk."
                )
            }
        }

    # 3. Serialize metadata manifest
    manifest = {
        "project": "Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction",
        "created_at": datetime.now().isoformat(),
        "is_production": False,
        "is_prototype": True,
        "prototype_name": "Augmented_23",
        "isolation_directory": str(OUTPUT_DIR),
        "dataset_rows": len(df),
        "dataset_scope": "Z-Alizadeh Sani Cardiovascular Dataset (N=303, Single-Center Research Cohort)",
        "disclaimer": PROTOTYPE_DISCLAIMER,
        "feature_schema": {
            "total_input_features": len(PROTOTYPE_23_FEATURES),
            "numerical_features_count": len(NUMERICAL_COLS),
            "categorical_features_count": len(CATEGORICAL_COLS),
            "feature_list": PROTOTYPE_23_FEATURES,
            "numerical_features": NUMERICAL_COLS,
            "categorical_features": CATEGORICAL_COLS,
            "forbidden_features_excluded": FORBIDDEN_FEATURES
        },
        "models": models_metadata
    }

    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nMetadata manifest saved: {METADATA_FILE}")
    print("=" * 80)
    print("Training of Augmented_23 prototype complete.")
    print("=" * 80)


if __name__ == "__main__":
    main()
