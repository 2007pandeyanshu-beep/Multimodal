"""
backend/research_routes.py - Isolated FastAPI Endpoints for 23-Feature Research Models
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Exposes dedicated endpoints under prefix '/research-23':
- GET  /research-23/health
- GET  /research-23/metadata
- POST /research-23/predict
- POST /research-23/predict/batch

Operates completely isolated from production /predict and experimental routes.
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status

from backend.config import APP_VERSION, MAX_BATCH_SIZE
from backend.research_schemas import (
    PatientInput23,
    ResearchPredictionResponse,
    ResearchTargetPrediction,
    ResearchBatchPredictionRequest,
    ResearchBatchPredictionResponse,
    ResearchBatchPatientResult,
    ResearchHealthResponse,
    ResearchMetadataResponse
)
from backend.research_model_loader import (
    research23_model_manager,
    RESEARCH_ARTIFACTS_DIR
)

logger = logging.getLogger("backend.research_routes")

router = APIRouter(prefix="/research-23", tags=["Research Candidates (Augmented_23)"])

RESEARCH_DISCLAIMER = (
    "Research prototype output for Track A: Cardiovascular Risk Visualization & Prediction. "
    "Not a clinical diagnostic device. Model probabilities reflect statistical estimates from "
    "retrospective research data (N=303) evaluated on a 23-feature schema (Augmented_23). "
    "Outputs must NOT be used for clinical diagnosis, patient triage, or medical treatment decisions."
)


@router.get(
    "/health",
    response_model=ResearchHealthResponse,
    summary="Research 23-Feature Models Health Check"
)
async def research_health_check():
    """Returns loading status and readiness for all 4 research candidate pipelines."""
    status_map = research23_model_manager.get_status()
    all_ready = research23_model_manager.is_all_ready()
    return ResearchHealthResponse(
        status="healthy" if all_ready else "degraded",
        pipeline_type="research_augmented_23",
        models_loaded=status_map,
        all_models_ready=all_ready,
        artifacts_directory=str(RESEARCH_ARTIFACTS_DIR),
        version=APP_VERSION
    )


@router.get(
    "/metadata",
    response_model=ResearchMetadataResponse,
    summary="Research Feature Schema, Candidate Architectures & Disclaimers"
)
async def get_research_metadata():
    """Returns the exact 23-feature schema, numerical/categorical splits, and candidate model details."""
    meta = research23_model_manager.metadata
    if not meta:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Research metadata not loaded. Check ml/research_artifacts_23/model_metadata.json."
        )

    return ResearchMetadataResponse(
        project="Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction",
        version=APP_VERSION,
        pipeline_type="research_augmented_23",
        is_production=False,
        research_only=True,
        disclaimer=RESEARCH_DISCLAIMER,
        artifacts_source="ml/research_artifacts_23",
        feature_schema=meta.get("feature_schema", {}),
        models=meta.get("models", {})
    )


@router.post(
    "/predict",
    response_model=ResearchPredictionResponse,
    summary="Predict Cardiovascular Risk with 23-Feature Research Models"
)
async def predict_single_research(patient: PatientInput23):
    """
    Accepts the strict 23 clinical parameters of Augmented_23 and returns
    research model predictions and probabilities for Cath, LAD, LCX, and RCA.
    """
    if not research23_model_manager.is_all_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Research models are not initialized or failed to load. Check /research-23/health."
        )

    try:
        patient_dict = patient.model_dump(by_alias=True)
        raw_preds = research23_model_manager.predict_single(patient_dict)

        formatted_preds = {
            t: ResearchTargetPrediction(
                target=item["target"],
                predicted_class=item["predicted_class"],
                predicted_label=item["predicted_label"],
                probability=item["probability"],
                model_type=item["model_type"],
                positive_label=item["positive_label"],
                negative_label=item["negative_label"],
                applied_threshold=item["applied_threshold"]
            )
            for t, item in raw_preds.items()
        }

        return ResearchPredictionResponse(
            predictions=formatted_preds,
            feature_set="Augmented_23",
            features_used_count=len(research23_model_manager.ordered_features),
            disclaimer=RESEARCH_DISCLAIMER,
            pipeline_type="research_augmented_23",
            artifacts_source="ml/research_artifacts_23"
        )
    except Exception as e:
        logger.error(f"Research single inference execution error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during research prediction inference: {str(e)}"
        )


@router.post(
    "/predict/batch",
    response_model=ResearchBatchPredictionResponse,
    summary="Batch Predict Risk with 23-Feature Research Models"
)
async def predict_batch_research(batch_request: ResearchBatchPredictionRequest):
    """
    Accepts a list of 23-feature patient records (up to MAX_BATCH_SIZE) and returns
    vectorized research model predictions preserving patient index ordering.
    """
    if not research23_model_manager.is_all_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Research models are not initialized or failed to load. Check /research-23/health."
        )

    patients = batch_request.patients
    if len(patients) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch list cannot be empty."
        )
    if len(patients) > MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Batch size {len(patients)} exceeds maximum allowed limit of {MAX_BATCH_SIZE}."
        )

    try:
        patient_dicts = [p.model_dump(by_alias=True) for p in patients]
        batch_raw_results = research23_model_manager.predict_batch(patient_dicts)

        formatted_results = []
        for item in batch_raw_results:
            idx = item["patient_index"]
            patient_preds = {
                t: ResearchTargetPrediction(
                    target=p["target"],
                    predicted_class=p["predicted_class"],
                    predicted_label=p["predicted_label"],
                    probability=p["probability"],
                    model_type=p["model_type"],
                    positive_label=p["positive_label"],
                    negative_label=p["negative_label"],
                    applied_threshold=p["applied_threshold"]
                )
                for t, p in item["predictions"].items()
            }
            formatted_results.append(ResearchBatchPatientResult(
                patient_index=idx,
                predictions=patient_preds
            ))

        return ResearchBatchPredictionResponse(
            results=formatted_results,
            total_patients=len(patients),
            feature_set="Augmented_23",
            disclaimer=RESEARCH_DISCLAIMER,
            pipeline_type="research_augmented_23",
            artifacts_source="ml/research_artifacts_23"
        )
    except Exception as e:
        logger.error(f"Research batch inference execution error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during research batch inference processing: {str(e)}"
        )
