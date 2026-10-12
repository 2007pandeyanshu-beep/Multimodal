# CardioVision AI — Phase 4.4: Defensive Audit of SHAP Explainability and PDF Reporting

## 1. Executive Summary & Audit Preflight Verification

| Audit Preflight Item | Required Value | Measured Value | Verification Result |
| :--- | :--- | :--- | :--- |
| **Repository Root** | `D:\Multimodal` | `D:\Multimodal` | **PASS** |
| **Active Git Branch** | `person-a-ml-backend` | `person-a-ml-backend` | **PASS** |
| **Exact Commit HEAD** | `a5876e7958a354e9bc10195ac62f43b8a8191e2f` | `a5876e7958a354e9bc10195ac62f43b8a8191e2f` | **PASS** |
| **Read-Only Invariant** | Zero Git mutations | Zero commits, pushes, stashes, checkouts, or cleans | **PASS** |
| **Audit Protocol** | Read-Only Defensive Audit | Independent evaluation against actual code, models, tests, runtime | **COMPLETED** |

### Working-Tree Status Inventory
Inspection of `git status --short` confirmed 14 modified tracked files and all untracked project files/directories have been strictly preserved:
- **Tracked Modified Files:** `backend/app.py`, `backend/model_loader.py`, `backend/schemas.py`, `frontend/package-lock.json`, `frontend/package.json`, `frontend/src/App.tsx`, `frontend/src/components/Header.tsx`, `frontend/src/components/HeartCanvas.tsx`, `frontend/src/components/PatientAssessmentForm.tsx`, `frontend/src/components/PatientAssessmentModal.tsx`, `frontend/src/components/ScanningFrame.tsx`, `frontend/src/index.css`, `frontend/tsconfig.app.json`, `ml/transformers.py`.
- **Untracked Directories & Artifacts:** `backend/tests/test_explainability.py`, `frontend/.env.example`, `frontend/public/models/`, `frontend/src/api/`, `frontend/src/components/`, `reports/`, `verify_pdf_render.py`.
- **Zero Modifications Executed:** In compliance with Phase 4.4 rules, no source files, configuration files, model artifacts, or test files were modified or deleted.

---

## 2. High-Level Audit Scorecard

| Critical Audit Area | Primary Verification Target | Audit Outcome |
| :--- | :--- | :---: |
| **Audit A: SHAP Baseline Integrity** | Explainer `expected_value` vs Phase 4.3 report claims | **FAIL (Documentation)** / **PASS (Implementation)** |
| **Audit A: Mathematical Additivity** | $\text{base\_value} + \sum \phi_i = \hat{p}(x)$ across 303 patients | **PASS** ($\max \Delta < 8 \times 10^{-16}$) |
| **Audit A: Feature Aggregation** | 95 transformed columns $\to$ 54 canonical features sum preservation | **PASS** ($\max \text{diff} < 2 \times 10^{-16}$) |
| **Audit B: Methodology Consistency** | Path-dependent TreeSHAP in probability space $[0.0, 1.0]$ | **PASS** |
| **Audit B: Global vs Local Parity** | Shared explainer instances, feature mapping, and class index | **PASS** |
| **Audit B: Input Validation & Errors** | Rejection of empty/duplicate/invalid targets and malformed payloads | **PASS** |
| **Audit C: PDF Page Count Requirement** | Original 1-page A4 requirement vs actual rendered output | **FAIL** (Actual: 2 Pages) |
| **Audit C: PDF Visual & Text Legibility** | No text clipping, overlapping, or unreadable fonts | **PASS** |
| **Audit D: State Integrity & Provenance** | Phase 3C.2.3 demo preset edit clearance and session isolation | **PASS** |
| **Audit D: Async Race Condition Guards** | Stale responses discarded via `currentSessionIdRef` | **PASS** |
| **Audit E: Backend Test Suite** | `pytest backend/tests/ -v` (32 tests) | **PASS** (32/32 Passed) |
| **Audit E: ML Pipeline Test Suite** | `python ml/test_pipeline.py` (6 tests) | **PASS** (6/6 Passed) |
| **Audit E: Frontend Test Suite** | `npx tsx --test src/api/__tests__/*.test.ts` (98 tests) | **FAIL (1 Test Regressed)** (97/98 Passed) |
| **Audit E: Production Build** | `npm run build` (`tsc -b && vite build`) | **PASS** (Built in 525ms, 0 errors) |

---

## 3. Critical Audit A: SHAP Baseline Integrity Investigation

### 3.1 The Four-Target SHAP Baseline Audit Matrix

The table below reconciles the Phase 4.3 reported values against actual model artifacts, runtime extraction, and cohort statistics on the Tehran Heart Center cohort ($N=303$):

| Target Vessel | Phase 4.3 Reported Baseline | Actual Explainer Expected Value ($E[f(x)]$) | Actual Dataset Prevalence | Mean Predicted Probability | Output Space & Positive Class | Max Measured Additivity Discrepancy ($\Delta$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cath** | `0.7129` | **`0.499109`** | `0.712871` (216 / 303) | `0.608004` (60.8%) | Probability (`pos_idx=1`, `classes_=[0, 1]`) | **$6.66 \times 10^{-16}$** |
| **LAD** | `0.5842` | **`0.497459`** | `0.584158` (177 / 303) | `0.525328` (52.5%) | Probability (`pos_idx=1`, `classes_=[0, 1]`) | **$5.55 \times 10^{-16}$** |
| **LCX** | `0.3927` | **`0.494125`** | `0.392739` (119 / 303) | `0.466801` (46.7%) | Probability (`pos_idx=1`, `classes_=[0, 1]`) | **$5.55 \times 10^{-16}$** |
| **RCA** | `0.3762` | **`0.500924`** | `0.376238` (114 / 303) | `0.466323` (46.6%) | Probability (`pos_idx=1`, `classes_=[0, 1]`) | **$7.77 \times 10^{-16}$** |

### 3.2 Root Cause of the Phase 4.3 Baseline Discrepancy
1. **The Discrepancy:** The Phase 4.3 completion report (`reports/phase4_3_local_shap_integration_report.md` Section 2) claimed the baseline values were: Cath `0.7129`, LAD `0.5842`, LCX `0.3927`, and RCA `0.3762`.
2. **Identification of Provenance:** Comparing these numbers with `data/processed/cad_clean.csv` and `reports/phase2_integrity_audit/verified_metrics.csv` reveals that:
   - `216 / 303 = 0.712871` $\to$ **`0.7129` is the exact positive-class prevalence of Cath** in the dataset.
   - `177 / 303 = 0.584158` $\to$ **`0.5842` is the exact positive-class prevalence of LAD** in the dataset.
   - `119 / 303 = 0.392739` $\to$ **`0.3927` is the exact positive-class prevalence of LCX** in the dataset.
   - `114 / 303 = 0.376238` $\to$ **`0.3762` is the exact positive-class prevalence of RCA** in the dataset.
3. **Why the Explainer Expected Value is Near 0.50:**
   - The models were trained using scikit-learn's `RandomForestClassifier` with parameter `class_weight="balanced"`.
   - `class_weight="balanced"` weights samples inversely proportional to class frequencies:
     $$w_c = \frac{N}{2 \cdot N_c}$$
   - Because the root of each tree calculates splits based on weighted samples, the weighted class distribution at the root of every tree is exactly $50\% / 50\%$.
   - In tree-path-dependent TreeSHAP without background data (`shap.TreeExplainer(classifier)`), the unconditional expected value $E[f(x)]$ is calculated directly from the weighted leaf probabilities across all trees, yielding values within $\pm 0.006$ of $0.5000$:
     - Cath: `0.499109`
     - LAD: `0.497459`
     - LCX: `0.494125`
     - RCA: `0.500924`
4. **Implementation Integrity Assessment:**
   - In `backend/model_loader.py` line 249:
     ```python
     base_val = float(explainer.expected_value[pos_class_idx])
     ```
   - In `backend/app.py` line 261, `base_val` is passed directly into the API response schema.
   - In `frontend/src/components/workspace/PredictionOverviewView.tsx` line 301, the UI reads `targetExpl.base_value` directly from the backend response.
   - In `frontend/src/components/workspace/AssessmentReportView.tsx` line 484, the report reads `expl.base_value` directly from the backend response.
   - In `reports/test_assessment_report.pdf`, the printed text confirms: `Cath: P=55.9% | Prior=49.9%`.
   - **Conclusion:** The codebase and runtime **NEVER used `0.7129`**. The backend and frontend have always executed with the genuine TreeSHAP expected value `0.4991` ($49.9\%$). The discrepancy was strictly a **human documentation error in the Phase 4.3 markdown report**, where the author mistook the dataset prevalence column for the model baseline prior.

### 3.3 Additivity Verification Across All 303 Cohort Patients
To independently audit whether additivity holds beyond the test fixtures, a batch evaluation script was executed across all 303 patients in `cad_clean.csv` for all 4 targets (1,212 individual inferences):
- **Cath:** $\max \Delta = 6.66 \times 10^{-16}$
- **LAD:** $\max \Delta = 5.55 \times 10^{-16}$
- **LCX:** $\max \Delta = 5.55 \times 10^{-16}$
- **RCA:** $\max \Delta = 7.77 \times 10^{-16}$

**Finding:** In all 1,212 instances, additivity holds to IEEE 754 floating point machine precision ($< 10^{-15}$). If the Phase 4.3 reported prevalence value ($0.7129$) had been used in the mathematical formula, additivity would have catastrophically failed by up to $21.38$ percentage points ($0.2138$).

### 3.4 Aggregation from 95 Transformed Columns to 54 Canonical Features
- The preprocessing pipeline expands 54 clinical inputs into 95 numerical and one-hot encoded columns.
- `model_loader.py` builds an exact index map `feature_index_to_canonical` at startup.
- Evaluated across all 303 patients, the maximum difference between the sum of the 95 raw SHAP values and the sum of the 54 aggregated canonical contributions was:
  $$\max \left| \sum_{j=1}^{95} \phi_j^{\text{raw}} - \sum_{i=1}^{54} \phi_i^{\text{canonical}} \right| \le 1.67 \times 10^{-16}$$
- **Finding:** Canonical aggregation strictly preserves the attribution sum without information loss.

---

## 4. Critical Audit B: Global and Local SHAP Methodology

### 4.1 Tree-Path-Dependent vs. Interventional TreeSHAP
- **Constructor Inspection (`backend/model_loader.py` line 95):**
  ```python
  explainer = shap.TreeExplainer(classifier)
  ```
- **Finding:** No background dataset argument (`data=...`) is provided to `shap.TreeExplainer`.
- Under the official SHAP API specification, omitting `data` forces TreeExplainer to execute the **tree-path-dependent conditional perturbation algorithm** (using internal node sample covers to traverse splits).
- An interventional TreeSHAP explainer requires passing background samples: `TreeExplainer(classifier, data=X_background, feature_perturbation="interventional")`.
- Therefore, claims of "interventional TreeSHAP" (found in historical report `reports/phase4_2_global_shap_ui_report.md` line 44) were inaccurate terminology. The implemented engine is **100% tree-path-dependent TreeSHAP**.

### 4.2 Local vs. Global Architecture Parity
Inspection of `backend/model_loader.py`:
- `explain_single()` (local endpoint `POST /predict/explain`) and `_compute_global_shap_internal()` (global endpoint `GET /explain/global`) use the exact same cached `self.explainers[target]` instances.
- Both use identical pipeline preprocessors (`pipe.named_steps["preprocessor"].transform()`).
- Both extract the positive class index dynamically via `list(clf.classes_).index(1)`.
- Both aggregate to canonical features using the exact same mapping `feature_index_to_canonical`.
- **Finding:** Local and global explainability share identical mathematical definitions, output spaces ($[0.0, 1.0]$), and feature attribution spaces.

### 4.3 Input Validation & Error Handling
Inspection of `backend/schemas.py` and `backend/app.py`:
- **Empty Targets:** `targets: []` is caught by `ExplainRequest.validate_targets` and returns HTTP 422 with `"Target list cannot be empty"`.
- **Invalid Targets:** Specifying an unlisted target (e.g., `["Cath", "Aorta"]`) returns HTTP 422 with `"Invalid target 'Aorta'"`.
- **Duplicate Targets:** Specifying `["Cath", "Cath"]` returns HTTP 422 with `"Duplicate target 'Cath' found"`.
- **Target Leakage:** Submitting forbidden target columns (`Cath`, `CAD`, `LAD`, `LCX`, `RCA`, `Exertional CP`) in the patient input payload triggers Pydantic `extra="forbid"` and returns HTTP 422.
- **Unseen Categoricals:** `OneHotEncoder(handle_unknown='ignore')` in `ml/transformers.py` prevents pipeline crashes on unseen levels during inference, while Pydantic `Literal` schemas reject non-standard literals at the API boundary.

### 4.4 Clinical Boundary & Causality Disclosures
Inspection of UI components (`PredictionOverviewView.tsx` lines 395-397, `AssessmentReportView.tsx` lines 841-843, and `backend/schemas.py` line 132):
- Explicit disclaimer: *"Contributions indicate directional model shifts in percentage-point units (pp) relative to baseline prior. They reflect correlational tree attributions, NOT causal biological risk or protective medical factors."*
- **Finding:** The UI and API strictly avoid implying biological etiology or clinical causality.

---

## 5. Critical Audit C: PDF Report and Original Requirement

### 5.1 One-Page Requirement vs. Actual Output
- **Original Requirement:** A one-page A4 PDF clinical report.
- **Phase 4.3 Claim:** Delivered a two-page PDF as a "readability tradeoff".
- **Independent Measurement via PyMuPDF on `reports/test_assessment_report.pdf`:**
  - **Actual Page Count:** **2 Pages** (Original requirement: **FAIL**).
  - **Page Dimensions:** $594.96 \times 841.92\text{ pt}$ ($8.26 \times 11.69\text{ inches}$ / standard ISO A4 portrait).

### 5.2 Layout Breakdown & Page-Spill Root Cause
1. **Page 1 Content Analysis:**
   - Vertical content span: $y = 23.7\text{ pt}$ to $y = 770.4\text{ pt}$ (out of $841.92\text{ pt}$ page height).
   - Remaining vertical space on Page 1: $841.92 - 770.4 = \mathbf{71.52\text{ pt}}$ (approx. $25\text{ mm}$).
   - Elements on Page 1: Masthead, Telemetry Bar, Executive Decision Table, Section 3.5 Multi-Target TreeSHAP Grid ($2 \times 2$ grid), and 3-Item Clinical Interpretation Note.
2. **Page 2 Content Analysis:**
   - Vertical content span: $y = 29.3\text{ pt}$ to $y = 203.2\text{ pt}$.
   - Elements on Page 2: Methodology Disclosures, 5-Fold Cross-Validation Protocol, BodyParts3D License Attribution, Statutory Clinical Notice, and Execution Footer.
   - Vertical height of Page 2 content block: $173.9\text{ pt}$.
3. **Why Page 2 is Generated:**
   - Section 6 (Methodology Disclosures) in `AssessmentReportView.tsx` line 1004 has CSS class `print-break-inside-avoid`.
   - The disclosures card requires $173.9\text{ pt}$ of vertical space, but Page 1 only has $71.52\text{ pt}$ remaining after Section 3.5.
   - Because of `break-inside: avoid`, the browser's print layout engine moves the entire card to Page 2 rather than splitting it across the bottom margin.
4. **Evaluation of the Tradeoff:**
   - **Legibility:** Page 1 and Page 2 are visually clean, with no overlapping text, clipped borders, or distorted fonts (10pt base body, 7–8pt table cells).
   - **Tradeoff:** To compress the report into a single page, the application would need to either:
     a. Omit the multi-target TreeSHAP attribution grid from the print layout; or
     b. Condense typography below legible clinical standards ($< 6\text{pt}$), which violates medical accessibility guidelines.
   - **Defensive Verdict:** While the visual output is high quality and readable, the **strict 1-page requirement is NOT satisfied**.

---

## 6. Critical Audit D: State Integrity and Assessment Provenance

### 6.1 Demo-Preset State Transition Verification (Phase 3C.2.3 Fix)
Audited against `PatientProfileWizard.tsx` lines 85-98, 167-179, and `phase3c23DemoStateIntegrity.test.ts`:
1. **Untouched Demo Presets:**
   - Loading preset sets `activeDemoPreset = preset`.
   - Submitting without edits calls `computeAssessmentSessionMeta(preset)`, yielding `isSyntheticDemo: true`, `demoPresetName: preset.name`, and a session ID starting with `DEMO-`.
2. **Field Edit Clearance:**
   - Any user edit triggers `applyWizardFieldChange()`, which unconditionally sets `nextPreset: null`.
   - `handleFieldChange()` immediately updates `activeDemoPreset` to `null`.
   - Submitting after editing calls `computeAssessmentSessionMeta(null)`, yielding `isSyntheticDemo: false`, `demoPresetName: undefined`, and a session ID starting with `ASMT-`.
3. **Genuinely Blank Reset:**
   - Clicking "Reset" sets form data to `EMPTY_WIZARD_DATA` (54 empty strings).
   - Clears `sessionStorage` (`clearActiveAssessment()`).
   - Clears in-memory SHAP cache (`clearExplanationMemoryCache()`).
   - Clears draft from `localStorage` (`DRAFT_STORAGE_KEY`).

### 6.2 Asynchronous Race Condition & Stale Cache Protection
Audited against `frontend/src/api/usePatientExplanation.ts` lines 64-121:
- `usePatientExplanation` tracks `currentSessionIdRef.current = activeAssessment?.sessionId`.
- In-memory cache is indexed strictly by `activeAssessment.sessionId`.
- When an asynchronous response returns from `POST /predict/explain`, the hook checks:
  ```typescript
  if (currentSessionIdRef.current === sessId) { ... }
  ```
- If the user submitted a new assessment or navigated away before the API request completed, the stale response is dropped and never updates state.
- Explanations are **never stored in `localStorage`**, ensuring zero cross-session storage leakage.

---

## 7. Critical Audit E: Tests, Build, and Verification Outcomes

### 7.1 Backend Test Execution (`pytest backend/tests/ -v`)
- **Command:** `pytest backend/tests/ -v`
- **Result:** **32 PASSED**, 0 FAILED (6.19 seconds).
- **Coverage:** API health, schema validations, batch prediction bounds, explainer initialization, positive class index explicit extraction, additivity discrepancy ($\Delta < 10^{-5}$), target filtering, concurrency/thread safety, global SHAP endpoint contract.

### 7.2 ML Pipeline Test Execution (`python ml/test_pipeline.py`)
- **Command:** `python ml/test_pipeline.py`
- **Result:** **6 PASSED**, 0 FAILED (0.50 seconds).
- **Coverage:** Model artifact existence, forbidden feature exclusion (zero leakage), fresh joblib pipeline predictions, probability calibration $[0, 1]$, string-casting robustness, deterministic bit-for-bit inference.

### 7.3 Frontend Test Suite Execution (`npx tsx --test src/api/__tests__/*.test.ts`)
- **Command:** `npx tsx --test src/api/__tests__/*.test.ts` (executed from `frontend/`)
- **Result:** **97 PASSED**, **1 FAILED** (98 tests across 20 suites, 1.55 seconds).
- **Analysis of the Failing Test:**
  - **Failing Test:** `src/api/__tests__/phase3c1Navigation.test.ts:143:3` — *"6. Verifies ModelReviewView displays validated Tehran benchmarks and honest explainability placeholders"*.
  - **Failure Details:**
    ```
    AssertionError [ERR_ASSERTION]: Must provide honest SHAP placeholder
    at phase3c1Navigation.test.ts:159:12
    ```
  - **Root Cause:** In Phase 3C.1, `ModelReviewView.tsx` contained a literal placeholder string: `"TreeSHAP Waterfall Visualization Placeholder — Pending Phase 4"`. In Phase 4.2, this placeholder was replaced with the real, live global SHAP visualization (`fetchGlobalShapSummary()`). The historical Phase 3C.1 test asserted the existence of the outdated placeholder string, causing a test regression when real explainability was implemented.
  - **Action:** Under the read-only mandate, the test was NOT edited. Documented as a test suite regression.

### 7.4 Frontend Production Build (`npm run build`)
- **Command:** `npm run build` (`tsc -b && vite build`)
- **Result:** **PASS** (Zero TypeScript compilation errors, built in 525ms).

---

## 8. Deficiencies & Audit Findings Ordered by Severity

### 1. High Severity: Phase 4.3 Documentation Conflation of Dataset Prevalence with SHAP Baseline Prior
- **Classification:** Documentation & Metric Integrity Error.
- **Location:** `reports/phase4_3_local_shap_integration_report.md` Section 2.
- **Finding:** The report table documented the SHAP baseline values as Cath `0.7129`, LAD `0.5842`, LCX `0.3927`, and RCA `0.3762`. These numbers are the positive-class dataset prevalences in `cad_clean.csv`, not the model explainer expected values.
- **Mitigating Factor:** The backend code and frontend UI were implemented correctly using `explainer.expected_value` (`0.4991`, `0.4975`, `0.4941`, `0.5009`), and mathematical additivity holds to machine precision. The defect was entirely confined to the written documentation.

### 2. Medium Severity: Original One-Page A4 PDF Export Requirement Not Satisfied
- **Classification:** Requirements Non-Compliance (Visual Design Tradeoff).
- **Location:** `reports/test_assessment_report.pdf`, `frontend/src/components/workspace/AssessmentReportView.tsx`.
- **Finding:** The exported PDF document is 2 pages long. Section 3.5 (the multi-target TreeSHAP summary grid) occupies significant vertical space on Page 1, forcing Section 6 (Methodology Disclosures) onto Page 2 due to `print-break-inside-avoid`.
- **Mitigating Factor:** The 2-page document is well-formatted, completely legible, and contains all necessary clinical and statutory disclosures without clipping.

### 3. Low Severity: Regressed Unit Test in `phase3c1Navigation.test.ts`
- **Classification:** Test Suite Maintenance Defect.
- **Location:** `frontend/src/api/__tests__/phase3c1Navigation.test.ts` lines 159-162.
- **Finding:** Test 6 asserts the exact string `"TreeSHAP Waterfall Visualization Placeholder — Pending Phase 4"`, which was legitimately removed when Phase 4.2 implemented real global SHAP.
- **Mitigating Factor:** All 97 other frontend tests and all 38 backend/ML tests pass.

---

## 9. Limitations & Unverified Claims

1. **Physical Paper Printout:** PDF output was verified via Chrome DevTools Protocol headless emulation (`Page.printToPDF`) and PyMuPDF vector inspection. Real-world rendering on physical laser or inkjet printers with varying hardware margins was not physically tested.
2. **External Population Generalization:** The models, baselines, and priors are calibrated exclusively on the single-center Tehran Heart Center cohort ($N=303$). Generalization to other demographic cohorts cannot be evaluated without external datasets.

---

## 10. Recommended Next Phase Actions (Phase 4.5 Scope)

1. **Update Historical Documentation:** Correct the baseline table in Phase 4.3 documentation to clearly distinguish dataset prevalence from the model's balanced TreeSHAP baseline prior.
2. **Update Test Suite Expectation:** In `frontend/src/api/__tests__/phase3c1Navigation.test.ts`, update Test 6 to assert the active global SHAP container rather than the historical Phase 3 placeholder string.
3. **Evaluate One-Page PDF Layout Options:** If strict single-page PDF output is mandatory, provide a user-selectable print mode toggle:
   - *Option A (Default):* Full 2-Page Executive Clinical Dossier (with SHAP attribution grid and full disclosures).
   - *Option B:* Ultra-Compact 1-Page Clinical Summary (collapsing disclosures into a compact footnote block).

---

*Phase 4.4 Defensive Audit completed in strictly READ-ONLY mode. Zero Git mutations, zero code edits, and zero artifact overwrites were executed.*
