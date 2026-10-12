"""
backend/pdf/routes.py - Isolated FastAPI Endpoints for PDF Ingestion, Extraction & Schema Mapping
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Endpoints:
- POST /pdf/upload    : Upload PDF file -> Extract pages (PyMuPDF/OCR) -> Map to 54-feature schema
- POST /pdf/extract   : Upload PDF file -> Extract page text and telemetry only
- POST /pdf/validate  : Validate clinician-edited 54-feature dictionary against PatientInput
- GET  /pdf/ocr-status: Health check for local Tesseract OCR availability and setup status
"""

import time
import logging
from typing import Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import ValidationError

from backend.config import PROTOTYPE_DISCLAIMER, PROJECT_ROOT
from backend.schemas import PatientInput
from backend.pdf.schemas import (
    PdfExtractionResponse, PdfProcessResponse, PdfValidateRequest, PdfValidateResponse
)
from backend.pdf.extractor import SafePdfExtractor, PdfExtractionError, check_ocr_availability
from backend.pdf.mapper import ClinicalReportMapper

logger = logging.getLogger("backend.pdf.routes")

router = APIRouter(prefix="/pdf", tags=["PDF Report Processing & Clinical Intake"])

# Singletons for extractor and mapper
extractor = SafePdfExtractor()
mapper = ClinicalReportMapper()


@router.get(
    "/ocr-status",
    summary="Check Local Tesseract OCR Availability",
    description="Probes whether local Tesseract OCR binary is installed and executable for scanned documents."
)
async def get_ocr_status():
    """Returns local OCR installation and operational status."""
    is_available, message = check_ocr_availability()
    return {
        "ocr_available": is_available,
        "status_message": message,
        "prototype_disclaimer": PROTOTYPE_DISCLAIMER
    }


@router.get(
    "/sample-reports/scanned",
    summary="Get Synthetic Scanned Sample Report PDF",
    description="Returns the synthetic scanned-image medical report PDF for testing and demo."
)
async def get_scanned_sample_report():
    sample_path = PROJECT_ROOT / "synthetic_scanned_patient_report.pdf"
    if not sample_path.is_file():
        raise HTTPException(status_code=404, detail="Synthetic scanned report not found.")
    return FileResponse(
        path=str(sample_path),
        media_type="application/pdf",
        filename="synthetic_scanned_patient_report.pdf"
    )


@router.get(
    "/sample-reports/text",
    summary="Get Synthetic Text Sample Report PDF",
    description="Returns the synthetic selectable-text medical report PDF for testing and demo."
)
async def get_text_sample_report():
    sample_path = PROJECT_ROOT / "synthetic_patient_report.pdf"
    if not sample_path.is_file():
        raise HTTPException(status_code=404, detail="Synthetic text report not found.")
    return FileResponse(
        path=str(sample_path),
        media_type="application/pdf",
        filename="synthetic_patient_report.pdf"
    )


@router.post(
    "/upload",
    response_model=PdfProcessResponse,
    summary="Upload PDF Report & Map Clinical Schema",
    description="Extracts medical report text using PyMuPDF (with local OCR fallback for scanned pages) "
                "and maps extracted values conservatively to the 54-feature PatientInput schema."
)
async def upload_pdf_report(file: UploadFile = File(...)):
    """Accepts a medical report PDF and returns candidate extracted features with evidence snippets."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    # Read binary contents
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file stream: {str(e)}"
        )

    t0 = time.perf_counter()

    try:
        extraction_res = extractor.extract_from_bytes(
            raw_bytes=content,
            filename=file.filename,
            include_text=True
        )
    except PdfExtractionError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error during PDF extraction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the PDF file."
        )

    # Perform conservative clinical feature mapping
    try:
        process_res = mapper.map_extracted_pages(
            pages=extraction_res.pages,
            filename=file.filename,
            file_size_bytes=extraction_res.file_size_bytes,
            ocr_available=extraction_res.ocr_available,
            ocr_notice=extraction_res.ocr_status_message,
            processing_time_ms=round((time.perf_counter() - t0) * 1000.0, 2)
        )
        return process_res
    except Exception as e:
        logger.error(f"Feature mapping error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while mapping clinical features from extracted text."
        )


@router.post(
    "/extract",
    response_model=PdfExtractionResponse,
    summary="Extract Raw Page Text & Method Telemetry",
    description="Extracts page-by-page text without performing schema mapping."
)
async def extract_pdf_text(file: UploadFile = File(...)):
    """Returns page-by-page text and extraction methods (native text vs OCR)."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    try:
        content = await file.read()
        extraction_res = extractor.extract_from_bytes(
            raw_bytes=content,
            filename=file.filename,
            include_text=True
        )
        return extraction_res
    except PdfExtractionError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while extracting PDF text."
        )


@router.post(
    "/validate",
    response_model=PdfValidateResponse,
    summary="Validate Clinician-Reviewed Patient Input",
    description="Validates that a reviewed 54-feature patient dictionary satisfies all PatientInput constraints."
)
async def validate_reviewed_patient(request: PdfValidateRequest):
    """Checks clinician-reviewed values against PatientInput schema prior to prediction."""
    patient_data = request.patient_data

    try:
        validated = PatientInput(**patient_data)
        return PdfValidateResponse(
            is_valid=True,
            errors=[],
            validated_patient=validated,
            ready_for_inference=True,
            prototype_disclaimer=PROTOTYPE_DISCLAIMER
        )
    except ValidationError as exc:
        clean_errors = []
        for err in exc.errors():
            loc = " -> ".join(str(item) for item in err.get("loc", []))
            clean_errors.append({
                "field": loc,
                "message": err.get("msg", "Invalid value"),
                "error_type": err.get("type", "validation_error")
            })
        return PdfValidateResponse(
            is_valid=False,
            errors=clean_errors,
            validated_patient=None,
            ready_for_inference=False,
            prototype_disclaimer=PROTOTYPE_DISCLAIMER
        )
