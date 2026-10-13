"""
backend/app.py - Modular FastAPI Application for Cardiovascular Risk Prediction
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.config import (
    APP_NAME, APP_VERSION, CORS_ORIGINS, MAX_BATCH_SIZE,
    PROTOTYPE_DISCLAIMER, ARTIFACTS_DIR
)
from backend.schemas import (
    PatientInput, PredictionResponse, TargetPrediction,
    BatchPredictionRequest, BatchPredictionResponse, BatchPatientResult,
    HealthResponse, MetadataResponse
)
from backend.model_loader import model_manager
from ml.transformers import TARGET_CONFIG, FORBIDDEN_FEATURES

# Setup clean, privacy-safe logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("backend.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Loads model pipelines once on application startup."""
    logger.info("Initializing Cardiovascular Risk Prediction API...")
    logger.info(f"Loading model pipelines from {ARTIFACTS_DIR}...")
    model_manager.load_all_models()
    if model_manager.is_all_ready():
        logger.info("All 4 target pipelines loaded successfully.")
    else:
        logger.warning(f"Model loading warnings: {model_manager.loading_errors}")

    # Load isolated experimental model pipelines
    try:
        from backend.experimental_model_loader import experimental_model_manager, EXPERIMENTAL_ARTIFACTS_DIR
        logger.info(f"Loading experimental pipelines from {EXPERIMENTAL_ARTIFACTS_DIR}...")
        experimental_model_manager.load_all_models()
        if experimental_model_manager.is_all_ready():
            logger.info("All 4 experimental target pipelines loaded successfully.")
        else:
            logger.warning(f"Experimental model loading warnings: {experimental_model_manager.loading_errors}")
    except Exception as e:
        logger.warning(f"Failed to initialize experimental models in lifespan: {e}")

    # Load isolated research 23-feature model pipelines
    try:
        from backend.research_model_loader import research23_model_manager, RESEARCH_ARTIFACTS_DIR
        logger.info(f"Loading research 23-feature pipelines from {RESEARCH_ARTIFACTS_DIR}...")
        research23_model_manager.load_all_models()
        if research23_model_manager.is_all_ready():
            logger.info("All 4 research 23-feature target pipelines loaded successfully.")
        else:
            logger.warning(f"Research 23-feature model loading warnings: {research23_model_manager.loading_errors}")
    except Exception as e:
        logger.warning(f"Failed to initialize research 23-feature models in lifespan: {e}")

    yield
    logger.info("Shutting down API...")


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Inference API predicting overall CAD, LAD, LCX, and RCA coronary stenosis.",
    lifespan=lifespan
)

# Configure CORS with environment-driven allowed origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Sanitizes validation errors to present actionable error messages
    without leaking internal system structures.
    """
    clean_errors = []
    for err in exc.errors():
        loc = " -> ".join(str(item) for item in err.get("loc", []))
        msg = err.get("msg", "Invalid value")
        err_type = err.get("type", "validation_error")
        clean_errors.append({
            "field": loc,
            "message": msg,
            "error_type": err_type
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Request validation failed", "errors": clean_errors}
    )


@app.get("/health", response_model=HealthResponse, summary="Service & Model Health Check")
async def health_check():
    """Returns service availability and loading status of all 4 prediction models."""
    status_map = model_manager.get_status()
    all_ready = model_manager.is_all_ready()
    return HealthResponse(
        status="healthy" if all_ready else "degraded",
        models_loaded=status_map,
        all_models_ready=all_ready,
        version=APP_VERSION
    )


@app.get("/metadata", response_model=MetadataResponse, summary="Input/Output Feature & Target Specifications")
async def get_metadata():
    """
    Returns exhaustive schema specifications, target labels,
    leakage-prevention exclusions, and research disclaimers.
    """
    meta_json = model_manager.metadata
    num_features = meta_json.get("numerical_features", [])
    cat_features = meta_json.get("categorical_features", [])

    return MetadataResponse(
        project="Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction",
        version=APP_VERSION,
        prototype_disclaimer=PROTOTYPE_DISCLAIMER,
        targets={
            target: {
                "description": info["description"],
                "positive_label": info["positive_label"],
                "negative_label": info["negative_label"]
            }
            for target, info in TARGET_CONFIG.items()
        },
        total_input_features=len(num_features) + len(cat_features),
        numerical_features=num_features,
        categorical_features=cat_features,
        forbidden_features=FORBIDDEN_FEATURES,
        model_type="RandomForestClassifier (Balanced, Regularized max_depth=5)",
        validation_methodology="5-Fold Stratified Cross-Validation on Single-Center Cohort (N=303)"
    )


@app.post("/predict", response_model=PredictionResponse, summary="Predict Risk for a Single Patient")
async def predict_single(patient: PatientInput):
    """
    Accepts 54 clinical parameters and returns predictions for:
    - Cath (Overall CAD)
    - LAD Stenosis
    - LCX Stenosis
    - RCA Stenosis
    """
    if not model_manager.is_all_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Models are not initialized or failed to load. Check /health endpoint."
        )

    try:
        # Extract dictionary with exact feature aliases (matching training columns)
        patient_dict = patient.model_dump(by_alias=True)
        raw_preds = model_manager.predict_single(patient_dict)

        formatted_preds = {
            t: TargetPrediction(
                target=item["target"],
                predicted_class=item["predicted_class"],
                predicted_label=item["predicted_label"],
                probability=item["probability"]
            )
            for t, item in raw_preds.items()
        }

        return PredictionResponse(
            predictions=formatted_preds,
            disclaimer=PROTOTYPE_DISCLAIMER
        )
    except Exception as e:
        logger.error(f"Inference execution error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during prediction inference."
        )


@app.post("/predict/batch", response_model=BatchPredictionResponse, summary="Predict Risk for Multiple Patients")
async def predict_batch(batch_request: BatchPredictionRequest):
    """
    Accepts a list of patients (up to MAX_BATCH_SIZE) and returns predictions
    preserving input index order.
    """
    if not model_manager.is_all_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Models are not initialized or failed to load. Check /health endpoint."
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
        batch_raw_results = model_manager.predict_batch(patient_dicts)

        formatted_results = []
        for item in batch_raw_results:
            idx = item["patient_index"]
            patient_preds = {
                t: TargetPrediction(
                    target=p["target"],
                    predicted_class=p["predicted_class"],
                    predicted_label=p["predicted_label"],
                    probability=p["probability"]
                )
                for t, p in item["predictions"].items()
            }
            formatted_results.append(BatchPatientResult(
                patient_index=idx,
                predictions=patient_preds
            ))

        return BatchPredictionResponse(
            results=formatted_results,
            total_patients=len(patients),
            disclaimer=PROTOTYPE_DISCLAIMER
        )
    except Exception as e:
        logger.error(f"Batch inference execution error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during batch inference processing."
        )


# Include isolated experimental endpoints
from backend.experimental_routes import router as experimental_router
app.include_router(experimental_router)

# Include isolated PDF report ingestion & clinical mapping endpoints
from backend.pdf.routes import router as pdf_router
app.include_router(pdf_router)

# Include isolated 23-feature research endpoints
from backend.research_routes import router as research_router
app.include_router(research_router)

