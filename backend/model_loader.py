"""
backend/model_loader.py - Model Pipeline Loading & Inference Execution
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
"""

import sys
import json
import joblib
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Optional

# Ensure project root is in sys.path so joblib can unpickle ml.transformers
from backend.config import PROJECT_ROOT, ARTIFACTS_DIR, METADATA_PATH
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.transformers import TARGET_CONFIG, StringCastTransformer


class ModelManager:
    """
    Manages loading and thread-safe in-memory caching of the 4 inference pipelines.
    Guarantees models are loaded once at application startup.
    """
    def __init__(self, artifacts_dir: Path = ARTIFACTS_DIR, metadata_path: Path = METADATA_PATH):
        self.artifacts_dir = Path(artifacts_dir)
        self.metadata_path = Path(metadata_path)
        self.models: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.loading_errors: Dict[str, str] = {}

    def load_all_models(self):
        """Loads all four model pipelines and metadata into memory."""
        self.models.clear()
        self.loading_errors.clear()

        # Load metadata if present
        if self.metadata_path.exists():
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                self.loading_errors["metadata"] = f"Failed to parse metadata: {str(e)}"
        else:
            self.loading_errors["metadata"] = f"Metadata file not found at {self.metadata_path}"

        # Load each target model
        for target in TARGET_CONFIG.keys():
            artifact_file = self.artifacts_dir / f"model_{target.lower()}.joblib"
            if not artifact_file.exists():
                self.loading_errors[target] = f"Artifact not found at {artifact_file}"
                continue
            try:
                pipeline = joblib.load(artifact_file)
                self.models[target] = pipeline
            except Exception as e:
                self.loading_errors[target] = f"Failed to load pipeline: {str(e)}"

    def get_status(self) -> Dict[str, bool]:
        """Returns loading status per target."""
        return {target: (target in self.models) for target in TARGET_CONFIG.keys()}

    def is_all_ready(self) -> bool:
        """Returns True if all four target models are successfully loaded."""
        return len(self.models) == 4 and all(t in self.models for t in TARGET_CONFIG.keys())

    def predict_single(self, patient_dict: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Runs inference for one patient across all 4 targets.
        Returns dictionary of target predictions.
        """
        if not self.is_all_ready():
            missing = [t for t in TARGET_CONFIG.keys() if t not in self.models]
            raise RuntimeError(f"Service unavailable: Models not ready for targets: {missing}")

        # Construct single-row DataFrame
        df_patient = pd.DataFrame([patient_dict])
        results = {}

        for target, target_info in TARGET_CONFIG.items():
            pipe = self.models[target]
            pred_class = int(pipe.predict(df_patient)[0])
            prob_pos = float(pipe.predict_proba(df_patient)[0, 1])

            pos_label = target_info["positive_label"]
            neg_label = target_info["negative_label"]
            pred_label = pos_label if pred_class == 1 else neg_label

            results[target] = {
                "target": target,
                "predicted_class": pred_class,
                "predicted_label": pred_label,
                "probability": round(prob_pos, 4)
            }

        return results

    def predict_batch(self, patient_dicts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Runs batch inference across all 4 targets efficiently using vectorized DataFrame.
        Preserves exact input order.
        """
        if not self.is_all_ready():
            missing = [t for t in TARGET_CONFIG.keys() if t not in self.models]
            raise RuntimeError(f"Service unavailable: Models not ready for targets: {missing}")

        df_batch = pd.DataFrame(patient_dicts)
        batch_size = len(patient_dicts)

        # Dictionary to accumulate target results
        target_outputs = {}
        for target, target_info in TARGET_CONFIG.items():
            pipe = self.models[target]
            preds = pipe.predict(df_batch)
            probs = pipe.predict_proba(df_batch)[:, 1]

            pos_label = target_info["positive_label"]
            neg_label = target_info["negative_label"]

            target_outputs[target] = []
            for i in range(batch_size):
                pred_c = int(preds[i])
                prob_p = float(probs[i])
                lbl = pos_label if pred_c == 1 else neg_label
                target_outputs[target].append({
                    "target": target,
                    "predicted_class": pred_c,
                    "predicted_label": lbl,
                    "probability": round(prob_p, 4)
                })

        # Assemble results by patient index in original order
        batch_results = []
        for i in range(batch_size):
            patient_preds = {
                target: target_outputs[target][i] for target in TARGET_CONFIG.keys()
            }
            batch_results.append({
                "patient_index": i,
                "predictions": patient_preds
            })

        return batch_results


# Global manager instance
model_manager = ModelManager()
if ARTIFACTS_DIR.exists():
    model_manager.load_all_models()

