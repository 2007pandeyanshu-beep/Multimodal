"""
backend/tests/test_api.py - Automated Unit & Integration Tests for FastAPI Backend
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Tests:
1. Health endpoint and model-loading status.
2. Metadata endpoint and exact 54-feature schema.
3. Successful prediction for a valid single-patient request.
4. Successful batch prediction and preservation of result order.
5. Missing fields, unexpected fields, invalid values, and malformed requests.
6. Probability range [0.0, 1.0] and consistency of class labels.
7. Missing/corrupted model artifact error handling (503 Service Unavailable).
8. Target leakage prevention: Cath, LAD, LCX, RCA, Exertional CP must be strictly rejected.
"""

import sys
import os
import pytest
import pandas as pd
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app import app
from backend.config import PROJECT_ROOT, MAX_BATCH_SIZE
from backend.model_loader import ModelManager, model_manager
from ml.transformers import FORBIDDEN_FEATURES, TARGET_CONFIG


@pytest.fixture(scope="module")
def client():
    """Test client with loaded models in lifespan context."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def valid_patient_data():
    """Provides a realistic validated patient record from cad_clean.csv."""
    clean_csv_path = PROJECT_ROOT / "data" / "processed" / "cad_clean.csv"
    df = pd.read_csv(clean_csv_path)
    
    # Drop targets and forbidden columns
    patient = df.drop(columns=["Cath", "LAD", "LCX", "RCA", "Exertional CP"]).iloc[0].to_dict()
    return patient


# 1. Health Endpoint Test
def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["all_models_ready"] is True
    for target in ["Cath", "LAD", "LCX", "RCA"]:
        assert data["models_loaded"][target] is True


# 2. Metadata Endpoint Test
def test_metadata_endpoint(client):
    response = client.get("/metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["total_input_features"] == 54
    assert len(data["numerical_features"]) == 21
    assert len(data["categorical_features"]) == 33
    for f in FORBIDDEN_FEATURES:
        assert f in data["forbidden_features"]
        assert f not in data["numerical_features"]
        assert f not in data["categorical_features"]
    assert "Cath" in data["targets"]
    assert "LAD" in data["targets"]
    assert "LCX" in data["targets"]
    assert "RCA" in data["targets"]


# 3. Valid Single-Patient Prediction Test
def test_predict_single_valid(client, valid_patient_data):
    response = client.post("/predict", json=valid_patient_data)
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert "disclaimer" in data

    preds = data["predictions"]
    for target in ["Cath", "LAD", "LCX", "RCA"]:
        assert target in preds
        pred_item = preds[target]
        assert pred_item["predicted_class"] in [0, 1]
        assert 0.0 <= pred_item["probability"] <= 1.0

        # Label consistency check
        pos_lbl = TARGET_CONFIG[target]["positive_label"]
        neg_lbl = TARGET_CONFIG[target]["negative_label"]
        if pred_item["predicted_class"] == 1:
            assert pred_item["predicted_label"] == pos_lbl
        else:
            assert pred_item["predicted_label"] == neg_lbl


# 4. Valid Batch Prediction and Result Order Preservation
def test_predict_batch_valid(client, valid_patient_data):
    clean_csv_path = PROJECT_ROOT / "data" / "processed" / "cad_clean.csv"
    df = pd.read_csv(clean_csv_path).drop(columns=["Cath", "LAD", "LCX", "RCA", "Exertional CP"])
    patients = [df.iloc[i].to_dict() for i in range(3)]

    response = client.post("/predict/batch", json={"patients": patients})
    assert response.status_code == 200
    data = response.json()
    assert data["total_patients"] == 3
    assert len(data["results"]) == 3

    for i in range(3):
        res = data["results"][i]
        assert res["patient_index"] == i
        assert len(res["predictions"]) == 4


# 5. Missing Field Validation
def test_predict_missing_field(client, valid_patient_data):
    malformed = valid_patient_data.copy()
    del malformed["Age"]  # Remove required field

    response = client.post("/predict", json=malformed)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert any("Age" in str(err) for err in data.get("errors", []))


# 6. Unexpected Field Rejection (extra='forbid')
def test_predict_unexpected_field(client, valid_patient_data):
    malformed = valid_patient_data.copy()
    malformed["Arbitrary_Extra_Field"] = "random_value"

    response = client.post("/predict", json=malformed)
    assert response.status_code == 422
    data = response.json()
    assert any("extra_forbidden" in str(err) or "Arbitrary_Extra_Field" in str(err) for err in data.get("errors", []))


# 7. Target Leakage Rejection (Cath, LAD, LCX, RCA, Exertional CP)
@pytest.mark.parametrize("forbidden_col", ["Cath", "LAD", "LCX", "RCA", "Exertional CP"])
def test_predict_target_leakage_rejection(client, valid_patient_data, forbidden_col):
    leaky_input = valid_patient_data.copy()
    leaky_input[forbidden_col] = "Normal"

    response = client.post("/predict", json=leaky_input)
    assert response.status_code == 422
    data = response.json()
    assert any("extra_forbidden" in str(err) or forbidden_col in str(err) for err in data.get("errors", []))


# 8. Invalid Categorical and Numeric Values
def test_predict_invalid_category_value(client, valid_patient_data):
    invalid_data = valid_patient_data.copy()
    invalid_data["Sex"] = "UnknownGender"

    response = client.post("/predict", json=invalid_data)
    assert response.status_code == 422


def test_predict_invalid_numeric_range(client, valid_patient_data):
    invalid_data = valid_patient_data.copy()
    invalid_data["Age"] = 999.0  # Exceeds max 120

    response = client.post("/predict", json=invalid_data)
    assert response.status_code == 422


# 9. Batch Limit Enforcement
def test_predict_batch_empty(client):
    response = client.post("/predict/batch", json={"patients": []})
    assert response.status_code in [400, 422]


def test_predict_batch_exceeds_limit(client, valid_patient_data):
    too_many = [valid_patient_data] * (MAX_BATCH_SIZE + 1)
    response = client.post("/predict/batch", json={"patients": too_many})
    assert response.status_code == 400
    assert "exceeds" in response.json().get("detail", "").lower()


# 10. Model Loading Failure Error Handling
def test_model_loading_failure_handling(tmp_path):
    empty_manager = ModelManager(artifacts_dir=tmp_path, metadata_path=tmp_path / "metadata.json")
    empty_manager.load_all_models()
    assert empty_manager.is_all_ready() is False
    assert all(loaded is False for loaded in empty_manager.get_status().values())

    with pytest.raises(RuntimeError) as exc_info:
        empty_manager.predict_single({"Age": 50})
    assert "Service unavailable" in str(exc_info.value)


# 11. Endpoint 503 Service Unavailable Test
def test_predict_endpoint_503_when_models_not_ready(client, valid_patient_data, monkeypatch):
    monkeypatch.setattr(model_manager, "is_all_ready", lambda: False)
    response = client.post("/predict", json=valid_patient_data)
    assert response.status_code == 503
    assert "Models are not initialized" in response.json().get("detail", "")

    batch_resp = client.post("/predict/batch", json={"patients": [valid_patient_data]})
    assert batch_resp.status_code == 503


# 12. CORS Header Verification Tests
def test_cors_allowed_origin_headers(client):
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
    }
    response = client.options("/predict", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_disallowed_origin_headers(client):
    headers = {
        "Origin": "http://unauthorized-domain.com",
        "Access-Control-Request-Method": "POST",
    }
    response = client.options("/predict", headers=headers)
    assert response.headers.get("access-control-allow-origin") != "http://unauthorized-domain.com"


# 13. Valid Boundary Value Acceptance Test
def test_predict_boundary_values(client, valid_patient_data):
    boundary_patient = valid_patient_data.copy()
    boundary_patient["Age"] = 18.0   # Minimum allowed age
    boundary_patient["Weight"] = 300.0 # Maximum allowed weight
    response = client.post("/predict", json=boundary_patient)
    assert response.status_code == 200
    assert "predictions" in response.json()

