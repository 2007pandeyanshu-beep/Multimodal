"""
backend/tests/test_explainability.py - Comprehensive Unit & Integration Tests for Backend SHAP Engine
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Tests covering:
1. All four target models and TreeExplainers initialize successfully.
2. Positive-class index is determined explicitly from classes_ (index 1).
3. Canonical feature aggregation strictly preserves the transformed SHAP sum.
4. Additivity reconstruction holds for each target within documented tolerance (< 1e-5).
5. Predictions remain strictly unchanged before and after explanation generation.
6. Target validation: invalid, duplicate, and empty targets are rejected with 422; valid subsets succeed.
7. Missing and unseen categories: transformer handles unseen categories; schema rejects invalid literals.
8. Malformed requests (missing fields, out-of-bounds numbers, extra fields) receive controlled 422 validation errors.
9. Regression verification: existing endpoints (/health, /metadata, /predict, /predict/batch) remain operational.
10. Concurrency & thread safety: concurrent requests cannot corrupt or duplicate cached explainer state.
11. StringCastTransformer get_feature_names_out contract verification.
"""

import os
import sys
import pytest
import numpy as np
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app import app
from backend.config import PROJECT_ROOT
from backend.model_loader import model_manager
from ml.transformers import TARGET_CONFIG, CANONICAL_FEATURE_ORDER, StringCastTransformer


# Documented additivity tolerance
ADDITIVITY_TOLERANCE = 1e-5


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
    patient = df.drop(columns=["Cath", "CAD", "LAD", "LCX", "RCA", "Exertional CP"], errors="ignore").iloc[0].to_dict()
    return patient


# Test 1: All four target models and explainers initialize successfully
def test_all_models_and_explainers_initialized(client):
    assert model_manager.is_all_ready() is True
    assert model_manager.is_explainers_ready() is True
    for target in ["Cath", "LAD", "LCX", "RCA"]:
        assert target in model_manager.models
        assert target in model_manager.explainers
        assert target in model_manager.feature_index_to_canonical
        assert len(model_manager.feature_index_to_canonical[target]) == 95


# Test 2: Positive-class index is determined explicitly from classes_
def test_positive_class_index_explicit_determination():
    for target in ["Cath", "LAD", "LCX", "RCA"]:
        clf = model_manager.models[target].named_steps["classifier"]
        classes_list = list(clf.classes_)
        assert 1 in classes_list, f"Positive class 1 missing from classes_ for {target}"
        pos_idx = classes_list.index(1)
        assert pos_idx == 1, f"Expected positive class index 1, got {pos_idx} for {target}"


# Test 3: Canonical feature aggregation preserves the transformed SHAP sum
def test_canonical_aggregation_sum_preservation(valid_patient_data):
    df_patient = pd.DataFrame([valid_patient_data])
    for target in ["Cath", "LAD", "LCX", "RCA"]:
        pipe = model_manager.models[target]
        clf = pipe.named_steps["classifier"]
        prep = pipe.named_steps["preprocessor"]
        explainer = model_manager.explainers[target]
        idx_map = model_manager.feature_index_to_canonical[target]

        X_trans = prep.transform(df_patient)
        raw_shap = explainer.shap_values(X_trans)
        pos_class_idx = list(clf.classes_).index(1)
        sample_shap = raw_shap[pos_class_idx][0] if isinstance(raw_shap, list) else raw_shap[0, :, pos_class_idx]

        transformed_sum = float(np.sum(sample_shap))

        # Aggregate to canonical features
        canonical_sums = {f: 0.0 for f in CANONICAL_FEATURE_ORDER}
        for idx, val in enumerate(sample_shap):
            canonical_sums[idx_map[idx]] += float(val)

        canonical_sum = float(sum(canonical_sums.values()))
        diff = abs(transformed_sum - canonical_sum)
        assert diff < 1e-14, f"Sum conservation discrepancy for {target}: {diff}"


# Test 4: Additivity reconstruction for each target within tolerance
def test_additivity_reconstruction_each_target(client, valid_patient_data):
    response = client.post("/predict/explain", json={"patient": valid_patient_data})
    assert response.status_code == 200
    data = response.json()
    assert "explanations" in data
    assert "disclaimer" in data

    explanations = data["explanations"]
    assert len(explanations) == 4

    max_measured_discrepancy = 0.0

    for target in ["Cath", "LAD", "LCX", "RCA"]:
        assert target in explanations
        exp = explanations[target]

        # Field validation
        assert exp["target"] == target
        assert exp["output_space"] == "probability"
        assert exp["predicted_class"] in [0, 1]
        assert 0.0 <= exp["predicted_probability"] <= 1.0
        assert 0.0 <= exp["base_value"] <= 1.0
        assert len(exp["attributions"]) == 54

        # Ordering check
        reported_feature_order = [a["feature_name"] for a in exp["attributions"]]
        assert reported_feature_order == CANONICAL_FEATURE_ORDER, f"Canonical ordering violated for {target}"

        # Reconstructed probability check
        base = exp["base_value"]
        sum_contribs = exp["sum_attributions"]
        reconstructed = exp["reconstructed_probability"]
        assert np.isclose(base + sum_contribs, reconstructed, atol=1e-12)

        # Additivity discrepancy check against predicted_probability
        discrepancy = exp["additivity_discrepancy"]
        assert discrepancy < ADDITIVITY_TOLERANCE, (
            f"Additivity discrepancy {discrepancy} exceeded tolerance {ADDITIVITY_TOLERANCE} for {target}"
        )
        if discrepancy > max_measured_discrepancy:
            max_measured_discrepancy = discrepancy

    print(f"Max measured additivity discrepancy: {max_measured_discrepancy:.2e}")


# Test 5: Predictions remain unchanged before and after explanation
def test_predictions_unchanged_before_and_after_explanation(client, valid_patient_data):
    # Predict before
    res_before = client.post("/predict", json=valid_patient_data)
    assert res_before.status_code == 200
    preds_before = res_before.json()["predictions"]

    # Generate explanations
    res_explain = client.post("/predict/explain", json={"patient": valid_patient_data})
    assert res_explain.status_code == 200

    # Predict after
    res_after = client.post("/predict", json=valid_patient_data)
    assert res_after.status_code == 200
    preds_after = res_after.json()["predictions"]

    # Verify strict parity
    for target in ["Cath", "LAD", "LCX", "RCA"]:
        assert preds_before[target]["probability"] == preds_after[target]["probability"]
        assert preds_before[target]["predicted_class"] == preds_after[target]["predicted_class"]
        assert preds_before[target]["predicted_label"] == preds_after[target]["predicted_label"]

        # Explanation probability parity with prediction pipeline
        exp_prob = res_explain.json()["explanations"][target]["predicted_probability"]
        assert np.isclose(exp_prob, preds_before[target]["probability"], atol=1e-4)


# Test 6: Target validation: invalid, duplicate, empty rejected; valid subsets succeed
def test_target_filtering_and_validation(client, valid_patient_data):
    # 6a. Valid subset
    res_subset = client.post(
        "/predict/explain",
        json={"patient": valid_patient_data, "targets": ["Cath", "LAD"]}
    )
    assert res_subset.status_code == 200
    exps = res_subset.json()["explanations"]
    assert set(exps.keys()) == {"Cath", "LAD"}

    # 6b. Invalid target name -> 422
    res_invalid = client.post(
        "/predict/explain",
        json={"patient": valid_patient_data, "targets": ["Cath", "INVALID_VESSEL"]}
    )
    assert res_invalid.status_code == 422
    assert "Invalid target" in str(res_invalid.json())

    # 6c. Duplicate target names -> 422
    res_dup = client.post(
        "/predict/explain",
        json={"patient": valid_patient_data, "targets": ["Cath", "Cath"]}
    )
    assert res_dup.status_code == 422
    assert "Duplicate target" in str(res_dup.json())

    # 6d. Empty targets list -> 422
    res_empty = client.post(
        "/predict/explain",
        json={"patient": valid_patient_data, "targets": []}
    )
    assert res_empty.status_code == 422
    assert "Target list cannot be empty" in str(res_empty.json())


# Test 7: Missing and unseen categories behavior
def test_missing_and_unseen_categories(client, valid_patient_data):
    # 7a. Unseen categorical literal rejected by Pydantic PatientInput schema
    bad_patient = dict(valid_patient_data)
    bad_patient["Sex"] = "NonBinary"
    res = client.post("/predict/explain", json={"patient": bad_patient})
    assert res.status_code == 422

    # 7b. Underlying ModelManager handles unseen category via OneHotEncoder(handle_unknown='ignore')
    unknown_patient = dict(valid_patient_data)
    unknown_patient["Sex"] = "OtherUnknown"
    exps = model_manager.explain_single(unknown_patient, targets=["Cath"])
    assert "Cath" in exps
    exp = exps["Cath"]
    assert exp["additivity_discrepancy"] < ADDITIVITY_TOLERANCE


# Test 8: Malformed requests receive controlled validation errors
def test_malformed_requests(client, valid_patient_data):
    # Missing required field
    missing_data = dict(valid_patient_data)
    del missing_data["Age"]
    res = client.post("/predict/explain", json={"patient": missing_data})
    assert res.status_code == 422

    # Numeric out of range (BP = 500)
    out_of_range = dict(valid_patient_data)
    out_of_range["BP"] = 500.0
    res = client.post("/predict/explain", json={"patient": out_of_range})
    assert res.status_code == 422

    # Unexpected forbidden target in payload (Cath as input)
    leakage_data = dict(valid_patient_data)
    leakage_data["Cath"] = 1
    res = client.post("/predict/explain", json={"patient": leakage_data})
    assert res.status_code == 422


# Test 9: Regression verification of existing endpoints
def test_existing_endpoints_regression(client, valid_patient_data):
    # /health
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

    # /metadata
    res_meta = client.get("/metadata")
    assert res_meta.status_code == 200
    assert res_meta.json()["total_input_features"] == 54

    # /predict
    res_pred = client.post("/predict", json=valid_patient_data)
    assert res_pred.status_code == 200
    assert len(res_pred.json()["predictions"]) == 4

    # /predict/batch
    res_batch = client.post("/predict/batch", json={"patients": [valid_patient_data, valid_patient_data]})
    assert res_batch.status_code == 200
    assert res_batch.json()["total_patients"] == 2


# Test 10: Concurrency and thread safety under concurrent requests
def test_concurrency_and_thread_safety(client, valid_patient_data):
    def run_explain():
        return client.post("/predict/explain", json={"patient": valid_patient_data})

    def run_predict():
        return client.post("/predict", json=valid_patient_data)

    num_threads = 12
    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = []
        for i in range(num_threads):
            if i % 2 == 0:
                futures.append(executor.submit(run_explain))
            else:
                futures.append(executor.submit(run_predict))

        for future in as_completed(futures):
            res = future.result()
            assert res.status_code == 200


# Test 11: StringCastTransformer get_feature_names_out contract verification
def test_string_cast_transformer_get_feature_names_out():
    transformer = StringCastTransformer()
    # Contract with input_features
    features_in = ["Sex", "DM", "HTN"]
    features_out = transformer.get_feature_names_out(features_in)
    assert list(features_out) == features_in

    # Contract when fitted with DataFrame
    df = pd.DataFrame({"colA": [1, 2], "colB": ["x", "y"]})
    transformer.fit(df)
    features_out_fitted = transformer.get_feature_names_out()
    assert list(features_out_fitted) == ["colA", "colB"]

    # Verify unpickled model preprocessor supports get_feature_names_out
    for target in ["Cath", "LAD", "LCX", "RCA"]:
        prep = model_manager.models[target].named_steps["preprocessor"]
        names = prep.get_feature_names_out()
        assert len(names) == 95


# Test 12: GET /explain/global contract, values, and determinism verification
def test_get_global_shap_endpoint_contract(client):
    res = client.get("/explain/global")
    assert res.status_code == 200
    data = res.json()

    # Verify cohort metadata
    assert data["cohort_name"] == "Tehran Heart Center Cohort"
    assert data["sample_size"] == 303
    assert "disclaimer" in data
    assert "calculation_method" in data

    # Verify all four targets present
    targets = ["Cath", "LAD", "LCX", "RCA"]
    assert sorted(list(data["targets"].keys())) == sorted(targets)

    for target in targets:
        t_data = data["targets"][target]
        assert t_data["target"] == target
        assert t_data["sample_size"] == 303
        assert t_data["cohort_name"] == "Tehran Heart Center Cohort"
        assert t_data["output_space"] == "probability"
        
        top_features = t_data["top_features"]
        assert len(top_features) == 10

        prev_val = float("inf")
        prev_name = ""
        for i, item in enumerate(top_features):
            assert item["rank"] == i + 1
            assert item["feature_name"] in CANONICAL_FEATURE_ORDER
            val = item["mean_absolute_shap"]
            assert 0.0 < val <= 1.0
            # Verify descending order (or alphabetical tie-breaking if equal)
            if val == prev_val:
                assert item["feature_name"] > prev_name
            else:
                assert val <= prev_val
            prev_val = val
            prev_name = item["feature_name"]

    # Verify specific verified top predictor
    assert data["targets"]["Cath"]["top_features"][0]["feature_name"] == "Typical Chest Pain"
    assert round(data["targets"]["Cath"]["top_features"][0]["mean_absolute_shap"], 3) == 0.142

    # Verify caching idempotency
    res_cached = client.get("/explain/global")
    assert res_cached.status_code == 200
    assert res_cached.json() == data
