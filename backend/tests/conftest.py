import pytest
import pandas as pd
from pathlib import Path
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


@pytest.fixture
def client():
    from backend.app import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def valid_patient():
    clean_csv_path = PROJECT_ROOT / "data" / "processed" / "cad_clean.csv"

    df = pd.read_csv(clean_csv_path)
    forbidden = ["Cath", "LAD", "LCX", "RCA", "Exertional CP"]

    patient = df.drop(
        columns=forbidden,
        errors="ignore"
    ).iloc[0].to_dict()

    return patient
