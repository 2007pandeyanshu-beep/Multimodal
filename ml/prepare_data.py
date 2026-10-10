"""
ml/prepare_data.py - Deterministic Dataset Extraction, Auditing, and Cleaning Pipeline
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

This script performs:
1. Zero-dependency extraction from the raw Excel workbook (Sheet 1 - Table 1).
2. Deep integrity audit (duplicate checks, missing values, data type validation).
3. Documented categorical standardization ('Fmale' -> 'Female', 'VHD' -> 'Normal'/'Mild'/'Moderate'/'Severe').
4. Feature metadata generation with strict target leakage flags.
5. Export of cleaned dataset (data/processed/cad_clean.csv) and metadata (data/processed/feature_metadata.csv).
"""

import os
import sys
import csv
import zipfile
import hashlib
import xml.etree.ElementTree as ET
from collections import Counter
from typing import Dict, List, Tuple, Any

# Clinical categories & metadata definitions for the 59 attributes
FEATURE_DEFINITIONS = [
    # Demographics & Physical Measurements
    {"name": "Age", "category": "Demographic", "is_cat": False, "dtype": "int",
     "clean": "Cast to integer", "allowed": True, "reason": ""},
    {"name": "Weight", "category": "Physical Measurement", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (kg)", "allowed": True, "reason": ""},
    {"name": "Length", "category": "Physical Measurement", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (height in cm)", "allowed": True, "reason": ""},
    {"name": "Sex", "category": "Demographic", "is_cat": True, "dtype": "string",
     "clean": "Normalized 'Fmale' to 'Female' (original typo in 2013 benchmark)", "allowed": True, "reason": ""},
    {"name": "BMI", "category": "Physical Measurement", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (kg/m^2)", "allowed": True, "reason": ""},
    
    # Medical History & Lifestyle
    {"name": "DM", "category": "Medical History", "is_cat": True, "dtype": "int",
     "clean": "Binary integer flag (0=No, 1=Yes Diabetes Mellitus)", "allowed": True, "reason": ""},
    {"name": "HTN", "category": "Medical History", "is_cat": True, "dtype": "int",
     "clean": "Binary integer flag (0=No, 1=Yes Hypertension)", "allowed": True, "reason": ""},
    {"name": "Current Smoker", "category": "Lifestyle", "is_cat": True, "dtype": "int",
     "clean": "Binary integer flag (0=No, 1=Yes)", "allowed": True, "reason": ""},
    {"name": "EX-Smoker", "category": "Lifestyle", "is_cat": True, "dtype": "int",
     "clean": "Binary integer flag (0=No, 1=Yes)", "allowed": True, "reason": ""},
    {"name": "FH", "category": "Medical History", "is_cat": True, "dtype": "int",
     "clean": "Binary integer flag (0=No, 1=Yes Family History of CAD)", "allowed": True, "reason": ""},
    {"name": "Obesity", "category": "Risk Factor", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N')", "allowed": True, "reason": ""},
    {"name": "CRF", "category": "Medical History", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N' Chronic Renal Failure)", "allowed": True, "reason": ""},
    {"name": "CVA", "category": "Medical History", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N' Cerebrovascular Accident)", "allowed": True, "reason": ""},
    {"name": "Airway disease", "category": "Medical History", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N' Chronic Airway Disease)", "allowed": True, "reason": ""},
    {"name": "Thyroid Disease", "category": "Medical History", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N')", "allowed": True, "reason": ""},
    {"name": "CHF", "category": "Medical History", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N' Congestive Heart Failure)", "allowed": True, "reason": ""},
    {"name": "DLP", "category": "Medical History", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N' Dyslipidemia)", "allowed": True, "reason": ""},
    
    # Vital Signs & Physical Examination
    {"name": "BP", "category": "Vital Signs", "is_cat": False, "dtype": "int",
     "clean": "Cast to integer (Systolic Blood Pressure, mmHg)", "allowed": True, "reason": ""},
    {"name": "PR", "category": "Vital Signs", "is_cat": False, "dtype": "int",
     "clean": "Cast to integer (Pulse Rate, bpm)", "allowed": True, "reason": ""},
    {"name": "Edema", "category": "Physical Exam", "is_cat": True, "dtype": "int",
     "clean": "Binary integer flag (0=No, 1=Yes Peripheral Edema)", "allowed": True, "reason": ""},
    {"name": "Weak Peripheral Pulse", "category": "Physical Exam", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N')", "allowed": True, "reason": ""},
    {"name": "Lung rales", "category": "Physical Exam", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N')", "allowed": True, "reason": ""},
    {"name": "Systolic Murmur", "category": "Physical Exam", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N')", "allowed": True, "reason": ""},
    {"name": "Diastolic Murmur", "category": "Physical Exam", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N')", "allowed": True, "reason": ""},
    
    # Symptoms & Clinical Status
    {"name": "Typical Chest Pain", "category": "Symptom", "is_cat": True, "dtype": "int",
     "clean": "Binary integer flag (0=No, 1=Yes)", "allowed": True, "reason": ""},
    {"name": "Dyspnea", "category": "Symptom", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N' Shortness of Breath)", "allowed": True, "reason": ""},
    {"name": "Function Class", "category": "Clinical Status", "is_cat": True, "dtype": "int",
     "clean": "NYHA Functional Class (0, 1, 2, 3)", "allowed": True, "reason": ""},
    {"name": "Atypical", "category": "Symptom", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N' Atypical Chest Pain)", "allowed": True, "reason": ""},
    {"name": "Nonanginal", "category": "Symptom", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N' Non-anginal Chest Pain)", "allowed": True, "reason": ""},
    {"name": "Exertional CP", "category": "Symptom", "is_cat": True, "dtype": "string",
     "clean": "Constant across all records ('N'). Preserved in clean CSV but excluded from input.",
     "allowed": False, "reason": "Excluded: Constant feature with zero variance across all 303 records (100% 'N')."},
    {"name": "LowTH Ang", "category": "Symptom", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N' Low Threshold Angina)", "allowed": True, "reason": ""},
    
    # Electrocardiography (ECG)
    {"name": "Q Wave", "category": "ECG", "is_cat": True, "dtype": "int",
     "clean": "Binary integer flag (0=No, 1=Yes Pathological Q Wave)", "allowed": True, "reason": ""},
    {"name": "St Elevation", "category": "ECG", "is_cat": True, "dtype": "int",
     "clean": "Binary integer flag (0=No, 1=Yes ST Segment Elevation)", "allowed": True, "reason": ""},
    {"name": "St Depression", "category": "ECG", "is_cat": True, "dtype": "int",
     "clean": "Binary integer flag (0=No, 1=Yes ST Segment Depression)", "allowed": True, "reason": ""},
    {"name": "Tinversion", "category": "ECG", "is_cat": True, "dtype": "int",
     "clean": "Binary integer flag (0=No, 1=Yes T-wave Inversion)", "allowed": True, "reason": ""},
    {"name": "LVH", "category": "ECG", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N' Left Ventricular Hypertrophy)", "allowed": True, "reason": ""},
    {"name": "Poor R Progression", "category": "ECG", "is_cat": True, "dtype": "string",
     "clean": "Binary string ('Y'/'N')", "allowed": True, "reason": ""},
    {"name": "BBB", "category": "ECG", "is_cat": True, "dtype": "string",
     "clean": "Categorical string ('N', 'LBBB', 'RBBB')", "allowed": True, "reason": ""},
    
    # Laboratory Measurements
    {"name": "FBS", "category": "Laboratory", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (Fasting Blood Sugar, mg/dL)", "allowed": True, "reason": ""},
    {"name": "CR", "category": "Laboratory", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (Serum Creatinine, mg/dL)", "allowed": True, "reason": ""},
    {"name": "TG", "category": "Laboratory", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (Triglycerides, mg/dL)", "allowed": True, "reason": ""},
    {"name": "LDL", "category": "Laboratory", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (LDL Cholesterol, mg/dL)", "allowed": True, "reason": ""},
    {"name": "HDL", "category": "Laboratory", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (HDL Cholesterol, mg/dL)", "allowed": True, "reason": ""},
    {"name": "BUN", "category": "Laboratory", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (Blood Urea Nitrogen, mg/dL)", "allowed": True, "reason": ""},
    {"name": "ESR", "category": "Laboratory", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (Erythrocyte Sedimentation Rate, mm/hr)", "allowed": True, "reason": ""},
    {"name": "HB", "category": "Laboratory", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (Hemoglobin, g/dL)", "allowed": True, "reason": ""},
    {"name": "K", "category": "Laboratory", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (Serum Potassium, mEq/L)", "allowed": True, "reason": ""},
    {"name": "Na", "category": "Laboratory", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (Serum Sodium, mEq/L)", "allowed": True, "reason": ""},
    {"name": "WBC", "category": "Laboratory", "is_cat": False, "dtype": "int",
     "clean": "Cast to integer (White Blood Cell Count, cells/mcL)", "allowed": True, "reason": ""},
    {"name": "Lymph", "category": "Laboratory", "is_cat": False, "dtype": "int",
     "clean": "Cast to integer (Lymphocytes, %)", "allowed": True, "reason": ""},
    {"name": "Neut", "category": "Laboratory", "is_cat": False, "dtype": "int",
     "clean": "Cast to integer (Neutrophils, %)", "allowed": True, "reason": ""},
    {"name": "PLT", "category": "Laboratory", "is_cat": False, "dtype": "int",
     "clean": "Cast to integer (Platelet Count, 10^3/mcL)", "allowed": True, "reason": ""},
    
    # Echocardiography
    {"name": "EF-TTE", "category": "Echocardiography", "is_cat": False, "dtype": "float",
     "clean": "Cast to float (Transthoracic Ejection Fraction, %)", "allowed": True, "reason": ""},
    {"name": "Region RWMA", "category": "Echocardiography", "is_cat": True, "dtype": "int",
     "clean": "Regional Wall Motion Abnormality score (0, 1, 2, 3, 4)", "allowed": True, "reason": ""},
    {"name": "VHD", "category": "Echocardiography", "is_cat": True, "dtype": "string",
     "clean": "Standardized 'mild' -> 'Mild', 'N' -> 'Normal' (consistent title case and avoids pandas NA parsing)",
     "allowed": True, "reason": ""},
    
    # Target Columns (Excluded from model inputs to prevent leakage)
    {"name": "LAD", "category": "Prediction Target", "is_cat": True, "dtype": "string",
     "clean": "Target binary status ('Normal' / 'Stenotic')",
     "allowed": False, "reason": "Excluded: Target label and post-angiography vessel diagnosis (Target leakage)."},
    {"name": "LCX", "category": "Prediction Target", "is_cat": True, "dtype": "string",
     "clean": "Target binary status ('Normal' / 'Stenotic')",
     "allowed": False, "reason": "Excluded: Target label and post-angiography vessel diagnosis (Target leakage)."},
    {"name": "RCA", "category": "Prediction Target", "is_cat": True, "dtype": "string",
     "clean": "Target binary status ('Normal' / 'Stenotic')",
     "allowed": False, "reason": "Excluded: Target label and post-angiography vessel diagnosis (Target leakage)."},
    {"name": "Cath", "category": "Prediction Target", "is_cat": True, "dtype": "string",
     "clean": "Target binary status ('Normal' / 'CAD')",
     "allowed": False, "reason": "Excluded: Target label and post-angiography catheterization diagnosis (Target leakage)."}
]

VHD_MAPPING = {
    "N": "Normal",
    "Normal": "Normal",
    "mild": "Mild",
    "Mild": "Mild",
    "Moderate": "Moderate",
    "Severe": "Severe"
}

SEX_MAPPING = {
    "Male": "Male",
    "Fmale": "Female",
    "Female": "Female"
}


def compute_sha256(filepath: str) -> str:
    """Calculate SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def extract_excel_sheet1(excel_path: str) -> Tuple[List[str], List[Dict[str, str]]]:
    """
    Extract headers and row dicts from Sheet 1 of the XLSX file
    using Python standard library zipfile and xml.etree.ElementTree.
    Zero external dependencies required.
    """
    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"Dataset file not found at: {excel_path}")

    with zipfile.ZipFile(excel_path, "r") as z:
        ns = {"ns": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        
        # 1. Parse shared strings table
        strings = []
        if "xl/sharedStrings.xml" in z.namelist():
            ss_tree = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in ss_tree.findall("ns:si", ns):
                t = si.find("ns:t", ns)
                if t is not None:
                    strings.append(t.text if t.text else "")
                else:
                    strings.append("".join([t_el.text for t_el in si.findall(".//ns:t", ns) if t_el.text]))
        
        # 2. Parse sheet 1 (Sheet 1 - Table 1)
        s1_tree = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
        rows = s1_tree.findall(".//ns:row", ns)
        if not rows:
            raise ValueError("No rows found in sheet 1 of Excel workbook.")
        
        # Header row
        header = []
        for c in rows[0].findall("ns:c", ns):
            t = c.attrib.get("t")
            v = c.find("ns:v", ns)
            val = v.text if v is not None else ""
            if t == "s" and val.isdigit():
                val = strings[int(val)]
            header.append(val.strip())
        
        # Data rows
        records = []
        for r in rows[1:]:
            row_dict = {}
            for c in r.findall("ns:c", ns):
                col_ref = "".join([ch for ch in c.attrib.get("r", "") if ch.isalpha()])
                col_idx = 0
                for ch in col_ref:
                    col_idx = col_idx * 26 + (ord(ch) - ord("A") + 1)
                col_name = header[col_idx - 1] if col_idx <= len(header) else f"Col_{col_idx}"
                t = c.attrib.get("t")
                v = c.find("ns:v", ns)
                val = v.text if v is not None else ""
                if t == "s" and val.isdigit():
                    val = strings[int(val)]
                row_dict[col_name] = val.strip()
            records.append(row_dict)

    return header, records


def audit_raw_data(header: List[str], records: List[Dict[str, str]]) -> Dict[str, Any]:
    """Perform audit on raw extracted data."""
    num_records = len(records)
    num_cols = len(header)
    
    # Missing values
    missing_by_col = {col: 0 for col in header}
    for r in records:
        for col in header:
            val = r.get(col, "")
            if val == "":
                missing_by_col[col] += 1
    total_missing = sum(missing_by_col.values())
    
    # Duplicates check
    exact_duplicates = 0
    seen_exact = set()
    for r in records:
        tup = tuple(r.get(c, "") for c in header)
        if tup in seen_exact:
            exact_duplicates += 1
        seen_exact.add(tup)
        
    # Target distributions
    target_distributions = {}
    for t_col in ["Cath", "LAD", "LCX", "RCA"]:
        cnt = Counter(r.get(t_col, "") for r in records)
        target_distributions[t_col] = dict(cnt)

    return {
        "num_records": num_records,
        "num_cols": num_cols,
        "total_missing": total_missing,
        "missing_by_col": {k: v for k, v in missing_by_col.items() if v > 0},
        "exact_duplicates": exact_duplicates,
        "target_distributions": target_distributions
    }


def clean_records(header: List[str], records: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """
    Apply deterministic, documented cleaning:
    - Strip whitespace
    - Normalize Sex ('Fmale' -> 'Female')
    - Normalize VHD ('mild' -> 'Mild', 'N' -> 'Normal')
    - Cast numeric columns to int/float where appropriate
    """
    cleaned = []
    def_map = {d["name"]: d for d in FEATURE_DEFINITIONS}

    for r in records:
        cleaned_row = {}
        for col in header:
            val = r.get(col, "").strip()
            meta = def_map.get(col, {})
            dtype = meta.get("dtype", "string")
            
            # Specific categorical normalizations
            if col == "Sex":
                val = SEX_MAPPING.get(val, val)
            elif col == "VHD":
                val = VHD_MAPPING.get(val, val)
            
            # Clean numeric casting
            if dtype == "int":
                try:
                    val = int(round(float(val)))
                except ValueError:
                    pass
            elif dtype == "float":
                try:
                    val = float(val)
                except ValueError:
                    pass
            
            cleaned_row[col] = val
        cleaned.append(cleaned_row)
        
    return cleaned


def save_cleaned_csv(header: List[str], records: List[Dict[str, Any]], output_path: str):
    """Write cleaned records to CSV."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=header)
        writer.writeheader()
        writer.writerows(records)


def save_metadata_csv(output_path: str):
    """Write feature metadata specification to CSV."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    fieldnames = [
        "feature_name",
        "data_type",
        "clinical_category",
        "is_categorical",
        "cleaning_or_encoding_decision",
        "is_allowed_input",
        "exclusion_reason"
    ]
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for d in FEATURE_DEFINITIONS:
            writer.writerow({
                "feature_name": d["name"],
                "data_type": d["dtype"],
                "clinical_category": d["category"],
                "is_categorical": d["is_cat"],
                "cleaning_or_encoding_decision": d["clean"],
                "is_allowed_input": d["allowed"],
                "exclusion_reason": d["reason"]
            })


def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    # Check for raw dataset path candidates
    raw_path_primary = os.path.join(base_dir, "data", "raw", "extention of Z-Alizadeh sani dataset.xlsx")
    raw_path_root = os.path.join(base_dir, "extention of Z-Alizadeh sani dataset.xlsx")
    
    if os.path.exists(raw_path_primary):
        input_excel = raw_path_primary
    elif os.path.exists(raw_path_root):
        input_excel = raw_path_root
    else:
        print(f"ERROR: Dataset not found in either {raw_path_primary} or {raw_path_root}")
        sys.exit(1)

    clean_csv_path = os.path.join(base_dir, "data", "processed", "cad_clean.csv")
    metadata_csv_path = os.path.join(base_dir, "data", "processed", "feature_metadata.csv")

    print(f"=== Multimodal AI Hackathon 2026 - Phase 1 Dataset Pipeline ===")
    print(f"Source raw Excel: {input_excel}")
    raw_sha = compute_sha256(input_excel)
    print(f"Source SHA-256:   {raw_sha}")
    
    # 1. Extraction
    print("\n[1/4] Extracting Sheet 1 via stdlib ZIP/XML parser...")
    header, records = extract_excel_sheet1(input_excel)
    print(f"  Extracted {len(records)} rows and {len(header)} columns.")

    # 2. Audit
    print("\n[2/4] Auditing data integrity...")
    audit = audit_raw_data(header, records)
    print(f"  Total records:     {audit['num_records']}")
    print(f"  Total columns:     {audit['num_cols']}")
    print(f"  Total missing:     {audit['total_missing']}")
    print(f"  Exact duplicates:  {audit['exact_duplicates']}")
    print("  Target distributions:")
    for t_col, dist in audit["target_distributions"].items():
        print(f"    - {t_col:5s}: {dist}")

    # 3. Clean
    print("\n[3/4] Applying documented cleaning rules...")
    cleaned = clean_records(header, records)
    print(f"  Cleaned {len(cleaned)} records.")
    
    # Verify cleaning results
    sex_dist = Counter(r["Sex"] for r in cleaned)
    vhd_dist = Counter(r["VHD"] for r in cleaned)
    print(f"  Standardized Sex: {dict(sex_dist)}")
    print(f"  Standardized VHD: {dict(vhd_dist)}")

    # 4. Save
    print("\n[4/4] Writing outputs...")
    save_cleaned_csv(header, cleaned, clean_csv_path)
    print(f"  Saved cleaned dataset:  {clean_csv_path}")
    
    save_metadata_csv(metadata_csv_path)
    print(f"  Saved feature metadata: {metadata_csv_path}")

    # Check leakage exclusion stats
    allowed_count = sum(1 for d in FEATURE_DEFINITIONS if d["allowed"])
    excluded_count = sum(1 for d in FEATURE_DEFINITIONS if not d["allowed"])
    print(f"\nFeature Policy Summary:")
    print(f"  Total features:    {len(FEATURE_DEFINITIONS)}")
    print(f"  Allowed inputs:    {allowed_count}")
    print(f"  Excluded features: {excluded_count} (LAD, LCX, RCA, Cath [Leakage Prevention] + Exertional CP [Zero Variance])")
    
    # Verify hash integrity
    final_sha = compute_sha256(input_excel)
    assert raw_sha == final_sha, "CRITICAL: Raw file was altered during extraction!"
    print(f"\nRaw dataset integrity verified: SHA-256 remains {final_sha}")
    print("\n=== Phase 1 Pipeline Completed Successfully ===")


if __name__ == "__main__":
    main()
