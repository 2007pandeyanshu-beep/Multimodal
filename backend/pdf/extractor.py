"""
backend/pdf/extractor.py - Safe PDF Text Extraction with PyMuPDF & OCR Fallback
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Safety & Privacy Safeguards:
1. Strict magic-byte (%PDF-) and content-type validation.
2. File size and page count bounds enforcement.
3. Safe temporary file handling with guaranteed cleanup via try/finally.
4. PyMuPDF selectable-text extraction with local Tesseract OCR fallback for scanned pages.
5. Zero remote network calls; report contents never leave the local environment.
6. Zero logging of patient identifying information or medical report text.
"""

import io
import os
import time
import shutil
import logging
import tempfile
from pathlib import Path
from typing import List, Tuple, Optional

import pymupdf as fitz
from PIL import Image
import pytesseract

from backend.config import (
    MAX_PDF_SIZE_BYTES, MAX_PDF_PAGES, OCR_MIN_CHARS_THRESHOLD,
    OCR_DPI, TESSERACT_CMD, PROTOTYPE_DISCLAIMER
)
from backend.pdf.schemas import (
    PageExtractionResult, PdfExtractionResponse
)

logger = logging.getLogger("backend.pdf.extractor")

if TESSERACT_CMD and Path(TESSERACT_CMD).is_file():
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


def get_tesseract_cmd() -> Optional[str]:
    """Resolves the Tesseract binary path from config, PATH, or common install locations."""
    env_cmd = (os.getenv("TESSERACT_CMD") or "").strip() or TESSERACT_CMD
    if env_cmd and Path(env_cmd).is_file():
        resolved = str(Path(env_cmd).resolve())
        pytesseract.pytesseract.tesseract_cmd = resolved
        return resolved

    # Check system PATH
    found = shutil.which("tesseract")
    if found:
        return found

    # Check common Windows standard directories
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    user_profile = os.environ.get("USERPROFILE", "")
    candidate_paths = [
        Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe"),
        Path(r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"),
        Path(local_app_data) / "Programs" / "Tesseract-OCR" / "tesseract.exe" if local_app_data else None,
        Path(local_app_data) / "Tesseract-OCR" / "tesseract.exe" if local_app_data else None,
        Path(user_profile) / "scoop" / "apps" / "tesseract" / "current" / "tesseract.exe" if user_profile else None,
        Path(r"C:\ProgramData\chocolatey\bin\tesseract.exe"),
    ]
    for p in candidate_paths:
        if p and p.is_file():
            return str(p)

    return None


def check_ocr_availability() -> Tuple[bool, str]:
    """Verifies whether local Tesseract OCR engine is functional."""
    cmd = get_tesseract_cmd()
    if not cmd:
        return (
            False,
            "Tesseract OCR engine is not installed or not found on PATH. "
            "Selectable-text PDFs will be extracted natively via PyMuPDF. "
            "To enable scanned image/page OCR, install Tesseract OCR and set TESSERACT_CMD."
        )

    try:
        pytesseract.pytesseract.tesseract_cmd = cmd
        ver = pytesseract.get_tesseract_version()
        return (True, f"Tesseract OCR v{ver} available at {cmd}")
    except Exception as e:
        return (
            False,
            f"Tesseract executable found but failed probe: {str(e)}"
        )


class PdfExtractionError(Exception):
    """Custom exception for user-correctable PDF parsing errors."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class SafePdfExtractor:
    """Manages secure extraction of selectable text and scanned pages from medical reports."""

    def __init__(
        self,
        max_size_bytes: int = MAX_PDF_SIZE_BYTES,
        max_pages: int = MAX_PDF_PAGES,
        min_chars_threshold: int = OCR_MIN_CHARS_THRESHOLD,
        dpi: int = OCR_DPI
    ):
        self.max_size_bytes = max_size_bytes
        self.max_pages = max_pages
        self.min_chars_threshold = min_chars_threshold
        self.dpi = dpi

    def validate_file_bytes(self, raw_bytes: bytes, filename: str = "document.pdf") -> None:
        """Enforces magic byte, non-empty, and file size constraints."""
        if not raw_bytes or len(raw_bytes) == 0:
            raise PdfExtractionError("Uploaded file is empty (0 bytes).", status_code=400)

        if len(raw_bytes) > self.max_size_bytes:
            limit_mb = self.max_size_bytes / (1024 * 1024)
            size_mb = len(raw_bytes) / (1024 * 1024)
            raise PdfExtractionError(
                f"File size ({size_mb:.2f} MB) exceeds maximum allowed limit of {limit_mb:.1f} MB.",
                status_code=400
            )

        # PDF magic byte check: must start with %PDF- (ignoring leading whitespace/BOM)
        stripped_prefix = raw_bytes[:1024].lstrip()
        if not stripped_prefix.startswith(b"%PDF-"):
            raise PdfExtractionError(
                "Invalid file format: File does not contain a valid PDF magic header (%PDF-).",
                status_code=400
            )

    def extract_from_bytes(
        self,
        raw_bytes: bytes,
        filename: str = "document.pdf",
        include_text: bool = True
    ) -> PdfExtractionResponse:
        """
        Safely writes PDF to temporary file, extracts all pages using PyMuPDF and OCR fallback,
        and guarantees temporary file deletion upon completion.
        """
        start_time = time.perf_counter()
        self.validate_file_bytes(raw_bytes, filename)

        ocr_available, ocr_msg = check_ocr_availability()

        temp_path: Optional[Path] = None
        doc: Optional[fitz.Document] = None

        try:
            # Create safe temporary file with restrictive permissions
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(raw_bytes)
                temp_path = Path(tmp.name)

            try:
                doc = fitz.open(str(temp_path))
            except fitz.FileDataError as e:
                raise PdfExtractionError(f"Malformed or corrupt PDF structure: {str(e)}", status_code=400)
            except Exception as e:
                raise PdfExtractionError(f"Failed to read PDF document: {str(e)}", status_code=400)

            if doc.is_encrypted:
                raise PdfExtractionError(
                    "Password-protected or encrypted PDFs are not supported. Please supply a decrypted report.",
                    status_code=400
                )

            total_pages = len(doc)
            if total_pages == 0:
                raise PdfExtractionError("PDF contains 0 pages.", status_code=400)

            if total_pages > self.max_pages:
                raise PdfExtractionError(
                    f"PDF page count ({total_pages}) exceeds allowed limit of {self.max_pages} pages.",
                    status_code=400
                )

            page_results: List[PageExtractionResult] = []
            text_pages_count = 0
            ocr_pages_count = 0

            for page_idx in range(total_pages):
                page_num = page_idx + 1
                page = doc.load_page(page_idx)

                # Attempt 1: Fast native text extraction
                raw_text = page.get_text("text").strip()
                char_count = len(raw_text)

                if char_count >= self.min_chars_threshold:
                    # Sufficient native selectable text found
                    words = raw_text.split()
                    page_results.append(PageExtractionResult(
                        page_number=page_num,
                        extraction_method="text",
                        char_count=char_count,
                        word_count=len(words),
                        ocr_applied=False,
                        text=raw_text if include_text else None
                    ))
                    text_pages_count += 1
                else:
                    # Attempt 2: Scanned page fallback to OCR
                    ocr_applied = False
                    ocr_warning: Optional[str] = None
                    final_text = raw_text

                    if ocr_available:
                        try:
                            pix = page.get_pixmap(dpi=self.dpi)
                            img_bytes = pix.tobytes("png")
                            pil_img = Image.open(io.BytesIO(img_bytes))

                            cmd = get_tesseract_cmd()
                            if cmd:
                                pytesseract.pytesseract.tesseract_cmd = cmd

                            ocr_text = pytesseract.image_to_string(pil_img).strip()
                            ocr_applied = True
                            if len(ocr_text) > len(raw_text):
                                final_text = ocr_text
                        except Exception as ocr_err:
                            ocr_warning = f"OCR execution failed on page {page_num}: {str(ocr_err)}"
                            logger.warning(f"OCR failure on page {page_num}: {ocr_err}")
                    else:
                        ocr_warning = (
                            f"Page {page_num} appears scanned ({char_count} chars extracted), "
                            "but Tesseract OCR is not installed to perform image text recognition."
                        )

                    char_count = len(final_text)
                    words = final_text.split()
                    method = "ocr" if ocr_applied and char_count > 0 else ("empty" if char_count == 0 else "text")

                    if method == "ocr":
                        ocr_pages_count += 1
                    elif method == "text":
                        text_pages_count += 1

                    page_results.append(PageExtractionResult(
                        page_number=page_num,
                        extraction_method=method,
                        char_count=char_count,
                        word_count=len(words),
                        ocr_applied=ocr_applied,
                        ocr_warning=ocr_warning,
                        text=final_text if include_text else None
                    ))

            # Determine overall extraction mode
            if ocr_pages_count > 0 and text_pages_count > 0:
                overall_method = "mixed"
            elif ocr_pages_count > 0:
                overall_method = "ocr"
            elif text_pages_count > 0:
                overall_method = "text"
            else:
                overall_method = "empty"

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            # Safe operational log (no patient data, no text content)
            logger.info(
                f"PDF processed: pages={total_pages}, text_pages={text_pages_count}, "
                f"ocr_pages={ocr_pages_count}, elapsed_ms={elapsed_ms:.1f}"
            )

            return PdfExtractionResponse(
                filename=filename,
                file_size_bytes=len(raw_bytes),
                total_pages=total_pages,
                text_pages_count=text_pages_count,
                ocr_pages_count=ocr_pages_count,
                overall_method=overall_method,
                ocr_available=ocr_available,
                ocr_status_message=ocr_msg,
                pages=page_results,
                processing_time_ms=round(elapsed_ms, 2),
                prototype_disclaimer=PROTOTYPE_DISCLAIMER
            )

        finally:
            if doc:
                try:
                    doc.close()
                except Exception:
                    pass
            # Guarantee temporary file deletion
            if temp_path and temp_path.is_file():
                try:
                    temp_path.unlink(missing_ok=True)
                except Exception as e:
                    logger.warning(f"Failed to cleanup temp file {temp_path}: {e}")
