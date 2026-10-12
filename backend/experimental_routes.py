"""
backend/experimental_routes.py - Isolated FastAPI Endpoints for Experimental Inference
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Provides isolated inference endpoints for candidate model architectures:
- POST /predict/experimental
- POST /predict/experimental/batch
- GET  /metadata/experimental
- GET  /health/experimental

Applies provisional decision thresholds without altering existing production routes.
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status

from backend.config import APP_VERSION, MAX_BATCH_SIZE
from backend.schemas import PatientInput, BatchPredictionRequest
from backend.experimental_schemas import (
    ExperimentalPredictionResponse, ExperimentalTargetPrediction,
    ExperimentalBatchPredictionResponse, ExperimentalBatchPatientResult,
    ExperimentalHealthResponse, ExperimentalMetadataResponse
)
from backend.experimental_model_loader import (
    experimental_model_manager, EXPERIMENTAL_ARTIFACTS_DIR
)
from ml.transformers import TARGET_CONFIG

logger = logging.getLogger("backend.experimental_routes")

router = APIRouter(prefix="", tags=["Experimental Inference (Isolated)"])

EXPERIMENTAL_DISCLAIMER = (
    "Experimental prototype output. Isolated from production ml/artifacts/. "
    "Not a clinical diagnostic device. Model probabilities reflect statistical "
    "estimates from single-center research data (N=303), and decision thresholds "
    "are provisional cross-validation benchmarks. Must not replace professional clinical judgment."
)


@router.get(
    "/health/experimental",
    response_model=ExperimentalHealthResponse,
    summary="Experimental Models Health Probe"
)
async def experimental_health_check():
    """Returns loading status and readiness for all 4 experimental target pipelines."""
    status_map = experimental_model_manager.get_status()
    all_ready = experimental_model_manager.is_all_ready()
    return ExperimentalHealthResponse(
        status="healthy" if all_ready else "degraded",
        pipeline_type="experimental",
        models_loaded=status_map,
        all_models_ready=all_ready,
        artifacts_directory=str(EXPERIMENTAL_ARTIFACTS_DIR)
    )


@router.get(
    "/metadata/experimental",
    response_model=ExperimentalMetadataResponse,
    summary="Experimental Metadata, Architectures & Provisional Thresholds"
)
async def get_experimental_metadata():
    """Returns detailed architecture configurations, provisional decision thresholds, and evidence."""
    meta = experimental_model_manager.metadata
    if not meta:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Experimental metadata not loaded. Check experimental model artifacts."
        )

    targets_meta = meta.get("models", {})
    return ExperimentalMetadataResponse(
        project="Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction",
        version=APP_VERSION,
        pipeline_type="experimental",
        prototype_disclaimer=EXPERIMENTAL_DISCLAIMER,
        artifacts_source="ml/experimental_artifacts",
        targets=targets_meta,
        feature_schema=meta.get("feature_schema", {})
    )


@router.post(
    "/predict/experimental",
    response_model=ExperimentalPredictionResponse,
    summary="Predict Cardiovascular Risk with Experimental Pipelines & Provisional Thresholds"
)
async def predict_single_experimental(patient: PatientInput):
    """
    Accepts 54 clinical parameters and computes predictions across all 4 targets
    using candidate ensemble architectures and provisional decision thresholds.
    """
    if not experimental_model_manager.is_all_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Experimental models are not initialized or failed to load. Check /health/experimental endpoint."
        )

    try:
        patient_dict = patient.model_dump(by_alias=True)
        raw_preds = experimental_model_manager.predict_single(patient_dict)

        formatted_preds = {
            t: ExperimentalTargetPrediction(
                target=item["target"],
                predicted_class=item["predicted_class"],
                predicted_label=item["predicted_label"],
                probability=item["probability"],
                applied_threshold=item["applied_threshold"],
                threshold_strategy=item["threshold_strategy"],
                threshold_status=item["threshold_status"],
                model_name=item["model_name"],
                model_type=item["model_type"],
                standard_class=item["standard_class"],
                standard_label=item["standard_label"]
            )
            for t, item in raw_preds.items()
        }

        return ExperimentalPredictionResponse(
            predictions=formatted_preds,
            disclaimer=EXPERIMENTAL_DISCLAIMER,
            pipeline_type="experimental",
            artifacts_source="ml/experimental_artifacts"
        )
    except Exception as e:
        logger.error(f"Experimental inference error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during experimental prediction inference."
        )


@router.post(
    "/predict/experimental/batch",
    response_model=ExperimentalBatchPredictionResponse,
    summary="Batch Predict Risk with Experimental Pipelines & Provisional Thresholds"
)
async def predict_batch_experimental(batch_request: BatchPredictionRequest):
    """
    Accepts a list of patients (up to MAX_BATCH_SIZE) and runs vectorized inference
    using experimental candidate models and provisional decision thresholds.
    """
    if not experimental_model_manager.is_all_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Experimental models are not initialized or failed to load. Check /health/experimental endpoint."
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
        batch_raw = experimental_model_manager.predict_batch(patient_dicts)

        formatted_results = []
        for item in batch_raw:
            idx = item["patient_index"]
            patient_preds = {
                t: ExperimentalTargetPrediction(
                    target=p["target"],
                    predicted_class=p["predicted_class"],
                    predicted_label=p["predicted_label"],
                    probability=p["probability"],
                    applied_threshold=p["applied_threshold"],
                    threshold_strategy=p["threshold_strategy"],
                    threshold_status=p["threshold_status"],
                    model_name=p["model_name"],
                    model_type=p["model_type"],
                    standard_class=p["standard_class"],
                    standard_label=p["standard_label"]
                )
                for t, p in item["predictions"].items()
            }
            formatted_results.append(ExperimentalBatchPatientResult(
                patient_index=idx,
                predictions=patient_preds
            ))

        return ExperimentalBatchPredictionResponse(
            results=formatted_results,
            total_patients=len(patients),
            disclaimer=EXPERIMENTAL_DISCLAIMER,
            pipeline_type="experimental",
            artifacts_source="ml/experimental_artifacts"
        )
    except Exception as e:
        logger.error(f"Experimental batch inference error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during experimental batch inference processing."
        )
