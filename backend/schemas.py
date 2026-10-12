"""
backend/schemas.py - Pydantic Request & Response Validation Schemas
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

from typing import Dict, List, Literal, Any, Union, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


# Strict 54-feature patient input schema
class PatientInput(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    # 1. Demographics & Physical Measurements (5 features)
    age: float = Field(..., alias="Age", ge=18, le=120, description="Age in years")
    weight: float = Field(..., alias="Weight", ge=20.0, le=300.0, description="Weight in kg")
    length: float = Field(..., alias="Length", ge=100.0, le=250.0, description="Height in cm")
    sex: Literal["Female", "Male"] = Field(..., alias="Sex", description="Biological sex")
    bmi: float = Field(..., alias="BMI", ge=10.0, le=80.0, description="Body Mass Index (kg/m^2)")

    # 2. Medical History & Lifestyle (12 features)
    dm: Literal[0, 1] = Field(..., alias="DM", description="Diabetes Mellitus (0=No, 1=Yes)")
    htn: Literal[0, 1] = Field(..., alias="HTN", description="Hypertension (0=No, 1=Yes)")
    current_smoker: Literal[0, 1] = Field(..., alias="Current Smoker", description="Current smoker (0=No, 1=Yes)")
    ex_smoker: Literal[0, 1] = Field(..., alias="EX-Smoker", description="Ex-smoker (0=No, 1=Yes)")
    fh: Literal[0, 1] = Field(..., alias="FH", description="Family History of CAD (0=No, 1=Yes)")
    obesity: Literal["Y", "N"] = Field(..., alias="Obesity", description="Obesity status ('Y'/'N')")
    crf: Literal["Y", "N"] = Field(..., alias="CRF", description="Chronic Renal Failure ('Y'/'N')")
    cva: Literal["Y", "N"] = Field(..., alias="CVA", description="Cerebrovascular Accident / Stroke ('Y'/'N')")
    airway_disease: Literal["Y", "N"] = Field(..., alias="Airway disease", description="Chronic Airway Disease ('Y'/'N')")
    thyroid_disease: Literal["Y", "N"] = Field(..., alias="Thyroid Disease", description="Thyroid Disease ('Y'/'N')")
    chf: Literal["Y", "N"] = Field(..., alias="CHF", description="Congestive Heart Failure ('Y'/'N')")
    dlp: Literal["Y", "N"] = Field(..., alias="DLP", description="Dyslipidemia ('Y'/'N')")

    # 3. Vital Signs & Physical Examination (7 features)
    bp: float = Field(..., alias="BP", ge=50.0, le=250.0, description="Systolic Blood Pressure (mmHg)")
    pr: float = Field(..., alias="PR", ge=30.0, le=220.0, description="Pulse Rate (bpm)")
    edema: Literal[0, 1] = Field(..., alias="Edema", description="Peripheral edema (0=No, 1=Yes)")
    weak_peripheral_pulse: Literal["Y", "N"] = Field(..., alias="Weak Peripheral Pulse", description="Weak peripheral pulse ('Y'/'N')")
    lung_rales: Literal["Y", "N"] = Field(..., alias="Lung rales", description="Lung rales on auscultation ('Y'/'N')")
    systolic_murmur: Literal["Y", "N"] = Field(..., alias="Systolic Murmur", description="Systolic cardiac murmur ('Y'/'N')")
    diastolic_murmur: Literal["Y", "N"] = Field(..., alias="Diastolic Murmur", description="Diastolic cardiac murmur ('Y'/'N')")

    # 4. Symptoms & Clinical Status (7 features)
    typical_chest_pain: Literal[0, 1] = Field(..., alias="Typical Chest Pain", description="Typical angina chest pain (0=No, 1=Yes)")
    dyspnea: Literal["Y", "N"] = Field(..., alias="Dyspnea", description="Dyspnea / shortness of breath ('Y'/'N')")
    function_class: Literal[0, 1, 2, 3] = Field(..., alias="Function Class", description="NYHA Functional Class (0, 1, 2, 3)")
    atypical: Literal["Y", "N"] = Field(..., alias="Atypical", description="Atypical chest pain ('Y'/'N')")
    nonanginal: Literal["Y", "N"] = Field(..., alias="Nonanginal", description="Non-anginal chest pain ('Y'/'N')")
    lowth_ang: Literal["Y", "N"] = Field(..., alias="LowTH Ang", description="Low threshold angina ('Y'/'N')")

    # 5. Electrocardiography (7 features)
    q_wave: Literal[0, 1] = Field(..., alias="Q Wave", description="Pathological Q wave on ECG (0=No, 1=Yes)")
    st_elevation: Literal[0, 1] = Field(..., alias="St Elevation", description="ST-segment elevation on ECG (0=No, 1=Yes)")
    st_depression: Literal[0, 1] = Field(..., alias="St Depression", description="ST-segment depression on ECG (0=No, 1=Yes)")
    tinversion: Literal[0, 1] = Field(..., alias="Tinversion", description="T-wave inversion on ECG (0=No, 1=Yes)")
    lvh: Literal["Y", "N"] = Field(..., alias="LVH", description="Left Ventricular Hypertrophy ('Y'/'N')")
    poor_r_progression: Literal["Y", "N"] = Field(..., alias="Poor R Progression", description="Poor R wave progression on ECG ('Y'/'N')")
    bbb: Literal["N", "LBBB", "RBBB"] = Field(..., alias="BBB", description="Bundle Branch Block ('N', 'LBBB', 'RBBB')")

    # 6. Laboratory Blood Panels (13 features)
    fbs: float = Field(..., alias="FBS", ge=20.0, le=800.0, description="Fasting Blood Sugar (mg/dL)")
    cr: float = Field(..., alias="CR", ge=0.1, le=15.0, description="Serum Creatinine (mg/dL)")
    tg: float = Field(..., alias="TG", ge=10.0, le=2000.0, description="Serum Triglycerides (mg/dL)")
    ldl: float = Field(..., alias="LDL", ge=5.0, le=500.0, description="LDL Cholesterol (mg/dL)")
    hdl: float = Field(..., alias="HDL", ge=5.0, le=200.0, description="HDL Cholesterol (mg/dL)")
    bun: float = Field(..., alias="BUN", ge=1.0, le=150.0, description="Blood Urea Nitrogen (mg/dL)")
    esr: float = Field(..., alias="ESR", ge=0.0, le=150.0, description="Erythrocyte Sedimentation Rate (mm/hr)")
    hb: float = Field(..., alias="HB", ge=3.0, le=25.0, description="Hemoglobin (g/dL)")
    k: float = Field(..., alias="K", ge=1.0, le=10.0, description="Serum Potassium (mEq/L)")
    na: float = Field(..., alias="Na", ge=90.0, le=180.0, description="Serum Sodium (mEq/L)")
    wbc: float = Field(..., alias="WBC", ge=500.0, le=50000.0, description="White Blood Cell count (cells/mcL)")
    lymph: float = Field(..., alias="Lymph", ge=0.0, le=100.0, description="Lymphocyte percentage (%)")
    neut: float = Field(..., alias="Neut", ge=0.0, le=100.0, description="Neutrophil percentage (%)")
    plt: float = Field(..., alias="PLT", ge=5.0, le=1500.0, description="Platelet count (10^3/mcL)")

    # 7. Echocardiography (3 features)
    ef_tte: float = Field(..., alias="EF-TTE", ge=5.0, le=90.0, description="Transthoracic Ejection Fraction (%)")
    region_rwma: Literal[0, 1, 2, 3, 4] = Field(..., alias="Region RWMA", description="Regional Wall Motion Abnormality score (0-4)")
    vhd: Literal["Normal", "Mild", "Moderate", "Severe"] = Field(..., alias="VHD", description="Valvular Heart Disease status")


class TargetPrediction(BaseModel):
    target: str = Field(..., description="Target name ('Cath', 'LAD', 'LCX', 'RCA')")
    predicted_class: int = Field(..., description="Binary predicted class (0 or 1)")
    predicted_label: str = Field(..., description="Human-readable class label (e.g. 'CAD' or 'Normal')")
    probability: float = Field(..., ge=0.0, le=1.0, description="Statistical probability of positive class [0.0, 1.0]")


class PredictionResponse(BaseModel):
    predictions: Dict[str, TargetPrediction]
    disclaimer: str


class BatchPredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    patients: List[PatientInput] = Field(..., min_length=1, description="List of patients (bounded by MAX_BATCH_SIZE)")


class BatchPatientResult(BaseModel):
    patient_index: int
    predictions: Dict[str, TargetPrediction]


class BatchPredictionResponse(BaseModel):
    results: List[BatchPatientResult]
    total_patients: int
    disclaimer: str


class HealthResponse(BaseModel):
    status: str
    models_loaded: Dict[str, bool]
    all_models_ready: bool
    version: str


class MetadataResponse(BaseModel):
    project: str
    version: str
    prototype_disclaimer: str
    targets: Dict[str, Any]
    total_input_features: int
    numerical_features: List[str]
    categorical_features: List[str]
    forbidden_features: List[str]
    model_type: str
    validation_methodology: str


# Dedicated Explainability Schemas (Phase 4.1)
EXPLAINABILITY_DISCLAIMER: str = (
    "Research prototype output for Multimodal AI Hackathon 2026 (Track A). "
    "SHAP feature attributions represent statistical model-behavior shifts (in probability units) "
    "relative to the balanced tree prior for this single-center cohort (N=303). "
    "They reflect correlational decision logic of the fitted Random Forest models, "
    "NOT biological causality, clinical diagnosis, or treatment recommendations."
)


class FeatureAttribution(BaseModel):
    feature_name: str = Field(..., description="Canonical clinical feature name")
    submitted_value: Any = Field(..., description="Patient input value for this feature")
    contribution: float = Field(..., description="Signed SHAP contribution in probability units (fraction)")


class TargetExplanation(BaseModel):
    target: str = Field(..., description="Target name ('Cath', 'LAD', 'LCX', 'RCA')")
    predicted_probability: float = Field(..., ge=0.0, le=1.0, description="Predicted positive-class probability from the existing prediction pipeline")
    predicted_class: int = Field(..., description="Binary predicted class (0 or 1) using existing model behavior")
    predicted_label: str = Field(..., description="Human-readable class label (e.g. 'CAD' or 'Normal')")
    base_value: float = Field(..., description="Model-specific SHAP baseline in probability units")
    attributions: List[FeatureAttribution] = Field(..., description="Canonical feature attributions ordered by authoritative schema")
    sum_attributions: float = Field(..., description="Sum of all 54 canonical feature attributions")
    reconstructed_probability: float = Field(..., description="Reconstructed probability (base_value + sum_attributions)")
    additivity_discrepancy: float = Field(..., description="Absolute additivity discrepancy abs(reconstructed_probability - predicted_probability)")
    output_space: str = Field(default="probability", description="Explicit output space description (probability units [0.0, 1.0])")
    disclaimer: str = Field(default=EXPLAINABILITY_DISCLAIMER, description="Scientific research disclaimer")


class ExplainRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    patient: PatientInput = Field(..., description="Validated 54-feature patient input")
    targets: Optional[List[str]] = Field(default=None, description="Optional list of target names; defaults to all four targets")

    @field_validator("targets")
    @classmethod
    def validate_targets(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        if len(v) == 0:
            raise ValueError("Target list cannot be empty. Specify at least one valid target or omit field.")
        valid_targets = {"Cath", "LAD", "LCX", "RCA"}
        seen = set()
        for t in v:
            if t not in valid_targets:
                raise ValueError(f"Invalid target '{t}'. Allowed targets: {sorted(list(valid_targets))}.")
            if t in seen:
                raise ValueError(f"Duplicate target '{t}' found in targets list. Targets must be unique.")
            seen.add(t)
        return v


class ExplainResponse(BaseModel):
    explanations: Dict[str, TargetExplanation] = Field(..., description="Map of target explanations for requested targets")
    disclaimer: str = Field(default=EXPLAINABILITY_DISCLAIMER, description="Scientific research prototype disclaimer")


class GlobalFeatureImportanceItem(BaseModel):
    rank: int = Field(..., ge=1, le=54, description="Importance rank (1-indexed)")
    feature_name: str = Field(..., description="Canonical clinical feature name")
    mean_absolute_shap: float = Field(..., ge=0.0, description="Mean absolute SHAP contribution in probability units (fraction)")


class TargetGlobalShapResponse(BaseModel):
    target: str = Field(..., description="Target vessel / outcome ('Cath', 'LAD', 'LCX', 'RCA')")
    cohort_name: str = Field(default="Tehran Heart Center Cohort", description="Cohort study name")
    sample_size: int = Field(default=303, description="Cohort patient count used for SHAP expectation")
    calculation_method: str = Field(
        default="mean(abs(canonical_SHAP_contribution)) across cohort",
        description="Mathematical attribution method"
    )
    output_space: str = Field(default="probability", description="Output space of model predictions and SHAP values")
    top_features: List[GlobalFeatureImportanceItem] = Field(..., description="Top canonical features ranked by mean |SHAP| descending")


class GlobalShapSummaryResponse(BaseModel):
    targets: Dict[str, TargetGlobalShapResponse] = Field(..., description="Global SHAP summaries keyed by target name")
    cohort_name: str = Field(default="Tehran Heart Center Cohort", description="Cohort study name")
    sample_size: int = Field(default=303, description="Cohort patient count")
    calculation_method: str = Field(
        default="TreeSHAP path-dependent perturbation with canonical one-hot feature aggregation",
        description="SHAP calculation method"
    )
    disclaimer: str = Field(default=EXPLAINABILITY_DISCLAIMER, description="Scientific research prototype disclaimer")
