"""
backend/config.py - Environment & Application Configuration
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import os
from pathlib import Path
from typing import List

# Path resolution robust to working directory
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
ARTIFACTS_DIR = PROJECT_ROOT / "ml" / "artifacts"
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"

# Operational parameters
APP_NAME = "Cardiovascular Risk Visualization & Prediction API"
APP_VERSION = "1.0.0"
MAX_BATCH_SIZE = int(os.getenv("MAX_BATCH_SIZE", "50"))

# Restrictive development CORS defaults, overridable via environment variable
default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
env_cors = os.getenv("CORS_ORIGINS")
if env_cors:
    CORS_ORIGINS: List[str] = [origin.strip() for origin in env_cors.split(",") if origin.strip()]
else:
    CORS_ORIGINS: List[str] = default_origins

PROTOTYPE_DISCLAIMER = (
    "Research prototype output for Multimodal AI Hackathon 2026 (Track A). "
    "Not a clinical diagnostic device. Model probabilities reflect statistical "
    "estimates from single-center training data (N=303) and must not be used "
    "as verified clinical risk or replacement for physician judgment."
)
