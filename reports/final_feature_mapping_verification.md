# CardioVision AI — Final Backend Feature-Mapping Verification Report

**Track A: Cardiovascular Risk Visualization & Prediction**  
**Working Branch:** `person-a-ml-backend`  
**Base Commit (HEAD Before & After):** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`  
**Audit Date:** 2026-10-11  

---

## 1. Executive Summary & Audit Scope

This report provides an empirical, evidence-based audit and targeted correction of the frontend Patient Profile Wizard's 54-feature mapping against:
1. The raw and cleaned training dataset (`extention of Z-Alizadeh sani dataset.xlsx` and `data/processed/cad_clean.csv`, N=303 records).
2. The dataset feature metadata (`data/processed/feature_metadata.csv`).
3. The machine learning pipeline preprocessing and encoders (`ml/transformers.py`, `ml/prepare_data.py`, `ml/train.py`).
4. The backend FastAPI request schemas (`backend/schemas.py`).
5. The frontend integration adapters and wizard components (`frontend/src/components/wizard/*`, `frontend/src/api/*`).

### Key Findings & Corrections
- **All 54 Features Verified**: Exactly 54 features are required by the backend inference pipeline (`PatientInput`), matching the 54 permitted features in `ml/transformers.py`.
- **BMI Definition Proven**: Across all 303 records in `cad_clean.csv`, `BMI` matches $\text{Weight (kg)} / (\text{Length (cm)} / 100)^2$ with a maximum float difference of $7.1 \times 10^{-15}$ (exact machine precision).
- **Obesity Threshold Disclosed**: Across all 303 records, the dataset's binary column `Obesity` has **0 discordances** with $\text{BMI} \ge 25.0 \text{ kg/m}^2$. In generic medical guidelines (WHO/CDC), BMI 25.0–29.9 indicates **Overweight**, whereas BMI $\ge 30.0$ indicates **Obesity**. The wizard UI and documentation were updated to clarify this dataset-specific threshold as **"Dataset Obesity / Overweight (BMI ≥ 25.0 kg/m²)"** rather than unqualified "Clinical Obesity".
- **Chest Pain 4-Way Partition Verified**: Empirical cross-tabulation of `cad_clean.csv` proves that all 303 patients partition into **exactly 4 mutually exclusive states** based on Diamond-Forrester criteria:
  1. Asymptomatic / None: `Typical Chest Pain = 0, Atypical = 'N', Nonanginal = 'N'` (30 records, 9.9%)
  2. Typical Angina: `Typical Chest Pain = 1, Atypical = 'N', Nonanginal = 'N'` (164 records, 54.1%)
  3. Atypical Angina: `Typical Chest Pain = 0, Atypical = 'Y', Nonanginal = 'N'` (93 records, 30.7%)
  4. Non-Anginal Pain: `Typical Chest Pain = 0, Atypical = 'N', Nonanginal = 'Y'` (16 records, 5.3%)
- **Zero Silent Defaults**: All 54 features initialize to strictly unset (`''`). Missing values block form submission and adapter payload compilation.

---

## 2. Files Inspected & Modified

### Inspected Sources of Truth
- `backend/schemas.py`: Pydantic request and response schemas.
- `backend/app.py`: FastAPI endpoints and CORS configuration.
- `backend/model_loader.py`: In-memory model manager and inference dispatch.
- `ml/transformers.py`: Pipeline preprocessor (`ColumnTransformer`, `StandardScaler`, `StringCastTransformer`, `OneHotEncoder`).
- `ml/prepare_data.py`: Dataset extraction, cleaning, and metadata export logic.
- `ml/train.py`: Model training hyperparameters, artifact serialization (`.joblib`).
- `data/processed/cad_clean.csv`: Cleaned dataset (303 rows, 59 columns).
- `data/processed/feature_metadata.csv`: Canonical feature dictionary (59 attributes).
- `frontend/src/api/types.ts`: TypeScript contracts for API and canonical inputs.
- `frontend/src/api/featureAdapter.ts`: Adapter transformations and cohort defaults.

### Modified Files (Targeted Corrections Only)
- `frontend/src/components/wizard/wizardMetadata.ts`: Refined `Obesity` label and derivation disclosure to document the dataset-specific BMI $\ge 25.0$ cutoff alongside WHO standards.
- `frontend/src/components/wizard/Step1Profile.tsx`: Updated `Obesity` card label to `"Dataset Obesity / Overweight (BMI ≥ 25.0 kg/m²)"` with explicit WHO distinction note.
- `frontend/src/components/wizard/Step2History.tsx`: Updated chest pain presentation card to clarify the 4-way dataset partition and Diamond-Forrester criteria with cohort record counts.
- `frontend/src/api/__tests__/wizardCompleteness.test.ts`: Added high-risk mapping verification tests for BMI calculation, dataset Obesity threshold boundaries, and 4-way chest pain partition.

---

## 3. Complete 54-Feature Mapping Table

The table below audits all 54 features accepted by `POST /predict`. Every feature is cross-verified against `data/processed/cad_clean.csv`, `backend/schemas.py`, and `frontend/src/components/wizard/wizardMetadata.ts`.

| # | Exact Backend Feature Name | Expected Data Type & Accepted Values | Frontend Source Field | Mapping / Transformation Applied | Classification | Evidence Supporting Mapping | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | `Age` | `float` (`[18, 120]`) | `age` | `Number(data.age)` | Directly Entered | `cad_clean.csv`: min=30, max=86; integer cast in pipeline | **Verified** |
| 2 | `Weight` | `float` (`[20.0, 300.0]`) | `weight` | `Number(data.weight)` | Directly Entered | `cad_clean.csv`: min=48.0, max=120.0 kg; float | **Verified** |
| 3 | `Length` | `float` (`[100.0, 250.0]`) | `length` | `Number(data.length)` | Directly Entered | `cad_clean.csv`: min=140.0, max=188.0 cm; float | **Verified** |
| 4 | `Sex` | `Literal['Female', 'Male']` | `sex` | `data.sex as 'Male' \| 'Female'` | Directly Entered | `cad_clean.csv`: ['Female', 'Male'] normalized from raw typo 'Fmale' | **Verified** |
| 5 | `BMI` | `float` (`[10.0, 80.0]`) | `bmi` | `Number(data.bmi)` | Deterministically Derived | $\text{Weight} / (\text{Length}/100)^2$; diff < 1e-14 in `cad_clean.csv` | **Verified** |
| 6 | `DM` | `Literal[0, 1]` | `dm` | `data.dm as 0 \| 1` | Directly Entered | `cad_clean.csv`: 0=No, 1=Yes Diabetes Mellitus | **Verified** |
| 7 | `HTN` | `Literal[0, 1]` | `htn` | `data.htn as 0 \| 1` | Directly Entered | `cad_clean.csv`: 0=No, 1=Yes Hypertension | **Verified** |
| 8 | `Current Smoker` | `Literal[0, 1]` | `currentSmoker` | `data.currentSmoker as 0 \| 1` | Directly Entered | `cad_clean.csv`: 0=No, 1=Yes Active Smoker | **Verified** |
| 9 | `EX-Smoker` | `Literal[0, 1]` | `exSmoker` | `data.exSmoker as 0 \| 1` | Directly Entered | `cad_clean.csv`: 0=No, 1=Yes Former Smoker (uppercase 'EX-') | **Verified** |
| 10 | `FH` | `Literal[0, 1]` | `fh` | `data.fh as 0 \| 1` | Directly Entered | `cad_clean.csv`: 0=No, 1=Yes Family History of CAD | **Verified** |
| 11 | `Obesity` | `Literal['Y', 'N']` | `obesity` | `data.obesity as 'Y' \| 'N'` | Deterministically Derived | `cad_clean.csv`: Y if BMI >= 25.0 (0 discordances in 303 rows) | **Verified** |
| 12 | `CRF` | `Literal['Y', 'N']` | `crf` | `data.crf as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Chronic Renal Failure | **Verified** |
| 13 | `CVA` | `Literal['Y', 'N']` | `cva` | `data.cva as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Cerebrovascular Accident / Stroke | **Verified** |
| 14 | `Airway disease` | `Literal['Y', 'N']` | `airwayDisease` | `data.airwayDisease as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Chronic Airway Disease (lowercase 'd') | **Verified** |
| 15 | `Thyroid Disease` | `Literal['Y', 'N']` | `thyroidDisease` | `data.thyroidDisease as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Thyroid Disease (uppercase 'D') | **Verified** |
| 16 | `CHF` | `Literal['Y', 'N']` | `chf` | `data.chf as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Congestive Heart Failure | **Verified** |
| 17 | `DLP` | `Literal['Y', 'N']` | `dlp` | `data.dlp as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Dyslipidemia | **Verified** |
| 18 | `BP` | `float` (`[50.0, 250.0]`) | `bp` | `Number(data.bp)` | Directly Entered | `cad_clean.csv`: min=90, max=190 mmHg Systolic Blood Pressure | **Verified** |
| 19 | `PR` | `float` (`[30.0, 220.0]`) | `pr` | `Number(data.pr)` | Directly Entered | `cad_clean.csv`: min=50, max=110 bpm Resting Pulse Rate | **Verified** |
| 20 | `Edema` | `Literal[0, 1]` | `edema` | `data.edema as 0 \| 1` | Directly Entered | `cad_clean.csv`: 0=No, 1=Yes Peripheral Edema | **Verified** |
| 21 | `Weak Peripheral Pulse` | `Literal['Y', 'N']` | `weakPeripheralPulse` | `data.weakPeripheralPulse as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Peripheral pulse deficit | **Verified** |
| 22 | `Lung rales` | `Literal['Y', 'N']` | `lungRales` | `data.lungRales as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Pulmonary crackles (lowercase 'r') | **Verified** |
| 23 | `Systolic Murmur` | `Literal['Y', 'N']` | `systolicMurmur` | `data.systolicMurmur as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Auscultated systolic murmur | **Verified** |
| 24 | `Diastolic Murmur` | `Literal['Y', 'N']` | `diastolicMurmur` | `data.diastolicMurmur as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Auscultated diastolic murmur | **Verified** |
| 25 | `Typical Chest Pain` | `Literal[0, 1]` | `typicalChestPain` | `data.typicalChestPain as 0 \| 1` | Deterministically Derived | `cad_clean.csv`: 1=Typical angina (164 records), 0=Other (139 records) | **Verified** |
| 26 | `Dyspnea` | `Literal['Y', 'N']` | `dyspnea` | `data.dyspnea as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Shortness of breath | **Verified** |
| 27 | `Function Class` | `Literal[0, 1, 2, 3]` | `functionClass` | `data.functionClass as 0 \| 1 \| 2 \| 3` | Directly Entered | `cad_clean.csv`: [0, 1, 2, 3] NYHA functional class | **Verified** |
| 28 | `Atypical` | `Literal['Y', 'N']` | `atypical` | `data.atypical as 'Y' \| 'N'` | Deterministically Derived | `cad_clean.csv`: 'Y' if atypical angina (93 records), 'N' otherwise | **Verified** |
| 29 | `Nonanginal` | `Literal['Y', 'N']` | `nonanginal` | `data.nonanginal as 'Y' \| 'N'` | Deterministically Derived | `cad_clean.csv`: 'Y' if non-anginal pain (16 records), 'N' otherwise | **Verified** |
| 30 | `LowTH Ang` | `Literal['Y', 'N']` | `lowthAng` | `data.lowthAng as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Low threshold angina at minimal exertion | **Verified** |
| 31 | `Q Wave` | `Literal[0, 1]` | `qWave` | `data.qWave as 0 \| 1` | Directly Entered | `cad_clean.csv`: 0=No, 1=Yes Pathological Q wave on ECG | **Verified** |
| 32 | `St Elevation` | `Literal[0, 1]` | `stElevation` | `data.stElevation as 0 \| 1` | Directly Entered | `cad_clean.csv`: 0=No, 1=Yes ST elevation on ECG | **Verified** |
| 33 | `St Depression` | `Literal[0, 1]` | `stDepression` | `data.stDepression as 0 \| 1` | Directly Entered | `cad_clean.csv`: 0=No, 1=Yes ST depression on ECG | **Verified** |
| 34 | `Tinversion` | `Literal[0, 1]` | `tinversion` | `data.tinversion as 0 \| 1` | Directly Entered | `cad_clean.csv`: 0=No, 1=Yes T-wave inversion (single word) | **Verified** |
| 35 | `LVH` | `Literal['Y', 'N']` | `lvh` | `data.lvh as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Left ventricular hypertrophy voltage signs | **Verified** |
| 36 | `Poor R Progression` | `Literal['Y', 'N']` | `poorRProgression` | `data.poorRProgression as 'Y' \| 'N'` | Directly Entered | `cad_clean.csv`: 'Y'/'N' Precordial R wave progression failure | **Verified** |
| 37 | `BBB` | `Literal['N', 'LBBB', 'RBBB']` | `bbb` | `data.bbb as 'N' \| 'LBBB' \| 'RBBB'` | Directly Entered | `cad_clean.csv`: ['N', 'LBBB', 'RBBB'] bundle branch block | **Verified** |
| 38 | `FBS` | `float` (`[20.0, 800.0]`) | `fbs` | `Number(data.fbs)` | Directly Entered | `cad_clean.csv`: min=62.0, max=400.0 mg/dL Fasting Blood Sugar | **Verified** |
| 39 | `CR` | `float` (`[0.1, 15.0]`) | `cr` | `Number(data.cr)` | Directly Entered | `cad_clean.csv`: min=0.5, max=2.2 mg/dL Serum Creatinine | **Verified** |
| 40 | `TG` | `float` (`[10.0, 2000.0]`) | `tg` | `Number(data.tg)` | Directly Entered | `cad_clean.csv`: min=37.0, max=1050.0 mg/dL Serum Triglycerides | **Verified** |
| 41 | `LDL` | `float` (`[5.0, 500.0]`) | `ldl` | `Number(data.ldl)` | Directly Entered | `cad_clean.csv`: min=18.0, max=232.0 mg/dL LDL Cholesterol | **Verified** |
| 42 | `HDL` | `float` (`[5.0, 200.0]`) | `hdl` | `Number(data.hdl)` | Directly Entered | `cad_clean.csv`: min=15.9, max=111.0 mg/dL HDL Cholesterol | **Verified** |
| 43 | `BUN` | `float` (`[1.0, 150.0]`) | `bun` | `Number(data.bun)` | Directly Entered | `cad_clean.csv`: min=6.0, max=52.0 mg/dL Blood Urea Nitrogen | **Verified** |
| 44 | `ESR` | `float` (`[0.0, 150.0]`) | `esr` | `Number(data.esr)` | Directly Entered | `cad_clean.csv`: min=1.0, max=90.0 mm/hr Erythrocyte Sed Rate | **Verified** |
| 45 | `HB` | `float` (`[3.0, 25.0]`) | `hb` | `Number(data.hb)` | Directly Entered | `cad_clean.csv`: min=8.9, max=17.6 g/dL Hemoglobin | **Verified** |
| 46 | `K` | `float` (`[1.0, 10.0]`) | `k` | `Number(data.k)` | Directly Entered | `cad_clean.csv`: min=3.0, max=6.6 mEq/L Serum Potassium | **Verified** |
| 47 | `Na` | `float` (`[90.0, 180.0]`) | `na` | `Number(data.na)` | Directly Entered | `cad_clean.csv`: min=128.0, max=156.0 mEq/L Serum Sodium | **Verified** |
| 48 | `WBC` | `float` (`[500.0, 50000.0]`) | `wbc` | `Number(data.wbc)` | Directly Entered | `cad_clean.csv`: min=3700, max=18000 cells/mcL White Blood Cells | **Verified** |
| 49 | `Lymph` | `float` (`[0.0, 100.0]`) | `lymph` | `Number(data.lymph)` | Directly Entered | `cad_clean.csv`: min=7, max=60 % Lymphocyte differential | **Verified** |
| 50 | `Neut` | `float` (`[0.0, 100.0]`) | `neut` | `Number(data.neut)` | Directly Entered | `cad_clean.csv`: min=32, max=89 % Neutrophil differential | **Verified** |
| 51 | `PLT` | `float` (`[5.0, 1500.0]`) | `plt` | `Number(data.plt)` | Directly Entered | `cad_clean.csv`: min=25, max=742 10³/mcL Platelet count | **Verified** |
| 52 | `EF-TTE` | `float` (`[5.0, 90.0]`) | `efTte` | `Number(data.efTte)` | Directly Entered | `cad_clean.csv`: min=15.0, max=60.0 % Transthoracic Ejection Fraction | **Verified** |
| 53 | `Region RWMA` | `Literal[0, 1, 2, 3, 4]` | `regionRwma` | `data.regionRwma as 0 \| 1 \| 2 \| 3 \| 4` | Directly Entered | `cad_clean.csv`: [0, 1, 2, 3, 4] Segmental wall motion score | **Verified** |
| 54 | `VHD` | `Literal['Normal', 'Mild', 'Moderate', 'Severe']` | `vhd` | `data.vhd as 'Normal' \| 'Mild' \| ...` | Directly Entered | `cad_clean.csv`: ['Normal', 'Mild', 'Moderate', 'Severe'] | **Verified** |

---

## 4. Specifically Verified High-Risk Features

### A. BMI and Obesity
1. **Mathematical Formula**:
   $$\text{BMI} = \frac{\text{Weight (kg)}}{(\text{Length (cm)} / 100)^2}$$
   - Testing against all 303 rows in `data/processed/cad_clean.csv` yields maximum discrepancy of $7.105 \times 10^{-15}$, confirming exact float computation.
2. **Dataset Obesity Cutoff**:
   - `Obesity == 'Y'` minimum BMI in training dataset: `25.0`
   - `Obesity == 'N'` maximum BMI in training dataset: `24.9108`
   - Discordances between `(BMI >= 25.0)` and `(Obesity == 'Y')`: **0 (100.0% match)**.
   - Discordances between `(BMI >= 30.0)` and `(Obesity == 'Y')`: **140**.
3. **Clinical Interpretation Disclosure**:
   - WHO and CDC guidelines define BMI 25.0–29.9 as **Overweight** and BMI $\ge 30.0$ as **Clinical Obesity**.
   - The original Z-Alizadeh Sani benchmark (2013, Tehran Heart Center) designated any patient with $\text{BMI} \ge 25.0$ as `Obesity = 'Y'`.
   - **Correction Implemented**: The frontend wizard now displays **"Dataset Obesity / Overweight (BMI ≥ 25.0 kg/m²)"** and includes an explicit note explaining the dataset cutoff vs WHO definitions, preventing misleading clinical claims.

### B. Chest Pain Features
1. **Dataset Representation**:
   - Features in dataset: `Typical Chest Pain`, `Atypical`, `Nonanginal`, and `Exertional CP`.
   - `Exertional CP` has zero variance in the dataset (100% `'N'` across all 303 records) and was excluded during pipeline preprocessing (`ml/transformers.py`) to prevent model instability.
2. **Mutually Exclusive 4-Way Partition**:
   - An exhaustive cross-tabulation of `cad_clean.csv` proves that `Typical Chest Pain`, `Atypical`, and `Nonanginal` form four disjoint subsets:
     - Asymptomatic: $(0, \text{'N'}, \text{'N'})$ ($N=30$)
     - Typical Angina: $(1, \text{'N'}, \text{'N'})$ ($N=164$)
     - Atypical Angina: $(0, \text{'Y'}, \text{'N'})$ ($N=93$)
     - Non-Anginal Pain: $(0, \text{'N'}, \text{'Y'})$ ($N=16$)
     - Other combinations: **0 records**
3. **Clinical Criteria Justification**:
   - The 4 categories are structured directly on standard Diamond-Forrester criteria (substernal discomfort, exertion/stress provoked, rest/nitroglycerin relieved).
   - **Correction Implemented**: UI labels were updated to explicitly display the 4 underlying category outcomes and cohort frequencies, avoiding unsubstantiated claims of clinical validation while maintaining complete empirical fidelity.

---

## 5. Test & Build Execution Evidence

All test suites and production builds were executed from clean working commands.

### 1. Wizard Completeness & Input Integrity Suite
```powershell
node --experimental-strip-types src/api/__tests__/wizardCompleteness.test.ts
```
**Output:**
```
▶ Input Integrity: Fresh Assessment State & Removal of Prefilled Defaults
  ✔ EMPTY_WIZARD_DATA must not contain arbitrary patient values (all 54 features blank) (0.7435ms)
  ✔ Fresh assessment strictly blocks advancement and submission via step validators (0.4408ms)
  ✔ adaptWizardDataToCanonical throws error if called with blank data, preventing silent default fills (0.5655ms)
✔ Input Integrity: Fresh Assessment State & Removal of Prefilled Defaults (2.6701ms)
▶ Synthetic Demo Presets Governance & Labeling
  ✔ All presets must be explicitly tagged as synthetic demo data with no misleading clinical validation claims (0.2411ms)
  ✔ Every demo preset compiles to a 100% valid 54-feature canonical payload (1.1912ms)
✔ Synthetic Demo Presets Governance & Labeling (1.671ms)
▶ 5-Step Wizard Feature Specification & Schema Completeness
  ✔ must contain exactly 54 feature specifications in the auditable matrix (0.164ms)
  ✔ must match every canonical feature in backend schema with zero omissions or extras (0.2771ms)
  ✔ must partition 54 features across Steps 1-4 with exact count distribution (0.1936ms)
  ✔ must define step metadata for all 5 wizard steps (0.108ms)
✔ 5-Step Wizard Feature Specification & Schema Completeness (0.9848ms)
▶ High-Risk Clinical Feature Mapping Verification
  ✔ verifies deterministic BMI calculation and dataset Obesity threshold boundary (0.3251ms)
  ✔ verifies that chest pain presentation strictly maps to the 4 mutually exclusive dataset partitions (0.1774ms)
✔ High-Risk Clinical Feature Mapping Verification (0.671ms)
▶ Draft Preservation & State Retention
  ✔ updating fields preserves all other entered fields without loss (0.1934ms)
✔ Draft Preservation & State Retention (0.2651ms)
▶ Step-by-Step Boundary Protections
  ✔ Step 1: flags invalid and out-of-range biometrics (0.1578ms)
  ✔ Step 2: requires valid symptom and comorbidity selections (0.0771ms)
  ✔ Step 3: flags out-of-range hemodynamic and laboratory values (0.1115ms)
  ✔ Step 4: flags out-of-range echocardiographic and ECG values (0.0793ms)
✔ Step-by-Step Boundary Protections (0.5347ms)
▶ Live Backend Inference Contract Verification
  ✔ submits complete synthetic demo payload to live backend and receives all 4 predictions (145.75ms)
✔ Live Backend Inference Contract Verification (145.8953ms)
ℹ tests 17, suites 7, pass 17, fail 0
```

### 2. Frontend Integration & Client Suites
- `featureAdapter.test.ts`: **6 passed, 0 failed**
- `client.test.ts`: **5 passed, 0 failed** (Live `/health`, `/metadata`, `/predict` integration)
- `resultsPresentation.test.ts`: **9 passed, 0 failed**
- **Total Frontend Test Count**: **37 passed, 0 failed**

### 3. Frontend Production Build
```powershell
npm run build
```
**Output:**
```
> cardiovision-ai@1.0.0 build
> tsc -b && vite build

vite v8.3.4 building client environment for production...
✓ 2478 modules transformed.
dist/index.html                     1.32 kB │ gzip:   0.77 kB
dist/assets/index-6PCFwN5I.css     59.47 kB │ gzip:  10.24 kB
dist/assets/index-a8GEESrQ.js   1,388.55 kB │ gzip: 368.42 kB
✓ built in 472ms
```

### 4. Backend Pytest Suite
```powershell
pytest backend/tests/test_api.py -v
```
**Output:**
```
======================= 20 passed, 11 warnings in 2.64s =======================
```

---

## 6. Remaining Blockers & Clinical Limitations

1. **No Unavailable Features**: All 54 canonical features required by the backend schema are available in the 5-step wizard interface.
2. **Honest Provenance Enforcement**:
   - 50 features are directly entered by the clinician.
   - 4 features are deterministically derived from entered values (`BMI`, `Obesity`, and chest pain combinations `Typical Chest Pain`, `Atypical`, `Nonanginal`).
   - No feature is silently filled using cohort medians, modes, or arbitrary heuristics.
3. **Dataset Scope Disclaimer**:
   - Models are trained on the single-center Tehran Heart Center cohort (N=303). Generalization to multi-ethnic populations requires prospective external validation. This research prototype disclaimer is visibly rendered on all inference outputs.

---

## 7. Working Tree & Git Safety Confirmation

- **Current Git Branch**: `person-a-ml-backend` (tracking `origin/person-a-ml-backend`).
- **Base Commit**: `a5876e7958a354e9bc10195ac62f43b8a8191e2f`.
- **Working Tree State**:
  - `M frontend/src/components/PatientAssessmentForm.tsx`
  - `M frontend/src/components/PatientAssessmentModal.tsx`
  - `M frontend/tsconfig.app.json`
  - `?? frontend/.env.example`
  - `?? frontend/src/api/`
  - `?? frontend/src/components/PredictionResultsView.tsx`
  - `?? frontend/src/components/wizard/`
  - `?? reports/git_collaboration_audit.md` (preserved untouched)
  - `?? reports/final_feature_mapping_verification.md` (this report)
- **Zero Destructive Changes**: No Git switch, reset, stash, commit, push, or clean operations were performed.
