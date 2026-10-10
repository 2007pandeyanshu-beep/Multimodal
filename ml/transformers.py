"""
ml/transformers.py - Reusable Pipeline Transformers & Schema Definitions
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from typing import List, Dict, Tuple

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
        return self

    def transform(self, X):
        if isinstance(X, pd.DataFrame):
            return X.astype(str)
        return pd.DataFrame(X).astype(str)


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
