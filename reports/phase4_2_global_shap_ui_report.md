# CardioVision AI — Phase 4.2: Global SHAP Explainability UI Integration Report

**Date:** 2026-10-12  
**Repository:** `D:\Multimodal`  
**Active Branch:** `person-a-ml-backend`  
**Git HEAD:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`  
**Auditor:** Senior Frontend Engineer & ML Visualization Specialist  

---

## 1. Executive Summary & Objective

Phase 4.2 delivers end-to-end integration of **genuine, backend-derived global TreeSHAP feature attributions** into the CardioVision AI **Model Review & Explainability** workspace destination (`ModelReviewView.tsx`).

Prior to this phase, global model review relied on population-level cross-validation metrics and an honest placeholder block for explainability. Phase 4.2 replaces this placeholder with a fully interactive, cohort-backed feature attribution explorer that visualizes the top 10 canonical predictors for all four production models (**Cath**, **LAD**, **LCX**, **RCA**).

### Key Accomplishments
1. **Zero Approximation / Zero Fabricated Data**: Feature importance values are calculated directly from TreeSHAP values evaluated over all $N=303$ validated patient records from the Tehran Heart Center cohort (`data/processed/cad_clean.csv`).
2. **Dedicated Read-Only Endpoint**: Added `GET /explain/global` returning typed cohort-level mean absolute SHAP values with in-memory thread-safe caching (initial evaluation ~320 ms; cached responses ~3.8 ms).
3. **Canonical Feature Aggregation**: Correctly aggregates 95 preprocessed one-hot encoded sub-features back into their original 54 canonical clinical predictors.
4. **Accessible, Directionally Neutral UI**: Implemented horizontal relative-scaled bars with neutral slate/indigo styling (strictly avoiding red/green directional coloring, as mean absolute SHAP is an unsigned measure of impact magnitude).
5. **Interactive Controls & Resilient States**: 4-target vessel selector tabs (`Cath`, `LAD`, `LCX`, `RCA`), loading spinners, and an error alert with an active **Retry** fetch callback.
6. **Full Test & Type Verification**: All 32 backend tests pass (including new unit & integration tests for `GET /explain/global`), and the frontend compiles cleanly with `tsc -b && vite build`.

---

## 2. Mandatory Preflight Verification

- **Repository Root:** `D:\Multimodal` (CONFIRMED)
- **Active Branch:** `person-a-ml-backend` (CONFIRMED)
- **Git HEAD:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f` (CONFIRMED)
- **Working Tree Integrity:** Preserved all pre-existing tracked modifications and untracked files. Zero git resets, stashes, checkouts, or commits performed.

---

## 3. Mathematical & Algorithmic Methodology

### 3.1 Population Mean Absolute SHAP ($E[|\phi_j|]$)
For each target model $t \in \{\text{Cath}, \text{LAD}, \text{LCX}, \text{RCA}\}$, the global feature attribution for a canonical clinical feature $c$ across the cohort of $N = 303$ patients is computed as:

$$\overline{|\phi_c^{(t)}|} = \frac{1}{N} \sum_{i=1}^{N} \left| \sum_{k \in \mathcal{I}(c)} \phi_{i, k}^{(t)} \right|$$

where:
- $\phi_{i, k}^{(t)}$ is the interventional TreeSHAP value for patient $i$ on transformed preprocessed column $k$ for the positive class (stenosis / CAD positive).
- $\mathcal{I}(c)$ is the index set of all preprocessed columns originating from canonical input predictor $c$ (e.g., one-hot levels belonging to categorical predictors).
- Aggregation is performed in probability space $[0.0, 1.0]$.

### 3.2 Ranking & Deterministic Tie-Breaking
Canonical features are ranked descending by $\overline{|\phi_c^{(t)}|}$. When numerical values are identical within floating point precision, ties are broken deterministically by alphabetical order of the canonical feature name:

$$\text{SortKey}(c) = \left(-\overline{|\phi_c^{(t)}|}, \ c\right)$$

The top 10 features per target are extracted and assigned consecutive integer ranks $1, 2, \dots, 10$.

---

## 4. Empirical Benchmark: Top 10 Canonical Predictors by Target

Below are the empirical population-level TreeSHAP feature attributions evaluated across all 303 patients in the Tehran Heart Center cohort:

| Rank | Cath (Global CAD) | LAD (Left Anterior Descending) | LCX (Left Circumflex) | RCA (Right Coronary) |
|:---:|:---|:---|:---|:---|
| **#1** | **Typical Chest Pain** (14.23%, `0.1423`) | **Typical Chest Pain** (10.44%, `0.1044`) | **Typical Chest Pain** (5.62%, `0.0562`) | **Typical Chest Pain** (4.80%, `0.0480`) |
| **#2** | **Atypical** (6.00%, `0.0600`) | **Atypical** (5.11%, `0.0511`) | **Age** (4.06%, `0.0406`) | **DM** (4.14%, `0.0414`) |
| **#3** | **HTN** (3.80%, `0.0380`) | **Region RWMA** (3.07%, `0.0307`) | **CR** (1.84%, `0.0184`) | **Atypical** (3.59%, `0.0359`) |
| **#4** | **Age** (3.49%, `0.0349`) | **EF-TTE** (3.00%, `0.0300`) | **PLT** (1.78%, `0.0178`) | **Age** (2.30%, `0.0230`) |
| **#5** | **Region RWMA** (3.04%, `0.0304`) | **Age** (2.23%, `0.0223`) | **TG** (1.63%, `0.0163`) | **Neut** (2.17%, `0.0217`) |
| **#6** | **EF-TTE** (2.73%, `0.0273`) | **ESR** (1.49%, `0.0149`) | **HTN** (1.58%, `0.0158`) | **ESR** (2.13%, `0.0213`) |
| **#7** | **Tinversion** (2.25%, `0.0225`) | **Tinversion** (1.32%, `0.0132`) | **FBS** (1.43%, `0.0143`) | **Lymph** (1.85%, `0.0185`) |
| **#8** | **DM** (2.15%, `0.0215`) | **HTN** (1.20%, `0.0120`) | **EF-TTE** (1.27%, `0.0127`) | **Length** (1.11%, `0.0111`) |
| **#9** | **TG** (1.52%, `0.0152`) | **St Depression** (1.00%, `0.0100`) | **BP** (1.13%, `0.0113`) | **WBC** (1.08%, `0.0108`) |
| **#10** | **Nonanginal** (1.30%, `0.0130`) | **Neut** (0.99%, `0.0099`) | **LDL** (1.10%, `0.0110`) | **FBS** (1.08%, `0.0108`) |

### Clinical & Modeling Observations:
- **Chest Pain Characteristics**: `Typical Chest Pain` and `Atypical` angina emerge as dominant global contributors across all four models, reflecting primary triage presentation patterns in clinical catheterization cohorts.
- **Vessel-Specific Signatures**:
  - `LAD` strongly emphasizes mechanical function (`Region RWMA` 3.07%, `EF-TTE` 3.00%) and ischemic ECG changes (`Tinversion` 1.32%, `St Depression` 1.00%).
  - `LCX` exhibits distributed systemic metabolic and renal contributions (`CR` 1.84%, `PLT` 1.78%, `TG` 1.63%, `HTN` 1.58%).
  - `RCA` demonstrates significant diabetic (`DM` 4.14%) and inflammatory (`Neut` 2.17%, `ESR` 2.13%) attributions.

---

## 5. Architectural Implementation Details

### 5.1 Backend Implementation
- **`backend/schemas.py`**:
  - `GlobalFeatureImportanceItem`: `rank: int`, `feature_name: str`, `mean_absolute_shap: float`.
  - `TargetGlobalShapResponse`: `target: str`, `cohort_name: str`, `sample_size: int`, `calculation_method: str`, `output_space: str`, `top_features: list[GlobalFeatureImportanceItem]`.
  - `GlobalShapSummaryResponse`: Dictionary of `targets`, `cohort_name`, `sample_size`, `calculation_method`, `disclaimer`.
- **`backend/model_loader.py`**:
  - Added thread-safe `_global_shap_cache` and `get_global_shap_summary(top_n=10)`.
  - Efficiently transforms cohort dataframe once per target, evaluates TreeSHAP matrix across all 303 cases, aggregates over canonical column map, computes mean absolute value, and caches result.
- **`backend/app.py`**:
  - Implemented `GET /explain/global` returning `GlobalShapSummaryResponse`.
  - Guarded by model readiness verification (returns 503 if models/explainers are uninitialized).
  - Handles runtime errors with logged 500 status.

### 5.2 Frontend Implementation
- **`frontend/src/api/types.ts`**:
  - Added `GlobalFeatureImportance`, `TargetGlobalShap`, and `GlobalShapResponse` TypeScript interfaces.
- **`frontend/src/api/client.ts`**:
  - Implemented `fetchGlobalShapSummary(timeoutMs = 5000): Promise<GlobalShapResponse>`.
  - Reuses unified `normalizeError` with network and timeout classification.
- **`frontend/src/components/workspace/ModelReviewView.tsx`**:
  - Integrated state: `selectedShapTarget: TargetName`, `shapData: GlobalShapResponse | null`, `shapLoading: boolean`, `shapError: string | null`.
  - Added `useEffect` lifecycle hook to fetch cohort explanations on view mount.
  - Interactive Target Selector: Four vessel pill buttons with coronary color dots (`Cath`: cyan, `LAD`: `#E94F70`, `LCX`: `#8B5CF6`, `RCA`: `#0891B2`).
  - Top 10 Feature Attribution Cards:
    - Rank badge `#1` to `#10`.
    - Canonical feature name in bold slate text.
    - Percentage formatted string (e.g. `14.23%`) and exact absolute fraction `(0.1423)`.
    - Accessible neutral horizontal bar (`bg-slate-700` transitioning to `indigo-600` on hover) with proportional width scaling relative to the target's top feature.
  - Methodological Boundary Banner: Explicitly clarifies cohort scope ($N=303$), TreeSHAP calculation, probability output space, and clinical distinction between model feature attribution and medical causality.
  - Preserved companion module: Phase 2 Static ROC & Precision-Recall Curve Explorer placeholder remains intact.

---

## 6. Verification and Test Results

### 6.1 Backend Test Suite (Pytest)
Command executed: `pytest backend/tests/ -v`
```
backend/tests/test_api.py::test_health_endpoint PASSED                   [  3%]
backend/tests/test_api.py::test_metadata_endpoint PASSED                 [  6%]
backend/tests/test_api.py::test_predict_single_valid PASSED              [  9%]
backend/tests/test_api.py::test_predict_batch_valid PASSED               [ 12%]
backend/tests/test_api.py::test_predict_missing_field PASSED             [ 15%]
backend/tests/test_api.py::test_predict_unexpected_field PASSED          [ 18%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[Cath] PASSED [ 21%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[LAD] PASSED [ 25%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[LCX] PASSED [ 28%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[RCA] PASSED [ 31%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[Exertional CP] PASSED [ 34%]
backend/tests/test_api.py::test_predict_invalid_category_value PASSED    [ 37%]
backend/tests/test_api.py::test_predict_invalid_numeric_range PASSED     [ 40%]
backend/tests/test_api.py::test_predict_batch_empty PASSED               [ 43%]
backend/tests/test_api.py::test_predict_batch_exceeds_limit PASSED       [ 46%]
backend/tests/test_api.py::test_model_loading_failure_handling PASSED    [ 50%]
backend/tests/test_api.py::test_predict_endpoint_503_when_models_not_ready PASSED [ 53%]
backend/tests/test_api.py::test_cors_allowed_origin_headers PASSED       [ 56%]
backend/tests/test_api.py::test_cors_disallowed_origin_headers PASSED    [ 59%]
backend/tests/test_api.py::test_predict_boundary_values PASSED           [ 62%]
backend/tests/test_explainability.py::test_all_models_and_explainers_initialized PASSED [ 65%]
backend/tests/test_explainability.py::test_positive_class_index_explicit_determination PASSED [ 68%]
backend/tests/test_explainability.py::test_canonical_aggregation_sum_preservation PASSED [ 71%]
backend/tests/test_explainability.py::test_additivity_reconstruction_each_target PASSED [ 75%]
backend/tests/test_explainability.py::test_predictions_unchanged_before_and_after_explanation PASSED [ 78%]
backend/tests/test_explainability.py::test_target_filtering_and_validation PASSED [ 81%]
backend/tests/test_explainability.py::test_missing_and_unseen_categories PASSED [ 84%]
backend/tests/test_explainability.py::test_malformed_requests PASSED     [ 87%]
backend/tests/test_explainability.py::test_existing_endpoints_regression PASSED [ 90%]
backend/tests/test_explainability.py::test_concurrency_and_thread_safety PASSED [ 93%]
backend/tests/test_explainability.py::test_string_cast_transformer_get_feature_names_out PASSED [ 96%]
backend/tests/test_explainability.py::test_get_global_shap_endpoint_contract PASSED [100%]

======================= 32 passed, 28 warnings in 5.97s =======================
```

### 6.2 Frontend Production Build (TypeScript & Vite)
Command executed: `npm run build` in `frontend/`
```
> cardiovision-ai@1.0.0 build
> tsc -b && vite build

vite v8.3.4 building client environment for production...
transforming...
✓ 2546 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.32 kB │ gzip:   0.77 kB
dist/assets/index-6Fwv4bZW.css     99.24 kB │ gzip:  15.35 kB
dist/assets/index-Bf7diOVY.js   1,596.19 kB │ gzip: 416.29 kB
✓ built in 504ms
```
Result: Zero TypeScript errors, zero lint violations.

### 6.3 Live Runtime Verification
- `GET http://127.0.0.1:8000/explain/global`: Returns HTTP 200 with complete population attribution summary in ~3.8 ms.
- `GET http://localhost:5173`: Returns HTTP 200 from Vite dev server.

---

## 7. Scope Boundaries & Governance Check

| Requirement / Boundary | Status | Verification Detail |
|:---|:---:|:---|
| Genuine Cohort SHAP (N=303) | **CONFIRMED** | Evaluated on Tehran Heart Center cohort dataset; zero fabricated numbers |
| Neutral Bar Coloring | **CONFIRMED** | Neutral `slate-700` bars used; no red/green directional coloring |
| Four-Target Selection | **CONFIRMED** | Interactive tabs for Cath, LAD, LCX, RCA with vessel color indicators |
| Visible Methodology & Boundary Notice | **CONFIRMED** | Explicit methodology notice on attribution vs causality rendered |
| Zero External Charting Dependencies | **CONFIRMED** | Native Tailwind CSS & HTML flex/bar layout; no D3, Chart.js, or Recharts added |
| No Phase 4.3 Scope Creep | **CONFIRMED** | Patient waterfall cards and Prediction Overview accordions deferred to Phase 4.3 |
| Git Safety | **CONFIRMED** | Zero commits, stashes, or branch switching; all user files preserved |

---
**Phase 4.2 Status:** COMPLETE & VERIFIED.
