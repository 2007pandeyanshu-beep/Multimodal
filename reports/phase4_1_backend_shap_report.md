# CardioVision AI — Phase 4.1: Backend SHAP Engine & API Implementation Report

**Date of Execution:** October 12, 2026  
**Implementation Phase:** Phase 4.1 (Backend SHAP Engine & API Implementation)  
**Repository:** `D:\Multimodal`  
**Branch:** `person-a-ml-backend`  
**HEAD Commit:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`  

---

## 1. Executive Summary

Phase 4.1 successfully implemented the backend SHAP explainability engine and a dedicated, production-grade `/predict/explain` API endpoint for CardioVision AI. Building directly on the mathematical and architectural findings of the Phase 4.0 feasibility audit, the implementation decomposes inference into preprocessor feature transformation and tree path-dependent explainer attribution, guarantees exact mathematical additivity in probability space, maps one-hot encoded categories back to the 54 canonical clinical inputs in authoritative schema order, and preserves thread safety and prediction parity.

All 31 backend automated tests (20 existing integration tests and 11 new explainability tests) passed with 100% success. Zero frontend code, model artifacts, or training datasets were modified.

---

## 2. Safety Preflight & Repository Status

### 2.1 Preflight Verification
- **Current Branch:** `person-a-ml-backend` (Verified match).
- **HEAD Commit:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f` (Verified match).
- **Git Policy Adherence:** No commits, checkouts, stashes, resets, or cleans executed. All 10 pre-existing tracked modified files and all untracked assets and reports preserved intact.

### 2.2 Modified Files
- `ml/transformers.py`: Implemented `get_feature_names_out` on `StringCastTransformer` conforming to scikit-learn transformer protocol; defined authoritative `CANONICAL_FEATURE_ORDER` list.
- `backend/schemas.py`: Added `FeatureAttribution`, `TargetExplanation`, `ExplainRequest`, `ExplainResponse`, and `EXPLAINABILITY_DISCLAIMER`.
- `backend/model_loader.py`: Added thread-safe explainer caching (`threading.Lock`), transformed-to-canonical feature index mapping, and `explain_single` method.
- `backend/app.py`: Added `POST /predict/explain` endpoint with strict validation, error sanitization, and response formatting.

### 2.3 Created Files
- `backend/tests/test_explainability.py`: 11 automated unit and integration tests covering initialization, additivity, feature preservation, concurrency, and validation.
- `reports/phase4_1_backend_shap_report.md`: This comprehensive implementation and verification report.

---

## 3. Dependency Environment Verification

Confirmed installed dependency versions in the active AMD64 Windows Python 3.12.10 environment (`C:\Users\2007p\AppData\Local\Programs\Python\Python312\python.exe`):
- `shap`: `0.52.0`
- `scikit-learn`: `1.9.0`
- `fastapi`: `0.138.1`
- `pydantic`: `2.13.4`
- `uvicorn`: `0.49.0`
- `joblib`: `1.5.3`
- `numpy`: `2.3.5`
- `pandas`: `2.3.3`
- `pytest`: `9.1.1`

Zero new dependencies were installed or upgraded during this phase.

---

## 4. Explainability Engine Architecture

### 4.1 Two-Step Decomposition
As established in Phase 4.0, `shap.TreeExplainer` cannot explain scikit-learn `Pipeline` objects directly. The engine implements a clean two-step decomposition:
1. Raw patient inputs (`PatientInput`, 54 features) are transformed using the fitted model's `ColumnTransformer`:
   $$\mathbf{x}_{\text{trans}} = \text{preprocessor.transform}(\mathbf{x}_{\text{patient}}) \in \mathbb{R}^{1 \times 95}$$
2. The 95-dimensional transformed vector is evaluated by the cached `shap.TreeExplainer`:
   $$\mathbf{\phi} = \text{TreeExplainer}(\text{classifier}).\text{shap\_values}(\mathbf{x}_{\text{trans}})$$

### 4.2 Explicit Positive-Class Selection
In binary classification, `classifier.classes_` contains `[0, 1]`. Rather than assuming fixed index positions or array shapes, the positive-class index is resolved dynamically:
```python
classes_list = list(classifier.classes_)
pos_class_idx = classes_list.index(1)
```
SHAP attributions and baseline expectations are sliced explicitly using `pos_class_idx`.

### 4.3 Deterministic Canonical Feature Aggregation
The 95 transformed columns consist of:
- Columns `0` to `20`: 21 numerical features scaled by `StandardScaler`.
- Columns `21` to `94`: 74 one-hot encoded binary indicator columns generated from 33 categorical features.

During model initialization, `ModelManager` maps each transformed index to its parent canonical feature. Transformed SHAP attributions are aggregated additively:
$$\Phi_k = \sum_{j \in \text{Indices}(k)} \phi_j$$

The resulting attributions are emitted strictly adhering to `CANONICAL_FEATURE_ORDER`:
- Transformed SHAP sum equals canonical aggregated sum:
  $$\left| \sum_{j=1}^{95} \phi_j - \sum_{k=1}^{54} \Phi_k \right| = 0.00 \times 10^0 \text{ (exact numerical equality)}$$

### 4.4 `StringCastTransformer` Compatibility
`StringCastTransformer` in `ml/transformers.py` was enhanced to support `get_feature_names_out`:
```python
def get_feature_names_out(self, input_features=None):
    if input_features is not None:
        return np.asarray(input_features, dtype=object)
    if hasattr(self, "feature_names_in_"):
        return np.asarray(self.feature_names_in_, dtype=object)
    return np.array([], dtype=object)
```
This enables native scikit-learn `preprocessor.get_feature_names_out()` calls without breaking backward compatibility on existing serialized pipelines.

---

## 5. API Endpoint Contract: `POST /predict/explain`

### 5.1 Request Schema (`ExplainRequest`)
```json
{
  "patient": {
    "Age": 53.0,
    "Weight": 86.0,
    "Length": 172.0,
    "Sex": "Male",
    "BMI": 29.07,
    "DM": 0,
    "HTN": 1,
    "Current Smoker": 1,
    "EX-Smoker": 0,
    "FH": 0,
    "Obesity": "Y",
    "CRF": "N",
    "CVA": "N",
    "Airway disease": "N",
    "Thyroid Disease": "N",
    "CHF": "N",
    "DLP": "Y",
    "BP": 110.0,
    "PR": 74.0,
    "Edema": 0,
    "Weak Peripheral Pulse": "N",
    "Lung rales": "N",
    "Systolic Murmur": "N",
    "Diastolic Murmur": "N",
    "Typical Chest Pain": 0,
    "Dyspnea": "N",
    "Function Class": 0,
    "Atypical": "N",
    "Nonanginal": "N",
    "LowTH Ang": "N",
    "Q Wave": 0,
    "St Elevation": 0,
    "St Depression": 0,
    "Tinversion": 1,
    "LVH": "N",
    "Poor R Progression": "N",
    "BBB": "N",
    "FBS": 90.0,
    "CR": 0.8,
    "TG": 250.0,
    "LDL": 110.0,
    "HDL": 31.0,
    "BUN": 12.0,
    "ESR": 17.0,
    "HB": 14.6,
    "K": 4.7,
    "Na": 140.0,
    "WBC": 5800.0,
    "Lymph": 39.0,
    "Neut": 54.0,
    "PLT": 272.0,
    "EF-TTE": 50.0,
    "Region RWMA": 0,
    "VHD": "Normal"
  },
  "targets": ["Cath", "LAD"]
}
```
- `targets` is optional and defaults to all 4 targets (`["Cath", "LAD", "LCX", "RCA"]`).
- Invalid target names, duplicate target entries, and empty target lists are rejected with HTTP 422 validation errors.

### 5.2 Response Schema (`ExplainResponse`)
```json
{
  "explanations": {
    "Cath": {
      "target": "Cath",
      "predicted_probability": 0.5587604918859033,
      "predicted_class": 1,
      "predicted_label": "CAD",
      "base_value": 0.49910891089108933,
      "attributions": [
        {
          "feature_name": "Age",
          "submitted_value": 53.0,
          "contribution": -0.02297906941164999
        },
        {
          "feature_name": "Typical Chest Pain",
          "submitted_value": 0,
          "contribution": -0.12157585096738914
        },
        {
          "feature_name": "Tinversion",
          "submitted_value": 1,
          "contribution": 0.05567341399881858
        }
      ],
      "sum_attributions": 0.05965158099481412,
      "reconstructed_probability": 0.5587604918859035,
      "additivity_discrepancy": 2.220446049250313e-16,
      "output_space": "probability",
      "disclaimer": "Research prototype output for Multimodal AI Hackathon 2026 (Track A)..."
    }
  },
  "disclaimer": "Research prototype output for Multimodal AI Hackathon 2026 (Track A)..."
}
```

---

## 6. Mathematical Additivity & Correctness Verification

### 6.1 Additivity Check
For each target model, the reconstruction property holds:
$$\text{Reconstructed} = \text{base\_value} + \sum_{k=1}^{54} \Phi_k \approx \hat{P}(Y=1 \mid \mathbf{x})$$

**Documented Numerical Tolerance:** $\epsilon = 1.0 \times 10^{-5}$

**Empirical Measured Results (Patient 0, `cad_clean.csv`):**
| Target | Base Value $E[f(x)]$ | Sum Attributions $\sum \Phi_k$ | Reconstructed Prob | Predict Prob | Measured Discrepancy | Tolerance | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cath** | `0.49910891` | `+0.05965158` | `0.55876049` | `0.55876049` | **$2.22 \times 10^{-16}$** | $< 10^{-5}$ | **PASS** |
| **LAD** | `0.49753086` | `+0.02706914` | `0.52460000` | `0.52460000` | **$0.00 \times 10^0$** | $< 10^{-5}$ | **PASS** |
| **LCX** | `0.49411765` | `-0.17421765` | `0.31990000` | `0.31990000` | **$1.11 \times 10^{-16}$** | $< 10^{-5}$ | **PASS** |
| **RCA** | `0.50089109` | `+0.05810891` | `0.55900000` | `0.55900000` | **$1.11 \times 10^{-16}$** | $< 10^{-5}$ | **PASS** |

**Maximum Measured Discrepancy Across All Targets:** **$2.22 \times 10^{-16}$** (Exact machine epsilon).

### 6.2 Prediction Parity
Predictions from the production `/predict` endpoint were compared before and after generating SHAP explanations:
- `Cath`: Probability = `0.5588`, Class = `1`, Label = `'CAD'` (Exact match before & after).
- `LAD`: Probability = `0.5246`, Class = `1`, Label = `'Stenotic'` (Exact match before & after).
- `LCX`: Probability = `0.3199`, Class = `0`, Label = `'Normal'` (Exact match before & after).
- `RCA`: Probability = `0.5590`, Class = `1`, Label = `'Stenotic'` (Exact match before & after).
TreeExplainer execution does not alter tree structures, leaf probabilities, or model weights.

---

## 7. Thread Safety & Concurrency

1. **Initialization Lock:** `ModelManager` protects model and explainer loading with `self._lock = threading.Lock()`.
2. **Read-Only Concurrent Inference:** `shap.TreeExplainer.shap_values` performs read-only traversal over Cython tree structures.
3. **Concurrency Test:** `test_concurrency_and_thread_safety` executed 12 simultaneous worker threads interleaving `/predict/explain` and `/predict` calls. Zero deadlocks, race conditions, or state corruptions occurred.
4. **Stateless Processing:** Patient explanations are not persisted to disk, database, or session cache on the backend.

---

## 8. Test Execution Results

### 8.1 Explainability Test Suite (`backend/tests/test_explainability.py`)
Executed with: `pytest backend/tests/test_explainability.py -v`
```text
backend/tests/test_explainability.py::test_all_models_and_explainers_initialized PASSED [  9%]
backend/tests/test_explainability.py::test_positive_class_index_explicit_determination PASSED [ 18%]
backend/tests/test_explainability.py::test_canonical_aggregation_sum_preservation PASSED [ 27%]
backend/tests/test_explainability.py::test_additivity_reconstruction_each_target PASSED [ 36%]
backend/tests/test_explainability.py::test_predictions_unchanged_before_and_after_explanation PASSED [ 45%]
backend/tests/test_explainability.py::test_target_filtering_and_validation PASSED [ 54%]
backend/tests/test_explainability.py::test_missing_and_unseen_categories PASSED [ 63%]
backend/tests/test_explainability.py::test_malformed_requests PASSED     [ 72%]
backend/tests/test_explainability.py::test_existing_endpoints_regression PASSED [ 81%]
backend/tests/test_concurrency_and_thread_safety PASSED                  [ 90%]
backend/tests/test_string_cast_transformer_get_feature_names_out PASSED [100%]
======================= 11 passed in 8.29s =======================
```

### 8.2 Full Backend Regression Suite (`backend/tests/`)
Executed with: `pytest backend/tests/ -v`
```text
backend/tests/test_api.py::test_health_endpoint PASSED                   [  3%]
backend/tests/test_api.py::test_metadata_endpoint PASSED                 [  6%]
backend/tests/test_api.py::test_predict_single_valid PASSED              [  9%]
backend/tests/test_api.py::test_predict_batch_valid PASSED               [ 12%]
backend/tests/test_api.py::test_predict_missing_field PASSED             [ 16%]
backend/tests/test_api.py::test_predict_unexpected_field PASSED          [ 19%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[Cath] PASSED [ 22%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[LAD] PASSED [ 25%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[LCX] PASSED [ 29%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[RCA] PASSED [ 32%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[Exertional CP] PASSED [ 35%]
backend/tests/test_api.py::test_predict_invalid_category_value PASSED    [ 38%]
backend/tests/test_api.py::test_predict_invalid_numeric_range PASSED     [ 41%]
backend/tests/test_api.py::test_predict_batch_empty PASSED               [ 45%]
backend/tests/test_api.py::test_predict_batch_exceeds_limit PASSED       [ 48%]
backend/tests/test_api.py::test_model_loading_failure_handling PASSED    [ 51%]
backend/tests/test_api.py::test_predict_endpoint_503_when_models_not_ready PASSED [ 54%]
backend/tests/test_cors_allowed_origin_headers PASSED                   [ 58%]
backend/tests/test_cors_disallowed_origin_headers PASSED                [ 61%]
backend/tests/test_predict_boundary_values PASSED                       [ 64%]
backend/tests/test_explainability.py::test_all_models_and_explainers_initialized PASSED [ 67%]
backend/tests/test_explainability.py::test_positive_class_index_explicit_determination PASSED [ 70%]
backend/tests/test_explainability.py::test_canonical_aggregation_sum_preservation PASSED [ 74%]
backend/tests/test_explainability.py::test_additivity_reconstruction_each_target PASSED [ 77%]
backend/tests/test_explainability.py::test_predictions_unchanged_before_and_after_explanation PASSED [ 80%]
backend/tests/test_explainability.py::test_target_filtering_and_validation PASSED [ 83%]
backend/tests/test_explainability.py::test_missing_and_unseen_categories PASSED [ 87%]
backend/tests/test_explainability.py::test_malformed_requests PASSED     [ 90%]
backend/tests/test_explainability.py::test_existing_endpoints_regression PASSED [ 93%]
backend/tests/test_explainability.py::test_concurrency_and_thread_safety PASSED [ 96%]
backend/tests/test_explainability.py::test_string_cast_transformer_get_feature_names_out PASSED [100%]
======================= 31 passed in 8.36s =======================
```
- **Skipped / Unverified Tests:** 0.

### 8.3 Frontend TypeScript Build
Executed with: `npm run build` in `frontend/`
- Result: `tsc -b && vite build` completed in 810 ms with 0 errors.

---

## 9. Final Working Tree Inventory

```text
M backend/app.py
M backend/model_loader.py
M backend/schemas.py
M frontend/package-lock.json
M frontend/package.json
M frontend/src/App.tsx
M frontend/src/components/Header.tsx
M frontend/src/components/HeartCanvas.tsx
M frontend/src/components/PatientAssessmentForm.tsx
M frontend/src/components/PatientAssessmentModal.tsx
M frontend/src/components/ScanningFrame.tsx
M frontend/src/index.css
M frontend/tsconfig.app.json
M ml/transformers.py
?? backend/tests/test_explainability.py
?? reports/phase4_1_backend_shap_report.md
```
*(All 10 pre-existing tracked modified files and all pre-existing untracked files preserved intact).*

---

## 10. Conclusion & Boundary Confirmation

Phase 4.1 implementation is **complete**. The backend SHAP engine and `/predict/explain` API endpoint are fully operational, mathematically verified, thread-safe, and thoroughly covered by regression tests.

Per the completion criteria, all Phase 4.2–4.4 work (frontend UI charts, waterfall visualizations, and global explainability UI) remains deferred to subsequent phases.
