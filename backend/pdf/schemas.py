"""
backend/pdf/schemas.py - Pydantic Request & Response Schemas for PDF Extraction & Mapping
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

from typing import Dict, List, Literal, Optional, Any, Union
from pydantic import BaseModel, Field, ConfigDict
from backend.schemas import PatientInput


class PageExtractionResult(BaseModel):
    """Extraction metadata and content for a single PDF page."""
    model_config = ConfigDict(extra="forbid")

    page_number: int = Field(..., ge=1, description="1-based page index")
    extraction_method: Literal["text", "ocr", "failed", "empty"] = Field(
        ..., description="Extraction technique applied to this page"
    )
    char_count: int = Field(..., ge=0, description="Number of text characters extracted")
    word_count: int = Field(..., ge=0, description="Number of whitespace-delimited words extracted")
    ocr_applied: bool = Field(False, description="Whether Tesseract OCR was invoked as fallback")
    ocr_warning: Optional[str] = Field(None, description="OCR execution warning or error, if applicable")
    text: Optional[str] = Field(None, description="Page text content (kept local; unlogged on server)")


class PdfExtractionResponse(BaseModel):
    """High-level extraction telemetry and per-page results."""
    model_config = ConfigDict(extra="forbid")

    filename: str
    file_size_bytes: int
    total_pages: int
    text_pages_count: int
    ocr_pages_count: int
    overall_method: Literal["text", "ocr", "mixed", "empty"]
    ocr_available: bool
    ocr_status_message: Optional[str] = None
    pages: List[PageExtractionResult]
    processing_time_ms: float
    prototype_disclaimer: str


MappingStatus = Literal["matched", "ambiguous", "missing", "conflicting", "invalid_range"]


class FieldMappingDetail(BaseModel):
    """Detailed mapping evidence and confidence for a single clinical feature."""
    model_config = ConfigDict(extra="forbid")

    field_alias: str = Field(..., description="Exact feature alias matching PatientInput (e.g. 'Age', 'BP', 'FBS')")
    clinical_label: str = Field(..., description="Human-readable medical parameter description")
    category: str = Field(..., description="Clinical category (Demographics, Lab, ECG, Echo, etc.)")
    expected_type: str = Field(..., description="Expected Python/Pydantic type (float, int, string literal)")
    value: Optional[Union[float, int, str]] = Field(None, description="Extracted candidate value, or None if missing")
    status: MappingStatus = Field(..., description="Mapping confidence and consistency state")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction certainty score")
    unit: Optional[str] = Field(None, description="Detected or standardized medical measurement unit")
    source_snippet: Optional[str] = Field(None, description="Contextual excerpt from the report")
    page_number: Optional[int] = Field(None, description="Page number where snippet was located")
    alternatives: Optional[List[Union[float, int, str]]] = Field(None, description="Conflicting candidate values if ambiguous")
    validation_error: Optional[str] = Field(None, description="Range or type error if value is incompatible with PatientInput")
    requires_review: bool = Field(..., description="True if clinician must verify, correct, or furnish this value")


class PdfProcessResponse(BaseModel):
    """Complete response returned after uploading and mapping a clinical PDF."""
    model_config = ConfigDict(extra="forbid")

    filename: str
    file_size_bytes: int
    total_pages: int
    ocr_available: bool
    ocr_notice: Optional[str] = None
    processing_time_ms: float
    page_summary: List[PageExtractionResult]
    mappings: Dict[str, FieldMappingDetail]
    total_features: int = 54
    matched_count: int
    ambiguous_count: int
    missing_count: int
    conflicting_count: int
    invalid_count: int
    ready_for_inference: bool
    missing_or_invalid_fields: List[str]
    prefilled_patient_data: Dict[str, Any]
    prototype_disclaimer: str


class PdfValidateRequest(BaseModel):
    """Request model for validating clinician-reviewed values against PatientInput."""
    model_config = ConfigDict(extra="forbid")
    patient_data: Dict[str, Any] = Field(..., description="Reviewed 54-feature dictionary")


class PdfValidateResponse(BaseModel):
    """Response reporting whether reviewed patient input satisfies model constraints."""
    model_config = ConfigDict(extra="forbid")

    is_valid: bool
    errors: List[Dict[str, Any]] = []
    validated_patient: Optional[PatientInput] = None
    ready_for_inference: bool
    prototype_disclaimer: str
