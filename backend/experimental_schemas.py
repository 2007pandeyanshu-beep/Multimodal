"""
backend/experimental_schemas.py - Pydantic Request & Response Validation Schemas for Experimental Models
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Defines response structures for experimental model inference incorporating:
- Provisional classification thresholds
- Model architecture metadata
- Standard vs threshold-adjusted class labels
- Explicit research prototype disclaimers
"""

from typing import Dict, List, Literal, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.schemas import PatientInput, TargetPrediction


# Enhanced target prediction schema exposing provisional threshold metadata
class ExperimentalTargetPrediction(BaseModel):
    target: str = Field(..., description="Target name ('Cath', 'LAD', 'LCX', 'RCA')")
    predicted_class: int = Field(..., description="Threshold-adjusted binary predicted class (0 or 1)")
    predicted_label: str = Field(..., description="Human-readable class label based on applied threshold")
    probability: float = Field(..., ge=0.0, le=1.0, description="Raw statistical probability of positive class [0.0, 1.0]")
    applied_threshold: float = Field(..., ge=0.0, le=1.0, description="Decision threshold applied to positive class probability")
    threshold_strategy: str = Field(..., description="Threshold selection objective (e.g. 'f1_optimized', 'youden_j')")
    threshold_status: str = Field(default="provisional", description="Status of the decision threshold ('provisional')")
    model_name: str = Field(..., description="Candidate model name (e.g. 'SoftVoting', 'RandomForest', 'Stacking')")
    model_type: str = Field(..., description="Underlying scikit-learn classifier class name")
    standard_class: int = Field(..., description="Standard unadjusted binary class at default T=0.50")
    standard_label: str = Field(..., description="Standard unadjusted class label at default T=0.50")


# Response for single patient prediction via experimental pipeline
class ExperimentalPredictionResponse(BaseModel):
    predictions: Dict[str, ExperimentalTargetPrediction] = Field(
        ..., description="Map of target predictions containing threshold metadata"
    )
    disclaimer: str = Field(..., description="Mandatory research prototype disclaimer")
    pipeline_type: str = Field(default="experimental", description="Pipeline category ('experimental')")
    artifacts_source: str = Field(default="ml/experimental_artifacts", description="Source directory for serialized models")


# Batch prediction patient item
class ExperimentalBatchPatientResult(BaseModel):
    patient_index: int = Field(..., description="Zero-based patient index in original batch request")
    predictions: Dict[str, ExperimentalTargetPrediction] = Field(..., description="Target predictions for this patient")


# Response for batch predictions via experimental pipeline
class ExperimentalBatchPredictionResponse(BaseModel):
    results: List[ExperimentalBatchPatientResult] = Field(..., description="List of per-patient prediction results")
    total_patients: int = Field(..., description="Total patient count processed")
    disclaimer: str = Field(..., description="Mandatory research prototype disclaimer")
    pipeline_type: str = Field(default="experimental", description="Pipeline category ('experimental')")
    artifacts_source: str = Field(default="ml/experimental_artifacts", description="Source directory for serialized models")


# Health status for experimental models
class ExperimentalHealthResponse(BaseModel):
    status: str = Field(..., description="'healthy' if all experimental models loaded, else 'degraded'")
    pipeline_type: str = Field(default="experimental", description="Pipeline identifier")
    models_loaded: Dict[str, bool] = Field(..., description="Per-target loading status")
    all_models_ready: bool = Field(..., description="True if all 4 experimental target models are ready")
    artifacts_directory: str = Field(..., description="Path to experimental artifacts")


# Metadata response for experimental pipeline
class ExperimentalMetadataResponse(BaseModel):
    project: str = Field(..., description="Project title")
    version: str = Field(..., description="API version")
    pipeline_type: str = Field(default="experimental", description="Pipeline category")
    prototype_disclaimer: str = Field(..., description="Research disclaimer")
    artifacts_source: str = Field(..., description="Directory containing experimental artifacts")
    targets: Dict[str, Any] = Field(..., description="Per-target architecture, provisional thresholds, and evidence")
    feature_schema: Dict[str, Any] = Field(..., description="Input feature counts and permitted feature lists")
