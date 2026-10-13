# CardioVision AI

> **Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
> An investigational clinical decision-support system predicting overall CAD and vessel-specific coronary stenosis (LAD, LCX, RCA) from 54 non-invasive clinical parameters, paired with interactive 3D coronary anatomy visualization and TreeSHAP explainability.

[![Frontend Deployed](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://multimodal-five.vercel.app/)
[![Backend Deployed](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://cardiovision-backend-oiji.onrender.com/health)
[![Python 3.12](https://img.shields.io/badge/Python-3.12.10-blue?logo=python)](requirements.txt)
[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react)](frontend/package.json)

For the comprehensive submission dossier, methodology defense, and literature citations, see [**`SUBMISSION.md`**](SUBMISSION.md).

---

## 1. Live Deployments

* **Live Web Application (Vercel)**: [https://multimodal-five.vercel.app/](https://multimodal-five.vercel.app/)
* **Live API Health Check (Render)**: [https://cardiovision-backend-oiji.onrender.com/health](https://cardiovision-backend-oiji.onrender.com/health)
* **Live API Base URL**: `https://cardiovision-backend-oiji.onrender.com`

---

## 2. Key Features

* **Simultaneous Multi-Target Prediction**: Predicts overall CAD status (`Cath`) and vessel-specific stenosis ($\ge 50\%$) across the three main coronary arteries: Left Anterior Descending (`LAD`), Left Circumflex (`LCX`), and Right Coronary Artery (`RCA`).
* **54 Non-Invasive Parameters**: Ingests patient profile, vital signs, routine laboratory panels, resting ECG findings, and echocardiography without requiring pre-procedural invasive testing.
* **Interactive 3D Anatomical Viewer**: Visualizes coronary anatomy using the open BodyParts3D multi-mesh model (`coronary_heart_bp3d.glb`), featuring fixed anatomical vessel coloring (Coral Red LAD, Violet LCX, Teal RCA, Deep Crimson LMCA), camera tracking presets, and floating risk HUD cards.
* **Local & Global TreeSHAP Attribution**: Real-time patient-specific feature attribution in probability space ($P = \phi_0 + \sum \Phi_k$) with exact machine precision additivity ($\sim 2.22 \times 10^{-16}$) via `shap.TreeExplainer`.
* **5-Step Guided Intake Wizard**: Step-by-step form validation, automated read-only BMI calculation, dataset-derived obesity flagging (BMI $\ge 25.0 \text{ kg/m}^2$), and 3 pre-built synthetic demonstration presets.
* **Browser-Native Clinical Dossier Export**: Formatted single-patient summary report with A4 print stylesheets (`window.print()`).

---

## 3. Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│             Frontend: Vercel (React 19 SPA)            │
│  - React 19.0.0, TypeScript ~5.9.3, Vite 8.0.0         │
│  - Tailwind CSS v4, Lucide React                       │
│  - Three.js 0.186.0, @react-three/fiber 9.8.0, drei    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (JSON)
                            ▼
┌────────────────────────────────────────────────────────┐
│           Backend: Render Web Service (FastAPI)        │
│  - Python 3.12.10, Uvicorn 0.49.0, FastAPI 0.138.1     │
│  - Pydantic 2.13.4 (Strict 54-feature validation)      │
│  - Scikit-learn 1.9.0, Joblib 1.5.3, NumPy 2.3.5       │
│  - Pandas 2.3.3, SciPy 1.16.3, SHAP 0.52.0             │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Serialized Production Artifacts            │
│  - ml/artifacts/model_cath.joblib                      │
│  - ml/artifacts/model_lad.joblib                       │
│  - ml/artifacts/model_lcx.joblib                       │
│  - ml/artifacts/model_rca.joblib                       │
│  - ml/model_metadata.json                              │
└────────────────────────────────────────────────────────┘
```

---

## 4. Quick Start & Local Setup

### Prerequisites
* **Python**: `3.12.x` (verified on Python 3.12.10)
* **Node.js**: `18.x` or later (with `npm 9+`)
* **Git**: Installed and configured

### 1. Backend Setup & Execution
From the repository root:
```powershell
# Create and activate Python virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows PowerShell
# source .venv/bin/activate  # macOS / Linux

# Install pinned runtime dependencies
pip install -r requirements.txt

# Launch FastAPI ASGI server
uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs locally at: `http://localhost:8000` (interactive Swagger docs at `http://localhost:8000/docs`).*

### 2. Frontend Setup & Execution
In a separate terminal:
```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Launch Vite development server
npm run dev
```
*Frontend runs locally at: `http://localhost:5173`.*

### 3. Running Test Suites
```powershell
# 1. Run ML pipeline verification tests
python ml/test_pipeline.py

# 2. Run backend FastAPI & TreeSHAP integration tests (32 tests)
pytest backend/tests/test_api.py backend/tests/test_explainability.py

# 3. Verify frontend production TypeScript build
cd frontend
npm run build

# 4. Run frontend test suite (Node.js test runner via tsx)
npx tsx --test "src/api/__tests__/*.test.ts"
```

---

## 5. Environment Variables & API Summary

### Environment Variables

| Variable | Target Service | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend (Render) | `8000` | Port for the Uvicorn ASGI server. |
| `CORS_ORIGINS` | Backend | `http://localhost:5173,...` | Comma-delimited list of permitted CORS web origins. |
| `MAX_BATCH_SIZE` | Backend | `50` | Maximum patient records allowed in a single `/predict/batch` request. |
| `VITE_API_BASE_URL` | Frontend | `http://localhost:8000` | Base URL of the backend API service (set to Render URL in production). |

### API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Healthcheck verifying initialization of all 4 models and SHAP explainers. |
| `GET` | `/metadata` | Returns 54 canonical feature names, input types, clinical ranges, and target definitions. |
| `POST` | `/predict` | Ingests 54 clinical parameters and returns probabilities and binary classifications for 4 targets. |
| `POST` | `/predict/batch` | Ingests a list of up to 50 patients for vectorized batch inference. |
| `POST` | `/predict/explain` | Computes local patient TreeSHAP attributions in probability space with additivity metrics. |
| `GET` | `/explain/global` | Returns cohort-level mean absolute SHAP feature importances on the Tehran cohort ($N=303$). |

---

## 6. Model Evaluation Results

Models are regularized `RandomForestClassifier` pipelines (`n_estimators=100`, `max_depth=5`, `min_samples_leaf=3`, `class_weight='balanced'`) fitted on the Z-Alizadeh Sani cohort ($N=303$).

> [!IMPORTANT]
> **Validation Framing**: The metrics below represent the **unweighted arithmetic mean of test metrics across 5-fold stratified cross-validation** ($N=303$, single-center cohort). They reflect internal validation and **do not represent prospective performance on an independent external clinical cohort**.

| Target Artery / Condition | ROC-AUC (5-Fold Mean ± SD) | Accuracy (5-Fold Mean ± SD) | Recall / Sensitivity (5-Fold Mean ± SD) | Precision (5-Fold Mean ± SD) | F1-Score (5-Fold Mean ± SD) | Brier Score (5-Fold Mean ± SD) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cath (Overall CAD)** | **0.9195** ± 0.044 | **0.8547** ± 0.056 | **0.8564** ± 0.063 | **0.9349** ± 0.039 | **0.8931** ± 0.042 | **0.1220** ± 0.024 |
| **LAD Stenosis (≥50%)** | **0.8383** ± 0.077 | **0.7858** ± 0.060 | **0.8424** ± 0.053 | **0.8028** ± 0.052 | **0.8216** ± 0.048 | **0.1692** ± 0.025 |
| **LCX Stenosis (≥50%)** | **0.7199** ± 0.084 | **0.6402** ± 0.088 | **0.6138** ± 0.072 | **0.5469** ± 0.114 | **0.5757** ± 0.086 | **0.2157** ± 0.016 |
| **RCA Stenosis (≥50%)** | **0.7340** ± 0.059 | **0.6698** ± 0.051 | **0.6308** ± 0.084 | **0.5563** ± 0.069 | **0.5893** ± 0.064 | **0.2087** ± 0.016 |

*Pooled Out-of-Fold (OOF) comparison*: Evaluating all 303 validation predictions globally yields similar discrimination (Cath: 0.9144, LAD: 0.8352, LCX: 0.7130, RCA: 0.7313). See [`SUBMISSION.md`](SUBMISSION.md#72-reconciliation-with-pooled-out-of-fold-oof-metrics) for mathematical reconciliation.

---

## 7. Explainability & Scientific Limitations

* **TreeSHAP in Probability Space**: Because individual decision trees within scikit-learn's `RandomForestClassifier` output class frequencies at leaf nodes, `shap.TreeExplainer` operates directly in probability space:
  $$P(\text{Target} = 1) = \phi_0 + \sum_{k=1}^{54} \Phi_k$$
  The baseline expectation $\phi_0$ reflects balanced tree priors (for Cath, $\phi_0 \approx 0.4991$), and additivity residuals are bounded by IEEE 754 floating-point machine precision ($\sim 2.22 \times 10^{-16}$).
* **Empirical vs Post-Hoc Calibration**: Models output raw ensemble tree voting fractions. The production models have **not undergone post-hoc Platt scaling or isotonic calibration**. Output probabilities should be interpreted as relative consensus scores rather than true actuarial risks.
* **Single-Center Cohort Limitation**: The dataset is restricted to 303 adult patients referred for catheterization at the Tehran Heart Center. Predictive performance may degrade under demographic or geographic covariate shift.
* **Secondary Artery Sensitivity**: Due to lower positive class prevalence in the cohort, sensitivity for LCX (61.4%) and RCA (63.1%) is moderate compared to Cath (85.6%) and LAD (84.2%).

---

## 8. Clinical Disclaimer

> [!CAUTION]
> **Research & Hackathon Prototype Only**: CardioVision AI is an educational and investigational prototype developed for the Multimodal AI Hackathon 2026. It is **not an FDA-cleared, CE-marked, or certified medical diagnostic device**. The software does not provide medical diagnoses, replace certified clinical judgment, or determine therapeutic pathways. All predictions, risk calculations, and 3D visual outputs must be evaluated by licensed medical professionals alongside standard diagnostic modalities.

---

## 9. Full Submission Documentation

For complete evaluation documentation, literature citations, ensemble benchmark comparisons, and architectural audits:
👉 Read [**`SUBMISSION.md`**](SUBMISSION.md)
