# Dataset Audit and Cleaning Report (Phase 1)
**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Author:** Person A (ML & Backend Lead)  
**Date:** October 2026  
**Status:** Validated & Submission-Ready  

---

## 1. Executive Summary & Provenance

This report documents the rigorous extraction, auditing, cleaning, and metadata specification of the coronary artery disease dataset for Track A.

* **Raw Dataset File:** `extention of Z-Alizadeh sani dataset.xlsx`
* **Raw File Preservation Path:** `data/raw/extention of Z-Alizadeh sani dataset.xlsx`
* **Verified SHA-256 Hash:** `739343245c2ba578b541370217531750d8e936022f928b83e0d91756caa3ff0b` (Identical before and after extraction)
* **Active Sheet:** `Sheet 1 - Table 1` (Contains 303 patient records across 59 attributes)
* **Secondary Sheet:** `Sheet 2` (Contains 1 header row of 100 attributes but 0 patient records; confirmed inactive)
* **Extraction Method:** Zero-dependency Python standard library (`zipfile` and `xml.etree.ElementTree`). Does not require `openpyxl` or external dependencies, ensuring 100% reproducibility across environments.

---

## 2. Verified Data Dimensions & Integrity Audit

| Metric | Raw Dataset | Cleaned Dataset (`cad_clean.csv`) |
| :--- | :--- | :--- |
| **Total Patient Records (Rows)** | 303 | 303 |
| **Total Features/Columns** | 59 | 59 |
| **Missing Values (Null / Empty / NaN)** | **0** (100% complete) | **0** (100% complete) |
| **Exact Duplicate Rows** | **0** | **0** |
| **Feature-Only Duplicate Rows** | **0** | **0** |
| **Allowed Model Input Features** | N/A | **54** |
| **Excluded Features** | N/A | **5** (4 targets + 1 zero-variance) |

### Verified Target Distributions ($N = 303$)
All 4 prediction tasks are binary classification targets:

1. **Overall CAD (`Cath`):**
   * `CAD`: 216 patients (71.3%)
   * `Normal`: 87 patients (28.7%)
2. **LAD Stenosis (`LAD`):**
   * `Stenotic`: 177 patients (58.4%)
   * `Normal`: 126 patients (41.6%)
3. **LCX Stenosis (`LCX`):**
   * `Stenotic`: 119 patients (39.3%)
   * `Normal`: 184 patients (60.7%)
4. **RCA Stenosis (`RCA`):**
   * `Stenotic`: 114 patients (37.6%)
   * `Normal`: 189 patients (62.4%)

---

## 3. Mandatory Target-Leakage & Feature Exclusion Policy

To ensure clinical validity and prevent target leakage, the following 5 columns are strictly excluded from model input matrices:

| Column Name | Category | Status | Rationale for Exclusion |
| :--- | :--- | :--- | :--- |
| **`Cath`** | Target | `is_allowed_input = False` | **Target Leakage:** Catheterization diagnosis is the overall outcome label and a post-angiography result. |
| **`LAD`** | Target | `is_allowed_input = False` | **Target Leakage:** Left Anterior Descending stenosis diagnosis is an outcome label and post-angiography result. |
| **`LCX`** | Target | `is_allowed_input = False` | **Target Leakage:** Left Circumflex stenosis diagnosis is an outcome label and post-angiography result. |
| **`RCA`** | Target | `is_allowed_input = False` | **Target Leakage:** Right Coronary Artery stenosis diagnosis is an outcome label and post-angiography result. |
| **`Exertional CP`** | Symptom | `is_allowed_input = False` | **Zero Variance:** Value is `'N'` for 303 out of 303 records (100%). Provides zero mutual information or discriminative value. |

> **Clinical Verification of Leakage:**  
> In 302 of 303 patients (99.7%), `Cath == CAD` if and only if at least one of LAD, LCX, or RCA is `Stenotic`. Feeding vessel stenosis into a CAD predictor or catheterization into a vessel predictor produces trivial, non-generalizable 99%+ accuracy based purely on data leakage.

The model input space is strictly constrained to the remaining **54 clinical, demographic, symptom, ECG, laboratory, and echocardiographic features**.

---

## 4. Cleaning Decisions & Documented Rationale

1. **Standardization of `Sex`:**
   * *Raw:* `Male`: 176, `Fmale`: 127
   * *Finding:* `Fmale` is a known typographic error originating in the 2013 UCI Z-Alizadeh Sani benchmark dataset publication (*Alizadeh Sani et al., Computer Methods and Programs in Biomedicine, 2013*).
   * *Decision:* Mapped `Fmale` $\rightarrow$ `Female` while preserving `Male`.
2. **Standardization of `VHD` (Valvular Heart Disease):**
   * *Raw:* `mild`: 149, `N`: 116, `Moderate`: 27, `Severe`: 11
   * *Finding:* Inconsistent casing (`mild` vs `Moderate` / `Severe`) and shorthand `N` for Normal / No VHD. Furthermore, mapping `N` to the literal string `"None"` causes default CSV readers like `pandas.read_csv()` to parse `"None"` as `NaN` (missing values).
   * *Decision:* Standardized to clinical title-case terminology consistent with other features in the dataset (`BBB: N` for Normal, `Cath: Normal`): `N` $\rightarrow$ `Normal`, `mild` $\rightarrow$ `Mild`, `Moderate` $\rightarrow$ `Moderate`, `Severe` $\rightarrow$ `Severe`. This eliminates casing inconsistency while guaranteeing 0 false nulls upon loading.
3. **Whitespace Normalization:**
   * Leading and trailing whitespaces across all textual attributes were stripped deterministically.
4. **Data Type Preservation:**
   * Numeric fields (`Age`, `BP`, `PR`, `FBS`, `CR`, `TG`, `LDL`, `HDL`, `BUN`, `ESR`, `HB`, `K`, `Na`, `WBC`, `Lymph`, `Neut`, `PLT`, `EF-TTE`, `Weight`, `Length`, `BMI`) are formatted as proper numeric representations.
   * Binary clinical flags (`DM`, `HTN`, `Current Smoker`, `EX-Smoker`, `FH`, `Edema`, `Typical Chest Pain`, `Q Wave`, `St Elevation`, `St Depression`, `Tinversion`) are maintained as clean `0` or `1` integers.
   * Ordinal scores (`Function Class`: 0–3, `Region RWMA`: 0–4) are maintained as clean integers.
5. **No Statistical Pre-learning (Leakage Prevention):**
   * In strict accordance with Phase 1 constraints, **no dataset-wide scaling, imputation, normalization, or target encoding was performed**. Those transformations will be executed solely inside cross-validation splits in Phase 2.

---

## 5. Clinical Observations & Ambiguities Noted

1. **Row 94 Vessel-Cath Discordance:**
   * Patient at row 94 has `LAD: Stenotic`, `LCX: Normal`, `RCA: Normal`, but `Cath: Normal`.
   * *Clinical context:* Mild or non-obstructive stenosis in a distal or diagonal branch may be noted during angiographic vessel inspection, but overall catheterization criteria for obstructive CAD may not have been met.
   * *Action:* Preserved as ground truth without modification.
2. **Low-Prevalence Clinical Features:**
   * `CHF` (Congestive Heart Failure): only 1 positive case (`Y: 1`, `N: 302`).
   * `LowTH Ang` (Low threshold angina): only 2 positive cases (`Y: 2`, `N: 301`).
   * `CVA` (Cerebrovascular accident): only 5 positive cases (`Y: 5`, `N: 298`).
   * `Weak Peripheral Pulse`: only 5 positive cases (`Y: 5`, `N: 298`).
   * `CRF` (Chronic renal failure): only 6 positive cases (`Y: 6`, `N: 297`).
   * `Thyroid Disease`: only 7 positive cases (`Y: 7`, `N: 296`).
   * *Action:* Preserved without synthetic fabrication. In Phase 2, tree-based models and stratified folds will naturally handle low-frequency splits without artificial oversampling.

---

## 6. Generated Deliverables

* [`data/raw/extention of Z-Alizadeh sani dataset.xlsx`](file:///D:/Multimodal/data/raw/extention%20of%20Z-Alizadeh%20sani%20dataset.xlsx): Exact raw Excel copy with verified SHA-256 hash.
* [`data/processed/cad_clean.csv`](file:///D:/Multimodal/data/processed/cad_clean.csv): Cleaned 303-record dataset with all 59 columns.
* [`data/processed/feature_metadata.csv`](file:///D:/Multimodal/data/processed/feature_metadata.csv): Exhaustive feature catalog specifying name, clinical category, data type, categorical status, cleaning rule, model input permission, and exclusion rationale.
* [`ml/prepare_data.py`](file:///D:/Multimodal/ml/prepare_data.py): Fully reproducible, zero-dependency extraction, audit, and cleaning script.
* [`reports/data_audit.md`](file:///D:/Multimodal/reports/data_audit.md): This report.
