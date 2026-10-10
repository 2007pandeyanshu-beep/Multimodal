# Cardiovascular Risk Prediction API (Backend)
**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**

Backend service providing inference endpoints for coronary artery disease and vessel-specific stenosis predictions using scikit-learn machine learning pipelines.

---

## 1. Quick Start

### Installation & Environment
Ensure Python 3.12+ is active with the project dependencies installed:
```bash
pip install fastapi uvicorn pydantic scikit-learn pandas numpy
```

### Start the API Server
Run Uvicorn from the project root (`D:\Multimodal`):

* **Single-Machine Local Development:**
  ```powershell
  uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
  ```
* **Two-Laptop Team Development (Person A + Person B on LAN):**
  > [!IMPORTANT]
  > When Person B connects from a separate laptop, Person A **must bind to `0.0.0.0`** so the server accepts connections across the local network:
  ```powershell
  uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
  ```

* **Interactive Swagger Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **OpenAPI Specification:** [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)
* **Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 2. API Endpoints

### `GET /health`
Verifies that all 4 model pipelines are loaded and ready in memory.

**Response Example (200 OK):**
```json
{
  "status": "healthy",
  "models_loaded": {
    "Cath": true,
    "LAD": true,
    "LCX": true,
    "RCA": true
  },
  "all_models_ready": true,
  "version": "1.0.0"
}
```

---

### `GET /metadata`
Returns expected feature names, clinical categories, allowed categorical sets, model types, and prototype disclaimers.

**Response Example (200 OK):**
```json
{
  "project": "Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction",
  "version": "1.0.0",
  "prototype_disclaimer": "Research prototype output for Multimodal AI Hackathon 2026 (Track A). Not a clinical diagnostic device. Model probabilities reflect statistical estimates from single-center training data (N=303) and must not be used as verified clinical risk or replacement for physician judgment.",
  "targets": {
    "Cath": { "description": "Overall CAD status", "positive_label": "CAD", "negative_label": "Normal" },
    "LAD": { "description": "Left Anterior Descending stenosis", "positive_label": "Stenotic", "negative_label": "Normal" },
    "LCX": { "description": "Left Circumflex stenosis", "positive_label": "Stenotic", "negative_label": "Normal" },
    "RCA": { "description": "Right Coronary Artery stenosis", "positive_label": "Stenotic", "negative_label": "Normal" }
  },
  "total_input_features": 54,
  "numerical_features": ["Age", "Weight", "Length", "BMI", "BP", "PR", "FBS", "CR", "TG", "LDL", "HDL", "BUN", "ESR", "HB", "K", "Na", "WBC", "Lymph", "Neut", "PLT", "EF-TTE"],
  "categorical_features": ["Sex", "DM", "HTN", "Current Smoker", "EX-Smoker", "FH", "Obesity", "CRF", "CVA", "Airway disease", "Thyroid Disease", "CHF", "DLP", "Edema", "Weak Peripheral Pulse", "Lung rales", "Systolic Murmur", "Diastolic Murmur", "Typical Chest Pain", "Dyspnea", "Function Class", "Atypical", "Nonanginal", "LowTH Ang", "Q Wave", "St Elevation", "St Depression", "Tinversion", "LVH", "Poor R Progression", "BBB", "Region RWMA", "VHD"],
  "forbidden_features": ["Cath", "LAD", "LCX", "RCA", "Exertional CP"],
  "model_type": "RandomForestClassifier (Balanced, Regularized max_depth=5)",
  "validation_methodology": "5-Fold Stratified Cross-Validation on Single-Center Cohort (N=303)"
}
```

---

### `POST /predict`
Predicts overall CAD status and stenosis risk in LAD, LCX, and RCA for a single patient.

**Request Payload:** Must contain all 54 clinical features. Unexpected fields and forbidden features (`Cath`, `LAD`, `LCX`, `RCA`, `Exertional CP`) are strictly rejected with HTTP 422.

**Request Example:**
```json
{
  "Age": 53,
  "Weight": 90.0,
  "Length": 175.0,
  "Sex": "Male",
  "BMI": 29.39,
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
  "BP": 110,
  "PR": 80,
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
  "St Depression": 1,
  "Tinversion": 1,
  "LVH": "N",
  "Poor R Progression": "N",
  "BBB": "N",
  "FBS": 90.0,
  "CR": 0.7,
  "TG": 38.0,
  "LDL": 84.0,
  "HDL": 30.0,
  "BUN": 8.0,
  "ESR": 11.0,
  "HB": 16.6,
  "K": 4.7,
  "Na": 141.0,
  "WBC": 8500,
  "Lymph": 39,
  "Neut": 54,
  "PLT": 271,
  "EF-TTE": 60.0,
  "Region RWMA": 0,
  "VHD": "Normal"
}
```

**Response Example (200 OK):**
```json
{
  "predictions": {
    "Cath": {
      "target": "Cath",
      "predicted_class": 1,
      "predicted_label": "CAD",
      "probability": 0.5588
    },
    "LAD": {
      "target": "LAD",
      "predicted_class": 1,
      "predicted_label": "Stenotic",
      "probability": 0.5246
    },
    "LCX": {
      "target": "LCX",
      "predicted_class": 0,
      "predicted_label": "Normal",
      "probability": 0.3199
    },
    "RCA": {
      "target": "RCA",
      "predicted_class": 1,
      "predicted_label": "Stenotic",
      "probability": 0.5590
    }
  },
  "disclaimer": "Research prototype output for Multimodal AI Hackathon 2026 (Track A). Not a clinical diagnostic device. Model probabilities reflect statistical estimates from single-center training data (N=303) and must not be used as verified clinical risk or replacement for physician judgment."
}
```

---

### `POST /predict/batch`
Accepts a bounded list of patients (up to `MAX_BATCH_SIZE`, default 50) and returns predictions preserving input index order.

**Request Example:**
```json
{
  "patients": [
    { ... patient 1 (54 features) ... },
    { ... patient 2 (54 features) ... }
  ]
}
```

**Response Example (200 OK):**
```json
{
  "results": [
    { "patient_index": 0, "predictions": { ... } },
    { "patient_index": 1, "predictions": { ... } }
  ],
  "total_patients": 2,
  "disclaimer": "Research prototype output..."
}
```

---

## 3. Error Handling

* **422 Unprocessable Content:** Triggered when fields are missing, invalid data types are sent, extra fields are present, or forbidden columns (`Cath`, `LAD`, `LCX`, `RCA`, `Exertional CP`) are supplied. Error messages are sanitized to avoid exposing internal tracebacks.
* **400 Bad Request:** Triggered when a batch request is empty or exceeds `MAX_BATCH_SIZE`.
* **503 Service Unavailable:** Triggered if a model artifact is missing or corrupted at runtime.

---

## 4. CORS & Network Configuration for Person B's Separate Laptop

### Default Allowed Origins
By default, the backend allows requests from standard local dev servers:
* `http://localhost:5173` (Vite)
* `http://localhost:3000` (React)
* `http://127.0.0.1:5173`
* `http://127.0.0.1:3000`

### Two-Laptop Setup Steps:
1. **Find Person A's Local IP Address:**
   Run `ipconfig` in PowerShell on Person A's laptop to find the IPv4 Address (e.g. `192.168.1.105`).
2. **Start Backend on `0.0.0.0`:**
   ```powershell
   uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
   ```
3. **If Person B Browses via Network IP:**
   Configure `CORS_ORIGINS` to allow Person B's frontend host:
   * **PowerShell:**
     ```powershell
     $env:CORS_ORIGINS = "http://localhost:5173,http://192.168.1.120:5173"
     uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
     ```
   * **CMD:**
     ```cmd
     set CORS_ORIGINS=http://localhost:5173,http://192.168.1.120:5173
     uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
     ```

---

## 5. Frontend & 3D Viewer Integration Guide (For Person B)

### Important URL Notice for Person B:
> [!WARNING]
> Because Person B is developing on a **separate laptop**, fetching from `http://127.0.0.1:8000` or `http://localhost:8000` will target **Person B's own machine**, which will fail with connection refused!
> Person B **must point their API requests to Person A's IP address** (e.g. `http://192.168.1.105:8000`).

### Recommended Frontend JavaScript Implementation:
In Person B's frontend, set an environment variable in `.env`:
```env
VITE_API_BASE_URL=http://192.168.1.105:8000
```

Then in JavaScript:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function getCardiacRisk(patientData) {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patientData)
  });
  
  if (!response.ok) {
    const errorDetails = await response.json();
    console.error("Validation error:", errorDetails);
    throw new Error("Prediction request failed");
  }

  const { predictions } = await response.json();
  
  // Return probabilities for 3D visual rendering
  return predictions;
}
```

### Configurable 3D Color-Coding Thresholds (Illustrative & Non-Diagnostic):
For Person B's 3D vascular tree, use configurable thresholds in component state/props:

```javascript
// Default illustrative thresholds (Configurable by user in UI settings)
const defaultThresholds = {
  lowMax: 0.40,      // Below 40% -> Green (Low Probability)
  moderateMax: 0.70  // 40% - 70% -> Amber (Moderate Probability)
                     // Above 70% -> Red (High Probability)
};

function getVesselColor(probability, thresholds = defaultThresholds) {
  if (probability < thresholds.lowMax) return "#22c55e"; // Green
  if (probability < thresholds.moderateMax) return "#eab308"; // Amber
  return "#ef4444"; // Red
}
```
*(Notice: Explicitly label these color bands in the UI as illustrative visual categories, not clinically validated diagnostic brackets).*

---

## 6. Model Limitations & Research Scope

1. **Single-Center Cohort ($N=303$):** Trained exclusively on the UCI Z-Alizadeh Sani clinical dataset. Generalization to diverse external demographic populations is unproven.
2. **Tabular Surrogates:** Vessel stenosis predictions are derived from resting non-invasive parameters (ECG, echo, blood markers). They provide statistical likelihoods, not definitive imaging ground truth.
3. **Research Prototype:** Explicit disclaimers must remain visible in both API responses and UI presentations.
