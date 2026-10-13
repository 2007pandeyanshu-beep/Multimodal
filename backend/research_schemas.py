"""
backend/research_schemas.py - Pydantic Request & Response Validation Schemas for 23-Feature Research Models
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Strictly isolated from production PatientInput and schemas.py.
Validates the exact 23 clinical features required by Augmented_23 models:
- 13 numerical measurements (bounded physiological ranges)
- 10 categorical / binary flags
Rejects any extra, missing, malformed, or out-of-range fields with HTTP 422.
"""

from typing import Dict, List, Literal, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class PatientInput23(BaseModel):
    """
    Strict 23-feature patient intake schema for research candidate models.
    Enforces extra='forbid' to reject any pruned or unexpected fields.
    """
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    # 1. Demographics & Physical Measurements (3 features)
    age: float = Field(..., alias="Age", ge=18.0, le=120.0, description="Age in years")
    sex: Literal["Female", "Male"] = Field(..., alias="Sex", description="Biological sex ('Female'/'Male')")
    bmi: float = Field(..., alias="BMI", ge=10.0, le=80.0, description="Body Mass Index (kg/m^2)")

    # 2. Vital Signs (2 features)
    bp: float = Field(..., alias="BP", ge=50.0, le=250.0, description="Systolic Blood Pressure (mmHg)")
    pr: float = Field(..., alias="PR", ge=30.0, le=220.0, description="Pulse Rate (bpm)")

    # 3. Medical History & Lifestyle (3 features)
    dm: Literal[0, 1] = Field(..., alias="DM", description="Diabetes Mellitus (0=No, 1=Yes)")
    htn: Literal[0, 1] = Field(..., alias="HTN", description="Hypertension (0=No, 1=Yes)")
    current_smoker: Literal[0, 1] = Field(..., alias="Current Smoker", description="Current smoker (0=No, 1=Yes)")

    # 4. Symptoms & Clinical Status (2 features)
    typical_chest_pain: Literal[0, 1] = Field(..., alias="Typical Chest Pain", description="Typical angina (0=No, 1=Yes)")
    dyspnea: Literal["Y", "N"] = Field(..., alias="Dyspnea", description="Dyspnea / shortness of breath ('Y'/'N')")

    # 5. Electrocardiography (3 features)
    st_elevation: Literal[0, 1] = Field(..., alias="St Elevation", description="ST-segment elevation (0=No, 1=Yes)")
    st_depression: Literal[0, 1] = Field(..., alias="St Depression", description="ST-segment depression (0=No, 1=Yes)")
    poor_r_progression: Literal["Y", "N"] = Field(..., alias="Poor R Progression", description="Poor R wave progression on ECG ('Y'/'N')")

    # 6. Echocardiography (2 features)
    ef_tte: float = Field(..., alias="EF-TTE", ge=5.0, le=90.0, description="Transthoracic Ejection Fraction (%)")
    region_rwma: Literal[0, 1, 2, 3, 4] = Field(..., alias="Region RWMA", description="Regional Wall Motion Abnormality score (0-4)")

    # 7. Laboratory Blood Panels (8 features)
    fbs: float = Field(..., alias="FBS", ge=20.0, le=800.0, description="Fasting Blood Sugar (mg/dL)")
    cr: float = Field(..., alias="CR", ge=0.1, le=15.0, description="Serum Creatinine (mg/dL)")
    ldl: float = Field(..., alias="LDL", ge=5.0, le=500.0, description="LDL Cholesterol (mg/dL)")
    hdl: float = Field(..., alias="HDL", ge=5.0, le=200.0, description="HDL Cholesterol (mg/dL)")
    tg: float = Field(..., alias="TG", ge=10.0, le=2000.0, description="Serum Triglycerides (mg/dL)")
    esr: float = Field(..., alias="ESR", ge=0.0, le=150.0, description="Erythrocyte Sedimentation Rate (mm/hr)")
    bun: float = Field(..., alias="BUN", ge=1.0, le=150.0, description="Blood Urea Nitrogen (mg/dL)")
    neut: float = Field(..., alias="Neut", ge=0.0, le=100.0, description="Neutrophil percentage (%)")


class ResearchTargetPrediction(BaseModel):
    """Prediction results for a single anatomical target in research pipeline."""
    target: str = Field(..., description="Target name ('Cath', 'LAD', 'LCX', 'RCA')")
    predicted_class: int = Field(..., description="Binary predicted class (0 or 1)")
    predicted_label: str = Field(..., description="Human-readable class label ('CAD', 'Stenotic', or 'Normal')")
    probability: float = Field(..., ge=0.0, le=1.0, description="Statistical probability of positive class [0.0, 1.0]")
    model_type: str = Field(..., description="Model architecture family (e.g. 'SoftVoting', 'RandomForest', 'Stacking')")
    positive_label: str = Field(..., description="Positive class label")
    negative_label: str = Field(..., description="Negative class label")
    applied_threshold: float = Field(0.50, description="Decision threshold applied to positive class probability")


class ResearchPredictionResponse(BaseModel):
    """Response returned by /research-23/predict for a single patient."""
    predictions: Dict[str, ResearchTargetPrediction]
    feature_set: str = "Augmented_23"
    features_used_count: int = 23
    disclaimer: str
    pipeline_type: str = "research_augmented_23"
    artifacts_source: str = "ml/research_artifacts_23"


class ResearchBatchPredictionRequest(BaseModel):
    """Batch prediction request for 23-feature research models."""
    model_config = ConfigDict(extra="forbid")
    patients: List[PatientInput23] = Field(..., min_length=1, description="List of patient records (bounded by MAX_BATCH_SIZE)")


class ResearchBatchPatientResult(BaseModel):
    """Batch item result containing patient index and predictions."""
    patient_index: int
    predictions: Dict[str, ResearchTargetPrediction]


class ResearchBatchPredictionResponse(BaseModel):
    """Batch prediction response for 23-feature research models."""
    results: List[ResearchBatchPatientResult]
    total_patients: int
    feature_set: str = "Augmented_23"
    disclaimer: str
    pipeline_type: str = "research_augmented_23"
    artifacts_source: str = "ml/research_artifacts_23"


class ResearchHealthResponse(BaseModel):
    """Health check response for research 23-feature models."""
    status: str
    pipeline_type: str = "research_augmented_23"
    models_loaded: Dict[str, bool]
    all_models_ready: bool
    artifacts_directory: str
    version: str


class ResearchMetadataResponse(BaseModel):
    """Metadata response detailing 23-feature schema and candidate architectures."""
    project: str
    version: str
    pipeline_type: str = "research_augmented_23"
    is_production: bool = False
    research_only: bool = True
    disclaimer: str
    artifacts_source: str = "ml/research_artifacts_23"
    feature_schema: Dict[str, Any]
    models: Dict[str, Any]
