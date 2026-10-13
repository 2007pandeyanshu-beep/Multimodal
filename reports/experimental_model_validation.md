# Experimental Model Artifact & API Contract Validation Report

**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Execution Date:** 2026-10-12 01:42:10  
**Target Artifacts:** [`D:\multimodal ai\Multimodal\ml\experimental_artifacts`](file:///D:/multimodal ai/Multimodal/ml/experimental_artifacts)  
**Overall Status:** **PASSED (100% Validated)** (8/8 Tests Passed)  

---

## 1. Executive Summary

This automated validation suite verified the four candidate machine learning pipelines trained and serialized to `ml/experimental_artifacts/`:
- **`Cath`**: Soft Voting Ensemble (`model_cath.joblib`)
- **`LAD`**: Balanced Random Forest Classifier (`model_lad.joblib`)
- **`LCX`**: Stacking Ensemble (`model_lcx.joblib`)
- **`RCA`**: Stacking Ensemble (`model_rca.joblib`)

All artifacts were evaluated for scikit-learn pipeline compliance, probability calibration bounds $[0.0, 1.0]$, batch vectorization, categorical data robustness, and seamless integration with the existing FastAPI `ModelManager` and Pydantic V2 request/response schemas **without modifying production files**.

---

## 2. Test Execution Results Matrix

| # | Test Suite Scenario | Status | Execution Time | Summary Outcome |
| :---: | :--- | :---: | :---: | :--- |
| 1 | **Artifact & Metadata Integrity** | ✅ PASS | 1.0 ms | All 4 experimental pipeline artifacts and metadata catalog verified. |
| 2 | **Fresh Deserialization & Architecture** | ✅ PASS | 110.4 ms | All 4 pipelines cleanly deserialized with scikit-learn standard interface. |
| 3 | **Single-Patient Inference & Shapes** | ✅ PASS | 132.6 ms | All single-patient predictions produced valid binary labels and normalized probabilities. |
| 4 | **Batch Inference & Order Preservation** | ✅ PASS | 711.1 ms | Batch prediction validated up to 50 records with strict index stability. |
| 5 | **Categorical Robustness & Unseen Levels** | ✅ PASS | 175.5 ms | Pipelines demonstrate complete robustness to categorical type representations and unseen categories. |
| 6 | **Missing Feature & Error Handling** | ✅ PASS | 0.0 ms | All 4 pipelines strictly trap and reject incomplete patient feature schemas. |
| 7 | **FastAPI Contract & Pydantic Schema Validation** | ✅ PASS | 315.7 ms | ModelManager and API schemas validated with 100% Pydantic V2 contract compliance. |
| 8 | **Provisional Threshold Sanity** | ✅ PASS | 67.9 ms | Provisional thresholds verified: Threshold sensitivity adjustments function predictably. |

---

## 3. Detailed Scenario Audits

### Test 1: Artifact & Metadata Integrity

- **Description:** Verify experimental artifacts exist and metadata schema matches specifications  
- **Result:** **PASSED** (All 4 experimental pipeline artifacts and metadata catalog verified.)  
- **Execution Latency:** 0.99 ms  

**Detailed Verifications:**
- `Verified artifact for target 'Cath': model_cath.joblib (SoftVoting)`
- `Verified artifact for target 'LAD': model_lad.joblib (RandomForest)`
- `Verified artifact for target 'LCX': model_lcx.joblib (Stacking)`
- `Verified artifact for target 'RCA': model_rca.joblib (Stacking)`

### Test 2: Fresh Deserialization & Architecture

- **Description:** Verify unpickling and pipeline component integrity  
- **Result:** **PASSED** (All 4 pipelines cleanly deserialized with scikit-learn standard interface.)  
- **Execution Latency:** 110.43 ms  

**Detailed Verifications:**
- `Successfully loaded Cath -> Preprocessor + VotingClassifier`
- `Successfully loaded LAD -> Preprocessor + RandomForestClassifier`
- `Successfully loaded LCX -> Preprocessor + StackingClassifier`
- `Successfully loaded RCA -> Preprocessor + StackingClassifier`

### Test 3: Single-Patient Inference & Shapes

- **Description:** Verify scalar prediction output shapes and probability normalization  
- **Result:** **PASSED** (All single-patient predictions produced valid binary labels and normalized probabilities.)  
- **Execution Latency:** 132.59 ms  

**Detailed Verifications:**
- `Cath: Class=1, P(Pos)=0.6756, P(Neg)=0.3244`
- `LAD: Class=1, P(Pos)=0.5246, P(Neg)=0.4754`
- `LCX: Class=0, P(Pos)=0.2938, P(Neg)=0.7062`
- `RCA: Class=1, P(Pos)=0.5711, P(Neg)=0.4289`

### Test 4: Batch Inference & Order Preservation

- **Description:** Verify vectorized batch execution up to MAX_BATCH_SIZE (50) and index stability  
- **Result:** **PASSED** (Batch prediction validated up to 50 records with strict index stability.)  
- **Execution Latency:** 711.11 ms  

**Detailed Verifications:**
- `Validated batch size 5: Correct shapes and 100% order preservation.`
- `Validated batch size 20: Correct shapes and 100% order preservation.`
- `Validated batch size 50: Correct shapes and 100% order preservation.`

### Test 5: Categorical Robustness & Unseen Levels

- **Description:** Verify StringCastTransformer type conversion and OneHotEncoder handle_unknown='ignore'  
- **Result:** **PASSED** (Pipelines demonstrate complete robustness to categorical type representations and unseen categories.)  
- **Execution Latency:** 175.50 ms  

**Detailed Verifications:**
- `StringCastTransformer verified: Numeric flags (0/1) and string representations ('0'/'1') produce identical output.`
- `OneHotEncoder handle_unknown='ignore' verified: Novel categorical values zero out safely without runtime errors.`

### Test 6: Missing Feature & Error Handling

- **Description:** Verify pipeline fails informatively when mandatory features are omitted  
- **Result:** **PASSED** (All 4 pipelines strictly trap and reject incomplete patient feature schemas.)  
- **Execution Latency:** 0.00 ms  

**Detailed Verifications:**
- `Cath successfully trapped missing column error: ValueError`
- `LAD successfully trapped missing column error: ValueError`
- `LCX successfully trapped missing column error: ValueError`
- `RCA successfully trapped missing column error: ValueError`

### Test 7: FastAPI Contract & Pydantic Schema Validation

- **Description:** Verify ModelManager and API request/response schemas with experimental models  
- **Result:** **PASSED** (ModelManager and API schemas validated with 100% Pydantic V2 contract compliance.)  
- **Execution Latency:** 315.66 ms  

**Detailed Verifications:**
- `API TargetPrediction 'Cath': Class=1 (CAD), Prob=0.6756`
- `API TargetPrediction 'LAD': Class=1 (Stenotic), Prob=0.5246`
- `API TargetPrediction 'LCX': Class=0 (Normal), Prob=0.2938`
- `API TargetPrediction 'RCA': Class=1 (Stenotic), Prob=0.5711`

### Test 8: Provisional Threshold Sanity

- **Description:** Verify provisional threshold calculations and sensitivity adjustments  
- **Result:** **PASSED** (Provisional thresholds verified: Threshold sensitivity adjustments function predictably.)  
- **Execution Latency:** 67.91 ms  

**Detailed Verifications:**
- `Cath (T_prov=0.43, f1_optimized): Default Positives=38/50 -> Provisional Positives=39/50`
- `LAD (T_prov=0.45, f1_optimized): Default Positives=35/50 -> Provisional Positives=36/50`
- `LCX (T_prov=0.49, youden_j): Default Positives=24/50 -> Provisional Positives=24/50`
- `RCA (T_prov=0.46, youden_j): Default Positives=24/50 -> Provisional Positives=27/50`

---

## 4. Production Isolation & Ethical Safeguards

1. **Complete Directory Isolation:**
   - All experimental artifacts are saved strictly in `ml/experimental_artifacts/`.
   - Production models in `ml/artifacts/` (`model_cath.joblib`, `model_lad.joblib`, etc.) remain identical and untouched.

2. **Provisional Threshold Governance:**
   - Thresholds are stored with explicit `'status': 'provisional'` declarations in `model_metadata.json`.
   - The documentation explicitly notes that cross-validation fold averages do not constitute clinical diagnostic cutoffs without prospective decision-curve validation.

3. **Non-Invasive API Contract Verification:**
   - The `ModelManager` class was tested with custom path overrides (`artifacts_dir` parameter), demonstrating that candidate models can be served via the existing backend API without altering server source code.
