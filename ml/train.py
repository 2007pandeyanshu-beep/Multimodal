"""
ml/train.py - Final Inference Pipeline Training & Artifact Serialization
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Trains the selected production pipelines for each of the 4 targets:
1. Overall CAD (Cath)
2. LAD Stenosis (LAD)
3. LCX Stenosis (LCX)
4. RCA Stenosis (RCA)

Saves self-contained, inference-ready .joblib artifacts and model_metadata.json to ml/artifacts/.
"""

import os
import sys
import json
import joblib
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline

# Local module imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ml.transformers import TARGET_CONFIG, FORBIDDEN_FEATURES, build_preprocessor, get_feature_lists


def train_and_serialize_models():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    data_path = os.path.join(base_dir, "data", "processed", "cad_clean.csv")
    meta_path = os.path.join(base_dir, "data", "processed", "feature_metadata.csv")
    artifacts_dir = os.path.join(base_dir, "ml", "artifacts")

    os.makedirs(artifacts_dir, exist_ok=True)

    print("=== Multimodal AI Hackathon 2026 - Model Training & Export Pipeline ===")
    print(f"Loading cleaned dataset: {data_path}")
    df = pd.read_csv(data_path)
    meta_df = pd.read_csv(meta_path)

    # 1. Feature verification & leakage prevention assertions
    num_cols, cat_cols = get_feature_lists(meta_df)
    feature_cols = num_cols + cat_cols

    for f in FORBIDDEN_FEATURES:
        assert f not in feature_cols, f"CRITICAL LEAKAGE: '{f}' is present in feature_cols!"
    print(f"Verified input feature count: {len(feature_cols)} (Leakage exclusions verified).")

    X = df[feature_cols]

    # Selected model hyperparameters (Regularized for N=303, class-weighted)
    model_params = {
        "n_estimators": 100,
        "max_depth": 5,
        "min_samples_leaf": 3,
        "class_weight": "balanced",
        "random_state": 42
    }

    # Dynamically pull exact cross-validation benchmarks from model_comparison.csv
    comp_csv_path = os.path.join(base_dir, "reports", "model_comparison.csv")
    cv_benchmarks = {}
    if os.path.exists(comp_csv_path):
        df_comp = pd.read_csv(comp_csv_path)
        for t in TARGET_CONFIG.keys():
            match = df_comp[(df_comp["target"] == t) & (df_comp["model"] == "RandomForest")]
            if not match.empty:
                r = match.iloc[0]
                cv_benchmarks[t] = {
                    "cv_roc_auc": round(float(r["mean_roc_auc"]), 4),
                    "cv_accuracy": round(float(r["mean_accuracy"]), 4),
                    "cv_recall": round(float(r["mean_recall"]), 4),
                    "cv_precision": round(float(r["mean_precision"]), 4),
                    "cv_f1": round(float(r["mean_f1"]), 4),
                    "cv_brier": round(float(r["mean_brier"]), 4)
                }

    # Documented selection rationale for each target
    selection_rationales = {
        "Cath": (
            "Random Forest selected for production: higher precision (0.9349 vs 0.9225) and "
            "higher accuracy (0.8547 vs 0.8445) with identical recall (0.8564), reducing false-positive "
            "alarms while maintaining architectural homogeneity across all 4 vessel targets. "
            "Logistic Regression is a validated alternative with higher ROC-AUC (0.9279 vs 0.9195) and "
            "lower Brier score (0.1061 vs 0.1220)."
        ),
        "LAD": (
            "Random Forest selected: substantially higher recall (0.8424 vs 0.7348) and higher F1 "
            "(0.8216 vs 0.7606) compared to Logistic Regression, minimizing dangerous false negatives on "
            "the critical anterior descending artery."
        ),
        "LCX": (
            "Random Forest selected: avoids the severe recall collapse of Gradient Boosting (0.6138 vs 0.5042) "
            "and achieves the highest ROC-AUC (0.7199 vs 0.6538 for Logistic Regression)."
        ),
        "RCA": (
            "Random Forest selected: highest ROC-AUC (0.7340 vs 0.7056 for Logistic Regression and 0.6932 "
            "for Gradient Boosting) and superior sensitivity (0.6308 vs 0.4287 for Gradient Boosting)."
        )
    }

    model_metadata = {
        "project": "Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction",
        "created_at": datetime.now().isoformat(),
        "training_dataset_rows": len(df),
        "training_scope": "Fitted on all 303 available records after 5-fold cross-validation model selection",
        "total_input_features": len(feature_cols),
        "numerical_features_count": len(num_cols),
        "categorical_features_count": len(cat_cols),
        "numerical_features": num_cols,
        "categorical_features": cat_cols,
        "forbidden_features_excluded": FORBIDDEN_FEATURES,
        "models": {}
    }

    saved_artifacts = {}

    for target_name, target_info in TARGET_CONFIG.items():
        pos_val = target_info["positive_label"]
        neg_val = target_info["negative_label"]
        y = (df[target_name] == pos_val).astype(int)

        print(f"\nTraining pipeline for target: {target_name} ({target_info['description']})...")
        print(f"  Class balance: Positive '{pos_val}' = {int(y.sum())}, Negative '{neg_val}' = {len(y) - int(y.sum())}")

        # Construct complete self-contained pipeline
        preprocessor = build_preprocessor(num_cols, cat_cols)
        clf = RandomForestClassifier(**model_params)
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])

        # Fit on all 303 training records
        pipeline.fit(X, y)

        # File naming
        filename_lower = f"model_{target_name.lower()}.joblib"
        artifact_path = os.path.join(artifacts_dir, filename_lower)
        joblib.dump(pipeline, artifact_path)
        saved_artifacts[target_name] = artifact_path
        print(f"  Saved inference pipeline to: {artifact_path}")

        # Save metadata record
        model_metadata["models"][target_name] = {
            "artifact_file": filename_lower,
            "target_description": target_info["description"],
            "positive_label": pos_val,
            "negative_label": neg_val,
            "model_type": "RandomForestClassifier",
            "hyperparameters": model_params,
            "cv_metrics_5fold": cv_benchmarks.get(target_name, {}),
            "selection_rationale": selection_rationales.get(target_name, "")
        }

    # Save model_metadata.json to both ml/artifacts/ and ml/
    metadata_json_path = os.path.join(artifacts_dir, "model_metadata.json")
    metadata_root_path = os.path.join(base_dir, "ml", "model_metadata.json")
    for out_p in [metadata_json_path, metadata_root_path]:
        with open(out_p, "w", encoding="utf-8") as f:
            json.dump(model_metadata, f, indent=2)
    print(f"\nModel metadata catalog saved to:")
    print(f"  - {metadata_json_path}")
    print(f"  - {metadata_root_path}")

    print("\n=== All 4 Target Model Pipelines Trained and Serialized Successfully ===")
    return saved_artifacts, metadata_json_path


if __name__ == "__main__":
    train_and_serialize_models()
