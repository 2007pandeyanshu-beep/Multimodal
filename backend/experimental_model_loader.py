"""
backend/experimental_model_loader.py - Experimental Model Pipeline Loader & Inference Manager
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Manages loading, thread-safe in-memory caching, and inference execution for the 4 experimental
pipelines located in ml/experimental_artifacts/:
1. Overall CAD (Cath) - Soft Voting Ensemble
2. LAD Stenosis (LAD) - Balanced Random Forest Classifier
3. LCX Stenosis (LCX) - Stacking Ensemble (Logistic Regression meta-model)
4. RCA Stenosis (RCA) - Stacking Ensemble (Logistic Regression meta-model)

CRITICAL INFERENCE GOVERNANCE:
- Applies each model's documented provisional decision threshold to its positive-class probability
  to determine the predicted label and threshold-adjusted class.
- Retains the exact raw statistical probability [0.0, 1.0] in the prediction response.
- Exposes model architecture, threshold value, strategy objective, and provisional status.
- Operates completely isolated from the production ModelManager and ml/artifacts/.
"""

import sys
import json
import joblib
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Optional

from backend.config import PROJECT_ROOT

# Path resolutions for experimental artifacts
EXPERIMENTAL_ARTIFACTS_DIR = PROJECT_ROOT / "ml" / "experimental_artifacts"
EXPERIMENTAL_METADATA_PATH = EXPERIMENTAL_ARTIFACTS_DIR / "model_metadata.json"

# Ensure project root is in sys.path for unpickling ml.transformers
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.transformers import TARGET_CONFIG, StringCastTransformer


class ExperimentalModelManager:
    """
    Manages loading and thread-safe in-memory caching of the 4 experimental inference pipelines.
    Enforces provisional decision thresholds on positive-class predicted probabilities.
    """
    def __init__(
        self,
        artifacts_dir: Path = EXPERIMENTAL_ARTIFACTS_DIR,
        metadata_path: Path = EXPERIMENTAL_METADATA_PATH
    ):
        self.artifacts_dir = Path(artifacts_dir)
        self.metadata_path = Path(metadata_path)
        self.models: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.thresholds: Dict[str, Dict[str, Any]] = {}
        self.loading_errors: Dict[str, str] = {}

    def load_all_models(self):
        """Loads all four experimental model pipelines and metadata into memory."""
        self.models.clear()
        self.loading_errors.clear()
        self.thresholds.clear()

        # Load experimental metadata catalog if present
        if self.metadata_path.exists():
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                self.loading_errors["metadata"] = f"Failed to parse experimental metadata: {str(e)}"
        else:
            self.loading_errors["metadata"] = f"Experimental metadata file not found at {self.metadata_path}"

        # Load each target model and extract its provisional decision threshold
        for target, target_info in TARGET_CONFIG.items():
            artifact_file = self.artifacts_dir / f"model_{target.lower()}.joblib"
            if not artifact_file.exists():
                self.loading_errors[target] = f"Experimental artifact not found at {artifact_file}"
                continue

            try:
                pipeline = joblib.load(artifact_file)
                self.models[target] = pipeline

                # Extract threshold specifications from metadata
                t_meta = self.metadata.get("models", {}).get(target, {})
                prov_meta = t_meta.get("provisional_threshold", {})

                thresh_val = float(prov_meta.get("value", 0.50))
                strat_label = str(prov_meta.get("strategy_label", "default_0.50"))
                strat_status = str(prov_meta.get("status", "provisional"))
                model_name = str(t_meta.get("model_name", type(pipeline.named_steps["classifier"]).__name__))
                model_type = str(t_meta.get("model_type", type(pipeline.named_steps["classifier"]).__name__))

                self.thresholds[target] = {
                    "threshold_value": thresh_val,
                    "strategy_label": strat_label,
                    "status": strat_status,
                    "model_name": model_name,
                    "model_type": model_type
                }
            except Exception as e:
                self.loading_errors[target] = f"Failed to load experimental pipeline: {str(e)}"

    def get_status(self) -> Dict[str, bool]:
        """Returns loading status per target."""
        return {target: (target in self.models) for target in TARGET_CONFIG.keys()}

    def is_all_ready(self) -> bool:
        """Returns True if all four experimental target models are successfully loaded."""
        return len(self.models) == 4 and all(t in self.models for t in TARGET_CONFIG.keys())

    def predict_single(self, patient_dict: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Runs experimental inference for one patient across all 4 targets.
        Applies each target's provisional decision threshold to the positive-class probability.
        """
        if not self.is_all_ready():
            missing = [t for t in TARGET_CONFIG.keys() if t not in self.models]
            raise RuntimeError(f"Experimental service unavailable: Models not ready for targets: {missing}")

        df_patient = pd.DataFrame([patient_dict])
        results = {}

        for target, target_info in TARGET_CONFIG.items():
            pipe = self.models[target]
            thresh_config = self.thresholds.get(target, {
                "threshold_value": 0.50,
                "strategy_label": "default_0.50",
                "status": "provisional",
                "model_name": "Unknown",
                "model_type": "Unknown"
            })

            # Continuous statistical risk probability P(y=1)
            prob_pos = float(pipe.predict_proba(df_patient)[0, 1])
            applied_threshold = thresh_config["threshold_value"]

            # Apply provisional threshold to determine predicted class
            pred_class = 1 if prob_pos >= applied_threshold else 0
            pos_label = target_info["positive_label"]
            neg_label = target_info["negative_label"]
            pred_label = pos_label if pred_class == 1 else neg_label

            # Standard unadjusted baseline class at T=0.50 for comparison
            standard_class = 1 if prob_pos >= 0.50 else 0
            standard_label = pos_label if standard_class == 1 else neg_label

            results[target] = {
                "target": target,
                "predicted_class": pred_class,
                "predicted_label": pred_label,
                "probability": round(prob_pos, 4),
                "applied_threshold": round(applied_threshold, 4),
                "threshold_strategy": thresh_config["strategy_label"],
                "threshold_status": thresh_config["status"],
                "model_name": thresh_config["model_name"],
                "model_type": thresh_config["model_type"],
                "standard_class": standard_class,
                "standard_label": standard_label
            }

        return results

    def predict_batch(self, patient_dicts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Runs vectorized batch experimental inference across all 4 targets.
        Applies provisional decision thresholds while preserving exact input ordering.
        """
        if not self.is_all_ready():
            missing = [t for t in TARGET_CONFIG.keys() if t not in self.models]
            raise RuntimeError(f"Experimental service unavailable: Models not ready for targets: {missing}")

        df_batch = pd.DataFrame(patient_dicts)
        batch_size = len(patient_dicts)

        target_outputs = {}
        for target, target_info in TARGET_CONFIG.items():
            pipe = self.models[target]
            thresh_config = self.thresholds.get(target, {
                "threshold_value": 0.50,
                "strategy_label": "default_0.50",
                "status": "provisional",
                "model_name": "Unknown",
                "model_type": "Unknown"
            })

            probs = pipe.predict_proba(df_batch)[:, 1]
            applied_threshold = thresh_config["threshold_value"]
            pos_label = target_info["positive_label"]
            neg_label = target_info["negative_label"]

            target_outputs[target] = []
            for i in range(batch_size):
                prob_p = float(probs[i])
                pred_c = 1 if prob_p >= applied_threshold else 0
                pred_lbl = pos_label if pred_c == 1 else neg_label

                std_c = 1 if prob_p >= 0.50 else 0
                std_lbl = pos_label if std_c == 1 else neg_label

                target_outputs[target].append({
                    "target": target,
                    "predicted_class": pred_c,
                    "predicted_label": pred_lbl,
                    "probability": round(prob_p, 4),
                    "applied_threshold": round(applied_threshold, 4),
                    "threshold_strategy": thresh_config["strategy_label"],
                    "threshold_status": thresh_config["status"],
                    "model_name": thresh_config["model_name"],
                    "model_type": thresh_config["model_type"],
                    "standard_class": std_c,
                    "standard_label": std_lbl
                })

        # Assemble results per patient preserving input index order
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


# Global isolated manager for experimental models
experimental_model_manager = ExperimentalModelManager()
if EXPERIMENTAL_ARTIFACTS_DIR.exists():
    experimental_model_manager.load_all_models()
