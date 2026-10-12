import sys
import json
import logging
import threading
import joblib
import numpy as np
import pandas as pd
import shap
from pathlib import Path
from typing import Dict, List, Any, Optional

# Ensure project root is in sys.path so joblib can unpickle ml.transformers
from backend.config import PROJECT_ROOT, ARTIFACTS_DIR, METADATA_PATH
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.transformers import TARGET_CONFIG, StringCastTransformer, CANONICAL_FEATURE_ORDER
from backend.schemas import EXPLAINABILITY_DISCLAIMER

logger = logging.getLogger("backend.model_loader")


class ModelManager:
    """
    Manages loading and thread-safe in-memory caching of the 4 inference pipelines
    and their corresponding shap.TreeExplainer instances.
    Guarantees models and explainers are loaded once at application startup.
    """
    def __init__(self, artifacts_dir: Path = ARTIFACTS_DIR, metadata_path: Path = METADATA_PATH):
        self.artifacts_dir = Path(artifacts_dir)
        self.metadata_path = Path(metadata_path)
        self._lock = threading.Lock()
        self.models: Dict[str, Any] = {}
        self.explainers: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.loading_errors: Dict[str, str] = {}
        self.explainer_errors: Dict[str, str] = {}
        self.feature_index_to_canonical: Dict[str, Dict[int, str]] = {}
        self.canonical_features: List[str] = list(CANONICAL_FEATURE_ORDER)
        self._global_shap_cache: Optional[Dict[str, Any]] = None

    def load_all_models(self):
        """Loads all four model pipelines, builds explainer cache, and prepares feature mappings."""
        with self._lock:
            self.models.clear()
            self.explainers.clear()
            self.loading_errors.clear()
            self.explainer_errors.clear()
            self.feature_index_to_canonical.clear()
            self._global_shap_cache = None

            # Load metadata if present
            if self.metadata_path.exists():
                try:
                    with open(self.metadata_path, "r", encoding="utf-8") as f:
                        self.metadata = json.load(f)
                except Exception as e:
                    self.loading_errors["metadata"] = f"Failed to parse metadata: {str(e)}"
            else:
                self.loading_errors["metadata"] = f"Metadata file not found at {self.metadata_path}"

            self.canonical_features = list(CANONICAL_FEATURE_ORDER)

            # Load each target model and initialize cached TreeExplainer
            for target in TARGET_CONFIG.keys():
                artifact_file = self.artifacts_dir / f"model_{target.lower()}.joblib"
                if not artifact_file.exists():
                    self.loading_errors[target] = f"Artifact not found at {artifact_file}"
                    continue
                try:
                    pipeline = joblib.load(artifact_file)
                    self.models[target] = pipeline

                    # Extract preprocessor and classifier
                    preprocessor = pipeline.named_steps["preprocessor"]
                    classifier = pipeline.named_steps["classifier"]
                    num_cols = list(preprocessor.transformers_[0][2])
                    cat_cols = list(preprocessor.transformers_[1][2])
                    ohe = preprocessor.transformers_[1][1].named_steps["ohe"]

                    # Build deterministic transformed-to-canonical mapping
                    idx_map: Dict[int, str] = {}
                    for i, col in enumerate(num_cols):
                        idx_map[i] = col

                    curr_idx = len(num_cols)
                    for col_name, cats in zip(cat_cols, ohe.categories_):
                        for _ in cats:
                            idx_map[curr_idx] = col_name
                            curr_idx += 1

                    self.feature_index_to_canonical[target] = idx_map

                    # Initialize cached TreeExplainer on fitted classifier
                    explainer = shap.TreeExplainer(classifier)
                    self.explainers[target] = explainer

                except Exception as e:
                    self.loading_errors[target] = f"Failed to load pipeline: {str(e)}"
                    self.explainer_errors[target] = f"Failed to initialize explainer: {str(e)}"

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

    def is_explainers_ready(self) -> bool:
        """Returns True if all four target explainers are successfully loaded and cached."""
        return len(self.explainers) == 4 and all(t in self.explainers for t in TARGET_CONFIG.keys())

    def explain_single(
        self,
        patient_dict: Dict[str, Any],
        targets: Optional[List[str]] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Runs SHAP TreeExplainer inference for one patient on requested targets.
        Decomposes pipeline into preprocessor.transform(X) and explains the fitted classifier.
        Selects positive class index 1 explicitly from classes_.
        Aggregates one-hot attributions deterministically to canonical features.
        Preserves canonical feature ordering from authoritative schema.
        Stateless: does not store or persist patient explanations.
        """
        if not self.is_all_ready() or not self.is_explainers_ready():
            missing_models = [t for t in TARGET_CONFIG.keys() if t not in self.models]
            missing_explainers = [t for t in TARGET_CONFIG.keys() if t not in self.explainers]
            raise RuntimeError(
                f"Service unavailable: Models missing: {missing_models}, Explainers missing: {missing_explainers}"
            )

        target_list = targets if targets is not None else list(TARGET_CONFIG.keys())

        # Validate requested targets
        for t in target_list:
            if t not in TARGET_CONFIG:
                raise ValueError(f"Invalid target: '{t}'. Permitted targets: {list(TARGET_CONFIG.keys())}")
            if t not in self.models or t not in self.explainers:
                raise RuntimeError(f"Target '{t}' model or explainer not initialized.")

        # Construct single-row DataFrame
        df_patient = pd.DataFrame([patient_dict])
        results: Dict[str, Dict[str, Any]] = {}

        for target in target_list:
            target_info = TARGET_CONFIG[target]
            pipe = self.models[target]
            clf = pipe.named_steps["classifier"]
            prep = pipe.named_steps["preprocessor"]
            explainer = self.explainers[target]
            idx_map = self.feature_index_to_canonical[target]

            # 1. Transform features using exact pipeline preprocessor
            X_trans = prep.transform(df_patient)

            # 2. Determine positive class index explicitly from classes_
            classes_list = list(clf.classes_)
            if 1 not in classes_list:
                raise RuntimeError(f"Positive class 1 not found in model classes_: {classes_list}")
            pos_class_idx = classes_list.index(1)

            # 3. Model prediction and positive-class probability from pipeline
            pred_class = int(pipe.predict(df_patient)[0])
            prob_raw = float(clf.predict_proba(X_trans)[0, pos_class_idx])
            pred_label = target_info["positive_label"] if pred_class == 1 else target_info["negative_label"]

            # 4. Extract model-specific SHAP baseline for positive class
            if isinstance(explainer.expected_value, (list, np.ndarray)):
                base_val = float(explainer.expected_value[pos_class_idx])
            else:
                base_val = float(explainer.expected_value)

            # 5. Compute SHAP values and extract positive class slice
            raw_shap = explainer.shap_values(X_trans)
            if isinstance(raw_shap, list):
                sample_shap = raw_shap[pos_class_idx][0]
            elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 3:
                sample_shap = raw_shap[0, :, pos_class_idx]
            elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 2:
                sample_shap = raw_shap[0]
            else:
                raise ValueError(f"Unexpected SHAP values structure: {type(raw_shap)}")

            # 6. Aggregate transformed one-hot contributions back to 54 canonical features
            canonical_contribs: Dict[str, float] = {feat: 0.0 for feat in self.canonical_features}
            for feat_idx, shap_val in enumerate(sample_shap):
                canon_name = idx_map[feat_idx]
                canonical_contribs[canon_name] += float(shap_val)

            # 7. Build attributions preserving authoritative canonical ordering
            attributions: List[Dict[str, Any]] = []
            for feat in self.canonical_features:
                submitted_val = patient_dict.get(feat)
                attributions.append({
                    "feature_name": feat,
                    "submitted_value": submitted_val,
                    "contribution": float(canonical_contribs[feat])
                })

            # 8. Reconstruct probability and compute additivity discrepancy
            sum_contribs = float(sum(canonical_contribs.values()))
            reconstructed_prob = float(base_val + sum_contribs)
            additivity_diff = float(abs(reconstructed_prob - prob_raw))

            results[target] = {
                "target": target,
                "predicted_probability": prob_raw,
                "predicted_class": pred_class,
                "predicted_label": pred_label,
                "base_value": base_val,
                "attributions": attributions,
                "sum_attributions": sum_contribs,
                "reconstructed_probability": reconstructed_prob,
                "additivity_discrepancy": additivity_diff,
                "output_space": "probability",
                "disclaimer": EXPLAINABILITY_DISCLAIMER
            }

        return results

    def get_global_shap_summary(self, top_n: int = 10) -> Dict[str, Any]:
        """
        Returns cached cohort-wide mean absolute SHAP feature importances
        for all four target models on the Tehran Heart Center cohort (N=303).
        Thread-safe and deterministic.
        """
        with self._lock:
            if self._global_shap_cache is not None:
                return self._global_shap_cache
            return self._compute_global_shap_internal(top_n=top_n)

    def _compute_global_shap_internal(self, top_n: int = 10) -> Dict[str, Any]:
        """Internal computation of cohort mean absolute SHAP values."""
        if not self.is_all_ready() or not self.is_explainers_ready():
            raise RuntimeError("Models or explainers are not ready for global SHAP calculation.")

        clean_csv = PROJECT_ROOT / "data" / "processed" / "cad_clean.csv"
        if not clean_csv.exists():
            raise FileNotFoundError(f"Cohort data file not found at {clean_csv}")

        df_cohort = pd.read_csv(clean_csv)
        target_cols = ["Cath", "CAD", "LAD", "LCX", "RCA", "Exertional CP"]
        feat_cols = [c for c in df_cohort.columns if c not in target_cols]
        X_cohort = df_cohort[feat_cols]
        n_samples = len(X_cohort)

        target_summaries: Dict[str, Any] = {}
        feat_to_idx = {f: i for i, f in enumerate(self.canonical_features)}

        for target in TARGET_CONFIG.keys():
            pipe = self.models[target]
            clf = pipe.named_steps["classifier"]
            prep = pipe.named_steps["preprocessor"]
            explainer = self.explainers[target]
            idx_map = self.feature_index_to_canonical[target]

            X_trans = prep.transform(X_cohort)
            pos_idx = list(clf.classes_).index(1)

            raw_shap = explainer.shap_values(X_trans)
            if isinstance(raw_shap, list):
                sample_shap = raw_shap[pos_idx]
            elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 3:
                sample_shap = raw_shap[:, :, pos_idx]
            else:
                sample_shap = raw_shap

            # Aggregate to 54 canonical features per patient
            canonical_matrix = np.zeros((n_samples, len(self.canonical_features)))
            for feat_idx in range(sample_shap.shape[1]):
                canon_name = idx_map[feat_idx]
                c_col = feat_to_idx[canon_name]
                canonical_matrix[:, c_col] += sample_shap[:, feat_idx]

            # Mean absolute SHAP: mean over N patients of abs(canonical contribution)
            mean_abs_shap = np.mean(np.abs(canonical_matrix), axis=0)

            # Sort descending, ties broken deterministically by feature name
            ranked_indices = sorted(
                range(len(self.canonical_features)),
                key=lambda i: (-mean_abs_shap[i], self.canonical_features[i])
            )

            top_items = []
            for rank, idx in enumerate(ranked_indices[:top_n], 1):
                top_items.append({
                    "rank": rank,
                    "feature_name": self.canonical_features[idx],
                    "mean_absolute_shap": float(mean_abs_shap[idx])
                })

            target_summaries[target] = {
                "target": target,
                "cohort_name": "Tehran Heart Center Cohort",
                "sample_size": n_samples,
                "calculation_method": "mean(abs(canonical_SHAP_contribution)) across cohort",
                "output_space": "probability",
                "top_features": top_items
            }

        result = {
            "targets": target_summaries,
            "cohort_name": "Tehran Heart Center Cohort",
            "sample_size": n_samples,
            "calculation_method": "TreeSHAP path-dependent perturbation with canonical one-hot feature aggregation",
            "disclaimer": EXPLAINABILITY_DISCLAIMER
        }
        self._global_shap_cache = result
        return result


# Global manager instance
model_manager = ModelManager()
if ARTIFACTS_DIR.exists():
    model_manager.load_all_models()

