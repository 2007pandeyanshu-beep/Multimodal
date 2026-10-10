# Phase 3.1: Backend Runtime & Integration Readiness Audit
**Track A: Cardiovascular Risk Visualization & Prediction | Person A (ML & Backend Lead)**  
**Date:** October 2026  
**Status:** Audit Completed & Verified  

---

## 1. Executive Summary

This audit evaluates the runtime behavior, network readiness, and cross-laptop integration ergonomics of the Phase 3 FastAPI backend. All tests and inspections were performed directly against live Python runtimes and active TCP sockets on the local system.

* **Test Suite Status:** **20 passed** in `backend/tests/test_api.py` (100% success rate).
* **Live HTTP Server Verification:** Verified over TCP port 8000 using real HTTP requests (`urllib` / `httpx`).
* **Artifact & Dataset Immutability:** All Phase 2 model artifacts and raw/processed datasets were verified unaltered via SHA-256 hashes.
* **Target Leakage Prevention:** Verified 100% programmatic rejection of `Cath`, `LAD`, `LCX`, `RCA`, and `Exertional CP`.
* **Cross-Laptop Readiness:** The "localhost trap" was identified and resolved with concrete LAN binding and frontend integration steps for Person B.

---

## 2. Executed Commands & Actual Results

### Command 1: Pytest Test Suite
```powershell
python -m pytest backend\tests\test_api.py -v
```
**Actual Output:**
```
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Multimodal
collecting ... collected 20 items

backend/tests/test_api.py::test_health_endpoint PASSED                   [  5%]
backend/tests/test_api.py::test_metadata_endpoint PASSED                 [ 10%]
backend/tests/test_api.py::test_predict_single_valid PASSED              [ 15%]
backend/tests/test_api.py::test_predict_batch_valid PASSED               [ 20%]
backend/tests/test_api.py::test_predict_missing_field PASSED             [ 25%]
backend/tests/test_api.py::test_predict_unexpected_field PASSED          [ 30%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[Cath] PASSED [ 35%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[LAD] PASSED [ 40%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[LCX] PASSED [ 45%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[RCA] PASSED [ 50%]
backend/tests/test_api.py::test_predict_target_leakage_rejection[Exertional CP] PASSED [ 55%]
backend/tests/test_api.py::test_predict_invalid_category_value PASSED    [ 60%]
backend/tests/test_api.py::test_predict_invalid_numeric_range PASSED     [ 65%]
backend/tests/test_api.py::test_predict_batch_empty PASSED               [ 70%]
backend/tests/test_api.py::test_predict_batch_exceeds_limit PASSED       [ 75%]
backend/tests/test_api.py::test_model_loading_failure_handling PASSED    [ 80%]
backend/tests/test_api.py::test_predict_endpoint_503_when_models_not_ready PASSED [ 85%]
backend/tests/test_api.py::test_cors_allowed_origin_headers PASSED       [ 90%]
backend/tests/test_api.py::test_cors_disallowed_origin_headers PASSED    [ 95%]
backend/tests/test_api.py::test_predict_boundary_values PASSED           [100%]

======================= 20 passed, 11 warnings in 2.50s =======================
```

---

### Command 2: Live Uvicorn Daemon & Real HTTP Execution
The server was started via Uvicorn on `127.0.0.1:8000`, and live HTTP calls were dispatched:

```powershell
uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

**Real HTTP Call 1: `GET /health`**
* **Status:** `200 OK`
* **Response:**
  ```json
  {
    "status": "healthy",
    "models_loaded": { "Cath": true, "LAD": true, "LCX": true, "RCA": true },
    "all_models_ready": true,
    "version": "1.0.0"
  }
  ```

**Real HTTP Call 2: `GET /metadata`**
* **Status:** `200 OK`
* **Response Keys Verified:** `['project', 'version', 'prototype_disclaimer', 'targets', 'total_input_features', 'numerical_features', 'categorical_features', 'forbidden_features', 'model_type', 'validation_methodology']`
* **Total Features:** Exactly 54. Targets: `['Cath', 'LAD', 'LCX', 'RCA']`. Forbidden: `['Cath', 'LAD', 'LCX', 'RCA', 'Exertional CP']`.

**Real HTTP Call 3: `POST /predict`**
* **Status:** `200 OK`
* **Sample Inference Output:**
  * `Cath`: `predicted_class=1`, `label='CAD'`, `probability=0.5588`
  * `LAD`: `predicted_class=1`, `label='Stenotic'`, `probability=0.5246`
  * `LCX`: `predicted_class=0`, `label='Normal'`, `probability=0.3199`
  * `RCA`: `predicted_class=1`, `label='Stenotic'`, `probability=0.5590`

**Real HTTP Call 4: `POST /predict/batch` (3 patients)**
* **Status:** `200 OK`
* **Patients Returned:** 3 (Index order `0`, `1`, `2` strictly preserved).

**Real HTTP Error Rejections:**
* Missing `Age`: **`HTTP 422 Unprocessable Content`**
* Leakage `Cath="CAD"`: **`HTTP 422 Unprocessable Content`**
* Leakage `Exertional CP="N"`: **`HTTP 422 Unprocessable Content`**
* Invalid `VHD="InvalidValve"`: **`HTTP 422 Unprocessable Content`**
* Empty Batch `patients=[]`: **`HTTP 422 Unprocessable Content`** (Pydantic `min_length=1`)
* Oversized Batch (51 patients): **`HTTP 400 Bad Request`**

---

## 3. Probability & Class Label Consistency

* **Mathematical Bounds:** All probabilities are strictly contained within $[0.0, 1.0]$.
* **Positive Class Alignment:**
  * Across all 303 patient records, `predicted_class == 1` if and only if `probability >= 0.5`.
  * Index 1 of `predict_proba()` strictly corresponds to:
    * `Cath` $\rightarrow$ `'CAD'`
    * `LAD` $\rightarrow$ `'Stenotic'`
    * `LCX` $\rightarrow$ `'Stenotic'`
    * `RCA` $\rightarrow$ `'Stenotic'`
  * Index 0 strictly corresponds to `'Normal'` across all four targets.

---

## 4. Working Directory & Path Resolution Audit

Path resolution was audited from both project root (`D:\Multimodal`) and arbitrary system directories (`C:\`):
```powershell
python -c "
import os, sys
os.chdir('C:\\')
sys.path.insert(0, r'D:\Multimodal')
from backend.config import PROJECT_ROOT, ARTIFACTS_DIR, METADATA_PATH
from backend.model_loader import model_manager
assert ARTIFACTS_DIR.exists() and METADATA_PATH.exists()
assert model_manager.is_all_ready() is True
print('CWD Independence Verified')
"
```
* **Result:** `CWD Independence Verified`. [`backend/config.py`](file:///D:/Multimodal/backend/config.py) uses `Path(__file__).resolve().parent.parent` to locate artifacts relative to the module file rather than the current working directory.

---

## 5. CORS & Cross-Laptop Integration Analysis

### The "Localhost Trap" for Person B
* **Issue Identified:** In a team setting where Person B works on a separate laptop, querying `http://127.0.0.1:8000` or `http://localhost:8000` from Person B's browser directs traffic to **Person B's own machine**, which fails with `ERR_CONNECTION_REFUSED`.
* **Issue Identified:** Binding Uvicorn to `--host 127.0.0.1` binds exclusively to the loopback interface on Person A's machine, ignoring all network packets coming from Person B's laptop.

### Exact Integration Protocol for the Two-Laptop Team

#### Step 1: Person A (Backend Server)
1. Find Person A's local IPv4 address via `ipconfig` (e.g. `192.168.1.105`).
2. Start Uvicorn binding to `0.0.0.0` (all network interfaces):
   ```powershell
   uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
   ```
3. Allow the Windows Defender Firewall prompt for Python/Uvicorn on Private Networks.
4. If Person B accesses the frontend via network IP (e.g. `http://192.168.1.120:5173`), set:
   ```powershell
   $env:CORS_ORIGINS = "http://localhost:5173,http://192.168.1.120:5173"
   uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
   ```

#### Step 2: Person B (Frontend UI & 3D Visualization)
1. In Person B's React project, set the environment variable in `.env`:
   ```env
   VITE_API_BASE_URL=http://192.168.1.105:8000
   ```
2. In JavaScript `fetch()` calls:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
   const res = await fetch(`${API_BASE_URL}/predict`, { ... });
   ```
3. **Illustrative Visualization Thresholds:** In Person B's 3D artery viewer, make color thresholds configurable via component props/state:
   ```javascript
   const defaultThresholds = { lowMax: 0.40, moderateMax: 0.70 };
   ```
   Explicitly label these color transitions in the UI as visual indicators, not clinical diagnostic criteria.

> [!NOTE]
> In accordance with instructions, external cross-network connectivity was not simulated or claimed as executed, because Person B's laptop is an independent external physical machine. The local socket binding to `0.0.0.0` and CORS header behavior are verified programmatically.

---

## 6. Test Suite Gap Analysis & Enhancements Applied

During this audit, the test suite was analyzed for behaviors claimed but not previously exercised by automated tests:

| Claimed Behavior | Audit Finding | Correction Applied |
| :--- | :--- | :--- |
| **HTTP 503 Route Response** | Tested on `ModelManager` instance, but not via HTTP route | Added `test_predict_endpoint_503_when_models_not_ready` to [`backend/tests/test_api.py`](file:///D:/Multimodal/backend/tests/test_api.py). |
| **CORS Allowed Header** | Middleware configured, but headers unasserted | Added `test_cors_allowed_origin_headers` asserting `access-control-allow-origin: http://localhost:5173`. |
| **CORS Disallowed Header** | Rejection behavior unasserted | Added `test_cors_disallowed_origin_headers` asserting unauthorized domains receive no allow origin header. |
| **Permitted Measurement Boundaries** | Nominal values tested, but extreme bounds unasserted | Added `test_predict_boundary_values` testing `Age=18` and `Weight=300`. |

* After these additions, total automated tests increased from **16 to 20**, with all 20 passing.

---

## 7. Artifact & Dataset Immutability Verification

| File | SHA-256 Checksum | Verified Status |
| :--- | :--- | :--- |
| [`extention of Z-Alizadeh sani dataset.xlsx`](file:///D:/Multimodal/extention%20of%20Z-Alizadeh%20sani%20dataset.xlsx) | `739343245C2BA578B541370217531750D8E936022F928B83E0D91756CAA3FF0B` | **Unchanged** |
| [`data/raw/extention of Z-Alizadeh sani dataset.xlsx`](file:///D:/Multimodal/data/raw/extention%20of%20Z-Alizadeh%20sani%20dataset.xlsx) | `739343245C2BA578B541370217531750D8E936022F928B83E0D91756CAA3FF0B` | **Unchanged** |
| [`ml/artifacts/model_cath.joblib`](file:///D:/Multimodal/ml/artifacts/model_cath.joblib) | `F0DB5AC067BD682FED40186B0A8F986D88E7AB02225F038BA88143BACE119959` | **Unchanged** |
| [`ml/artifacts/model_lad.joblib`](file:///D:/Multimodal/ml/artifacts/model_lad.joblib) | `04AABEF960F77EDF1B448DDDC581CA1C1622E1AAFE41E43454493352BFAB8DED` | **Unchanged** |
| [`ml/artifacts/model_lcx.joblib`](file:///D:/Multimodal/ml/artifacts/model_lcx.joblib) | `208C5F689E1F894D09F9B8A5DAFA91B31E8AF3761D3552AD501B73B7E3E17E88` | **Unchanged** |
| [`ml/artifacts/model_rca.joblib`](file:///D:/Multimodal/ml/artifacts/model_rca.joblib) | `C5C47C02645161E7000C0BD11933CD9440907B019AF9C96A8368CAFB14D69596` | **Unchanged** |

---

## 8. Defect Classification

* **Critical Defects:** **0**
* **Major Defects:** **0**
* **Minor Documentation / Configuration Items Corrected:**
  * README updated with `0.0.0.0` binding instructions for LAN team setup.
  * Person B JavaScript `fetch()` URL example updated to use LAN IP rather than `localhost`.
  * Test suite expanded to 20 tests to cover HTTP 503, CORS headers, and boundary values.
  * PowerShell environment variable syntax (`$env:CORS_ORIGINS`) documented.

---

**Audit completed.**  
*Standing by for your review.*
