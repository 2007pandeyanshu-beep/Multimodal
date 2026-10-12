"""
ml/transformers.py - Reusable Pipeline Transformers & Schema Definitions
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from typing import List, Dict, Tuple

# Authoritative canonical 54-feature ordering matching schema and training pipeline
CANONICAL_FEATURE_ORDER: List[str] = [
    # 1. Demographics & Physical Measurements (5 features)
    "Age", "Weight", "Length", "Sex", "BMI",
    # 2. Medical History & Lifestyle (12 features)
    "DM", "HTN", "Current Smoker", "EX-Smoker", "FH", "Obesity",
    "CRF", "CVA", "Airway disease", "Thyroid Disease", "CHF", "DLP",
    # 3. Vital Signs & Physical Examination (7 features)
    "BP", "PR", "Edema", "Weak Peripheral Pulse", "Lung rales",
    "Systolic Murmur", "Diastolic Murmur",
    # 4. Symptoms & Clinical Status (6 features)
    "Typical Chest Pain", "Dyspnea", "Function Class", "Atypical",
    "Nonanginal", "LowTH Ang",
    # 5. Electrocardiography (7 features)
    "Q Wave", "St Elevation", "St Depression", "Tinversion", "LVH",
    "Poor R Progression", "BBB",
    # 6. Laboratory Blood Panels (14 features)
    "FBS", "CR", "TG", "LDL", "HDL", "BUN", "ESR", "HB", "K", "Na",
    "WBC", "Lymph", "Neut", "PLT",
    # 7. Echocardiography (3 features)
    "EF-TTE", "Region RWMA", "VHD"
]

# Explicit definitions of the 4 prediction targets
TARGET_CONFIG = {
    "Cath": {
        "positive_label": "CAD",
        "negative_label": "Normal",
        "description": "Overall Coronary Artery Disease (Angiographic Catheterization Outcome)"
    },
    "LAD": {
        "positive_label": "Stenotic",
        "negative_label": "Normal",
        "description": "Left Anterior Descending Artery Stenosis (>=50% occlusion)"
    },
    "LCX": {
        "positive_label": "Stenotic",
        "negative_label": "Normal",
        "description": "Left Circumflex Artery Stenosis (>=50% occlusion)"
    },
    "RCA": {
        "positive_label": "Stenotic",
        "negative_label": "Normal",
        "description": "Right Coronary Artery Stenosis (>=50% occlusion)"
    }
}

# Strict target-leakage and zero-variance exclusions
FORBIDDEN_FEATURES = ["Cath", "LAD", "LCX", "RCA", "Exertional CP"]


class StringCastTransformer(BaseEstimator, TransformerMixin):
    """
    Casts all categorical inputs to string format before OneHotEncoding.
    Guarantees that numeric 0/1 flags and string '0'/'1' representations
    produce identical categorical encodings without runtime type mismatch bugs.
    """
    def fit(self, X, y=None):
        if hasattr(X, "columns"):
            self.feature_names_in_ = np.asarray(X.columns, dtype=object)
        return self

    def transform(self, X):
        if isinstance(X, pd.DataFrame):
            return X.astype(str)
        return pd.DataFrame(X).astype(str)

    def get_feature_names_out(self, input_features=None):
        """
        Passes through input feature names according to the scikit-learn
        transformer protocol.
        """
        if input_features is not None:
            return np.asarray(input_features, dtype=object)
        if hasattr(self, "feature_names_in_"):
            return np.asarray(self.feature_names_in_, dtype=object)
        return np.array([], dtype=object)


def build_preprocessor(num_cols: List[str], cat_cols: List[str]) -> ColumnTransformer:
    """
    Constructs a leakage-safe ColumnTransformer that:
    1. Standardizes numerical measurements with StandardScaler.
    2. Casts categoricals to string and applies OneHotEncoder(handle_unknown='ignore').
    """
    cat_pipeline = Pipeline([
        ("to_str", StringCastTransformer()),
        ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("cat", cat_pipeline, cat_cols)
        ],
        remainder="drop"
    )
    return preprocessor


def get_feature_lists(metadata_df: pd.DataFrame) -> Tuple[List[str], List[str]]:
    """
    Extracts permitted numerical and categorical columns from metadata.
    Enforces strict assertions that no forbidden feature is allowed.
    """
    allowed_df = metadata_df[metadata_df["is_allowed_input"] == True]
    
    # Assert zero leakage
    for forbidden in FORBIDDEN_FEATURES:
        assert forbidden not in allowed_df["feature_name"].values, (
            f"LEAKAGE VIOLATION: Forbidden feature '{forbidden}' found in permitted inputs!"
        )

    num_cols = allowed_df[allowed_df["is_categorical"] == False]["feature_name"].tolist()
    cat_cols = allowed_df[allowed_df["is_categorical"] == True]["feature_name"].tolist()

    assert len(num_cols) + len(cat_cols) == 54, f"Expected 54 allowed features, got {len(num_cols) + len(cat_cols)}"
    return num_cols, cat_cols
