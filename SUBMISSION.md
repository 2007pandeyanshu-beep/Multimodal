# CardioVision AI: Master Hackathon Submission Document
**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**

* **Repository Active Branch**: `integration/ensemble-evaluation`
* **HEAD Commit**: `a1c1c4d` (`fix(frontend): preserve clinical form state and handle cold starts`)
* **Live Frontend Web Application**: [https://multimodal-five.vercel.app/](https://multimodal-five.vercel.app/)
* **Live Backend Inference Web Service**: [https://cardiovision-backend-oiji.onrender.com/](https://cardiovision-backend-oiji.onrender.com/)

---

## 1. Executive Summary

**CardioVision AI** is an investigational clinical decision-support system designed to assist pre-catheterization risk stratification for adult patients evaluated for suspected Coronary Artery Disease (CAD). Using a canonical schema of **54 non-invasive clinical parameters** (spanning demographics, symptom presentations, vital signs, routine hematology/biochemistry panels, resting electrocardiograms, and echocardiography), the platform simultaneously predicts four binary anatomical targets:
1. Overall angiographically confirmed CAD (**`Cath`**)
2. Left Anterior Descending artery stenosis $\ge 50\%$ (**`LAD`**)
3. Left Circumflex artery stenosis $\ge 50\%$ (**`LCX`**)
4. Right Coronary Artery stenosis $\ge 50\%$ (**`RCA`**)

The system integrates four homogeneous, regularized `RandomForestClassifier` pipelines evaluated via 5-fold stratified cross-validation on an open cardiovascular cohort ($N=303$). Local feature attributions are computed in real time using `shap.TreeExplainer` directly in probability space, demonstrating exact mathematical additivity with residuals bounded by floating-point machine precision ($\sim 2.22 \times 10^{-16}$). Predictions are spatially projected onto an interactive 3D coronary anatomical mesh derived from the BodyParts3D open repository, rendered via Three.js with distinct anatomical vessel coloring, interactive focus cameras, and floating probability HUD cards. A 5-step guided clinical intake wizard and a browser-native A4 printable dossier support user workflows.

---

## 2. Problem Statement & Motivation

Coronary Artery Disease remains the leading contributor to adult mortality globally [1]. Gold-standard diagnosis relies on Invasive Coronary Angiography (ICA / `Cath`). While definitive, catheterization requires arterial puncture, iodinated radiopaque contrast, and ionizing fluoroscopy, carrying procedural risks of vascular injury, bleeding, stroke, contrast-induced nephropathy, and arrhythmias [2].

In routine clinical practice, non-invasive risk scores (e.g., Framingham Risk Score, Diamond-Forrester pre-test probability) estimate multi-year cardiovascular risk or broad CAD likelihood, but present critical clinical limitations:
* **Lack of Vessel-Specific Localization**: Conventional clinical scoring does not localize disease to specific coronary arteries (LAD, LCX, RCA), which is vital for revascularization planning.
* **Low Diagnostic Yield of Elective Angiography**: Multicenter clinical registry data have shown that a substantial fraction of elective diagnostic catheterizations reveal normal coronary arteries or non-obstructive disease [3], exposing patients to procedural risks that could be better triaged.
* **Interpretability Gaps**: Advanced multivariate models often operate as black boxes, making clinical verification difficult in acute decision-making.

CardioVision AI explores whether non-invasive routine clinical variables can estimate vessel-specific stenosis probabilities while maintaining interpretability through TreeSHAP attributions and 3D anatomical visualization.

---

## 3. Proposed Solution & End-to-End User Workflow

The platform delivers an integrated workflow separating patient intake, real-time inference, anatomical inspection, model explainability, and clinical dossier generation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       1. 5-Step Clinical Intake Wizard                      │
│  - Step 1: Profile & Biometrics (Length/Height, Weight, auto-derived BMI,   │
│            dataset-specific Obesity flag at BMI ≥ 25.0, smoking, family hx) │
│  - Step 2: History & Symptoms (Comorbidities, mutually exclusive chest pain)│
│  - Step 3: Vitals & Laboratory Biomarkers (Hemodynamics, lipids, renal)     │
│  - Step 4: ECG & Cardiac Examination (Q-wave, ST-T, EF-TTE, RWMA, VHD)      │
│  - Step 5: Review & Submission (54-feature verification & JSON export)      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ POST /predict & POST /predict/explain
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    2. Master Clinical Workspace                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Tab 1: Prediction Overview (#overview)                                  │ │
│ │ Multi-artery risk summary cards (Cath, LAD, LCX, RCA)                   │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ Tab 2: 3D Cardiovascular Explorer (#explorer)                           │ │
│ │ Three.js anatomical mesh with vessel focus cameras & probability HUD    │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ Tab 3: Individual Assessment Report (#report)                           │ │
│ │ Measured vs assumed audit table & browser-native A4 printable dossier   │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ Tab 4: Model Review & Explainability (#model-review)                     │ │
│ │ Patient-level TreeSHAP waterfall plots & Tehran cohort CV benchmarks    │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ Tab 5: Feature Explorer (#feature-explorer)                             │ │
│ │ Interactive reference catalog of all 54 canonical inputs & ranges       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 5-Step Clinical Intake Wizard
Mounted modally (`#assessment`, [`PatientProfileWizard.tsx`](frontend/src/components/wizard/PatientProfileWizard.tsx)):
* **Step 1 (Profile & Biometrics)**: Evaluates chronological age, biological sex, standing height (`Length`, cm), body weight (kg), tobacco history (mutually exclusive Current/Ex/Never Smoker), and family history of CAD.
  * *BMI & Obesity Derivation*: BMI ($kg/m^2$) is automatically computed and rendered read-only. The binary feature `Obesity` is derived dynamically as `Y` if $\text{BMI} \ge 25.0 \text{ kg/m}^2$, else `N`. This threshold reflects the Z-Alizadeh Sani dataset protocol (identifying overweight and obese individuals) rather than the standard WHO Class I obesity cutoff ($\text{BMI} \ge 30.0$).
* **Step 2 (Medical History & Symptoms)**: Enforces mutual exclusivity among four chest pain presentations: *Typical Chest Pain*, *Atypical*, *Nonanginal*, or *None*. Captures hypertension, diabetes, dyslipidemia, CHF, CRF, stroke, functional class, and dyspnea.
* **Step 3 (Vitals & Laboratory Panels)**: Validates continuous physiological metrics (BP, PR, FBS, Creatinine, Triglycerides, LDL, HDL, BUN, ESR, Hemoglobin, Potassium, Sodium, WBC, Lymphocytes, Neutrophils, Platelets).
* **Step 4 (ECG & Cardiac Examination)**: Captures resting electrocardiographic changes (pathological Q-waves, ST-elevation, ST-depression, T-wave inversion, LVH, BBB), physical exam signs (edema, weak pulses, lung rales, murmurs), and echocardiography (EF-TTE, regional wall motion abnormality score 0–4, valvular heart disease).
* **Step 5 (Clinical Review & Inference)**: Full 54-feature audit matrix with JSON payload inspection. Assessment submission is protected by a 90-second client timeout and a non-blocking 4-second notification banner to absorb cloud service cold starts.
* **Synthetic Demonstration Presets**: Provides three explicitly labeled presets for verification and demonstration ([`wizardTypes.ts`](frontend/src/components/wizard/wizardTypes.ts)):
  1. `Synthetic Demo: Normative Benchmark` (Low Risk)
  2. `Synthetic Demo: Suspected Ischemia Benchmark` (Moderate Risk)
  3. `Synthetic Demo: Multi-Vessel Stenosis Benchmark` (High Risk)
  * *Note: All presets are synthetic demonstrations created for testing and UI preview, not real patients.*

### 3.2 Master Clinical Workspace (Five Destinations)
Managed by [`CardioVisionWorkspace.tsx`](frontend/src/components/workspace/CardioVisionWorkspace.tsx) and [`WorkspaceNavBar.tsx`](frontend/src/components/workspace/WorkspaceNavBar.tsx):
1. **Prediction Overview (`#overview`)**: Executive dashboard showing simultaneous prediction probabilities, binary decision badges, and provenance indicators across all four targets.
2. **3D Cardiovascular Explorer (`#explorer`)**: Spatial anatomy viewer linking numerical predictions to anatomical branches on a 3D coronary mesh.
3. **Individual Assessment Report (`#report`)**: Patient audit dossier comparing measured clinical values against assumed cohort defaults, formatted for browser-native A4 printing.
4. **Model Review & Explainability (`#model-review`)**: Tehran cohort 5-fold CV benchmarks, ROC curves, and TreeSHAP waterfall/force plots.
5. **Feature Explorer (`#feature-explorer`)**: Interactive encyclopedia of all 54 canonical inputs with clinical descriptions and reference ranges.

---

## 4. System Architecture & Technology Stack

The application uses a decoupled client-server architecture:

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

* **Exact Runtime Dependencies**: Dependencies are pinned in the root [`requirements.txt`](requirements.txt):
  `fastapi==0.138.1`, `uvicorn[standard]==0.49.0`, `pydantic==2.13.4`, `scikit-learn==1.9.0`, `joblib==1.5.3`, `numpy==2.3.5`, `pandas==2.3.3`, `scipy==1.16.3`, and `shap==0.52.0`.
* **CORS & Resilience**: Backend explicitly permits the deployed Vercel origin. The frontend client ([`client.ts`](frontend/src/api/client.ts)) manages request abort signals and provides a 90-second timeout window.

---

## 5. Dataset Provenance & Canonical 54-Feature Schema

### 5.1 Cohort Provenance & Single-Center Boundary
* **Data Source**: Extension of the Z-Alizadeh Sani coronary artery disease dataset collected at Tehran Heart Center, Tehran, Iran [4].
* **Raw Artifact**: `data/raw/extention of Z-Alizadeh sani dataset.xlsx` (SHA-256: `739343245c2ba578b541370217531750d8e936022f928b83e0d91756caa3ff0b`).
* **Cohort Metrics**: Exactly **303 patients**, **0 missing fields**, **0 duplicate rows**.
* **Cohort Scope & Limitation**: **Single-center research cohort**. All records originate from a single Iranian tertiary cardiac center. **External prospective validation across broader demographic or international cohorts has not been performed.**

### 5.2 Four Prediction Targets
Target labels correspond to $\ge 50\%$ luminal diameter stenosis confirmed by coronary catheterization:
1. **`Cath` (Overall CAD)**: Positive: 216 (71.29%) | Negative: 87 (28.71%)
2. **`LAD` (Left Anterior Descending)**: Positive: 177 (58.42%) | Negative: 126 (41.58%)
3. **`LCX` (Left Circumflex)**: Positive: 119 (39.27%) | Negative: 184 (60.73%)
4. **`RCA` (Right Coronary Artery)**: Positive: 114 (37.62%) | Negative: 189 (62.38%)

### 5.3 Feature Partitioning & Exclusions
From 59 original spreadsheet columns, 5 were strictly excluded:
* Four targets (`Cath`, `LAD`, `LCX`, `RCA`) to prevent data leakage.
* `Exertional CP`: Excluded because it exhibits **zero variance** (100% negative `'N'` across all 303 rows), which would cause singular matrices or dead nodes.

The **54 canonical features** consist of:
* **21 Numerical Features**: `Age`, `Weight`, `Length` (Height in cm; mapped to/from UI label *Height*), `BMI`, `BP` (Systolic BP), `PR` (Pulse Rate), `FBS`, `CR`, `TG`, `LDL`, `HDL`, `BUN`, `ESR`, `HB`, `K`, `Na`, `WBC`, `Lymph`, `Neut`, `PLT`, `EF-TTE`.
* **33 Categorical Features**: `Sex`, `DM`, `HTN`, `Current Smoker`, `EX-Smoker`, `FH`, `Obesity`, `CRF`, `CVA`, `Airway disease`, `Thyroid Disease`, `CHF`, `DLP`, `Edema`, `Weak Peripheral Pulse`, `Lung rales`, `Systolic Murmur`, `Diastolic Murmur`, `Typical Chest Pain`, `Dyspnea`, `Function Class`, `Atypical`, `Nonanginal`, `LowTH Ang`, `Q Wave`, `St Elevation`, `St Depression`, `Tinversion`, `LVH`, `Poor R Progression`, `BBB`, `Region RWMA`, `VHD`.
* **Deterministic Cleaning**: Two typographic anomalies normalized: `Sex` (`'Fmale'` $\rightarrow$ `'Female'`) and `VHD` (`'N'` $\rightarrow$ `'Normal'`, `'mild'` $\rightarrow$ `'Mild'`).

---

## 6. Preprocessing & Random Forest Methodology

### 6.1 Preprocessing Pipeline
Transformations are encapsulated inside scikit-learn `Pipeline` and `ColumnTransformer` objects to guarantee zero test fold leakage:
* **Numerical Path**: `SimpleImputer(strategy='median')` followed by `StandardScaler()`.
* **Categorical Path**: `SimpleImputer(strategy='most_frequent')` followed by `OneHotEncoder(handle_unknown='ignore', sparse_output=False)`.

### 6.2 Model Specification
Each target is modeled by an independently trained, balanced `RandomForestClassifier`:
* `n_estimators = 100`
* `max_depth = 5` (regularization to limit leaf depth on $N=303$)
* `min_samples_leaf = 3`
* `class_weight = 'balanced'` (mitigates class imbalance in LCX and RCA)
* `random_state = 42`

### 6.3 Empirical Calibration & Nature of Output Probabilities
* **Raw Voting Frequencies**: Probabilities returned by `/predict` represent raw ensemble tree voting proportions ($\frac{1}{100} \sum_{t=1}^{100} I(h_t(x) = 1)$) from scikit-learn's `predict_proba()`.
* **No Post-Hoc Calibration**: The production models have **not undergone post-hoc Platt scaling (`CalibratedClassifierCV`) or isotonic regression**.
* **Empirical Reliability**: Brier scores were evaluated during 5-fold CV (Cath: 0.1220, LAD: 0.1692, LCX: 0.2157, RCA: 0.2087). Out-of-fold reliability diagrams ([`06_calibration_curves.png`](reports/phase2_charts/06_calibration_curves.png)) reveal mild probability compression toward the center ($0.20–0.80$), typical of averaged decision trees. Output probabilities should be interpreted as relative tree-consensus metrics rather than exact actuarial risks.

---

## 7. Five-Fold Cross-Validation Results

Models were evaluated using 5-Fold Stratified Cross-Validation on the full 303-patient cohort (`random_state=42`).

### 7.1 Primary Verified Metrics (5-Fold Cross-Validation Means)
Primary performance metrics in [`ml/model_metadata.json`](ml/model_metadata.json) represent the **unweighted arithmetic mean of test metrics across all 5 folds** at default threshold $T = 0.50$:

| Target | ROC-AUC (Mean ± SD) | Accuracy (Mean ± SD) | Recall / Sens. (Mean ± SD) | Precision (Mean ± SD) | F1-Score (Mean ± SD) | Brier Score (Mean ± SD) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cath (Overall CAD)** | **0.9195** ± 0.044 | **0.8547** ± 0.056 | **0.8564** ± 0.063 | **0.9349** ± 0.039 | **0.8931** ± 0.042 | **0.1220** ± 0.024 |
| **LAD Stenosis** | **0.8383** ± 0.077 | **0.7858** ± 0.060 | **0.8424** ± 0.053 | **0.8028** ± 0.052 | **0.8216** ± 0.048 | **0.1692** ± 0.025 |
| **LCX Stenosis** | **0.7199** ± 0.084 | **0.6402** ± 0.088 | **0.6138** ± 0.072 | **0.5469** ± 0.114 | **0.5757** ± 0.086 | **0.2157** ± 0.016 |
| **RCA Stenosis** | **0.7340** ± 0.059 | **0.6698** ± 0.051 | **0.6308** ± 0.084 | **0.5563** ± 0.069 | **0.5893** ± 0.064 | **0.2087** ± 0.016 |

### 7.2 Reconciliation with Pooled Out-Of-Fold (OOF) Metrics
In [`reports/phase2_integrity_audit/verified_metrics.csv`](reports/phase2_integrity_audit/verified_metrics.csv), predictions from all 5 folds were pooled into a single vector of 303 validation cases:
* **Cath**: Pooled OOF ROC-AUC = **0.9144** ($\Delta = -0.0051$), Pooled Accuracy = **0.8548**, Pooled Recall = **0.8565**, Pooled Precision = **0.9343**.
* **LAD**: Pooled OOF ROC-AUC = **0.8352** ($\Delta = -0.0031$), Pooled Accuracy = **0.7855**, Pooled Recall = **0.8418**, Pooled Precision = **0.8011**.
* **LCX**: Pooled OOF ROC-AUC = **0.7130** ($\Delta = -0.0069$), Pooled Accuracy = **0.6403**, Pooled Recall = **0.6134**, Pooled Precision = **0.5368**.
* **RCA**: Pooled OOF ROC-AUC = **0.7313** ($\Delta = -0.0027$), Pooled Accuracy = **0.6700**, Pooled Recall = **0.6316**, Pooled Precision = **0.5538**.

*Methodological Note*: Fold-Mean calculates metrics within each fold and averages the results. Pooled OOF ranks all 303 cases simultaneously, introducing minor rank-order variations from fold-to-fold threshold shifts ($\Delta \text{AUC} \le 0.007$). Both representations demonstrate consistent model discrimination. See [`reports/phase2_integrity_audit/discrepancy_summary.csv`](reports/phase2_integrity_audit/discrepancy_summary.csv) for line-by-line mathematical documentation.

---

## 8. TreeSHAP Explainability

### 8.1 Probability-Space Implementation (`POST /predict/explain`)
Local explanations are computed using `shap.TreeExplainer` ([`backend/model_loader.py`](backend/model_loader.py)) [5]. In scikit-learn, individual decision trees inside `RandomForestClassifier` output class probability fractions at their leaf nodes. Consequently, TreeSHAP evaluates tree paths directly in **probability space** without link function approximations:
$$P(\text{Target} = 1) = \phi_0 + \sum_{k=1}^{54} \Phi_k$$
where:
* $\phi_0$ is the model baseline expectation (`explainer.expected_value[pos_class_idx]`). For Cath, $\phi_0 \approx 0.4991$, which reflects the balanced class weighting (`class_weight='balanced'`) during tree induction rather than the unweighted positive prevalence of 71.3%.
* $\Phi_k$ is the canonical attribution obtained by summing one-hot dummy column contributions back to parent feature $k$.
* **Additivity Discrepancy**: The difference between the pipeline's raw probability and the reconstructed SHAP probability ($\left| \phi_0 + \sum \Phi_k - P_{\text{raw}} \right|$) is bounded by floating-point machine precision: **$\approx 2.22 \times 10^{-16}$** ([`reports/phase4_1_backend_shap_report.md`](reports/phase4_1_backend_shap_report.md)).

### 8.2 Global Feature Rankings (`GET /explain/global`)
The `/explain/global` endpoint returns cached mean absolute SHAP values across the cohort. Overall CAD prediction is driven primarily by *Typical Chest Pain*, *Age*, *EF-TTE*, *Regional RWMA*, and *FBS*.

### 8.3 Limitations of TreeSHAP
* **Association vs Causation**: SHAP values quantify statistical dependencies within the model's training distribution; they do not establish biological causality.
* **Correlated Inputs**: Correlated parameters (e.g., Systolic and Diastolic BP, or Triglycerides and LDL) can split attribution weights across related inputs.

---

## 9. Interactive 3D Anatomy, Workspace & PDF Report Export

### 9.1 Three.js Anatomical Coronary Viewer
* **Mesh Attribution**: The 3D model ([`coronary_heart_bp3d.glb`](frontend/public/models/coronary_heart_bp3d.glb)) is derived from the **BodyParts3D** anatomical repository (The Database Center for Life Science, Japan) [6].
* **Fixed Anatomical Vessel Palette**: Rendered via `@react-three/fiber` in [`CoronaryResultsCanvas.tsx`](frontend/src/components/CoronaryResultsCanvas.tsx), the 3D heart maintains distinct anatomical colors per vessel branch:
  * **LAD**: Coral Red (`#E94F70`)
  * **LCX**: Violet (`#8B5CF6`)
  * **RCA**: Teal (`#0891B2`)
  * **LMCA (Cath)**: Deep Crimson (`#BE123C`)
  * **Ascending Aorta**: Warm Alabaster/Ivory (`#f1e5e6`)
  * **Myocardium**: Warm Cardiac Crimson (`#CF727C`, roughness 0.68)
* **Interactive State & Camera Tracking**:
  * Five camera views: *Anterior* (LAD), *Left Lateral* (LCX), *Right Posterior* (RCA), *Superior* (LMCA/Aorta), and *Reset*.
  * Raycast selection and hover apply emissive glow highlights and dim non-selected branches (opacity reduces from 1.0 to 0.40).
  * **Prediction HUD Cards**: Predicted risk probabilities ($p$) and binary classification labels are presented on floating HUD cards and overview cards, rather than dynamically shifting anatomical vessel colors between green and red.

### 9.2 Browser-Native A4 PDF Report Export
* **Print Engine**: PDF export in [`AssessmentReportView.tsx`](frontend/src/components/workspace/AssessmentReportView.tsx) is a **browser-native printing interface** invoking `window.print()`.
* **Print Stylesheets**: Utilizes `@media print` CSS rules with selectable *Full* and *Compact* layouts, suppressing navigation elements and rendering an official clinical dossier masthead.
* *Note: The application does not contain a server-side PDF generator or automated clinical PDF reader.*

---

## 10. Deployment Architecture

CardioVision AI is deployed across two synchronized environments:
* **Frontend (Vercel)**: Static Single Page Application built with Vite 8 (`https://multimodal-five.vercel.app/`).
* **Backend (Render)**: Python 3.12 Web Service (`https://cardiovision-backend-oiji.onrender.com/`) executed via:
  ```bash
  uvicorn backend.app:app --host 0.0.0.0 --port $PORT
  ```
* **Cold-Start Handling**: Client includes a 90-second timeout and a 4-second notification banner to absorb Render free-tier instance activations without throwing false inference failures.

---

## 11. Limitations, Responsible Use & Clinical Disclaimer

### 11.1 Methodological Caveats
1. **Single-Center Retrospective Sample**: The dataset comprises 303 patients from the Tehran Heart Center. Predictive performance may vary when evaluated on other demographic groups or clinical sites.
2. **Moderate Secondary Vessel Sensitivity**: Sensitivity for LCX (61.38%) and RCA (63.08%) is lower than for Cath (85.64%) and LAD (84.24%), reflecting class imbalance and the limited sensitivity of standard 12-lead ECGs for posterior/inferior ischemia.
3. **No External Prospective Trial**: Cross-validation results reflect internal cohort testing. Prospective clinical trials have not been conducted.

### 11.2 Investigational Clinical Disclaimer
> [!CAUTION]
> **Research Prototype Notice**: CardioVision AI is an educational and research prototype developed for the Multimodal AI Hackathon 2026. It is **not an FDA-cleared, CE-marked, or certified medical device**. It does not provide definitive medical diagnoses, replace clinical judgement, or dictate therapeutic pathways. All risk estimates and visualizations must be interpreted by board-certified physicians in conjunction with established diagnostic standards.

---

## 12. Future Work

The following items outline planned technical directions and completed preliminary investigations:

### 12.1 Completed Ensemble & Stacking Benchmarks
In [`reports/ensemble_evaluation/evaluation_summary.md`](reports/ensemble_evaluation/evaluation_summary.md), SoftVoting and Stacking ensembles were compared against production Random Forest models:
* **Cath (Overall CAD)**: SoftVoting yielded a small discrimination lift ($\Delta \text{ROC-AUC} = +0.0106$, paired $t$-test $p = 0.0368$). However, evaluating patient-level classification shifts at $T=0.50$ with McNemar's test showed no statistically significant difference ($p = 0.4237$). SoftVoting broke native TreeSHAP execution speed (<10ms vs >1000ms for KernelSHAP).
* **LAD**: The candidate model was architecturally identical to production RF ($\Delta \text{AUC} = 0.0000$, McNemar $p = 1.0000$).
* **LCX & RCA**: Stacking provided negligible lift on LCX ($\Delta \text{AUC} = +0.0029$, $p=0.8513$) and lower discrimination on RCA ($\Delta \text{AUC} = -0.0052$, $p=0.6804$), while increasing architectural complexity.
* **Conclusion**: Production retains the regularized Random Forest baseline across all four targets.

### 12.2 Planned Technical Directions
1. **Multimodal Clinical Document & PDF Extraction**: Intake pipeline utilizing document layout analysis and vision-language models to extract routine laboratory panels and ECG reports into the 54-feature schema.
2. **Feature Engineering Lab**: Exploration of composite cardiovascular ratios, such as the Atherogenic Index of Plasma ($\log(\text{TG}/\text{HDL})$), the Triglyceride-Glucose index (TyG), and Pulse Pressure ($\text{SBP} - \text{DBP}$).
3. **Prediction Uncertainty Quantification**: Integration of conformal prediction sets to bound predicted risks within guaranteed coverage intervals ($1 - \alpha$).
4. **Dataset Shift & Out-of-Distribution (OOD) Detection**: Mahalanobis distance scoring and autoencoder reconstruction errors to identify input profiles outside the training distribution.

---

## 13. References & Reproducibility Resources

### 13.1 Academic & Technical References
1. World Health Organization. *The Top 10 Causes of Death*. WHO Global Health Estimates, 2020.
2. Lawton JS, Tamis-Holland JE, Bangalore S, et al. *2021 ACC/AHA/SCAI Guideline for Coronary Artery Revascularization: A Report of the American College of Cardiology/American Heart Association Joint Committee on Clinical Practice Guidelines*. J Am Coll Cardiol. 2022;79(2):e21–e129.
3. Patel MR, Peterson ED, Dai D, et al. *Low diagnostic yield of elective coronary angiography*. N Engl J Med. 2010;362(10):886–895.
4. Alizadehsani R, Abdar M, Roshanzamir M, et al. *A database of patients for computer aided diagnosis of coronary artery disease*. Data in Brief. 2016;7:507–510.
5. Lundberg SM, Erion G, Chen H, et al. *From local explanations to global understanding with explainable AI for trees*. Nature Machine Intelligence. 2020;2(1):56–67.
6. Mitsuhashi M, Fujieda K, Tamura T, et al. *BodyParts3D: 3D structure database for anatomical concepts*. Nucleic Acids Res. 2009;37(Database issue):D782–D785.

### 13.2 Key Repository Evidence Files
* Production Model Metadata: [`ml/model_metadata.json`](ml/model_metadata.json)
* Dataset Audit & Checksum: [`reports/data_audit.md`](reports/data_audit.md)
* Verified 5-Fold Metrics: [`reports/phase2_integrity_audit/verified_metrics.csv`](reports/phase2_integrity_audit/verified_metrics.csv)
* Discrepancy Reconciliation: [`reports/phase2_integrity_audit/discrepancy_summary.csv`](reports/phase2_integrity_audit/discrepancy_summary.csv)
* Ensemble Evaluation: [`reports/ensemble_evaluation/evaluation_summary.md`](reports/ensemble_evaluation/evaluation_summary.md)
* Backend API Endpoints: [`backend/app.py`](backend/app.py)
* Pydantic Schemas: [`backend/schemas.py`](backend/schemas.py)
* Pinned Dependencies: [`requirements.txt`](requirements.txt)
* 3D Anatomical Canvas: [`frontend/src/components/CoronaryResultsCanvas.tsx`](frontend/src/components/CoronaryResultsCanvas.tsx)
* Clinical Wizard: [`frontend/src/components/wizard/PatientProfileWizard.tsx`](frontend/src/components/wizard/PatientProfileWizard.tsx)
* Assessment State & Tabs: [`frontend/src/components/workspace/CardioVisionWorkspace.tsx`](frontend/src/components/workspace/CardioVisionWorkspace.tsx)

### 13.3 Local Reproduction Instructions
```powershell
# 1. Backend Inference Service Setup & Launch
python -m venv .venv
.venv\Scripts\activate      # Windows PowerShell
# source .venv/bin/activate  # macOS / Linux
pip install -r requirements.txt
uvicorn backend.app:app --host 127.0.0.1 --port 8000

# 2. Frontend Development Client Setup & Launch
cd frontend
npm install
npm run dev

# 3. Test Suite Verification
python ml/test_pipeline.py
pytest backend/tests/test_api.py backend/tests/test_explainability.py
cd frontend && npm run build
```
