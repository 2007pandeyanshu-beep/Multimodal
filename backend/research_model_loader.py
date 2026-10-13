"""
backend/research_model_loader.py - Research 23-Feature Model Pipeline Loader & Inference Manager
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Manages loading, thread-safe in-memory caching, and inference execution for the 4 research
pipelines located in ml/research_artifacts_23/:
1. Cath: Soft Voting Ensemble (VotingClassifier: LR + RF + GB)
2. LAD:  Random Forest Classifier (Balanced, depth=5, min_samples_leaf=3)
3. LCX:  Random Forest Classifier (Balanced, depth=5, min_samples_leaf=3)
4. RCA:  Stacking Classifier (Logistic Regression meta-model over LR + RF + GB)

CRITICAL INFERENCE GOVERNANCE:
- Completely isolated from production ModelManager (ml/artifacts/) and experimental manager.
- Ensures ml.transformers.StringCastTransformer is resolvable in sys.modules for joblib unpickling.
- Reorders patient input DataFrame strictly according to the metadata's 'ordered_features'.
- Derives positive-class index from each loaded model's classes_ array (does not assume probability ordering).
- Applies documented threshold (T=0.50) while retaining exact probability [0.0, 1.0].
"""

import sys
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Optional

from backend.config import PROJECT_ROOT

# Dedicated artifact directory for research candidates
RESEARCH_ARTIFACTS_DIR = PROJECT_ROOT / "ml" / "research_artifacts_23"
RESEARCH_METADATA_PATH = RESEARCH_ARTIFACTS_DIR / "model_metadata.json"

# Ensure project root is in sys.path so joblib can unpickle ml.transformers
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.transformers import TARGET_CONFIG, StringCastTransformer


class Research23ModelManager:
    """
    Manages loading and thread-safe in-memory caching of the 4 research model pipelines
    trained on the Augmented_23 feature schema.
    """
    def __init__(
        self,
        artifacts_dir: Path = RESEARCH_ARTIFACTS_DIR,
        metadata_path: Path = RESEARCH_METADATA_PATH
    ):
        self.artifacts_dir = Path(artifacts_dir)
        self.metadata_path = Path(metadata_path)
        self.models: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.ordered_features: List[str] = []
        self.pos_class_indices: Dict[str, int] = {}
        self.model_classes: Dict[str, np.ndarray] = {}
        self.loading_errors: Dict[str, str] = {}

    def load_all_models(self):
        """Loads all four research model pipelines and metadata into memory."""
        self.models.clear()
        self.loading_errors.clear()
        self.ordered_features.clear()
        self.pos_class_indices.clear()
        self.model_classes.clear()

        # Load metadata catalog if present
        if self.metadata_path.exists():
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                self.ordered_features = self.metadata.get("feature_schema", {}).get("ordered_features", [])
                if len(self.ordered_features) != 23:
                    self.loading_errors["metadata"] = (
                        f"Expected 23 ordered features in metadata, found {len(self.ordered_features)}"
                    )
            except Exception as e:
                self.loading_errors["metadata"] = f"Failed to parse research metadata: {str(e)}"
        else:
            self.loading_errors["metadata"] = f"Research metadata not found at {self.metadata_path}"

        # Load each target model
        for target in TARGET_CONFIG.keys():
            artifact_file = self.artifacts_dir / f"model_{target.lower()}.joblib"
            if not artifact_file.exists():
                self.loading_errors[target] = f"Research artifact not found at {artifact_file}"
                continue

            try:
                pipeline = joblib.load(artifact_file)
                self.models[target] = pipeline

                # Derive positive class index from model classes_ (never assume column ordering)
                clf = pipeline.named_steps.get("classifier", pipeline)
                classes = getattr(pipeline, "classes_", getattr(clf, "classes_", np.array([0, 1])))
                self.model_classes[target] = classes

                pos_matches = np.where(classes == 1)[0]
                if len(pos_matches) > 0:
                    self.pos_class_indices[target] = int(pos_matches[0])
                else:
                    self.pos_class_indices[target] = 1

            except Exception as e:
                self.loading_errors[target] = f"Failed to load research pipeline for {target}: {str(e)}"

    def get_status(self) -> Dict[str, bool]:
        """Returns loading status per target."""
        return {target: (target in self.models) for target in TARGET_CONFIG.keys()}

    def is_all_ready(self) -> bool:
        """Returns True if all four research target models and features are ready."""
        return (
            len(self.models) == 4
            and all(t in self.models for t in TARGET_CONFIG.keys())
            and len(self.ordered_features) == 23
        )

    def predict_single(self, patient_dict: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Runs inference for one patient across all 4 research targets using the 23-feature schema.
        Reorders inputs according to ordered_features and derives class probabilities.
        """
        if not self.is_all_ready():
            missing = [t for t in TARGET_CONFIG.keys() if t not in self.models]
            errors = dict(self.loading_errors)
            raise RuntimeError(
                f"Research service unavailable: Models not ready for targets: {missing}. Details: {errors}"
            )

        # Build single-row DataFrame ordered strictly by metadata features
        df_patient = pd.DataFrame([patient_dict])[self.ordered_features]
        results = {}

        for target, target_info in TARGET_CONFIG.items():
            pipe = self.models[target]
            pos_idx = self.pos_class_indices.get(target, 1)

            # Predict probabilities
            probs = pipe.predict_proba(df_patient)[0]
            prob_pos = float(probs[pos_idx])

            # Apply target threshold (default 0.50)
            threshold = float(
                self.metadata.get("models", {}).get(target, {}).get("primary_threshold", 0.50)
            )
            pred_class = 1 if prob_pos >= threshold else 0

            pos_label = target_info["positive_label"]
            neg_label = target_info["negative_label"]
            pred_label = pos_label if pred_class == 1 else neg_label
            model_type = self.metadata.get("models", {}).get(target, {}).get("model_type", "Unknown")

            results[target] = {
                "target": target,
                "predicted_class": pred_class,
                "predicted_label": pred_label,
                "probability": round(prob_pos, 4),
                "model_type": model_type,
                "positive_label": pos_label,
                "negative_label": neg_label,
                "applied_threshold": threshold
            }

        return results

    def predict_batch(self, patient_dicts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Runs batch inference across all 4 research targets efficiently using a vectorized DataFrame.
        Preserves exact input order.
        """
        if not self.is_all_ready():
            missing = [t for t in TARGET_CONFIG.keys() if t not in self.models]
            errors = dict(self.loading_errors)
            raise RuntimeError(
                f"Research service unavailable: Models not ready for targets: {missing}. Details: {errors}"
            )

        df_batch = pd.DataFrame(patient_dicts)[self.ordered_features]
        batch_size = len(patient_dicts)

        target_outputs = {}
        for target, target_info in TARGET_CONFIG.items():
            pipe = self.models[target]
            pos_idx = self.pos_class_indices.get(target, 1)

            probs_all = pipe.predict_proba(df_batch)[:, pos_idx]
            threshold = float(
                self.metadata.get("models", {}).get(target, {}).get("primary_threshold", 0.50)
            )

            pos_label = target_info["positive_label"]
            neg_label = target_info["negative_label"]
            model_type = self.metadata.get("models", {}).get(target, {}).get("model_type", "Unknown")

            target_outputs[target] = []
            for i in range(batch_size):
                p_val = float(probs_all[i])
                pred_c = 1 if p_val >= threshold else 0
                pred_lbl = pos_label if pred_c == 1 else neg_label

                target_outputs[target].append({
                    "target": target,
                    "predicted_class": pred_c,
                    "predicted_label": pred_lbl,
                    "probability": round(p_val, 4),
                    "model_type": model_type,
                    "positive_label": pos_label,
                    "negative_label": neg_label,
                    "applied_threshold": threshold
                })

        # Assemble results by patient index
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


# Global research manager instance
research23_model_manager = Research23ModelManager()
if RESEARCH_ARTIFACTS_DIR.exists():
    research23_model_manager.load_all_models()
