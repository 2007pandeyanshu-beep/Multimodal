# CardioVision AI — Phase 4.0: SHAP Explainability Architecture & Feasibility Audit Report

**Date of Audit:** October 12, 2026  
**Auditor Roles:** Senior ML Engineer, Scientific Computing Specialist, Biomedical Visualization Engineer, Frontend Integration Auditor  
**Audit Scope:** Read-Only Feasibility Audit (Zero Git mutation, zero code edit, zero package installation, zero model artifact alteration)  
**Target Repository:** `D:\Multimodal`  
**Target Branch:** `person-a-ml-backend`  
**Target Commit HEAD:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`  

---

## 1. Executive Summary & Audit Mandate

This report documents the rigorous, read-only feasibility audit conducted for integrating **SHAP (SHapley Additive exPlanations)** explainability into CardioVision AI. The objective of this phase is to establish the mathematical, algorithmic, architectural, and user-experience feasibility of providing both **population-level global feature importance** and **patient-specific local risk attributions** across all four clinical targets (`Cath`, `LAD`, `LCX`, `RCA`).

### Key Audit Findings:
1. **Dependency Availability (Zero Mutation Required):**
   `shap` version **`0.52.0`** is already installed in the active Python 3.12.10 environment (`C:\Users\2007p\AppData\Local\Programs\Python\Python312\python.exe`). No environment mutation, pip installation, or build dependency changes are needed.
2. **Pipeline Explainer Incompatibility & Clean Decomposition:**
   `shap.TreeExplainer` does not support explaining scikit-learn `Pipeline` objects directly (raises `InvalidModelError: Model type not yet supported by TreeExplainer: <class 'sklearn.pipeline.Pipeline'>`). However, decomposing inference into **feature preprocessing** (`pipeline.named_steps['preprocessor'].transform(X)`) followed by **classifier explanation** (`TreeExplainer(pipeline.named_steps['classifier'])`) is 100% compatible and executes in under **0.50 ms per model**.
3. **Feature Name Extraction Limitation (`StringCastTransformer`):**
   Calling `preprocessor.get_feature_names_out()` directly on serialized pipelines raises `AttributeError: Estimator to_str does not provide get_feature_names_out` because `StringCastTransformer` in `ml/transformers.py` lacks a `get_feature_names_out()` implementation. Feature names must be recovered directly from the nested `OneHotEncoder` (`ohe.get_feature_names_out(cat_cols)`) or mapped deterministically.
4. **Exact Mathematical Additivity in Probability Space:**
   In scikit-learn binary `RandomForestClassifier`, each decision tree outputs class fractions. Because `TreeExplainer` calculates expectations on these tree leaves directly in probability space, the base value $E[f(x)]$ is the exact balanced prior probability (~49.4% to 50.1%), and individual feature SHAP attributions represent direct percentage-point risk shifts. Additivity was verified across all four models down to machine precision ($|E[f(x)] + \sum \phi_i - \hat{P}(Y=1)| \le 2.22 \times 10^{-16}$).
5. **Ultra-Low Latency & Memory Footprint:**
   Pre-caching four `TreeExplainer` instances in memory consumes $< 15$ MB RAM. Single-patient inference across all four models requires **~1.8 ms total** for SHAP computation. Cohort-wide evaluation ($N=303$) across all four models requires **~300 ms total**.
6. **Privacy-Preserving Tree Path-Dependent Background:**
   Using the default tree path-dependent feature perturbation requires **no external reference dataset** during inference. Patient data is not transmitted, stored, or compared against stored cohort records at runtime, preserving HIPAA/GDPR clinical data hygiene.

---

## 2. Mandatory Preflight & Repository Safety

Repository safety checks were performed strictly prior to executing any inspections or scratch benchmarks.

| Check Item | Required Specification | Measured Actual | Status |
| :--- | :--- | :--- | :--- |
| **Repository Root** | `D:\Multimodal` | `D:\Multimodal` | **MATCH** |
| **Active Branch** | `person-a-ml-backend` | `person-a-ml-backend` | **MATCH** |
| **HEAD Commit** | `a5876e7958a354e9bc10195ac62f43b8a8191e2f` | `a5876e7958a354e9bc10195ac62f43b8a8191e2f` | **MATCH** |
| **Working Tree Modifications** | Pre-existing Phase 3 modifications preserved | 10 tracked modified files preserved intact | **PASS** |
| **Untracked Artifacts** | Pre-existing untracked files preserved | 28 untracked reports/assets preserved intact | **PASS** |
| **Git Mutation Policy** | No commits, checkouts, stashes, resets, cleans | Zero Git state modifications executed | **PASS** |

### Git Working Tree Status Inventory:
```text
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
```
*(All 10 modified tracked files and all untracked reports remain completely untouched).*

---

## 3. Installed Environment & Dependency Audit

The audit inspected all installed runtimes, scientific libraries, backend packages, and frontend dependencies.

### 3.1 Python Environment (`AMD64 Windows`)
- **Binary Path:** `C:\Users\2007p\AppData\Local\Programs\Python\Python312\python.exe`
- **Python Version:** `3.12.10` (64-bit AMD64)
- **`shap` Version:** **`0.52.0`** *(Verified installed, importable, operational)*
- **`scikit-learn` Version:** **`1.9.0`**
- **`joblib` Version:** **`1.5.3`**
- **`numpy` Version:** **`2.3.5`**
- **`pandas` Version:** **`2.3.3`**
- **`fastapi` Version:** **`0.138.1`**
- **`pydantic` Version:** **`2.13.4`**
- **`uvicorn` Version:** **`0.49.0`**

### 3.2 Frontend Environment (`frontend/package.json`)
- **Node Environment:** Vite `8.3.0` / Vite build v8.3.4
- **React Version:** `19.2.8` (React DOM `19.2.8`)
- **TypeScript Version:** `~6.0.2`
- **Tailwind CSS:** `4.3.3`
- **Lucide Icons:** `lucide-react 1.55.0`
- **3D Graphics:** Three.js `0.186.1`, `@react-three/fiber` `9.8.1`, `@react-three/drei` `10.7.9`
- **Animation:** `animejs 4.5.0`
- **Charting Dependencies:** None currently installed (D3/Recharts not present; lightweight SVG/Tailwind components recommended).

---

## 4. Production Machine Learning Architecture Audit

The production machine learning architecture was audited by directly loading and introspecting the serialized joblib artifacts in `ml/artifacts/` and source files in `ml/` and `backend/`.

### 4.1 Production Model Artifacts
All four production targets are serialized as scikit-learn `Pipeline` objects:
- `ml/artifacts/model_cath.joblib` (670 KB)
- `ml/artifacts/model_lad.joblib` (740 KB)
- `ml/artifacts/model_lcx.joblib` (813 KB)
- `ml/artifacts/model_rca.joblib` (795 KB)

Each pipeline consists of two named stages:
1. `preprocessor`: `sklearn.compose.ColumnTransformer`
2. `classifier`: `sklearn.ensemble.RandomForestClassifier`
   - `n_estimators = 100`
   - `max_depth = 5`
   - `min_samples_leaf = 3`
   - `class_weight = "balanced"`
   - `random_state = 42`
   - `n_features_in_ = 95`
   - `n_classes_ = 2` (`classes_ = [0, 1]`)

### 4.2 Preprocessor Pipeline & Transformers (`ml/transformers.py`)
The `build_preprocessor` function in `ml/transformers.py` constructs a `ColumnTransformer` with two transformer streams:
1. **Numerical Stream (`num`):**
   - Transformer: `StandardScaler()`
   - Inputs: 21 numerical clinical columns
2. **Categorical Stream (`cat`):**
   - Sub-Pipeline:
     1. Step `to_str`: `StringCastTransformer` (casts inputs to string to avoid int/str type mismatches)
     2. Step `ohe`: `OneHotEncoder(handle_unknown="ignore", sparse_output=False)`
   - Inputs: 33 categorical clinical columns
3. **Remainder:** `"drop"`

### 4.3 Input-to-Transformed Dimension Mapping
The 54 canonical inputs expand into **95 transformed numerical columns**:
- **21 Numerical Features:** Standardized 1:1.
- **33 Categorical Features:** One-hot encoded into **74 binary indicators**.
- **Total Transformed Features:** $21 + 74 = 95$ features.

| Column Index Range | Transformer Type | Input Feature Count | Transformed Column Count | Example Features |
| :--- | :--- | :--- | :--- | :--- |
| `0` to `20` | `StandardScaler` | 21 numerical | 21 numerical | `Age`, `Weight`, `Length`, `BMI`, `BP`, `PR`, `FBS`, `CR`, `TG`, `LDL`, `HDL`, `BUN`, `ESR`, `HB`, `K`, `Na`, `WBC`, `Lymph`, `Neut`, `PLT`, `EF-TTE` |
| `21` to `94` | `OneHotEncoder` | 33 categorical | 74 binary indicators | `Sex_Female`, `Sex_Male`, `DM_0`, `DM_1`, `HTN_0`, `HTN_1`, `Current Smoker_0`, `Current Smoker_1`, `Typical Chest Pain_0`, `Typical Chest Pain_1`, `Tinversion_0`, `Tinversion_1`, `BBB_LBBB`, `BBB_N`, `BBB_RBBB` |

### 4.4 Leakage Prevention Exclusions
The pipeline strictly excludes 5 forbidden features defined in `ml/transformers.py` (`FORBIDDEN_FEATURES`):
- `Cath` (Catheterization ground-truth target)
- `LAD` (Left Anterior Descending stenosis target)
- `LCX` (Left Circumflex stenosis target)
- `RCA` (Right Coronary Artery stenosis target)
- `Exertional CP` (Target leakage proxy excluded during Phase 1 audit)

All models are trained with `class_weight='balanced'`, preventing majority-class collapse across the lower-prevalence vessels (LCX prevalence 39.3%, RCA prevalence 37.6%).

---

## 5. Empirical SHAP Compatibility Investigation & Benchmarks

An isolated, non-mutating Python scratch experiment was conducted using the active runtime (`python.exe`) to empirically test `shap` v0.52.0 against the production models.

### 5.1 Pipeline Explainer Incompatibility
Attempting to initialize `shap.TreeExplainer` directly on the pipeline:
```python
exp = shap.TreeExplainer(pipeline)
```
**Result:** Fails immediately with:
`InvalidModelError: Model type not yet supported by TreeExplainer: <class 'sklearn.pipeline.Pipeline'>`

**Root Cause:** `TreeExplainer` inspects tree estimators (`tree_`, `estimators_`) and does not traverse composite scikit-learn wrappers.

### 5.2 The Two-Step Preprocessing-Decomposition Solution
The correct, high-performance explanation flow decouples preprocessing from tree attribution:
1. Transform raw patient clinical inputs using `X_trans = pipeline.named_steps['preprocessor'].transform(X)` (Shape: `(1, 95)`).
2. Pass `X_trans` to `shap.TreeExplainer(pipeline.named_steps['classifier'])`.

### 5.3 Feature Name Extraction Limitation & Resolution
Attempting to call `preprocessor.get_feature_names_out()` raises:
```text
AttributeError: Estimator to_str does not provide get_feature_names_out. Did you mean to call pipeline[:-1].get_feature_names_out()?
```
**Root Cause:** In `ml/transformers.py`, `StringCastTransformer` subclasses `BaseEstimator` and `TransformerMixin`, but omits `get_feature_names_out(self, input_features=None)`.

**Non-Mutating Extraction Resolution:**
Feature names can be derived without modifying `ml/transformers.py` by querying the nested `OneHotEncoder`:
```python
num_cols = list(preprocessor.transformers_[0][2])
cat_cols = list(preprocessor.transformers_[1][2])
ohe = preprocessor.transformers_[1][1].named_steps['ohe']
ohe_feature_names = list(ohe.get_feature_names_out(cat_cols))
all_95_feature_names = num_cols + ohe_feature_names
```
During Phase 4.1 implementation, a permanent fix should also add `get_feature_names_out` to `StringCastTransformer`.

### 5.4 Canonical Clinical Feature Aggregation
Clinical users cannot interpret 74 disjointed one-hot columns (e.g. `Sex_Female` vs `Sex_Male`, or `DM_0` vs `DM_1`). They require explanations on the **54 canonical clinical features**.

Because SHAP attribution is strictly additive:
$$f(x) - E[f(x)] = \sum_{j \in \text{num}} \phi_j + \sum_{c \in \text{cat}} \left( \sum_{m \in \text{OHE}(c)} \phi_m \right)$$

By summing all one-hot indicator SHAP values associated with each canonical categorical feature:
$$\Phi_c = \sum_{m \in \text{OHE}(c)} \phi_m$$
The total attribution across all 54 canonical inputs reconstructs the model prediction perfectly:
$$E[f(x)] + \sum_{k=1}^{54} \Phi_k = \hat{P}(Y=1 \mid X)$$

### 5.5 Empirical Additivity & Output Space Verification
In scikit-learn `RandomForestClassifier`, each leaf stores the probability of class 1. `TreeExplainer(clf)` with default `model_output='raw'` evaluates leaf values in **probability space**.

Empirical results for Patient 0 (`data/processed/cad_clean.csv`):

| Model Target | Base Value $E[f(x)]$ (Class 1) | Sum of Transformed $\sum \phi_i$ | Sum of Canonical $\sum \Phi_k$ | Reconstructed Prob | Actual `predict_proba` | Absolute Discrepancy | Additivity Verified |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cath** | `0.49910891` | `+0.05965158` | `+0.05965158` | `0.55876049` | `0.55876049` | $2.22 \times 10^{-16}$ | **PASS** |
| **LAD** | `0.49753086` | `+0.02706914` | `+0.02706914` | `0.52460000` | `0.52460000` | $0.00 \times 10^{0}$ | **PASS** |
| **LCX** | `0.49411765` | `-0.17421765` | `-0.17421765` | `0.31990000` | `0.31990000` | $1.11 \times 10^{-16}$ | **PASS** |
| **RCA** | `0.50089109` | `+0.05810891` | `+0.05810891` | `0.55900000` | `0.55900000` | $1.11 \times 10^{-16}$ | **PASS** |

> [!NOTE]
> All base values are centered near 0.500 because the production models were trained with `class_weight='balanced'`. This balances the prior node distribution across classes, meaning any deviation from 50.0% is directly explainable by patient-specific clinical features.

### 5.6 Empirical Performance Benchmarks

| Operation | Cath | LAD | LCX | RCA | Combined (4 Models) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Explainer Initialization** (One-time startup) | `3.72 ms` | `3.80 ms` | `3.44 ms` | `3.53 ms` | `~14.5 ms` |
| **Single-Patient Transform & SHAP Inference** | `0.47 ms` | `0.44 ms` | `0.45 ms` | `0.46 ms` | `~1.82 ms` |
| **Cohort ($N=303$) Transform & SHAP Calculation** | `75.9 ms` | `73.2 ms` | `76.4 ms` | `74.8 ms` | `~300.3 ms` |
| **Memory Footprint** (Cached Explainers) | `~3.2 MB` | `~3.5 MB` | `~3.8 MB` | `~3.7 MB` | `< 15.0 MB` |

Inference overhead is practically negligible: **$< 2$ milliseconds** to calculate complete 54-feature attributions across all four models for a patient.

### 5.7 Robustness: Missing Values & Unseen Categories
1. **Unseen Categorical Inputs:**
   When non-training category values (e.g. `Sex = "Unknown_Gender"`, `DM = "999"`) were supplied, `OneHotEncoder(handle_unknown='ignore')` encoded them as zero vectors. `TreeExplainer` computed attributions normally and additivity was preserved down to $1.11 \times 10^{-16}$.
2. **Missing Numerical Inputs (NaN):**
   When `Age = np.nan` was passed into `X_sample`, `StandardScaler` preserved the NaN. Both `RandomForestClassifier.predict_proba()` and `shap.TreeExplainer` executed successfully without raising runtime errors.
3. **Pydantic Validation Guardrail:**
   In production, `backend/schemas.py` (`PatientInput`) validates all 54 fields with strict bounds before data reaches the pipeline, preventing malformed inputs from reaching the explainer.

---

## 6. Global vs. Local Explainability Findings

The empirical scratch experiment evaluated cohort-wide patterns ($N=303$) and individual patient attributions to assess clinical plausibility.

### 6.1 Global Cohort Feature Importance ($N=303$)
Calculated as the mean absolute SHAP value ($\text{mean}(|\Phi_k|)$) in probability space across the Tehran Heart Center cohort:

```
=== TOP 5 GLOBAL FEATURES: CATH (Global CAD) ===
  1. Typical Chest Pain: 14.23% avg impact
  2. Atypical Chest Pain: 6.00% avg impact
  3. Hypertension (HTN): 3.80% avg impact
  4. Age: 3.49% avg impact
  5. Regional Wall Motion (Region RWMA): 3.04% avg impact

=== TOP 5 GLOBAL FEATURES: LAD (Left Anterior Descending) ===
  1. Typical Chest Pain: 10.44% avg impact
  2. Atypical Chest Pain: 5.11% avg impact
  3. Regional Wall Motion (Region RWMA): 3.07% avg impact
  4. Ejection Fraction (EF-TTE): 3.00% avg impact
  5. Age: 2.23% avg impact

=== TOP 5 GLOBAL FEATURES: LCX (Left Circumflex) ===
  1. Typical Chest Pain: 5.62% avg impact
  2. Age: 4.06% avg impact
  3. Serum Creatinine (CR): 1.84% avg impact
  4. Platelets (PLT): 1.78% avg impact
  5. Triglycerides (TG): 1.63% avg impact

=== TOP 5 GLOBAL FEATURES: RCA (Right Coronary Artery) ===
  1. Typical Chest Pain: 4.80% avg impact
  2. Diabetes Mellitus (DM): 4.14% avg impact
  3. Atypical Chest Pain: 3.59% avg impact
  4. Age: 2.30% avg impact
  5. Neutrophils (Neut): 2.17% avg impact
```

#### Anatomical & Clinical Differentiation:
- **Cath & LAD** are heavily driven by symptoms (`Typical Chest Pain`, `Atypical`) and functional myocardial markers (`Region RWMA`, `EF-TTE`). This aligns with coronary pathophysiology: LAD supplies the anterior interventricular septum, where stenosis frequently causes detectable wall-motion abnormalities and reduced ejection fraction.
- **LCX** exhibits lower symptom sensitivity and higher reliance on metabolic/renal parameters (`CR`, `PLT`, `TG`).
- **RCA** demonstrates a pronounced association with `Diabetes Mellitus` (4.14% avg impact, #2 feature) and inflammatory markers (`Neut`).

### 6.2 Patient-Level Local Attribution (Sample: Patient 0)
- **Model Output (Cath):** Predicted Probability = **55.88%** (Decision: CAD positive).
- **Cohort Base Probability:** **49.91%**.
- **Net Feature Shift:** **+5.97%**.

#### Top Risk-Increasing Contributors (Red / Escalating):
1. `Tinversion = 1` (ECG T-wave inversion present): **+5.57%** risk
2. `HTN = 1` (Hypertension present): **+4.19%** risk
3. `Atypical = N` (Absence of atypical presentation): **+4.08%** risk
4. `K = 4.7 mEq/L` (Serum potassium level): **+4.01%** risk
5. `TG = 250.0 mg/dL` (Elevated triglycerides): **+2.91%** risk

#### Top Risk-Reducing Contributors (Green / Protective):
1. `Typical Chest Pain = 0` (Absence of typical angina): **-12.16%** risk
2. `Age = 53 years` (Relatively younger demographic): **-2.30%** risk
3. `Region RWMA = 0` (Normal ventricular wall motion): **-1.92%** risk
4. `BP = 110 mmHg` (Normotensive blood pressure): **-1.66%** risk
5. `DM = 0` (Non-diabetic): **-1.20%** risk

**Clinical Coherence:** Even though the patient has T-wave inversion and hypertension, the absence of typical angina provides a massive protective shift (-12.16%), explaining why their final probability is only moderately elevated (55.88%) rather than overwhelmingly high.

---

## 7. Explainability Product Architecture & UI Integration

The CardioVision AI workspace is divided into four distinct destinations plus the assessment input wizard. SHAP explainability integrates cleanly into the existing layout without redesigning or breaking working features.

```mermaid
flowchart TD
    subgraph Backend [FastAPI Backend Service]
        MGR[ModelManager] --> PIPE[Serialized Joblib Pipelines]
        MGR --> EXPLAIN[Cached TreeExplainers x4]
        API_PRED["/predict (Inference)"]
        API_EXPLAIN["/predict/explain (Local SHAP)"]
        API_META["/metadata (Global Feature Importance)"]
    end

    subgraph Frontend [React Workspace Destinations]
        D1["Destination 1: Prediction Overview<br/>(#overview)"]
        D2["Destination 2: 3D Cardiovascular Explorer<br/>(#explorer)"]
        D3["Destination 3: Individual Assessment Report<br/>(#report)"]
        D4["Destination 4: Model Review & Benchmarks<br/>(#model-review)"]
    end

    API_EXPLAIN -->|Local Waterfall Attribution| D1
    API_EXPLAIN -->|Dossier Risk Shift Breakdown| D3
    API_META -->|Global Mean |SHAP| Rankings| D4
    D1 -.->|Artery Focus| D2
```

### 7.1 Destination 4: Model Review & Explainability (`#model-review`)
- **Location in Code:** `frontend/src/components/workspace/ModelReviewView.tsx` (Lines 600–617 currently house the placeholder `[TreeSHAP Waterfall Visualization Placeholder — Pending Phase 4]`).
- **Integration Design:**
  - Replace placeholder with **Global Population Feature Attribution Explorer**.
  - Show top 10 influential features per target (`Cath`, `LAD`, `LCX`, `RCA`) using horizontal bar charts.
  - Interactive target toggle matching the existing `VERIFIED_TARGET_METRICS` table.
  - Prominent banner explaining that global importances reflect the Tehran Heart Center cohort ($N=303$) and are correlational model characteristics, not universal causal rules.

### 7.2 Destination 1: Prediction Overview (`#overview`)
- **Location in Code:** `frontend/src/components/workspace/PredictionOverviewView.tsx`.
- **Integration Design:**
  - Enhance each target card (`renderTargetCard`) with an expandable **"Top Influential Risk Factors"** accordion.
  - When expanded, render the top 3 risk-increasing features (rose badge, `+X.X%`) and top 3 risk-reducing features (emerald badge, `-X.X%`).
  - Provide an interactive link: *"View Full Attribution Waterfall in Dossier Report →"*.

### 7.3 Destination 3: Individual Assessment Report (`#report`)
- **Location in Code:** `frontend/src/components/workspace/AssessmentReportView.tsx`.
- **Integration Design:**
  - Insert a new section between Section 3 (*Executive Multi-Target Decision Summary*) and Section 4 (*Scientific Interpretation Boundaries*):
    **"Section 3B: Local Patient Feature Attribution (TreeSHAP Waterfall Decomposition)"**.
  - Renders horizontal waterfall bars displaying:
    - Base Expected Rate: $E[f(x)]$ (~50%)
    - Positive contributors (rose bars extending right)
    - Negative contributors (emerald bars extending left)
    - Net Final Predicted Posterior Likelihood
  - Responsive print layout: Included cleanly in the browser-native A4 PDF export with `print-break-inside-avoid`.

### 7.4 Destination 2: 3D Cardiovascular Explorer (`#explorer`)
- **Preservation:** The 3D BodyParts3D canvas (`CoronaryResultsCanvas.tsx`) remains dedicated to anatomical exploration and artery hover cards. Hovering LAD/LCX/RCA displays model probability and clinical territory without cluttering the 3D viewport.

### 7.5 Frontend UI Styling Strategy
- **Zero Heavy Dependencies:** No need to install Chart.js, Recharts, or D3.
- **Native Tailwind SVG/HTML Bars:** Use flexbox progress bars and SVG waterfall paths adhering to the existing Apple Health minimal visual theme (`slate-900`, `teal-600`, `rose-500`, `emerald-500`, `font-mono`).

---

## 8. Backend & API Contract Design

### 8.1 Proposed Endpoint Specifications

#### Option A: Dedicated Explanation Endpoint (`/predict/explain`)
```http
POST /predict/explain
Content-Type: application/json

{
  "patient": { /* 54 canonical inputs */ },
  "targets": ["Cath", "LAD", "LCX", "RCA"] // Optional target filter
}
```
**Response Schema:**
```json
{
  "session_id": "optional-uuid",
  "disclaimer": "Research prototype output...",
  "explanations": {
    "Cath": {
      "target": "Cath",
      "base_value": 0.4991,
      "predicted_probability": 0.5588,
      "predicted_class": 1,
      "attributions": [
        {
          "canonical_feature": "Tinversion",
          "patient_value": 1,
          "contribution": 0.0557,
          "direction": "increase"
        },
        {
          "canonical_feature": "Typical Chest Pain",
          "patient_value": 0,
          "contribution": -0.1216,
          "direction": "decrease"
        }
      ],
      "net_attribution_sum": 0.0597
    }
  }
}
```

#### Option B: Inline Explanation Flag in `/predict`
```http
POST /predict?include_explanations=true
```
*(Both approaches are viable; Option A or an optional field on `/predict` preserves 100% backward compatibility with existing API clients and tests).*

### 8.2 In-Memory Explainer Caching (`backend/model_loader.py`)
Modify `ModelManager` to initialize `TreeExplainer` instances during application startup (`load_all_models`):
```python
self.explainers = {
    target: shap.TreeExplainer(pipe.named_steps["classifier"])
    for target, pipe in self.models.items()
}
```
This guarantees that API inference requests incur zero explainer initialization latency.

---

## 9. Scientific and Clinical Boundaries

CardioVision AI is a medical AI research prototype. To maintain scientific integrity, the following boundaries must be strictly enforced across code, documentation, and user interfaces:

1. **Model-Behavior Explanations, Not Biological Causation:**
   SHAP values quantify how much a particular feature value moved the Random Forest's statistical prediction relative to the cohort prior. They **do not prove** that the feature caused coronary artery disease in that individual.
2. **Correlated Feature Disclaimers:**
   TreeSHAP with tree path-dependent perturbation distributes attribution among correlated features (e.g. `Weight`, `Length`, and `BMI`; or `Typical Chest Pain`, `Atypical`, and `Nonanginal`). The presence of one correlated feature can depress the apparent SHAP value of another.
3. **Uncalibrated Random Forest Probabilities:**
   The production estimators output the unweighted mean of tree vote fractions, regularized by depth limits (`max_depth=5`) and balanced weights (`class_weight='balanced'`). They are not calibrated via isotonic regression or Platt scaling. Base rates (~50%) reflect the balanced prior, not raw population disease prevalence.
4. **Single-Center Cohort Constraints:**
   All models were trained and validated on the Tehran Heart Center cohort ($N=303$). External validity across other populations, ethnicities, or healthcare settings is unverified.
5. **Clear Non-Diagnostic Labelling:**
   Explanations must always be accompanied by clear notices: *"Statistical attribution of machine learning decision logic. Not a clinical diagnosis, biomarker validation, or treatment recommendation."*

---

## 10. Prioritized Implementation Roadmap

Following this audit, implementation should proceed in four modular, independently testable phases:

### Phase 4.1: Backend SHAP Engine & API Endpoints
- Implement `get_feature_names_out` on `StringCastTransformer` in `ml/transformers.py`.
- Add thread-safe in-memory `TreeExplainer` caching and canonical feature aggregator to `backend/model_loader.py`.
- Define Pydantic request/response schemas in `backend/schemas.py`.
- Add `/predict/explain` endpoint to `backend/app.py`.
- Write pytest suite testing additivity, positive-class alignment, missing value handling, and latency.

### Phase 4.2: Global Population Explainability (Destination 4)
- Precompute or dynamically calculate cohort mean $|SHAP|$ rankings for all four targets.
- Integrate interactive horizontal bar charts into `frontend/src/components/workspace/ModelReviewView.tsx`.
- Add scientific methodology disclosures and Tehran cohort limitations.

### Phase 4.3: Local Patient Assessment Attribution (Destinations 1 & 3)
- Connect frontend API client (`frontend/src/api/client.ts`) to explanation endpoints.
- Update `activeAssessment` state to persist explanation payloads in `sessionStorage`.
- Add expandable risk factor accordions to `PredictionOverviewView.tsx`.
- Build accessible, print-ready waterfall attribution cards in `AssessmentReportView.tsx` with working A4 PDF export styling.

### Phase 4.4: End-to-End Clinical Verification & Defensive Auditing
- Verify empty-assessment and network-failure fallback states.
- Run complete regression test suite across backend and frontend.
- Generate independent verification report and freeze Phase 4 codebase.

---

## 11. Testing & Validation Matrix

The following matrix documents the verification status across all 12 concrete test areas defined in the audit mandate:

| # | Test Area | Verification Method | Status | Empirical Evidence / Finding |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **SHAP Compatibility with Pipelines** | Isolated Scratch Script | **PASS** | Direct pipeline fails (`InvalidModelError`). Decomposed transform + `TreeExplainer` succeeds on all 4 models. |
| **2** | **Positive-Class Selection** | Isolated Scratch Script | **PASS** | Output shape is `(N, 95, 2)`. Class index 1 strictly corresponds to positive class (`CAD` / `Stenotic`). |
| **3** | **Feature-to-Transformed Mapping** | Isolated Scratch Script | **PASS** | 21 numerical (1:1) + 74 one-hot columns (prefix-mapped) = 95 features. Summing one-hot components perfectly maps to 54 canonical inputs. |
| **4** | **Additivity / Reconstruction Check** | Isolated Scratch Script | **PASS** | Probability-space additivity holds to machine precision ($|E[f(x)] + \sum \phi_i - \hat{P}(Y=1)| \le 2.22 \times 10^{-16}$). |
| **5** | **Explanation Stability** | Isolated Scratch Script | **PASS** | Deterministic tree path-dependent traversal produces identical SHAP outputs across multiple runs on identical inputs. |
| **6** | **Separate Explanations for 4 Targets** | Isolated Scratch Script | **PASS** | Cath, LAD, LCX, RCA each evaluated with its own fitted model and distinct base rate (~49.4% to 50.1%). Top features differentiate biologically. |
| **7** | **Missing & Unseen Categorical Inputs** | Isolated Scratch Script | **PASS** | `handle_unknown='ignore'` zeros unknown categories. TreeExplainer executes cleanly. Missing numerical NaNs handled natively. |
| **8** | **Empty & Stale Assessment States** | Static Code Audit | **PASS** | `AssessmentReportView.tsx` and `PredictionOverviewView.tsx` have dedicated empty fallbacks when `activeAssessment` is null. |
| **9** | **Frontend Error & Unavailable States** | Architecture Design | **UNVERIFIED** | Error boundaries and fallback cards designed for Phase 4.3; unverified until frontend explanation integration is implemented. |
| **10** | **API Latency & Memory Behavior** | Isolated Scratch Benchmark | **PASS** | Init: ~14 ms total. Single-patient inference: ~1.8 ms total across all 4 targets. Cached memory: < 15 MB RAM. |
| **11** | **Non-Interference with Predictions** | Isolated Scratch Script | **PASS** | TreeExplainer execution does not alter tree parameters or model weights. `predict_proba` returns identical results. |
| **12** | **Regression Testing of Existing Suites** | Test Suite Execution | **PASS** | All 20 backend pytest tests pass (`test_api.py`). Frontend TypeScript build (`tsc -b && vite build`) compiles with zero errors. |

---

## 12. Exact Source Paths & Artifact Inventory

### Source Files Inspected:
- `ml/transformers.py`: Schema definitions, `TARGET_CONFIG`, `StringCastTransformer`, `build_preprocessor`.
- `ml/artifacts/model_cath.joblib`: Serialized global CAD model pipeline.
- `ml/artifacts/model_lad.joblib`: Serialized LAD stenosis model pipeline.
- `ml/artifacts/model_lcx.joblib`: Serialized LCX stenosis model pipeline.
- `ml/artifacts/model_rca.joblib`: Serialized RCA stenosis model pipeline.
- `ml/artifacts/model_metadata.json`: Feature schemas, canonical ordering, train/validation parameters.
- `backend/app.py`: FastAPI application, endpoints (`/health`, `/metadata`, `/predict`, `/predict/batch`).
- `backend/model_loader.py`: `ModelManager` class, model loading, single and batch prediction methods.
- `backend/schemas.py`: Pydantic input/output schemas (`PatientInput`, `TargetPrediction`, `PredictionResponse`).
- `backend/config.py`: Application configuration, environment constants, prototype disclaimer.
- `backend/tests/test_api.py`: 20 unit and regression tests.
- `frontend/src/api/types.ts`: TypeScript contracts for 54 canonical inputs and prediction responses.
- `frontend/src/api/assessmentState.ts`: Session storage manager and destination navigation hooks.
- `frontend/src/components/workspace/ModelReviewView.tsx`: Destination 4 component with explainability placeholders.
- `frontend/src/components/workspace/AssessmentReportView.tsx`: Destination 3 component with A4 PDF export styling.
- `frontend/src/components/workspace/PredictionOverviewView.tsx`: Destination 1 component with prediction cards.
- `data/processed/cad_clean.csv`: Tehran Heart Center benchmark cohort ($N=303$).

---

## 13. Audit Conclusion & Next Steps

This feasibility audit confirms that **SHAP explainability is 100% technically feasible, computationally lightweight, and mathematically sound** for CardioVision AI. 

No architectural overhaul or new dependencies are required. The pre-installed `shap` v0.52.0 library operates natively in probability space on the fitted Random Forest models, delivering millisecond-level explanations that sum perfectly to the predicted probabilities.

**Recommended Next Action:** Proceed to **Phase 4.1: Backend SHAP Engine & API Contract Implementation**.
