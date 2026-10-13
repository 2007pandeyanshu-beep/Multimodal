"""
backend/tests/test_research_api.py - Unit & Integration Tests for 23-Feature Research API
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Tests:
1. Research health probe (/research-23/health).
2. Research metadata schema & 23-feature order (/research-23/metadata).
3. Valid single prediction (/research-23/predict).
4. Valid batch prediction with index preservation (/research-23/predict/batch).
5. Missing required field rejections (422).
6. Extra / pruned field rejections (422 extra_forbidden).
7. Target leakage / forbidden feature rejections (422).
8. Invalid types and physiological range bound rejections (422).
9. Service unavailable handling when models are unready (503).
10. Internal error handling (500).
11. Production 54-feature API backward compatibility preservation (/predict).
"""

import sys
import os
import json
import pytest
import pandas as pd
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import app
from backend.research_model_loader import research23_model_manager
from ml.transformers import TARGET_CONFIG


@pytest.fixture(scope="module")
def client():
    """Initializes TestClient triggering lifespan model loading."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def valid_patient_23():
    """Prepares a validated 23-feature patient record from cad_clean.csv."""
    clean_csv_path = PROJECT_ROOT / "data" / "processed" / "cad_clean.csv"
    meta_path = (
        PROJECT_ROOT / "experiments" / "feature_selection" / "repeated_cv" / "results" / "feature_lists.json"
    )

    with open(meta_path, "r", encoding="utf-8") as f:
        feature_lists = json.load(f)
    features_23 = feature_lists["Augmented_23"]

    df = pd.read_csv(clean_csv_path)
    patient_row = df[features_23].iloc[0].to_dict()

    # Cast integer flags cleanly
    int_flag_cols = ["DM", "HTN", "Current Smoker", "Typical Chest Pain", "St Elevation", "St Depression", "Region RWMA"]
    for col in int_flag_cols:
        if col in patient_row:
            patient_row[col] = int(patient_row[col])

    return patient_row


# 1. Health Probe Test
def test_research_health_endpoint(client):
    response = client.get("/research-23/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["pipeline_type"] == "research_augmented_23"
    assert data["all_models_ready"] is True
    for target in ["Cath", "LAD", "LCX", "RCA"]:
        assert data["models_loaded"][target] is True


# 2. Metadata Endpoint Test
def test_research_metadata_endpoint(client):
    response = client.get("/research-23/metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["pipeline_type"] == "research_augmented_23"
    assert data["is_production"] is False
    assert data["research_only"] is True
    assert "disclaimer" in data

    feature_schema = data["feature_schema"]
    assert feature_schema["total_input_features"] == 23
    assert len(feature_schema["ordered_features"]) == 23
    assert feature_schema["numerical_features_count"] == 13
    assert feature_schema["categorical_features_count"] == 10

    # Ensure forbidden features are listed as excluded
    for fb in ["Cath", "LAD", "LCX", "RCA", "Exertional CP"]:
        assert fb in feature_schema["forbidden_features_excluded"]


# 3. Valid Single Prediction Test
def test_research_predict_single_valid(client, valid_patient_23):
    response = client.post("/research-23/predict", json=valid_patient_23)
    assert response.status_code == 200
    data = response.json()

    assert data["feature_set"] == "Augmented_23"
    assert data["features_used_count"] == 23
    assert "disclaimer" in data

    predictions = data["predictions"]
    for target in ["Cath", "LAD", "LCX", "RCA"]:
        assert target in predictions
        p = predictions[target]
        assert p["predicted_class"] in (0, 1)
        assert p["predicted_label"] in (
            TARGET_CONFIG[target]["positive_label"],
            TARGET_CONFIG[target]["negative_label"]
        )
        assert 0.0 <= p["probability"] <= 1.0
        assert p["applied_threshold"] == 0.50
        assert "model_type" in p


# 4. Valid Batch Prediction Test
def test_research_predict_batch_valid(client, valid_patient_23):
    batch_payload = {"patients": [valid_patient_23, valid_patient_23, valid_patient_23]}
    response = client.post("/research-23/predict/batch", json=batch_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["total_patients"] == 3
    assert len(data["results"]) == 3
    for idx, item in enumerate(data["results"]):
        assert item["patient_index"] == idx
        for target in ["Cath", "LAD", "LCX", "RCA"]:
            assert target in item["predictions"]
            assert 0.0 <= item["predictions"][target]["probability"] <= 1.0


# 5. Missing Field Rejections
@pytest.mark.parametrize("missing_field", ["Age", "Sex", "BMI", "Neut", "ESR", "Dyspnea", "Poor R Progression"])
def test_research_predict_missing_field(client, valid_patient_23, missing_field):
    payload = valid_patient_23.copy()
    del payload[missing_field]
    response = client.post("/research-23/predict", json=payload)
    assert response.status_code == 422
    err_text = response.text
    assert missing_field in err_text or "Field required" in err_text


# 6. Extra / Pruned Field Rejections (Strict extra='forbid')
@pytest.mark.parametrize("extra_field,val", [
    ("Weight", 75.0),
    ("Length", 175.0),
    ("CRF", "N"),
    ("Obesity", "Y"),
    ("UnrecognizedParam", 999)
])
def test_research_predict_extra_field_rejected(client, valid_patient_23, extra_field, val):
    payload = valid_patient_23.copy()
    payload[extra_field] = val
    response = client.post("/research-23/predict", json=payload)
    assert response.status_code == 422
    assert "extra_forbidden" in response.text or "Extra inputs are not permitted" in response.text


# 7. Target Leakage / Forbidden Feature Rejection
@pytest.mark.parametrize("forbidden_col,val", [
    ("Cath", "CAD"),
    ("LAD", "Stenotic"),
    ("LCX", "Normal"),
    ("RCA", "Stenotic"),
    ("Exertional CP", "N")
])
def test_research_predict_target_leakage_rejected(client, valid_patient_23, forbidden_col, val):
    payload = valid_patient_23.copy()
    payload[forbidden_col] = val
    response = client.post("/research-23/predict", json=payload)
    assert response.status_code == 422


# 8. Invalid Types and Physiological Ranges
@pytest.mark.parametrize("bad_field,bad_val", [
    ("Age", 5.0),          # ge=18.0
    ("Age", 150.0),        # le=120.0
    ("Sex", "Other"),      # Literal["Female", "Male"]
    ("DM", 2),             # Literal[0, 1]
    ("Region RWMA", 6),    # Literal[0, 1, 2, 3, 4]
    ("EF-TTE", 110.0),     # le=90.0
    ("Dyspnea", "Maybe"),  # Literal["Y", "N"]
    ("FBS", -5.0)          # ge=20.0
])
def test_research_predict_invalid_bounds(client, valid_patient_23, bad_field, bad_val):
    payload = valid_patient_23.copy()
    payload[bad_field] = bad_val
    response = client.post("/research-23/predict", json=payload)
    assert response.status_code == 422


# 9. Service Unavailable when Models Not Ready
def test_research_model_unready_handling(client, valid_patient_23, monkeypatch):
    monkeypatch.setattr(research23_model_manager, "is_all_ready", lambda: False)
    response = client.post("/research-23/predict", json=valid_patient_23)
    assert response.status_code == 503
    assert "not initialized" in response.json()["detail"].lower()


# 10. Internal Error Handling
def test_research_internal_error_handling(client, valid_patient_23, monkeypatch):
    def mock_predict_err(p):
        raise RuntimeError("Simulated inference matrix error")
    monkeypatch.setattr(research23_model_manager, "predict_single", mock_predict_err)

    response = client.post("/research-23/predict", json=valid_patient_23)
    assert response.status_code == 500
    assert "error occurred during research prediction" in response.json()["detail"].lower()


# 11. Production API Backward Compatibility Preservation
def test_production_api_backward_compatibility(client):
    """
    Guarantees that production endpoints (/health, /metadata, /predict)
    continue to function on the strict 54-feature contract without alteration.
    """
    clean_csv_path = PROJECT_ROOT / "data" / "processed" / "cad_clean.csv"
    df = pd.read_csv(clean_csv_path)
    forbidden = ["Cath", "LAD", "LCX", "RCA", "Exertional CP"]
    prod_patient_54 = df.drop(columns=forbidden, errors="ignore").iloc[0].to_dict()

    # 1. Production Health
    prod_health = client.get("/health")
    assert prod_health.status_code == 200
    assert prod_health.json()["status"] == "healthy"

    # 2. Production Metadata
    prod_meta = client.get("/metadata")
    assert prod_meta.status_code == 200
    assert prod_meta.json()["total_input_features"] == 54

    # 3. Production Prediction
    prod_pred = client.post("/predict", json=prod_patient_54)
    assert prod_pred.status_code == 200
    pred_data = prod_pred.json()
    assert "predictions" in pred_data
    for t in ["Cath", "LAD", "LCX", "RCA"]:
        assert t in pred_data["predictions"]
        assert 0.0 <= pred_data["predictions"][t]["probability"] <= 1.0

    # 4. Production Rejection of 23-feature payload (proves production contract is preserved)
    short_patient = {k: prod_patient_54[k] for k in list(prod_patient_54.keys())[:23]}
    res_bad = client.post("/predict", json=short_patient)
    assert res_bad.status_code == 422


# 12. Verification of Fixed Threshold 0.50 for All Candidates (Audit Alignment)
def test_research_targets_fixed_threshold_050(client, valid_patient_23):
    """
    Verifies that all four research candidate targets (Cath, LAD, LCX, RCA)
    strictly apply the documented fixed threshold of 0.50 from the repeated-CV audit,
    resolving any ambiguity around candidate thresholds (e.g., confirming LCX uses 0.50, not 0.40).
    """
    # 1. Verify in metadata endpoint
    meta_res = client.get("/research-23/metadata")
    assert meta_res.status_code == 200
    meta_data = meta_res.json()
    for target in ["Cath", "LAD", "LCX", "RCA"]:
        assert target in meta_data["models"]
        assert meta_data["models"][target]["primary_threshold"] == 0.50

    # 2. Verify in live single prediction
    pred_res = client.post("/research-23/predict", json=valid_patient_23)
    assert pred_res.status_code == 200
    pred_data = pred_res.json()["predictions"]
    for target in ["Cath", "LAD", "LCX", "RCA"]:
        assert pred_data[target]["applied_threshold"] == 0.50
        prob = pred_data[target]["probability"]
        expected_class = 1 if prob >= 0.50 else 0
        assert pred_data[target]["predicted_class"] == expected_class

