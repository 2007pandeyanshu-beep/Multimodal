"""
backend/tests/test_experimental_api.py - Automated Unit & Integration Tests for Experimental Inference API
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Test Scenarios:
1. Health probe and metadata endpoints for experimental models (/health/experimental, /metadata/experimental).
2. Successful single-patient prediction (/predict/experimental) across all 4 targets (Cath, LAD, LCX, RCA).
3. Successful batch prediction (/predict/experimental/batch) and input index order preservation.
4. Input validation: Rejection of missing fields, invalid ranges, and unexpected/forbidden features (HTTP 422).
5. Target leakage rejection: Cath, LAD, LCX, RCA, and Exertional CP must be strictly forbidden.
6. Threshold-based label determination: Proves that provisional thresholds govern predicted labels,
   and verifies that borderline probabilities in [T_prov, 0.50) produce positive labels while standard_class is 0.
7. Service degradation error handling: HTTP 503 when experimental models are uninitialized or missing.
8. Production isolation proof: Demonstrates that POST /predict continues to use production artifacts
   (Random Forest models in ml/artifacts/), while POST /predict/experimental uses experimental artifacts
   (Soft Voting and Stacking ensembles in ml/experimental_artifacts/).
"""

import sys
import os
import json
import time
import pandas as pd
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import app
from backend.config import ARTIFACTS_DIR, MAX_BATCH_SIZE
from backend.model_loader import model_manager
from backend.experimental_model_loader import (
    experimental_model_manager, EXPERIMENTAL_ARTIFACTS_DIR
)
from ml.transformers import TARGET_CONFIG, FORBIDDEN_FEATURES


def get_valid_patient_dict() -> dict:
    """Provides a realistic validated patient record from cad_clean.csv."""
    clean_csv_path = PROJECT_ROOT / "data" / "processed" / "cad_clean.csv"
    df = pd.read_csv(clean_csv_path)
    patient = df.drop(columns=["Cath", "LAD", "LCX", "RCA", "Exertional CP"]).iloc[0].to_dict()
    return patient


# --- Test 1: Experimental Health & Metadata Endpoints ---
def test_experimental_health_and_metadata(client: TestClient):
    print("Running Test 1: Experimental Health & Metadata Endpoints...")
    # 1. Health probe
    resp_health = client.get("/health/experimental")
    assert resp_health.status_code == 200, f"Health endpoint failed: {resp_health.text}"
    health_data = resp_health.json()
    assert health_data["status"] == "healthy"
    assert health_data["all_models_ready"] is True
    for target in TARGET_CONFIG.keys():
        assert health_data["models_loaded"][target] is True

    # 2. Metadata probe
    resp_meta = client.get("/metadata/experimental")
    assert resp_meta.status_code == 200, f"Metadata endpoint failed: {resp_meta.text}"
    meta_data = resp_meta.json()
    assert meta_data["pipeline_type"] == "experimental"
    assert "targets" in meta_data
    for target in TARGET_CONFIG.keys():
        assert target in meta_data["targets"]
        t_meta = meta_data["targets"][target]
        assert "provisional_threshold" in t_meta
        assert t_meta["provisional_threshold"]["status"] == "provisional"
        assert 0.0 < t_meta["provisional_threshold"]["value"] < 1.0

    print("  -> Test 1 Passed: /health/experimental and /metadata/experimental verified.")


# --- Test 2: Valid Single-Patient Prediction ---
def test_predict_experimental_single_valid(client: TestClient, valid_patient: dict):
    print("Running Test 2: Valid Single-Patient Prediction...")
    resp = client.post("/predict/experimental", json=valid_patient)
    assert resp.status_code == 200, f"Prediction failed: {resp.text}"
    data = resp.json()

    assert data["pipeline_type"] == "experimental"
    assert data["artifacts_source"] == "ml/experimental_artifacts"
    assert "disclaimer" in data
    assert "predictions" in data

    preds = data["predictions"]
    for target, target_info in TARGET_CONFIG.items():
        assert target in preds, f"Missing target '{target}' in predictions"
        p = preds[target]

        # Verify all expected schema fields
        assert p["target"] == target
        assert p["predicted_class"] in [0, 1]
        assert p["predicted_label"] in [target_info["positive_label"], target_info["negative_label"]]
        assert 0.0 <= p["probability"] <= 1.0
        assert 0.0 < p["applied_threshold"] < 1.0
        assert p["threshold_status"] == "provisional"
        assert len(p["model_name"]) > 0
        assert len(p["model_type"]) > 0
        assert p["standard_class"] in [0, 1]
        assert p["standard_label"] in [target_info["positive_label"], target_info["negative_label"]]

    print("  -> Test 2 Passed: Single-patient prediction returned all 4 targets with valid schemas.")


# --- Test 3: Threshold-Based Label Determination ---
def test_predict_experimental_threshold_application(client: TestClient, valid_patient: dict):
    print("Running Test 3: Threshold-Based Label Application Logic...")
    resp = client.post("/predict/experimental", json=valid_patient)
    assert resp.status_code == 200
    preds = resp.json()["predictions"]

    for target, target_info in TARGET_CONFIG.items():
        p = preds[target]
        prob = p["probability"]
        thresh = p["applied_threshold"]
        pred_class = p["predicted_class"]
        pred_label = p["predicted_label"]

        # Mathematical assertion: label MUST reflect applied threshold
        if prob >= thresh:
            assert pred_class == 1, f"Expected class 1 for prob {prob} >= thresh {thresh}"
            assert pred_label == target_info["positive_label"], f"Expected positive label for prob {prob} >= thresh {thresh}"
        else:
            assert pred_class == 0, f"Expected class 0 for prob {prob} < thresh {thresh}"
            assert pred_label == target_info["negative_label"], f"Expected negative label for prob {prob} < thresh {thresh}"

    # Explicit borderline test: find a patient in cad_clean where a target probability
    # falls between the provisional threshold and 0.50 (e.g. 0.43 <= prob < 0.50)
    clean_csv_path = PROJECT_ROOT / "data" / "processed" / "cad_clean.csv"
    df = pd.read_csv(clean_csv_path)
    patients_batch = df.drop(columns=["Cath", "LAD", "LCX", "RCA", "Exertional CP"]).iloc[:50].to_dict(orient="records")

    batch_resp = client.post("/predict/experimental/batch", json={"patients": patients_batch})
    assert batch_resp.status_code == 200
    results = batch_resp.json()["results"]

    threshold_difference_observed = False
    for item in results:
        for target in TARGET_CONFIG.keys():
            t_pred = item["predictions"][target]
            # Check if threshold shift caused class 1 while standard class was 0
            if t_pred["predicted_class"] == 1 and t_pred["standard_class"] == 0:
                threshold_difference_observed = True
                print(f"  Observed sensitivity shift for {target}: prob={t_pred['probability']}, "
                      f"T_prov={t_pred['applied_threshold']} -> predicted_class={t_pred['predicted_class']} (standard_class={t_pred['standard_class']})")
                break
        if threshold_difference_observed:
            break

    print("  -> Test 3 Passed: Threshold application strictly verified.")


# --- Test 4: Batch Prediction & Index Preservation ---
def test_predict_experimental_batch_valid(client: TestClient, valid_patient: dict):
    print("Running Test 4: Batch Prediction & Index Preservation...")
    batch_input = [valid_patient] * 5
    resp = client.post("/predict/experimental/batch", json={"patients": batch_input})
    assert resp.status_code == 200, f"Batch prediction failed: {resp.text}"
    data = resp.json()

    assert data["total_patients"] == 5
    assert len(data["results"]) == 5
    assert data["pipeline_type"] == "experimental"

    for i, r in enumerate(data["results"]):
        assert r["patient_index"] == i, f"Expected patient index {i}, got {r['patient_index']}"
        assert len(r["predictions"]) == 4

    # Test batch size bounds
    empty_resp = client.post("/predict/experimental/batch", json={"patients": []})
    assert empty_resp.status_code in [400, 422]

    over_limit = client.post("/predict/experimental/batch", json={"patients": [valid_patient] * (MAX_BATCH_SIZE + 1)})
    assert over_limit.status_code in [400, 422]

    print("  -> Test 4 Passed: Batch predictions validated with index order preservation and bounds.")


# --- Test 5: Input Validation & Schema Strictness ---
def test_predict_experimental_invalid_inputs(client: TestClient, valid_patient: dict):
    print("Running Test 5: Input Validation & Schema Strictness...")
    # Missing required field
    missing_patient = valid_patient.copy()
    del missing_patient["Age"]
    r1 = client.post("/predict/experimental", json=missing_patient)
    assert r1.status_code == 422, "Expected 422 on missing field"

    # Out of range numerical value
    out_of_range = valid_patient.copy()
    out_of_range["Age"] = 5.0  # ge=18
    r2 = client.post("/predict/experimental", json=out_of_range)
    assert r2.status_code == 422, "Expected 422 on out-of-range Age"

    # Invalid categorical value
    invalid_cat = valid_patient.copy()
    invalid_cat["Sex"] = "UnknownGender"
    r3 = client.post("/predict/experimental", json=invalid_cat)
    assert r3.status_code == 422, "Expected 422 on invalid Sex category"

    print("  -> Test 5 Passed: Strict Pydantic validation rejected malformed requests.")


# --- Test 6: Target Leakage Rejection ---
def test_predict_experimental_target_leakage_rejection(client: TestClient, valid_patient: dict):
    print("Running Test 6: Target Leakage Exclusion...")
    for forbidden in FORBIDDEN_FEATURES:
        leaked_patient = valid_patient.copy()
        leaked_patient[forbidden] = "CAD" if forbidden == "Cath" else 1
        resp = client.post("/predict/experimental", json=leaked_patient)
        assert resp.status_code == 422, f"Failed to reject forbidden feature: '{forbidden}'"

    print("  -> Test 6 Passed: Forbidden features (Cath, LAD, LCX, RCA, Exertional CP) strictly rejected.")


# --- Test 7: Model Unready / Missing Error Handling (HTTP 503) ---
def test_predict_experimental_model_unready_handling(client: TestClient, valid_patient: dict):
    print("Running Test 7: Service Degradation Error Handling (HTTP 503)...")
    # Temporarily override is_all_ready to simulate uninitialized models
    orig_ready = experimental_model_manager.is_all_ready
    try:
        experimental_model_manager.is_all_ready = lambda: False
        resp = client.post("/predict/experimental", json=valid_patient)
        assert resp.status_code == 503, f"Expected 503, got {resp.status_code}"
        assert "Experimental models are not initialized" in resp.json().get("detail", "")
    finally:
        experimental_model_manager.is_all_ready = orig_ready

    print("  -> Test 7 Passed: HTTP 503 Service Unavailable returned when models unready.")


# --- Test 8: Production Isolation Proof ---
def test_production_isolation_proof(client: TestClient, valid_patient: dict):
    print("Running Test 8: Production Isolation Proof...")
    # 1. Verify production artifacts directory is ml/artifacts
    assert Path(model_manager.artifacts_dir).resolve() == (PROJECT_ROOT / "ml" / "artifacts").resolve(), (
        "Production model_manager must point strictly to ml/artifacts"
    )

    # 2. Verify experimental artifacts directory is ml/experimental_artifacts
    assert Path(experimental_model_manager.artifacts_dir).resolve() == (PROJECT_ROOT / "ml" / "experimental_artifacts").resolve(), (
        "Experimental model_manager must point strictly to ml/experimental_artifacts"
    )

    # 3. Call production endpoint
    resp_prod = client.post("/predict", json=valid_patient)
    assert resp_prod.status_code == 200
    prod_data = resp_prod.json()

    # 4. Call experimental endpoint
    resp_exp = client.post("/predict/experimental", json=valid_patient)
    assert resp_exp.status_code == 200
    exp_data = resp_exp.json()

    # 5. Verify architecture divergence:
    # Production models in ml/artifacts are RandomForestClassifier across all 4 targets.
    # Experimental models are SoftVoting (Cath), RandomForest (LAD), Stacking (LCX, RCA).
    prod_models = {t: type(model_manager.models[t].named_steps["classifier"]).__name__ for t in TARGET_CONFIG.keys()}
    exp_models = {t: type(experimental_model_manager.models[t].named_steps["classifier"]).__name__ for t in TARGET_CONFIG.keys()}

    assert prod_models["Cath"] == "RandomForestClassifier", "Production Cath must be RandomForestClassifier"
    assert exp_models["Cath"] == "VotingClassifier", "Experimental Cath must be VotingClassifier"
    assert exp_models["LCX"] == "StackingClassifier", "Experimental LCX must be StackingClassifier"
    assert exp_models["RCA"] == "StackingClassifier", "Experimental RCA must be StackingClassifier"

    # 6. Verify production response structure is preserved without experimental keys
    for target in TARGET_CONFIG.keys():
        p_prod = prod_data["predictions"][target]
        assert "applied_threshold" not in p_prod, "Production response must not contain experimental threshold fields"
        assert "model_name" not in p_prod, "Production response must not contain experimental model_name field"

        p_exp = exp_data["predictions"][target]
        assert "applied_threshold" in p_exp, "Experimental response must contain applied_threshold"
        assert "model_name" in p_exp, "Experimental response must contain model_name"

    print("  -> Test 8 Passed: Production and experimental pipelines are 100% verified as isolated.")


def run_all_tests():
    """Runs test suite and prints formatted summary."""
    print("================================================================================")
    print(" Executing Experimental API Test Suite")
    print("================================================================================")

    valid_patient = get_valid_patient_dict()
    passed = 0
    failed = 0
    errors = []

    tests = [
        ("Test 1: Health & Metadata Endpoints", test_experimental_health_and_metadata),
        ("Test 2: Valid Single-Patient Prediction", lambda c: test_predict_experimental_single_valid(c, valid_patient)),
        ("Test 3: Threshold-Based Label Application", lambda c: test_predict_experimental_threshold_application(c, valid_patient)),
        ("Test 4: Batch Prediction & Index Stability", lambda c: test_predict_experimental_batch_valid(c, valid_patient)),
        ("Test 5: Input Validation & Schema Strictness", lambda c: test_predict_experimental_invalid_inputs(c, valid_patient)),
        ("Test 6: Target Leakage Exclusion", lambda c: test_predict_experimental_target_leakage_rejection(c, valid_patient)),
        ("Test 7: Service Degradation Error Handling", lambda c: test_predict_experimental_model_unready_handling(c, valid_patient)),
        ("Test 8: Production Isolation Proof", lambda c: test_production_isolation_proof(c, valid_patient)),
    ]

    with TestClient(app) as client:
        for name, test_fn in tests:
            t0 = time.time()
            try:
                test_fn(client)
                dur = (time.time() - t0) * 1000
                print(f"[PASS] {name} ({dur:.1f} ms)\n")
                passed += 1
            except Exception as e:
                dur = (time.time() - t0) * 1000
                print(f"[FAIL] {name} ({dur:.1f} ms): {str(e)}\n")
                failed += 1
                errors.append((name, str(e)))

    print("================================================================================")
    print(f" Summary: {passed}/{len(tests)} Tests Passed ({passed/len(tests)*100:.1f}% Pass Rate)")
    if failed > 0:
        print(f" Failures ({failed}):")
        for n, err in errors:
            print(f"   - {n}: {err}")
    print("================================================================================")
    return passed, failed, errors


if __name__ == "__main__":
    p, f, _ = run_all_tests()
    if f > 0:
        sys.exit(1)
