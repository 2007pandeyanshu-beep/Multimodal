"""
backend/pdf/mapper.py - Clinical Schema Mapping & Evidence Extraction
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Conservatively maps extracted report text to the 54 features of PatientInput.
Safety Rules:
1. Strict schema alignment with backend/schemas.py (PatientInput).
2. Never silently guess missing or low-confidence medical values.
3. Mark ambiguous, conflicting, or out-of-range values as requiring review.
4. Unambiguous unit conversions only (e.g. lbs to kg, inches to cm, m to cm).
5. Target/leakage features (Cath, LAD, LCX, RCA, Exertional CP) are strictly excluded.
6. Zero execution of untrusted text / prompt injection from PDF contents.
"""

import re
import logging
from typing import Dict, List, Tuple, Optional, Any, Union

from backend.schemas import PatientInput
from backend.pdf.schemas import (
    PageExtractionResult, FieldMappingDetail, PdfProcessResponse, MappingStatus
)
from backend.config import PROTOTYPE_DISCLAIMER
from ml.transformers import FORBIDDEN_FEATURES

logger = logging.getLogger("backend.pdf.mapper")


# Definitions of all 54 target features with metadata, types, and constraints
FEATURE_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    # 1. Demographics & Physical Measurements
    "Age": {
        "label": "Patient Age",
        "category": "Demographics",
        "type": "float",
        "min": 18.0,
        "max": 120.0,
        "default_unit": "years",
        "aliases": [r"\bage\b", r"\bpatient age\b", r"\byears old\b", r"\by/?o\b"]
    },
    "Weight": {
        "label": "Body Weight",
        "category": "Physical Measurement",
        "type": "float",
        "min": 20.0,
        "max": 300.0,
        "default_unit": "kg",
        "aliases": [r"\bweight\b", r"\bwt\b", r"\bbody weight\b"]
    },
    "Length": {
        "label": "Height / Length",
        "category": "Physical Measurement",
        "type": "float",
        "min": 100.0,
        "max": 250.0,
        "default_unit": "cm",
        "aliases": [r"\bheight\b", r"\blength\b", r"\bht\b", r"\bstature\b"]
    },
    "Sex": {
        "label": "Biological Sex",
        "category": "Demographics",
        "type": "categorical_choice",
        "allowed": ["Female", "Male"],
        "aliases": [r"\bsex\b", r"\bgender\b"]
    },
    "BMI": {
        "label": "Body Mass Index",
        "category": "Physical Measurement",
        "type": "float",
        "min": 10.0,
        "max": 80.0,
        "default_unit": "kg/m^2",
        "aliases": [r"\bbmi\b", r"\bbody mass index\b", r"\bcalculated\s+bm[ie]\b", r"\bbme\b"]
    },

    # 2. Medical History & Lifestyle
    "DM": {
        "label": "Diabetes Mellitus",
        "category": "Medical History",
        "type": "binary_int",
        "aliases": [r"\bdiabetes(?:\s+mellitus)?\b", r"\bdm\b", r"\bt2dm\b", r"\bt1dm\b", r"\bdiabetic\b"]
    },
    "HTN": {
        "label": "Hypertension",
        "category": "Medical History",
        "type": "binary_int",
        "aliases": [r"\bhypertension\b", r"\bhtn\b", r"\bhigh blood pressure\b"]
    },
    "Current Smoker": {
        "label": "Current Smoker",
        "category": "Lifestyle",
        "type": "binary_int",
        "aliases": [r"\bcurrent smoker\b", r"\bactive smoker\b", r"\bsmokes currently\b", r"\btobacco user\b"]
    },
    "EX-Smoker": {
        "label": "Ex-Smoker",
        "category": "Lifestyle",
        "type": "binary_int",
        "aliases": [r"\bex-smoker\b", r"\bformer smoker\b", r"\bpast smoker\b", r"\bquit smoking\b"]
    },
    "FH": {
        "label": "Family History of CAD",
        "category": "Medical History",
        "type": "binary_int",
        "aliases": [r"\bfamily history(?:\s+of\s+cad|\s+of\s+heart\s+disease)?\b", r"\bfh\b", r"\bfh of cad\b"]
    },
    "Obesity": {
        "label": "Obesity",
        "category": "Medical History",
        "type": "binary_str",
        "aliases": [r"\bobesity\b", r"\bobese\b"]
    },
    "CRF": {
        "label": "Chronic Renal Failure",
        "category": "Medical History",
        "type": "binary_str",
        "aliases": [r"\bchronic renal failure\b", r"\bcrf\b", r"\bchronic kidney disease\b", r"\bckd\b"]
    },
    "CVA": {
        "label": "Cerebrovascular Accident (Stroke)",
        "category": "Medical History",
        "type": "binary_str",
        "aliases": [r"\bcerebrovascular accident\b", r"\bcva\b", r"\bstroke\b", r"\btia\b"]
    },
    "Airway disease": {
        "label": "Chronic Airway Disease",
        "category": "Medical History",
        "type": "binary_str",
        "aliases": [r"\bairway disease\b", r"\bcopd\b", r"\basthma\b", r"\bchronic bronchitis\b"]
    },
    "Thyroid Disease": {
        "label": "Thyroid Disease",
        "category": "Medical History",
        "type": "binary_str",
        "aliases": [r"\bthyroid disease\b", r"\bhypothyroidism\b", r"\bhyperthyroidism\b"]
    },
    "CHF": {
        "label": "Congestive Heart Failure",
        "category": "Medical History",
        "type": "binary_str",
        "aliases": [r"\bcongestive heart failure\b", r"\bchf\b", r"\bheart failure\b"]
    },
    "DLP": {
        "label": "Dyslipidemia",
        "category": "Medical History",
        "type": "binary_str",
        "aliases": [r"\bdyslipidemia\b", r"\bdlp\b", r"\bhyperlipidemia\b", r"\bhypercholesterolemia\b"]
    },

    # 3. Vital Signs & Physical Examination
    "BP": {
        "label": "Systolic Blood Pressure",
        "category": "Vital Signs",
        "type": "float",
        "min": 50.0,
        "max": 250.0,
        "default_unit": "mmHg",
        "aliases": [r"\bblood pressure\b", r"\bbp\b", r"\bsystolic bp\b", r"\bsbp\b"]
    },
    "PR": {
        "label": "Pulse Rate / Heart Rate",
        "category": "Vital Signs",
        "type": "float",
        "min": 30.0,
        "max": 220.0,
        "default_unit": "bpm",
        "aliases": [r"\bpulse rate\b", r"\bheart rate\b", r"\bpr\b", r"\bhr\b", r"\bpulse\b"]
    },
    "Edema": {
        "label": "Peripheral Edema",
        "category": "Physical Exam",
        "type": "binary_int",
        "aliases": [r"\bperipheral edema\b", r"\bedema\b", r"\bpedal edema\b"]
    },
    "Weak Peripheral Pulse": {
        "label": "Weak Peripheral Pulse",
        "category": "Physical Exam",
        "type": "binary_str",
        "aliases": [r"\bweak\s+peripheral\s+pulses?\b", r"\bweak\s+pulses?\b", r"\bdiminished\s+pulses?\b"]
    },
    "Lung rales": {
        "label": "Lung Rales",
        "category": "Physical Exam",
        "type": "binary_str",
        "aliases": [r"\blung rales\b", r"\brales\b", r"\bcrackles\b", r"\bcrepitations\b"]
    },
    "Systolic Murmur": {
        "label": "Systolic Murmur",
        "category": "Physical Exam",
        "type": "binary_str",
        "aliases": [r"\bsystolic murmur\b", r"\bsystolic heart murmur\b"]
    },
    "Diastolic Murmur": {
        "label": "Diastolic Murmur",
        "category": "Physical Exam",
        "type": "binary_str",
        "aliases": [r"\bdiastolic murmur\b", r"\bdiastolic heart murmur\b"]
    },

    # 4. Symptoms & Clinical Status
    "Typical Chest Pain": {
        "label": "Typical Chest Pain",
        "category": "Symptoms",
        "type": "binary_int",
        "aliases": [r"\btypical chest pain\b", r"\btypical angina\b"]
    },
    "Dyspnea": {
        "label": "Dyspnea / Shortness of Breath",
        "category": "Symptoms",
        "type": "binary_str",
        "aliases": [r"\bdyspnea\b", r"\bshortness of breath\b", r"\bsob\b"]
    },
    "Function Class": {
        "label": "NYHA Functional Class",
        "category": "Clinical Status",
        "type": "categorical_choice",
        "allowed": [0, 1, 2, 3],
        "aliases": [r"\bfunction class\b", r"\bfunctional class\b", r"\bnyha class\b", r"\bnyha\b"]
    },
    "Atypical": {
        "label": "Atypical Chest Pain",
        "category": "Symptoms",
        "type": "binary_str",
        "aliases": [r"\batypical chest pain\b", r"\batypical angina\b", r"\batypical\b"]
    },
    "Nonanginal": {
        "label": "Non-anginal Chest Pain",
        "category": "Symptoms",
        "type": "binary_str",
        "aliases": [r"\bnon-?anginal chest pain\b", r"\bnonanginal\b"]
    },
    "LowTH Ang": {
        "label": "Low Threshold Angina",
        "category": "Symptoms",
        "type": "binary_str",
        "aliases": [r"\blow threshold angina\b", r"\blowth ang\b"]
    },

    # 5. Electrocardiography (ECG)
    "Q Wave": {
        "label": "Pathological Q Wave",
        "category": "ECG",
        "type": "binary_int",
        "aliases": [r"\bpathological\s+q[\s_-]*wave\b", r"\bq[\s_-]*wave\b"]
    },
    "St Elevation": {
        "label": "ST Segment Elevation",
        "category": "ECG",
        "type": "binary_int",
        "aliases": [r"\bst segment elevation\b", r"\bst elevation\b", r"\bst-elevation\b"]
    },
    "St Depression": {
        "label": "ST Segment Depression",
        "category": "ECG",
        "type": "binary_int",
        "aliases": [r"\bst segment depression\b", r"\bst depression\b", r"\bst-depression\b"]
    },
    "Tinversion": {
        "label": "T-Wave Inversion",
        "category": "ECG",
        "type": "binary_int",
        "aliases": [r"\bt-wave\s+inversion\b", r"\bt\s+wave\s+inversion\b", r"\btinversion\b", r"\binverted\s+t\b", r"\bwave\s+inversion\b"]
    },
    "LVH": {
        "label": "Left Ventricular Hypertrophy",
        "category": "ECG",
        "type": "binary_str",
        "aliases": [r"\bleft ventricular hypertrophy\b", r"\blvh\b"]
    },
    "Poor R Progression": {
        "label": "Poor R Wave Progression",
        "category": "ECG",
        "type": "binary_str",
        "aliases": [r"\bpoor\s+r[\s_-]*wave\s+progression\b", r"\bpoor\s+r\s+progression\b", r"\bprwp\b"]
    },
    "BBB": {
        "label": "Bundle Branch Block",
        "category": "ECG",
        "type": "categorical_choice",
        "allowed": ["N", "LBBB", "RBBB"],
        "aliases": [r"\bbundle branch block\b", r"\bbbb\b", r"\blbbb\b", r"\brbbb\b"]
    },

    # 6. Laboratory Blood Panels
    "FBS": {
        "label": "Fasting Blood Sugar",
        "category": "Laboratory",
        "type": "float",
        "min": 20.0,
        "max": 800.0,
        "default_unit": "mg/dL",
        "aliases": [r"\bfasting blood sugar\b", r"\bfasting glucose\b", r"\bfbs\b", r"\bglucose \(fasting\)\b"]
    },
    "CR": {
        "label": "Serum Creatinine",
        "category": "Laboratory",
        "type": "float",
        "min": 0.1,
        "max": 15.0,
        "default_unit": "mg/dL",
        "aliases": [r"\bserum creatinine\b", r"\bcreatinine\b", r"\bcr\b"]
    },
    "TG": {
        "label": "Serum Triglycerides",
        "category": "Laboratory",
        "type": "float",
        "min": 10.0,
        "max": 2000.0,
        "default_unit": "mg/dL",
        "aliases": [r"\btriglycerides\b", r"\btg\b", r"\btrigs\b"]
    },
    "LDL": {
        "label": "LDL Cholesterol",
        "category": "Laboratory",
        "type": "float",
        "min": 5.0,
        "max": 500.0,
        "default_unit": "mg/dL",
        "aliases": [r"\bldl cholesterol\b", r"\bldl-c\b", r"\bldl\b"]
    },
    "HDL": {
        "label": "HDL Cholesterol",
        "category": "Laboratory",
        "type": "float",
        "min": 5.0,
        "max": 200.0,
        "default_unit": "mg/dL",
        "aliases": [r"\bhdl[\s_-]*cholestero[lt]\b", r"\bhdl-c\b", r"\bhdl\b"]
    },
    "BUN": {
        "label": "Blood Urea Nitrogen",
        "category": "Laboratory",
        "type": "float",
        "min": 1.0,
        "max": 150.0,
        "default_unit": "mg/dL",
        "aliases": [r"\bblood urea nitrogen\b", r"\bbun\b", r"\burea\b"]
    },
    "ESR": {
        "label": "Erythrocyte Sedimentation Rate",
        "category": "Laboratory",
        "type": "float",
        "min": 0.0,
        "max": 150.0,
        "default_unit": "mm/hr",
        "aliases": [r"\berythrocyte sedimentation rate\b", r"\besr\b", r"\bsed rate\b"]
    },
    "HB": {
        "label": "Hemoglobin",
        "category": "Laboratory",
        "type": "float",
        "min": 3.0,
        "max": 25.0,
        "default_unit": "g/dL",
        "aliases": [r"\bhemoglobin\b", r"\bhgb\b", r"\bhb\b"]
    },
    "K": {
        "label": "Serum Potassium",
        "category": "Laboratory",
        "type": "float",
        "min": 1.0,
        "max": 10.0,
        "default_unit": "mEq/L",
        "aliases": [r"\bserum potassium\b", r"\bpotassium\b", r"\bk\+?\b"]
    },
    "Na": {
        "label": "Serum Sodium",
        "category": "Laboratory",
        "type": "float",
        "min": 90.0,
        "max": 180.0,
        "default_unit": "mEq/L",
        "aliases": [r"\bserum sodium\b", r"\bsodium\b", r"\bna\+?\b"]
    },
    "WBC": {
        "label": "White Blood Cell Count",
        "category": "Laboratory",
        "type": "float",
        "min": 500.0,
        "max": 50000.0,
        "default_unit": "cells/mcL",
        "aliases": [r"\bwhite blood cell count\b", r"\bwhite blood cells\b", r"\bwbc\b", r"\bleukocytes\b"]
    },
    "Lymph": {
        "label": "Lymphocyte Percentage",
        "category": "Laboratory",
        "type": "float",
        "min": 0.0,
        "max": 100.0,
        "default_unit": "%",
        "aliases": [r"\blymphocytes?\b", r"\blymphocyte\s*(?:count\b|%)?", r"\blymph\b"]
    },
    "Neut": {
        "label": "Neutrophil Percentage",
        "category": "Laboratory",
        "type": "float",
        "min": 0.0,
        "max": 100.0,
        "default_unit": "%",
        "aliases": [r"\bneutrophils?\b", r"\bneutrophil\s*(?:count\b|%)?", r"\bneut\b", r"\bsegs\b"]
    },
    "PLT": {
        "label": "Platelet Count",
        "category": "Laboratory",
        "type": "float",
        "min": 5.0,
        "max": 1500.0,
        "default_unit": "10^3/mcL",
        "aliases": [r"\bplatelet count\b", r"\bplatelets\b", r"\bplt\b"]
    },

    # 7. Echocardiography
    "EF-TTE": {
        "label": "Ejection Fraction (Echo)",
        "category": "Echocardiography",
        "type": "float",
        "min": 5.0,
        "max": 90.0,
        "default_unit": "%",
        "aliases": [r"\bejection fraction\b", r"\blvef\b", r"\bef-tte\b", r"\bef\b"]
    },
    "Region RWMA": {
        "label": "Regional Wall Motion Abnormality",
        "category": "Echocardiography",
        "type": "categorical_choice",
        "allowed": [0, 1, 2, 3, 4],
        "aliases": [r"\bregional\s+wall\s+motion\s+abnormality\b", r"\bregion\s+rwma\b", r"\brwma\b"]
    },
    "VHD": {
        "label": "Valvular Heart Disease",
        "category": "Echocardiography",
        "type": "categorical_choice",
        "allowed": ["Normal", "Mild", "Moderate", "Severe"],
        "aliases": [r"\bvalvular heart disease\b", r"\bvhd\b", r"\bvalve disease\b"]
    }
}


class ClinicalReportMapper:
    """Extracts candidate medical values from text and conservatively maps them to PatientInput."""

    def __init__(self):
        self.definitions = FEATURE_DEFINITIONS

    def _normalize_text(self, text: str) -> str:
        """Lightweight OCR noise cleanup and token normalization."""
        if not text:
            return ""
        # 1. Clean non-printable / unicode replacement characters while strictly preserving \n and \r
        text = re.sub(r"[\x00-\x09\x0b\x0c\x0e-\x1f\x7f-\x9f\ufffd]+", " ", text)
        # 2. Unpack concatenated lipid tokens: HDLCholesterol / HDLCholesterot -> HDL Cholesterol
        text = re.sub(r"\b(HDL|LDL|Total)[\s_-]*(Cholestero[lt])\b", r"\1 Cholesterol", text, flags=re.IGNORECASE)
        # 3. Concatenated wave tokens: QWave -> Q Wave, RWave -> R Wave
        text = re.sub(r"\b([QR])Wave\b", r"\1 Wave", text, flags=re.IGNORECASE)
        # 4. OCR typo for height: Height 174m -> Height: 174 cm (when 3 digits in [100, 250] followed by m without decimal point)
        text = re.sub(r"\b(Height|Length|Ht|Stature)[:\s=]+([12]\d{2})\s*m\b(?!\w)", r"\1: \2 cm", text, flags=re.IGNORECASE)
        # 5. Fix OCR closing parenthesis misread as I or | e.g. (CRI: -> (CR):
        text = re.sub(r"\(([A-Za-z0-9\-]+)[I|\]]([:\s=])", r"(\1)\2", text)
        return text

    def map_extracted_pages(
        self,
        pages: List[PageExtractionResult],
        filename: str = "document.pdf",
        file_size_bytes: int = 0,
        ocr_available: bool = False,
        ocr_notice: Optional[str] = None,
        processing_time_ms: float = 0.0
    ) -> PdfProcessResponse:
        """
        Parses all extracted pages, performs conservative extraction for each feature,
        detects conflicts and ambiguities, and computes schema readiness.
        """
        # Aggregate text with page references and apply lightweight normalization
        page_texts: List[Tuple[int, str]] = [
            (p.page_number, self._normalize_text(p.text or "")) for p in pages if p.text and len(p.text.strip()) > 0
        ]

        mappings: Dict[str, FieldMappingDetail] = {}
        matched_count = 0
        ambiguous_count = 0
        missing_count = 0
        conflicting_count = 0
        invalid_count = 0

        prefilled_data: Dict[str, Any] = {}
        missing_or_invalid: List[str] = []

        for alias, defn in self.definitions.items():
            # Strict safety guard: never map forbidden features
            if alias in FORBIDDEN_FEATURES:
                continue

            field_detail = self._extract_single_feature(alias, defn, page_texts)
            mappings[alias] = field_detail

            if field_detail.status == "matched":
                matched_count += 1
                prefilled_data[alias] = field_detail.value
            elif field_detail.status == "ambiguous":
                ambiguous_count += 1
                missing_or_invalid.append(alias)
            elif field_detail.status == "conflicting":
                conflicting_count += 1
                missing_or_invalid.append(alias)
            elif field_detail.status == "invalid_range":
                invalid_count += 1
                missing_or_invalid.append(alias)
            elif field_detail.status == "missing":
                missing_count += 1
                missing_or_invalid.append(alias)

        # Cross-feature derivation: Calculate BMI if Height and Weight exist and BMI is missing
        if mappings.get("BMI") and mappings["BMI"].status == "missing":
            wt_detail = mappings.get("Weight")
            ht_detail = mappings.get("Length")
            if (wt_detail and wt_detail.status == "matched" and isinstance(wt_detail.value, (int, float)) and
                ht_detail and ht_detail.status == "matched" and isinstance(ht_detail.value, (int, float)) and ht_detail.value > 0):
                height_m = float(ht_detail.value) / 100.0
                calc_bmi = round(float(wt_detail.value) / (height_m ** 2), 2)
                if 10.0 <= calc_bmi <= 80.0:
                    mappings["BMI"] = FieldMappingDetail(
                        field_alias="BMI",
                        clinical_label=self.definitions["BMI"]["label"],
                        category="Physical Measurement",
                        expected_type="float",
                        value=calc_bmi,
                        status="matched",
                        confidence=0.90,
                        unit="kg/m^2",
                        source_snippet=f"Derived from Weight ({wt_detail.value} kg) and Height ({ht_detail.value} cm)",
                        page_number=wt_detail.page_number,
                        alternatives=None,
                        validation_error=None,
                        requires_review=False
                    )
                    prefilled_data["BMI"] = calc_bmi
                    matched_count += 1
                    missing_count -= 1
                    if "BMI" in missing_or_invalid:
                        missing_or_invalid.remove("BMI")

        # Ready for inference check: true ONLY when all 54 features are matched and valid
        ready_for_inference = (len(missing_or_invalid) == 0 and len(prefilled_data) == len(self.definitions))

        if ready_for_inference:
            # Final validation check using PatientInput pydantic constructor
            try:
                PatientInput(**prefilled_data)
            except Exception as ve:
                logger.warning(f"prefilled_data failed PatientInput constructor: {ve}")
                ready_for_inference = False

        return PdfProcessResponse(
            filename=filename,
            file_size_bytes=file_size_bytes,
            total_pages=len(pages),
            ocr_available=ocr_available,
            ocr_notice=ocr_notice,
            processing_time_ms=processing_time_ms,
            page_summary=pages,
            mappings=mappings,
            total_features=len(self.definitions),
            matched_count=matched_count,
            ambiguous_count=ambiguous_count,
            missing_count=missing_count,
            conflicting_count=conflicting_count,
            invalid_count=invalid_count,
            ready_for_inference=ready_for_inference,
            missing_or_invalid_fields=missing_or_invalid,
            prefilled_patient_data=prefilled_data,
            prototype_disclaimer=PROTOTYPE_DISCLAIMER
        )

    def _extract_single_feature(
        self,
        alias: str,
        defn: Dict[str, Any],
        page_texts: List[Tuple[int, str]]
    ) -> FieldMappingDetail:
        """Extracts candidate mentions for a single feature across all page texts."""
        f_type = defn["type"]
        candidates: List[Tuple[Any, str, int, Optional[str]]] = []  # (value, snippet, page_num, detected_unit)

        for page_num, text in page_texts:
            found = self._find_candidates_in_page(alias, defn, text, page_num)
            candidates.extend(found)

        if not candidates:
            return FieldMappingDetail(
                field_alias=alias,
                clinical_label=defn["label"],
                category=defn["category"],
                expected_type=f_type,
                value=None,
                status="missing",
                confidence=0.0,
                unit=defn.get("default_unit"),
                source_snippet=None,
                page_number=None,
                alternatives=None,
                validation_error=None,
                requires_review=True
            )

        # De-duplicate candidates by extracted value
        unique_vals = list({c[0]: c for c in candidates}.values())

        if len(unique_vals) == 1:
            val, snippet, page_num, unit = unique_vals[0]
            # Range check for numerical values
            if f_type == "float":
                min_v = defn.get("min", float("-inf"))
                max_v = defn.get("max", float("inf"))
                if val < min_v or val > max_v:
                    return FieldMappingDetail(
                        field_alias=alias,
                        clinical_label=defn["label"],
                        category=defn["category"],
                        expected_type=f_type,
                        value=val,
                        status="invalid_range",
                        confidence=0.5,
                        unit=unit or defn.get("default_unit"),
                        source_snippet=snippet,
                        page_number=page_num,
                        alternatives=None,
                        validation_error=f"Extracted value {val} is outside valid clinical range [{min_v}, {max_v}].",
                        requires_review=True
                    )

            # Categorical choice check
            if f_type == "categorical_choice":
                allowed = defn.get("allowed", [])
                if val not in allowed:
                    return FieldMappingDetail(
                        field_alias=alias,
                        clinical_label=defn["label"],
                        category=defn["category"],
                        expected_type=f_type,
                        value=val,
                        status="invalid_range",
                        confidence=0.5,
                        unit=None,
                        source_snippet=snippet,
                        page_number=page_num,
                        alternatives=None,
                        validation_error=f"Extracted category '{val}' is not in allowed choices: {allowed}",
                        requires_review=True
                    )

            return FieldMappingDetail(
                field_alias=alias,
                clinical_label=defn["label"],
                category=defn["category"],
                expected_type=f_type,
                value=val,
                status="matched",
                confidence=0.92,
                unit=unit or defn.get("default_unit"),
                source_snippet=snippet,
                page_number=page_num,
                alternatives=None,
                validation_error=None,
                requires_review=False
            )
        else:
            # Multiple conflicting candidates found
            all_vals = [c[0] for c in unique_vals]
            primary = unique_vals[0]
            return FieldMappingDetail(
                field_alias=alias,
                clinical_label=defn["label"],
                category=defn["category"],
                expected_type=f_type,
                value=None,  # Conservative: never pick randomly
                status="ambiguous",
                confidence=0.40,
                unit=primary[3] or defn.get("default_unit"),
                source_snippet=f"Multiple values found: {', '.join(str(v) for v in all_vals)}",
                page_number=primary[2],
                alternatives=all_vals,
                validation_error="Multiple conflicting values found across document.",
                requires_review=True
            )

    def _find_candidates_in_page(
        self,
        alias: str,
        defn: Dict[str, Any],
        text: str,
        page_num: int
    ) -> List[Tuple[Any, str, int, Optional[str]]]:
        """Scans page text using feature-specific regex patterns."""
        f_type = defn["type"]
        candidates = []

        # Numerical float features
        if f_type == "float":
            candidates.extend(self._extract_numerical(alias, defn, text, page_num))
        # Binary integer flags (0 or 1)
        elif f_type == "binary_int":
            candidates.extend(self._extract_binary_int(alias, defn, text, page_num))
        # Binary string flags ('Y' or 'N')
        elif f_type == "binary_str":
            candidates.extend(self._extract_binary_str(alias, defn, text, page_num))
        # Specific categoricals (Sex, Function Class, BBB, Region RWMA, VHD)
        elif f_type == "categorical_choice":
            candidates.extend(self._extract_categorical_choice(alias, defn, text, page_num))

        return candidates

    def _extract_numerical(
        self,
        alias: str,
        defn: Dict[str, Any],
        text: str,
        page_num: int
    ) -> List[Tuple[float, str, int, Optional[str]]]:
        """Extracts numerical features with unit awareness and conversions."""
        results = []
        aliases = defn["aliases"]
        hsp = r"[^\S\r\n]"
        delim = rf"(?:{hsp}*[\(\[][A-Za-z0-9\-_/ ]+[\)\]I|])?[\)\]I|]?(?:{hsp}*[:=\-]{hsp}*|{hsp}+)"

        # Specific check for Age to prioritize explicitly labeled Patient Age
        if alias == "Age":
            patient_age_regex = re.compile(rf"\bpatient(?:\s+age)?{delim}(?:is\s+)?(\d{{2,3}})\b", re.IGNORECASE)
            patient_age_matches = list(patient_age_regex.finditer(text))
            if patient_age_matches:
                for m in patient_age_matches:
                    val = float(m.group(1))
                    snippet = text[max(0, m.start() - 15):min(len(text), m.end() + 15)].strip()
                    results.append((val, snippet, page_num, "years"))
                return results

        for pat in aliases:
            # Special parsing for Blood Pressure: captures systolic from 120/80 or sys 120
            if alias == "BP":
                bp_regex = re.compile(
                    rf"{pat}{delim}(?:is\s+)?(\d{{2,3}})(?:/(\d{{2,3}}))?(?:{hsp}*(mmHg))?",
                    re.IGNORECASE
                )
                for m in bp_regex.finditer(text):
                    sys_val = float(m.group(1))
                    unit = m.group(3) or "mmHg"
                    snippet = text[max(0, m.start() - 15):min(len(text), m.end() + 15)].strip()
                    results.append((sys_val, snippet, page_num, unit))
                continue

            # Special parsing for Height / Length: handles meters, cm, or feet/inches
            if alias == "Length":
                # Look for height in meters first: e.g. 1.75 m, 1.74m
                ht_m_matches = list(re.finditer(rf"{pat}{delim}(?:is\s+)?([12]\.\d{{1,2}}){hsp}*(?:m\b|meter)", text, re.IGNORECASE))
                if ht_m_matches:
                    for m in ht_m_matches:
                        cm_val = round(float(m.group(1)) * 100.0, 1)
                        snippet = text[max(0, m.start() - 15):min(len(text), m.end() + 15)].strip()
                        results.append((cm_val, snippet, page_num, "cm"))
                    continue

                # Look for height with explicit cm (e.g. 174 cm, 35 cm)
                ht_cm_matches = list(re.finditer(rf"{pat}{delim}(?:is\s+)?(\d{{2,3}}(?:\.\d+)?){hsp}*cm\b", text, re.IGNORECASE))
                if ht_cm_matches:
                    for m in ht_cm_matches:
                        cm_val = round(float(m.group(1)), 1)
                        snippet = text[max(0, m.start() - 15):min(len(text), m.end() + 15)].strip()
                        results.append((cm_val, snippet, page_num, "cm"))
                    continue

                # Look for integer height with dropped 'c' or no unit (e.g. 174m, 174)
                ht_int_regex = re.compile(rf"{pat}{delim}(?:is\s+)?([12]\d{{2}}(?:\.\d+)?){hsp}*(?:m\b|(?=\s|$|[^\w]))", re.IGNORECASE)
                for m in ht_int_regex.finditer(text):
                    cm_val = round(float(m.group(1)), 1)
                    if 90.0 <= cm_val <= 260.0:
                        snippet = text[max(0, m.start() - 15):min(len(text), m.end() + 15)].strip()
                        results.append((cm_val, snippet, page_num, "cm"))
                continue

            # Special parsing for Weight: handles kg or lbs
            if alias == "Weight":
                # Look for lbs/pounds first: e.g. 176 lbs -> kg
                wt_lbs_matches = list(re.finditer(rf"{pat}{delim}(?:is\s+)?(\d{{2,3}}(?:\.\d+)?){hsp}*(lbs?|pounds?)\b", text, re.IGNORECASE))
                if wt_lbs_matches:
                    for m in wt_lbs_matches:
                        lbs_val = float(m.group(1))
                        kg_val = round(lbs_val * 0.45359237, 1)
                        snippet = text[max(0, m.start() - 15):min(len(text), m.end() + 15)].strip()
                        results.append((kg_val, snippet, page_num, "kg"))
                    continue

                # Handles kg explicitly or default
                wt_kg_regex = re.compile(rf"{pat}{delim}(?:is\s+)?(\d{{2,3}}(?:\.\d+)?)(?:{hsp}*(kg|kilos?))?\b", re.IGNORECASE)
                for m in wt_kg_regex.finditer(text):
                    kg_val = round(float(m.group(1)), 1)
                    if 20.0 <= kg_val <= 300.0:
                        snippet = text[max(0, m.start() - 15):min(len(text), m.end() + 15)].strip()
                        results.append((kg_val, snippet, page_num, "kg"))
                continue

            # Generic numeric pattern
            num_regex = re.compile(
                rf"{pat}{delim}(?:is\s+)?([<>]?\s*\d+(?:\.\d+)?)(?:{hsp}*([a-zA-Z/%^0-9]+))?",
                re.IGNORECASE
            )
            for m in num_regex.finditer(text):
                raw_val = m.group(1).replace("<", "").replace(">", "").strip()
                try:
                    val = float(raw_val)
                    detected_unit = m.group(2)
                    snippet = text[max(0, m.start() - 15):min(len(text), m.end() + 15)].strip()
                    results.append((val, snippet, page_num, detected_unit))
                except ValueError:
                    continue

        return results

    def _extract_binary_int(
        self,
        alias: str,
        defn: Dict[str, Any],
        text: str,
        page_num: int
    ) -> List[Tuple[int, str, int, Optional[str]]]:
        """Extracts 0 or 1 integer flags for medical conditions and ECG signs."""
        results = []
        aliases = defn["aliases"]

        hsp = r"[^\S\r\n]"
        delim = rf"(?:{hsp}*[\(\[][A-Za-z0-9\-_/ ]+[\)\]I|])?[\)\]I|]?(?:{hsp}*[:=\-]{hsp}*|{hsp}+)"
        pos_terms = r"(?:yes|positive|present|confirmed|history of|\+|(?:type\s*2\s*diabet(?:es|ic))|current|noted)"
        neg_terms = r"(?:no|negative|denies|absent|none|normal|never|-|without)"

        for pat in aliases:
            # Positive match: e.g. "Diabetes: Yes", "HTN: Present", "History of DM"
            pos_regex = re.compile(
                rf"(?:(?:history{hsp}+of{hsp}+)?{pat}{delim}{pos_terms}|(?:history{hsp}+of{hsp}+{pat}))",
                re.IGNORECASE
            )
            for m in pos_regex.finditer(text):
                snippet = text[max(0, m.start() - 10):min(len(text), m.end() + 10)].strip()
                results.append((1, snippet, page_num, None))

            # Negative match: e.g. "DM: No", "No history of Diabetes", "Denies HTN"
            neg_regex = re.compile(
                rf"(?:{pat}{delim}{neg_terms}|(?:no{hsp}+(?:history{hsp}+of{hsp}+)?{pat})|(?:denies{hsp}+{pat}))",
                re.IGNORECASE
            )
            for m in neg_regex.finditer(text):
                snippet = text[max(0, m.start() - 10):min(len(text), m.end() + 10)].strip()
                results.append((0, snippet, page_num, None))

            # Direct 0 or 1 notation: e.g. "DM: 1", "Edema: 0"
            digit_regex = re.compile(rf"{pat}{delim}([01])\b", re.IGNORECASE)
            for m in digit_regex.finditer(text):
                val = int(m.group(1))
                snippet = text[max(0, m.start() - 10):min(len(text), m.end() + 10)].strip()
                results.append((val, snippet, page_num, None))

        return results

    def _extract_binary_str(
        self,
        alias: str,
        defn: Dict[str, Any],
        text: str,
        page_num: int
    ) -> List[Tuple[str, str, int, Optional[str]]]:
        """Extracts 'Y' or 'N' string flags for medical conditions."""
        results = []
        aliases = defn["aliases"]

        hsp = r"[^\S\r\n]"
        delim = rf"(?:{hsp}*[\(\[][A-Za-z0-9\-_/ ]+[\)\]I|])?[\)\]I|]?(?:{hsp}*[:=\-]{hsp}*|{hsp}+)"
        pos_terms = r"(?:y|yes|positive|present|noted|confirmed|\+)"
        neg_terms = r"(?:n|no|negative|absent|none|denies|-)"

        for pat in aliases:
            # Positive: maps to 'Y'
            pos_regex = re.compile(
                rf"(?:{pat}{delim}{pos_terms}|(?:history{hsp}+of{hsp}+{pat}))",
                re.IGNORECASE
            )
            for m in pos_regex.finditer(text):
                snippet = text[max(0, m.start() - 10):min(len(text), m.end() + 10)].strip()
                results.append(("Y", snippet, page_num, None))

            # Negative: maps to 'N'
            neg_regex = re.compile(
                rf"(?:{pat}{delim}{neg_terms}|(?:no{hsp}+{pat})|(?:denies{hsp}+{pat}))",
                re.IGNORECASE
            )
            for m in neg_regex.finditer(text):
                snippet = text[max(0, m.start() - 10):min(len(text), m.end() + 10)].strip()
                results.append(("N", snippet, page_num, None))

            # Direct 0 or 1 notation for binary string features: 0 -> 'N', 1 -> 'Y'
            digit_regex = re.compile(rf"{pat}{delim}([01])\b", re.IGNORECASE)
            for m in digit_regex.finditer(text):
                digit_val = m.group(1)
                val = "Y" if digit_val == "1" else "N"
                snippet = text[max(0, m.start() - 10):min(len(text), m.end() + 10)].strip()
                results.append((val, snippet, page_num, None))

        return results

    def _extract_categorical_choice(
        self,
        alias: str,
        defn: Dict[str, Any],
        text: str,
        page_num: int
    ) -> List[Tuple[Any, str, int, Optional[str]]]:
        """Extracts specific enumerated categorical variables."""
        results = []
        hsp = r"[^\S\r\n]"
        delim = rf"(?:{hsp}*[\(\[][A-Za-z0-9\-_/ ]+[\)\]I|])?[\)\]I|]?(?:{hsp}*[:=\-]{hsp}*|{hsp}+)"

        if alias == "Sex":
            # Match Female / Male
            for m in re.finditer(rf"\b(?:sex|gender){delim}(female|male|f|m)\b", text, re.IGNORECASE):
                raw = m.group(1).lower()
                val = "Female" if raw in ["female", "f"] else "Male"
                snippet = text[max(0, m.start() - 10):min(len(text), m.end() + 10)].strip()
                results.append((val, snippet, page_num, None))

        elif alias == "Function Class":
            # Match NYHA Class: 0, 1, 2, 3 or I, II, III, IV
            for m in re.finditer(
                rf"\b(?:function|functional|nyha)(?:\s+class)?{delim}(?:class\s+)?([0-3]|iv|iii|ii|i)\b",
                text,
                re.IGNORECASE
            ):
                raw = m.group(1).lower()
                roman_map = {"i": 1, "ii": 2, "iii": 3, "iv": 3, "0": 0, "1": 1, "2": 2, "3": 3}
                val = roman_map.get(raw, 0)
                snippet = text[max(0, m.start() - 10):min(len(text), m.end() + 10)].strip()
                results.append((val, snippet, page_num, None))

        elif alias == "BBB":
            # Match Bundle Branch Block: 'N', 'LBBB', 'RBBB'
            for m in re.finditer(rf"\b(?:bbb|bundle\s+branch\s+block){delim}(lbbb|rbbb|none|no|n|normal)\b", text, re.IGNORECASE):
                raw = m.group(1).upper()
                val = "LBBB" if "LBBB" in raw else ("RBBB" if "RBBB" in raw else "N")
                snippet = text[max(0, m.start() - 10):min(len(text), m.end() + 10)].strip()
                results.append((val, snippet, page_num, None))

        elif alias == "Region RWMA":
            # Regional Wall Motion Abnormality score: 0 to 4
            for m in re.finditer(
                rf"\b(?:(?:region(?:\s+with)?\s+)?regional\s+wall\s+motion\s+abnormality|region\s+rwma|rwma){delim}(?:score\s+)?([0-4])\b",
                text,
                re.IGNORECASE
            ):
                val = int(m.group(1))
                snippet = text[max(0, m.start() - 10):min(len(text), m.end() + 10)].strip()
                results.append((val, snippet, page_num, None))

        elif alias == "VHD":
            # Valvular Heart Disease: "Normal", "Mild", "Moderate", "Severe"
            for m in re.finditer(
                rf"\b(?:vhd|valvular\s+heart\s+disease){delim}(normal|none|mild|moderate|severe)\b",
                text,
                re.IGNORECASE
            ):
                raw = m.group(1).capitalize()
                val = "Normal" if raw in ["Normal", "None"] else raw
                if val in ["Normal", "Mild", "Moderate", "Severe"]:
                    snippet = text[max(0, m.start() - 10):min(len(text), m.end() + 10)].strip()
                    results.append((val, snippet, page_num, None))

        return results
