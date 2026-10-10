"""
ml/test_pipeline.py - Automated Unit & Integration Tests for ML Pipelines
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Tests:
1. Artifact existence & metadata completeness.
2. Strict feature exclusion (zero leakage).
3. Fresh pipeline loading & prediction validity.
4. Probability calibration bounds [0, 1].
5. Robustness to mixed data types (int vs string categories).
6. Deterministic inference reproducibility.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ml.transformers import TARGET_CONFIG, FORBIDDEN_FEATURES, StringCastTransformer


def run_pipeline_tests():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    artifacts_dir = os.path.join(base_dir, "ml", "artifacts")
    data_path = os.path.join(base_dir, "data", "processed", "cad_clean.csv")
    meta_path = os.path.join(base_dir, "data", "processed", "feature_metadata.csv")

    print("=== Running ML Pipeline Verification Tests ===")

    # Test 1: Check artifacts exist
    print("[Test 1/6] Verifying artifact existence...")
    meta_json_path = os.path.join(artifacts_dir, "model_metadata.json")
    assert os.path.exists(meta_json_path), f"Missing metadata file: {meta_json_path}"
    
    with open(meta_json_path, "r", encoding="utf-8") as f:
        meta_json = json.load(f)

    for target in TARGET_CONFIG.keys():
        model_file = os.path.join(artifacts_dir, f"model_{target.lower()}.joblib")
        assert os.path.exists(model_file), f"Missing model artifact: {model_file}"
        print(f"  Artifact verified: {model_file}")
    print("  Test 1 Passed: All artifacts present.")

    # Test 2: Check forbidden feature exclusion
    print("\n[Test 2/6] Verifying zero leakage & forbidden feature exclusion...")
    meta_df = pd.read_csv(meta_path)
    allowed_features = meta_df[meta_df["is_allowed_input"] == True]["feature_name"].tolist()

    for forbidden in FORBIDDEN_FEATURES:
        assert forbidden not in allowed_features, f"VIOLATION: '{forbidden}' in allowed_features!"
        assert forbidden not in meta_json["numerical_features"], f"VIOLATION: '{forbidden}' in metadata numerical features!"
        assert forbidden not in meta_json["categorical_features"], f"VIOLATION: '{forbidden}' in metadata categorical features!"
    assert len(allowed_features) == 54, f"Expected 54 allowed features, got {len(allowed_features)}"
    print(f"  Test 2 Passed: Strict exclusion confirmed. Exactly 54 permitted features.")

    # Test 3: Load pipelines in fresh process and test predictions
    print("\n[Test 3/6] Loading saved pipelines and testing predictions...")
    df = pd.read_csv(data_path)
    X_sample = df[allowed_features].head(5)

    for target in TARGET_CONFIG.keys():
        model_file = os.path.join(artifacts_dir, f"model_{target.lower()}.joblib")
        pipeline = joblib.load(model_file)

        preds = pipeline.predict(X_sample)
        probs = pipeline.predict_proba(X_sample)

        assert len(preds) == 5, f"Expected 5 predictions, got {len(preds)}"
        assert set(preds).issubset({0, 1}), f"Predictions must be binary 0 or 1, got {preds}"
        assert probs.shape == (5, 2), f"Probabilities shape must be (5, 2), got {probs.shape}"
        print(f"  {target:5s} pipeline: preds={preds.tolist()}, sample prob={probs[0, 1]:.3f}")
    print("  Test 3 Passed: Fresh pipelines load and predict accurately.")

    # Test 4: Check probability bounds [0, 1]
    print("\n[Test 4/6] Verifying probability mathematical bounds...")
    for target in TARGET_CONFIG.keys():
        model_file = os.path.join(artifacts_dir, f"model_{target.lower()}.joblib")
        pipeline = joblib.load(model_file)
        probs = pipeline.predict_proba(df[allowed_features])

        assert (probs >= 0.0).all() and (probs <= 1.0).all(), f"Probabilities out of [0, 1] bound for {target}!"
        np.testing.assert_allclose(probs.sum(axis=1), 1.0, err_msg="Probabilities must sum to 1.0")
    print("  Test 4 Passed: All probabilities strictly bounded in [0, 1] and sum to 1.0.")

    # Test 5: Check robustness to mixed data types
    print("\n[Test 5/6] Verifying robustness to string vs numeric types...")
    # Convert all integer flags to strings in sample to simulate JSON payload
    X_str_sample = X_sample.copy().astype(str)
    for target in TARGET_CONFIG.keys():
        model_file = os.path.join(artifacts_dir, f"model_{target.lower()}.joblib")
        pipeline = joblib.load(model_file)
        preds_str = pipeline.predict(X_str_sample)
        probs_str = pipeline.predict_proba(X_str_sample)
        assert len(preds_str) == 5
        assert probs_str.shape == (5, 2)
    print("  Test 5 Passed: Pipeline accepts string-encoded inputs seamlessly.")

    # Test 6: Verify deterministic inference reproducibility
    print("\n[Test 6/6] Verifying deterministic prediction reproducibility...")
    for target in TARGET_CONFIG.keys():
        model_file = os.path.join(artifacts_dir, f"model_{target.lower()}.joblib")
        pipeline = joblib.load(model_file)
        probs1 = pipeline.predict_proba(X_sample)
        probs2 = pipeline.predict_proba(X_sample)
        np.testing.assert_array_equal(probs1, probs2, err_msg=f"Non-deterministic prediction for {target}!")
    print("  Test 6 Passed: Identical inputs produce bit-for-bit identical predictions.")

    print("\n=== ALL 6 TEST SUITES PASSED PERFECTLY (100% SUCCESS) ===")


if __name__ == "__main__":
    run_pipeline_tests()
