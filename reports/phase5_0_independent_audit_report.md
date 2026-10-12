# CardioVision AI — Phase 5.0 Independent Audit Report

**Track A: Cardiovascular Risk Visualization & Prediction**  
**Repository Working Branch:** `person-a-ml-backend`  
**Base Commit / HEAD:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`  
**Audit Date:** 2026-10-12  
**Audit Scope:** Strictly Read-Only Independent Assessment of Phase 5.0 Feature Explorer & Clinical Learning Hub

---

## 1. Mandatory Preflight & Repository Integrity

### Preflight Verification Summary
- **Working Tree Path:** `D:\Multimodal`
- **Current Branch:** `person-a-ml-backend`
- **Exact HEAD SHA:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`
- **Preflight Verification Status:** **PASSED (100% match)**
- **Destructive Operation Safety:** Zero Git destructive operations performed (`no checkout`, `no reset`, `no clean`, `no stash`, `no stage`, `no commit`, `no push`). All existing modified files and untracked artifacts were preserved untouched.

---

## 2. Executive Summary of Audit Findings

The implementation of Phase 5.0 delivers a high-quality, fully responsive **Clinical Feature Explorer & Learning Hub** (`#feature-explorer`) as the fifth workspace destination. 

### Key Audit Verdicts
1. **Schema & Ordering Compliance (Verified)**: Exactly 54 canonical features are defined in `frontend/src/api/clinicalFeaturesData.ts`. Their names, aliases, Pydantic type constraints, and order strictly match `ml/transformers.py` (`CANONICAL_FEATURE_ORDER`) and `backend/schemas.py` (`PatientInput`).
2. **Numeric Distribution Accuracy (Verified)**: All 21 continuous numeric features match the empirical distributions in `data/processed/cad_clean.csv` ($N=303$) with 100% precision for Min, Max, Mean, and Median.
3. **Deterministic Derivations (Verified)**:
   - `BMI` matches the Quetelet formula across all 303 rows with a maximum float difference of $7.11 \times 10^{-15}$.
   - `Obesity` aligns with $\text{BMI} \ge 25.0 \text{ kg/m}^2$ with **0 discordances** across 303 rows.
   - Chest pain presentation partitions into **exactly 4 mutually exclusive states** based on Diamond-Forrester criteria with 0 outlier combinations.
4. **Range Provenance (Verified)**: The UI rigorously separates Schema-Permitted Validation Bounds (HTTP 422 constraints), Dataset-Observed Distributions ($N=303$), and Clinically Established Guidelines (ACC/AHA, ADA, ASE/EACVI, NCEP ATP III).
5. **Global TreeSHAP Integrity (Verified)**: Connects to `GET /explain/global`. Displays top-10 rankings for `Cath`, `LAD`, `LCX`, and `RCA`. Features outside the top 10 are transparently labeled as *"Outside Top 10 (unranked by endpoint)"*, strictly avoiding the false implication of zero importance.
6. **Navigation & SPA Decoupling (Verified)**: Destination 5 is integrated into `WorkspaceNavBar.tsx` and `CardioVisionWorkspace.tsx` without regressing the four existing destinations, the assessment wizard, or PDF report generation.
7. **Discrepancy Detected (Medium Severity)**: The narrative text notes (`clinicalReferenceNotes`) for several categorical features in `frontend/src/api/clinicalFeaturesData.ts` contain stale descriptive counts (e.g. `Sex` notes cite 224 males / 79 females instead of the actual 176 males / 127 females in `cad_clean.csv`).

---

## 3. Detailed Verification of Implementation

### 3.1. Authoritative 54 Canonical Features Matrix
- **Schema File:** `backend/schemas.py` (`PatientInput`, lines 11–81)
- **Pipeline Transformer:** `ml/transformers.py` (`CANONICAL_FEATURE_ORDER`, lines 15–35)
- **Metadata Module:** `frontend/src/api/clinicalFeaturesData.ts` (`CLINICAL_FEATURES`, lines 63–660)

**Audit Findings:**
- Total Feature Count: **54 (Exact)**
- Order Mismatches: **0**
- Missing Features: **0**
- Forbidden Feature Leaks: **0** (`Cath`, `LAD`, `LCX`, `RCA`, `Exertional CP` are strictly excluded from inputs).
- Required Status: All 54 features are strictly required (`Field(...)`). No silent defaults exist.

### 3.2. Verification of the Four Derived Inputs
1. **Body Mass Index (`BMI`)**:
   - Formula: $\text{Weight (kg)} / (\text{Length (cm)} / 100)^2$
   - Code: `frontend/src/components/wizard/Step1Profile.tsx` (lines 142–156), `frontend/src/api/featureAdapter.ts` (lines 428–430)
   - Discrepancy against `data/processed/cad_clean.csv`: $\max|\text{BMI}_{\text{actual}} - \text{BMI}_{\text{derived}}| = 7.1054 \times 10^{-15}$ across all 303 rows. **VERIFIED**.
2. **Dataset Obesity (`Obesity`)**:
   - Formula: $\text{BMI} \ge 25.0 \implies \text{'Y'}, \text{else } \text{'N'}$
   - Code: `frontend/src/components/wizard/wizardMetadata.ts` (line 103), `frontend/src/api/featureAdapter.ts` (line 434)
   - Discrepancy against `cad_clean.csv`: **0 discordances** across 303 rows.
   - Disclosure: UI notes clearly explain that $\text{BMI} \ge 25.0$ reflects the dataset benchmark convention, whereas WHO/CDC guidelines define 25.0–29.9 as Overweight and $\ge 30.0$ as Clinical Obesity. **VERIFIED**.
3. **Atypical Angina (`Atypical`) & Non-Anginal Discomfort (`Nonanginal`)**:
   - Formula: Derived from Diamond-Forrester 4-way presentation partition:
     - Asymptomatic: `Typical Chest Pain = 0`, `Atypical = 'N'`, `Nonanginal = 'N'` (30 records, 9.9%)
     - Typical Angina: `Typical Chest Pain = 1`, `Atypical = 'N'`, `Nonanginal = 'N'` (164 records, 54.1%)
     - Atypical Angina: `Typical Chest Pain = 0`, `Atypical = 'Y'`, `Nonanginal = 'N'` (93 records, 30.7%)
     - Non-Anginal Pain: `Typical Chest Pain = 0`, `Atypical = 'N'`, `Nonanginal = 'Y'` (16 records, 5.3%)
     - Other combinations: **0 records** (100.0% coverage of all 303 cohort patients). **VERIFIED**.

### 3.3. 3-Way Range Provenance & Statistical Integrity
All 21 continuous numeric features in `frontend/src/api/clinicalFeaturesData.ts` were cross-checked against `cad_clean.csv`:

| Feature | Schema Bounds | Dataset Min | Dataset Mean | Dataset Median | Dataset Max | Match Status |
|---|---|---|---|---|---|---|
| `Age` | [18, 120] | 30.0 | 58.90 | 58.00 | 86.0 | **Exact** |
| `Weight` | [20.0, 300.0] | 48.0 | 73.83 | 74.00 | 120.0 | **Exact** |
| `Length` | [100.0, 250.0] | 140.0 | 164.72 | 165.00 | 188.0 | **Exact** |
| `BMI` | [10.0, 80.0] | 18.12 | 27.25 | 26.78 | 40.90 | **Exact** |
| `BP` | [50.0, 250.0] | 90.0 | 129.55 | 130.00 | 190.0 | **Exact** |
| `PR` | [30.0, 220.0] | 50.0 | 75.14 | 70.00 | 110.0 | **Exact** |
| `FBS` | [20.0, 800.0] | 62.0 | 119.18 | 98.00 | 400.0 | **Exact** |
| `CR` | [0.1, 15.0] | 0.5 | 1.06 | 1.00 | 2.2 | **Exact** |
| `TG` | [10.0, 2000.0] | 37.0 | 150.34 | 122.00 | 1050.0 | **Exact** |
| `LDL` | [5.0, 500.0] | 18.0 | 104.64 | 100.00 | 232.0 | **Exact** |
| `HDL` | [5.0, 200.0] | 15.9 | 40.23 | 39.00 | 111.0 | **Exact** |
| `BUN` | [1.0, 150.0] | 6.0 | 17.50 | 16.00 | 52.0 | **Exact** |
| `ESR` | [0.0, 150.0] | 1.0 | 19.46 | 15.00 | 90.0 | **Exact** |
| `HB` | [3.0, 25.0] | 8.9 | 13.15 | 13.20 | 17.6 | **Exact** |
| `K` | [1.0, 10.0] | 3.0 | 4.23 | 4.20 | 6.6 | **Exact** |
| `Na` | [90.0, 180.0] | 128.0 | 141.00 | 141.00 | 156.0 | **Exact** |
| `WBC` | [500.0, 50000.0] | 3700.0 | 7562.05 | 7100.00 | 18000.0 | **Exact** |
| `Lymph` | [0.0, 100.0] | 7.0 | 32.40 | 32.00 | 60.0 | **Exact** |
| `Neut` | [0.0, 100.0] | 32.0 | 60.15 | 60.00 | 89.0 | **Exact** |
| `PLT` | [5.0, 1500.0] | 25.0 | 221.49 | 210.00 | 742.0 | **Exact** |
| `EF-TTE` | [5.0, 90.0] | 15.0 | 47.23 | 50.00 | 60.0 | **Exact** |

### 3.4. Preprocessing Descriptions
- **Continuous Numeric Features (21 features)**: Preprocessed via `StandardScaler(with_mean=True, with_std=True)` in `ml/transformers.py` (line 106).
- **Categorical Features (33 features)**: Preprocessed via `Pipeline([("to_str", StringCastTransformer()), ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False))])` in `ml/transformers.py` (lines 99–102).
- **Audit Finding**: Preprocessing documentation in `clinicalFeaturesData.ts` accurately describes these transformations.

### 3.5. Global SHAP Integration & Top-10 Policy
- **Endpoint**: `GET /explain/global`
- **Client**: `fetchGlobalShapSummary()` in `frontend/src/api/client.ts`
- **Targets**: `Cath`, `LAD`, `LCX`, `RCA`
- **Output Space**: Positive-class probability space $[0.0, 1.0]$
- **Audit Findings**:
  - Top-10 features per target are accurately displayed with rank, probability fraction, and percentage impact.
  - The 44 unranked features are clearly displayed as *"Outside top 10 (unreported by endpoint)"*.
  - An explicit notice discloses that unranked features possess non-zero attributions below the top-10 cutoff and are not zero.
  - Interactive selection allows clicking a SHAP feature to navigate directly to its catalogue specification.

### 3.6. Navigation & Workspace Integration
- **Route**: `#feature-explorer` (with recognized aliases `#features`, `#clinical-features`, `#feature-hub`, `#feature-catalogue`, `#learning-hub`).
- **NavBar**: Added as item 5 (`5. Feature Explorer`) with `BookOpen` icon, active indicator, and badge.
- **Master Workspace**: `CardioVisionWorkspace.tsx` coordinates all 5 destinations without breaking browser history, hash changes, or assessment session state.

---

## 4. Discrepancies and Bugs Identified

### Bug 1: Categorical Narrative Notes Discrepancy (Severity: Medium)
- **Location:** `frontend/src/api/clinicalFeaturesData.ts` (lines 133, 203, 290, 480, 513, 560, 642, 659)
- **Description:** While all numeric statistics (`datasetStats`) are 100% accurate, the free-text `clinicalReferenceNotes` for several categorical features contain numbers that diverge from the actual cleaned dataset `data/processed/cad_clean.csv`:
  1. `Sex`: Note states *"224 males (73.9%) and 79 females (26.1%)"*. Actual in `cad_clean.csv`: **176 Male (58.1%), 127 Female (41.9%)**. *(224 appears to have been copied from the CAD positive count of an external publication table).*
  2. `Obesity`: Note states *"53.1% (161/303)"*. Actual in `cad_clean.csv`: **211 positive (69.6%), 92 negative (30.4%)**.
  3. `DLP`: Note states *"66.0% (200/303)"*. Actual in `cad_clean.csv`: **112 positive (37.0%), 191 negative (63.0%)**.
  4. `Dyspnea`: Note states *"15.2% (46/303)"*. Actual in `cad_clean.csv`: **134 positive (44.2%), 169 negative (55.8%)**.
  5. `Function Class`: Note states *"Class 0 (54.5%), Class 1 (25.1%), Class 2 (19.8%), Class 3 (0.7%)"*. Actual in `cad_clean.csv`: **Class 0: 211 (69.6%), Class 2: 73 (24.1%), Class 3: 18 (5.9%), Class 1: 1 (0.3%)**.
  6. `LVH`: Note states *"15.2% (46/303)"*. Actual in `cad_clean.csv`: **20 positive (6.6%), 283 negative (93.4%)**.
  7. `Region RWMA`: Note states *"Score 0 (67.7%), Score 1 (8.6%), Score 2 (17.5%), Score 3 (5.3%), Score 4 (1.0%)"*. Actual in `cad_clean.csv`: **Score 0: 217 (71.6%), Score 2: 32 (10.6%), Score 1: 26 (8.6%), Score 4: 14 (4.6%), Score 3: 14 (4.6%)**.
  8. `VHD`: Note states *"Normal 68.0% (206), Mild 17.5% (53), Moderate 13.5% (41), Severe 1.0% (3)"*. Actual in `cad_clean.csv`: **Mild: 149 (49.2%), Normal: 116 (38.3%), Moderate: 27 (8.9%), Severe: 11 (3.6%)**.
- **Impact:** Misleading descriptive statistics rendered in the Detail Inspector under "Dataset-Observed Statistics" for categorical features. Numeric statistics and schema definitions are completely unaffected.
- **Recommended Minimal Fix:** Update the `clinicalReferenceNotes` strings in `frontend/src/api/clinicalFeaturesData.ts` to reflect the exact frequency counts from `cad_clean.csv`.

### Bug 2: Function Class Category Classification (Severity: Low)
- **Location:** `frontend/src/api/clinicalFeaturesData.ts` (line 499)
- **Description:** `Function Class` is classified under category `'Symptom'`, whereas `data/processed/feature_metadata.csv` (line 28) documents it as `'Clinical Status'`.
- **Impact:** Minor organizational inconsistency when filtering by category.
- **Recommended Minimal Fix:** Update category to `'Clinical Status'` (or add `'Clinical Status'` to `ClinicalCategory` type union).

---

## 5. Test & Build Execution Evidence

All test executions and builds were performed during the independent audit:

### 1. Dedicated Feature Explorer Suite
```powershell
node --experimental-strip-types src/api/__tests__/featureExplorer.test.ts
```
**Result:** **10 tests passed, 0 failed (16.2ms)**
- Test 1: Canonical 54-feature count and 1-to-1 schema correspondence: **PASSED**
- Test 2: Partitioning into 21 Numeric, 33 Categorical (29 Binary, 4 Multi-class): **PASSED**
- Test 3: Four deterministically derived features with verified mathematical rules: **PASSED**
- Test 4: 3-way range provenance (schema, observed, clinical): **PASSED**
- Test 5: Preprocessing pipeline match (`StandardScaler` vs `OneHotEncoder`): **PASSED**
- Test 6: Global SHAP target switching across Cath, LAD, LCX, RCA: **PASSED**
- Test 7: Transparent handling of top-10 limitation without zero attribution: **PASSED**
- Test 8: Hash routing `#feature-explorer` and aliases: **PASSED**
- Test 9: WorkspaceNavBar renders all 5 destinations: **PASSED**
- Test 10: CardioVisionWorkspace mounts FeatureExplorerView: **PASSED**

### 2. Frontend Regression Suites
```powershell
node --experimental-strip-types src/api/__tests__/phase3c1Navigation.test.ts
node --experimental-strip-types src/api/__tests__/featureAdapter.test.ts
node --experimental-strip-types src/api/__tests__/resultsPresentation.test.ts
```
**Result:** **22 tests passed, 0 failed** across all regression suites.

### 3. Production Build
```powershell
npm run build
```
**Result:**
```
vite v8.3.4 building client environment for production...
✓ 2549 modules transformed.
dist/index.html                     1.32 kB │ gzip:   0.77 kB
dist/assets/index-DC115wZ9.css    103.45 kB │ gzip:  15.86 kB
dist/assets/index-B3RSfwaV.js   1,708.09 kB │ gzip: 438.67 kB
✓ built in 808ms
```
**Status:** **PASSED (0 TypeScript errors, 0 bundling errors)**.

### 4. Backend Pytest Suite
```powershell
pytest backend/tests/ -v
```
**Result:** **32 passed, 28 warnings in 8.63s** (20 API tests, 12 TreeSHAP explainability tests).

---

## 6. Audit Conclusion & Compliance Verification

| Requirement | Audit Finding | Compliance Status |
|---|---|---|
| Exact 54 Canonical Features | 100% match with `backend/schemas.py` and `ml/transformers.py` | **VERIFIED** |
| 3-Way Range Distinction | Schema bounds, observed stats, and clinical guidelines strictly segregated | **VERIFIED** |
| BMI / Obesity / Chest Pain Derivations | Mathematically audited against 303 rows of `cad_clean.csv` | **VERIFIED** |
| Preprocessing Descriptions | `StandardScaler` (21 numeric) and `OneHotEncoder` (33 categorical) | **VERIFIED** |
| Global SHAP Integration | `GET /explain/global` across Cath, LAD, LCX, RCA; honest top-10 policy | **VERIFIED** |
| Destination 5 Navigation | `#feature-explorer` tab integrated without breaking 4 existing routes | **VERIFIED** |
| Categorical Frequency Notes | Discrepancy found in narrative text notes for categorical features (Bug 1) | **DISCREPANCY FLAGGED** |
| Production Build & Tests | 10/10 Phase 5.0 tests passed, 32/32 backend tests passed, Vite build clean | **VERIFIED** |

*In accordance with audit instructions, no code modifications have been made.*
