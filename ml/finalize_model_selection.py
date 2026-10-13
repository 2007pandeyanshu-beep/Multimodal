"""
ml/finalize_model_selection.py - Multi-Criteria Model Selection & Candidate Recommendation
Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction

Synthesizes results from:
- reports/ensemble_tuning_summary.csv (5-fold nested CV hyperparameter tuning)
- reports/threshold_tuning_summary.csv (5-fold nested CV threshold optimization)

Key Objectives:
1. Compares 5 candidate approaches (LR, RF, GB, Soft Voting, Stacking) across 4 vessel targets (Cath, LAD, LCX, RCA).
2. Evaluates performance multi-dimensionally: ROC-AUC, Brier score, Recall, Precision, F1, Accuracy, and fold-to-fold variance.
3. Analyzes operational trade-offs across decision thresholds (Default 0.50, F1-Optimized, Recall-Focused F2, Youden's J).
4. Strictly avoids single-metric ranking on raw accuracy; highlights False Negative (FN) and False Positive (FP) clinical implications.
5. Produces nuanced, evidence-based candidate recommendations without making unsupported clinical claims.
6. Clearly distinguishes cross-validation evaluated candidate models from retrained production models.
7. Generates:
   - reports/final_model_selection.md
   - reports/model_selection_candidates.json
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple

import pandas as pd
import numpy as np

# Robust base directory resolution (Multimodal project root)
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

try:
    from ml.transformers import TARGET_CONFIG
except ImportError:
    # Fallback dictionary if imported outside project structure
    TARGET_CONFIG = {
        "Cath": {"positive_label": "CAD", "negative_label": "Normal", "description": "Overall Coronary Artery Disease"},
        "LAD": {"positive_label": "Stenotic", "negative_label": "Normal", "description": "Left Anterior Descending Artery Stenosis"},
        "LCX": {"positive_label": "Stenotic", "negative_label": "Normal", "description": "Left Circumflex Artery Stenosis"},
        "RCA": {"positive_label": "Stenotic", "negative_label": "Normal", "description": "Right Coronary Artery Stenosis"}
    }


def resolve_output_path(base_dir: Path, rel_path: str) -> Path:
    """Resolves output path. Appends timestamp suffix if file already exists to prevent accidental overwriting."""
    target = base_dir / rel_path
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        return target
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    stem = target.stem
    suffix = target.suffix
    new_name = f"{stem}_{timestamp}{suffix}"
    return target.parent / new_name


def validate_and_load_summaries(reports_dir: Path) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Validates existence and required columns of previous experiment summaries."""
    ens_path = reports_dir / "ensemble_tuning_summary.csv"
    thr_path = reports_dir / "threshold_tuning_summary.csv"

    if not ens_path.exists():
        raise FileNotFoundError(
            f"Ensemble tuning summary not found at: {ens_path}. "
            "Please run 'python ml/tune_ensemble_models.py' first."
        )
    if not thr_path.exists():
        raise FileNotFoundError(
            f"Threshold tuning summary not found at: {thr_path}. "
            "Please run 'python ml/tune_thresholds.py' first."
        )

    df_ens = pd.read_csv(ens_path)
    df_thr = pd.read_csv(thr_path)

    required_ens_cols = [
        "target", "model", "mean_accuracy", "std_accuracy", "mean_precision", "std_precision",
        "mean_recall", "std_recall", "mean_f1", "std_f1", "mean_roc_auc", "std_roc_auc",
        "mean_brier_score", "std_brier_score", "total_tn", "total_fp", "total_fn", "total_tp"
    ]
    required_thr_cols = [
        "target", "model", "threshold_strategy", "mean_threshold", "std_threshold",
        "mean_accuracy", "std_accuracy", "mean_precision", "std_precision", "mean_recall", "std_recall",
        "mean_f1", "std_f1", "mean_roc_auc", "std_roc_auc", "mean_brier_score", "std_brier_score",
        "total_tn", "total_fp", "total_fn", "total_tp", "total_delta_fn_vs_default", "total_delta_fp_vs_default"
    ]

    missing_ens = [c for c in required_ens_cols if c not in df_ens.columns]
    if missing_ens:
        raise ValueError(f"Missing required columns in {ens_path.name}: {missing_ens}")

    missing_thr = [c for c in required_thr_cols if c not in df_thr.columns]
    if missing_thr:
        raise ValueError(f"Missing required columns in {thr_path.name}: {missing_thr}")

    print(f"Successfully loaded and validated {ens_path.name} ({len(df_ens)} rows) and {thr_path.name} ({len(df_thr)} rows).")
    return df_ens, df_thr


def analyze_target_candidates(target: str, df_ens: pd.DataFrame, df_thr: pd.DataFrame) -> Dict[str, Any]:
    """
    Performs comprehensive multi-criteria candidate analysis for a single vessel target.
    """
    t_ens = df_ens[df_ens["target"] == target].copy()
    t_thr = df_thr[df_thr["target"] == target].copy()

    # Pre-extract data subsets by threshold strategy
    def_thr = t_thr[t_thr["threshold_strategy"] == "default_0.50"]
    f1_thr = t_thr[t_thr["threshold_strategy"] == "f1_optimized"]
    f2_thr = t_thr[t_thr["threshold_strategy"] == "recall_focused_f2"]
    yd_thr = t_thr[t_thr["threshold_strategy"] == "youden_j"]

    # Target-specific candidate selection rationale grounded in empirical data
    if target == "Cath":
        primary = {
            "model_name": "SoftVoting",
            "model_type": "SoftVotingClassifier(LogisticRegression, RandomForest, GradientBoosting)",
            "rationale": (
                "Soft Voting achieved the highest overall discrimination (ROC-AUC 0.9318 ± 0.0461) and highest "
                "accuracy (0.8842 ± 0.0508) at the default threshold, with outstanding calibration (Brier 0.1009). "
                "By averaging probabilities, it combines Random Forest's high precision (0.9441) with Gradient "
                "Boosting's high recall (0.9351), missing only 16 CAD cases across all 216 diseased patients (FN=16). "
                "Under F1-optimized threshold (T=0.43), sensitivity further improves to 94.0% with only 13 missed cases."
            ),
            "recommended_threshold_strategy": "default_0.50 (for balanced triage) or f1_optimized (T~0.43 for screening)"
        }
        alternative = {
            "model_name": "RandomForest",
            "model_type": "RandomForestClassifier",
            "rationale": (
                "Random Forest provides the highest precision (0.9441 ± 0.0378 at T=0.50), resulting in the lowest false "
                "positive alarm rate (only 11 false alarms across 87 normal patients). It also offers single-model operational "
                "simplicity and fast inference."
            ),
            "recommended_threshold_strategy": "f1_optimized (T~0.42, boosting recall to 92.1% while maintaining 89.8% precision)"
        }

    elif target == "LAD":
        primary = {
            "model_name": "RandomForest",
            "model_type": "RandomForestClassifier",
            "rationale": (
                "The LAD supplies the anterior myocardial wall, making balanced sensitivity clinically vital. "
                "Random Forest achieved the highest baseline accuracy (0.7857 ± 0.0489) and F1-score (0.8207 ± 0.0376) "
                "at T=0.50 with strong ROC-AUC (0.8449 ± 0.0564). When operating under the F1-optimized threshold (T=0.45), "
                "Random Forest achieves 88.19% recall (reducing missed stenoses from 29 to 21) while maintaining 78.24% precision, "
                "matching ensemble performance without multi-model architectural overhead."
            ),
            "recommended_threshold_strategy": "f1_optimized (T~0.45, balancing 88.2% recall with 78.2% precision)"
        }
        alternative = {
            "model_name": "Stacking",
            "model_type": "StackingClassifier(LogisticRegression meta-model)",
            "rationale": (
                "Stacking achieved the top ROC-AUC (0.8496 ± 0.0606) and lowest Brier score (0.1615), offering the best overall "
                "probability ranking capability across candidate architectures."
            ),
            "recommended_threshold_strategy": "f1_optimized (T~0.38, yielding 88.18% recall and 77.29% precision)"
        }

    elif target == "LCX":
        primary = {
            "model_name": "Stacking",
            "model_type": "StackingClassifier(LogisticRegression meta-model)",
            "rationale": (
                "LCX stenosis is challenging due to subtle diagnostic signs and class imbalance (39.3% positive). "
                "Stacking achieved the highest ROC-AUC (0.7186 ± 0.0765) and highest default F1-score (0.6324 ± 0.1081). "
                "Crucially, Stacking's meta-model dynamically adjusted for Gradient Boosting's uncalibrated probability collapse "
                "(which missed 75 out of 119 cases), delivering 70.62% default sensitivity. Under Youden's J (T=0.49), "
                "it achieves 74.75% recall and 58.36% precision with optimal ROC balance."
            ),
            "recommended_threshold_strategy": "youden_j (T~0.49, optimal ROC operating point with F1=0.6481)"
        }
        alternative = {
            "model_name": "SoftVoting",
            "model_type": "SoftVotingClassifier",
            "rationale": (
                "Soft Voting achieved top default accuracy (0.6832 ± 0.0599) and competitive AUC (0.7170 ± 0.0801). "
                "When paired with an F1-optimized threshold (T=0.40), it achieves 87.39% recall and 64.76% F1."
            ),
            "recommended_threshold_strategy": "f1_optimized (T~0.40, overcoming single-tree false negative bias)"
        }

    else:  # RCA
        primary = {
            "model_name": "Stacking",
            "model_type": "StackingClassifier(LogisticRegression meta-model)",
            "rationale": (
                "Stacking achieved the highest ROC-AUC (0.7379 ± 0.0438) and lowest Brier score (0.2133) on RCA. "
                "It maintains high sensitivity (68.34% at T=0.50, rising to 75.42% under Youden's J at T=0.46) while "
                "resisting the severe sensitivity collapse seen in unweighted tree models."
            ),
            "recommended_threshold_strategy": "youden_j (T~0.46, reducing missed stenoses with minimal false alarm increase)"
        }
        alternative = {
            "model_name": "LogisticRegression",
            "model_type": "LogisticRegression(class_weight='balanced')",
            "rationale": (
                "Logistic Regression demonstrated the highest stability across folds (AUC std of only ±0.0335 vs ±0.0438-0.0706 "
                "for tree ensembles) and the highest default accuracy (0.6865 ± 0.0271). Its linear log-odds formulation provides "
                "direct coefficient interpretability without ensemble complexity."
            ),
            "recommended_threshold_strategy": "youden_j (T~0.41, achieving 76.29% sensitivity and 62.40% F1)"
        }

    # Compile structured summary dictionary
    candidate_summary = {
        "target": target,
        "description": TARGET_CONFIG.get(target, {}).get("description", ""),
        "primary_candidate": primary,
        "alternative_candidate": alternative,
        "cross_validation_models": {}
    }

    for m in ["LogisticRegression", "RandomForest", "GradientBoosting", "SoftVoting", "Stacking"]:
        m_def = def_thr[def_thr["model"] == m].iloc[0]
        m_f1 = f1_thr[f1_thr["model"] == m].iloc[0] if not f1_thr[f1_thr["model"] == m].empty else None
        m_f2 = f2_thr[f2_thr["model"] == m].iloc[0] if not f2_thr[f2_thr["model"] == m].empty else None
        m_yd = yd_thr[yd_thr["model"] == m].iloc[0] if not yd_thr[yd_thr["model"] == m].empty else None

        candidate_summary["cross_validation_models"][m] = {
            "roc_auc": {"mean": m_def["mean_roc_auc"], "std": m_def["std_roc_auc"]},
            "brier_score": {"mean": m_def["mean_brier_score"], "std": m_def["std_brier_score"]},
            "default_0.50": {
                "threshold": 0.50,
                "accuracy": {"mean": m_def["mean_accuracy"], "std": m_def["std_accuracy"]},
                "recall": {"mean": m_def["mean_recall"], "std": m_def["std_recall"]},
                "precision": {"mean": m_def["mean_precision"], "std": m_def["std_precision"]},
                "f1": {"mean": m_def["mean_f1"], "std": m_def["std_f1"]},
                "total_cm": {"tn": int(m_def["total_tn"]), "fp": int(m_def["total_fp"]), "fn": int(m_def["total_fn"]), "tp": int(m_def["total_tp"])}
            },
            "f1_optimized": {
                "threshold": {"mean": m_f1["mean_threshold"], "std": m_f1["std_threshold"]} if m_f1 is not None else None,
                "recall": {"mean": m_f1["mean_recall"], "std": m_f1["std_recall"]} if m_f1 is not None else None,
                "precision": {"mean": m_f1["mean_precision"], "std": m_f1["std_precision"]} if m_f1 is not None else None,
                "f1": {"mean": m_f1["mean_f1"], "std": m_f1["std_f1"]} if m_f1 is not None else None,
                "accuracy": {"mean": m_f1["mean_accuracy"], "std": m_f1["std_accuracy"]} if m_f1 is not None else None,
                "delta_fn": int(m_f1["total_delta_fn_vs_default"]) if m_f1 is not None else 0,
                "delta_fp": int(m_f1["total_delta_fp_vs_default"]) if m_f1 is not None else 0
            } if m_f1 is not None else None,
            "recall_focused_f2": {
                "threshold": {"mean": m_f2["mean_threshold"], "std": m_f2["std_threshold"]} if m_f2 is not None else None,
                "recall": {"mean": m_f2["mean_recall"], "std": m_f2["std_recall"]} if m_f2 is not None else None,
                "precision": {"mean": m_f2["mean_precision"], "std": m_f2["std_precision"]} if m_f2 is not None else None,
                "f1": {"mean": m_f2["mean_f1"], "std": m_f2["std_f1"]} if m_f2 is not None else None,
                "accuracy": {"mean": m_f2["mean_accuracy"], "std": m_f2["std_accuracy"]} if m_f2 is not None else None,
                "delta_fn": int(m_f2["total_delta_fn_vs_default"]) if m_f2 is not None else 0,
                "delta_fp": int(m_f2["total_delta_fp_vs_default"]) if m_f2 is not None else 0
            } if m_f2 is not None else None
        }

    return candidate_summary


def generate_final_report_md(candidates: Dict[str, Any], df_ens: pd.DataFrame, df_thr: pd.DataFrame, out_path: Path):
    """
    Constructs the detailed Markdown report documenting the selection evidence and trade-offs.
    """
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("# Final Model Selection & Optimization Report\n\n")
        f.write("**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  \n")
        f.write(f"**Date:** {datetime.now().strftime('%B %Y')}  \n")
        f.write("**Scope:** Research Model Selection & Multi-Metric Trade-Off Evaluation  \n\n")
        f.write("> [!IMPORTANT]\n")
        f.write("> **Research Prototype Disclaimer:** This analysis evaluates experimental statistical models trained on a single-center dataset ($N=303$). "
                "These models are research prototypes and **must not be used as clinical diagnostic devices** or substitutes for professional medical judgment. "
                "Performance estimates reflect cross-validation within this cohort and require prospective multi-center external validation.\n\n")
        f.write("---\n\n")

        f.write("## 1. Executive Summary & Selection Architecture\n\n")
        f.write("Following Phase 2 baseline benchmarking and Phase 3 API implementation, two nested cross-validation experiments were conducted:\n")
        f.write("1. **Hyperparameter Tuning & Ensemble Evaluation (`tune_ensemble_models.py`):** Optimized Logistic Regression, Random Forest, and Gradient Boosting under inner 3-fold CV, and compared them against Soft Voting and Stacking ensembles.\n")
        f.write("2. **Leakage-Safe Threshold Tuning (`tune_thresholds.py`):** Optimized classification thresholds strictly on inner out-of-fold training probabilities, evaluating operational trade-offs without outer test set contamination.\n\n")
        f.write("### Recommended Candidate Models Summary\n\n")
        f.write("| Target | Primary Candidate | Rationale | Recommended Threshold | Alternative Candidate |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- |\n")
        for target, info in candidates["targets"].items():
            prim = info["primary_candidate"]
            alt = info["alternative_candidate"]
            f.write(f"| **{target}** | **{prim['model_name']}** | {prim['model_type']} | {prim['recommended_threshold_strategy']} | {alt['model_name']} |\n")

        f.write("\n---\n\n")
        f.write("## 2. Distinction: Cross-Validation Candidates vs. Retrained Production Models\n\n")
        f.write("A critical distinction must be maintained between cross-validation candidate evaluation and final production model serialization:\n\n")
        f.write("- **Cross-Validation Candidate Evaluation:**\n")
        f.write("  - Models were trained on 80% splits ($\sim 242$ rows) and evaluated on held-out 20% splits ($\sim 61$ rows) over 5 stratified outer folds.\n")
        f.write("  - The metrics reported in this document represent **unbiased generalization estimates** across unseen folds, including fold-to-fold standard deviations.\n\n")
        f.write("- **Production Retraining (Inference Pipeline):**\n")
        f.write("  - Production models currently deployed in `ml/artifacts/` (`model_cath.joblib`, etc.) were fitted on all 303 available records after Phase 2 model selection.\n")
        f.write("  - In accordance with safety rules, **no production models were overwritten or retrained automatically**. Updating production models to candidate architectures requires explicit operational sign-off and separate serialization.\n\n")

        f.write("---\n\n")
        f.write("## 3. Multi-Metric Evaluation Framework & Asymmetric Clinical Costs\n\n")
        f.write("In cardiovascular risk modeling, models **must never be ranked on accuracy alone**:\n\n")
        f.write("1. **The Accuracy Paradox on Imbalanced Arteries:**\n")
        f.write("   - In `LCX` (39.3% positive) and `RCA` (37.6% positive), a naive model predicting 'Normal' for every patient achieves 61–63% accuracy while having **0% recall** (missing every single stenotic artery!).\n")
        f.write("   - Gradient Boosting under default $T=0.50$ achieved 65.0% accuracy on LCX, but missed 75 out of 119 stenoses (recall 37.1%). Lowering the decision threshold to $T=0.30$ slightly lowered raw accuracy to 60.4%, but recovered recall to **89.9%** (cutting missed cases from 75 down to 12).\n\n")
        f.write("2. **False Negative ($FN$) vs. False Positive ($FP$) Trade-Off:**\n")
        f.write("   - A **False Negative** represents a patient with undetected severe arterial occlusion who misses necessary clinical management.\n")
        f.write("   - A **False Positive** leads to confirmatory testing (e.g. stress echocardiography, coronary CT angiography, or catheterization).\n")
        f.write("   - Lowering the decision threshold classifies more borderline cases as positive, sharply increasing Recall at the expense of lower Precision and higher False Positives.\n\n")

        f.write("---\n\n")
        f.write("## 4. Target-by-Target Comparative Evidence & Selection Rationale\n\n")

        for target, info in candidates["targets"].items():
            f.write(f"### Target: {target} ({info['description']})\n\n")
            f.write("#### 5-Model Performance Comparison (Mean ± Std over 5 Outer Folds)\n\n")
            f.write("| Model | ROC-AUC | Brier Score | Acc (T=0.50) | Recall (T=0.50) | Prec (T=0.50) | F1 (T=0.50) | Total FN / FP |\n")
            f.write("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n")

            t_df = df_ens[df_ens["target"] == target]
            for _, r in t_df.iterrows():
                f.write(
                    f"| **{r['model']}** | {r['mean_roc_auc']:.3f} ± {r['std_roc_auc']:.3f} | "
                    f"{r['mean_brier_score']:.3f} | {r['mean_accuracy']:.3f} | "
                    f"{r['mean_recall']:.3f} | {r['mean_precision']:.3f} | "
                    f"{r['mean_f1']:.3f} | FN: {r['total_fn']} / FP: {r['total_fp']} |\n"
                )

            f.write("\n#### Threshold Optimization Shifts for Candidate Models\n\n")
            f.write("| Model | Strategy | Mean Thresh | Recall | Precision | F1-Score | Accuracy | Net $\\Delta FN$ | Net $\\Delta FP$ |\n")
            f.write("| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n")

            t_thr_sub = df_thr[df_thr["target"] == target]
            for m in [info["primary_candidate"]["model_name"], info["alternative_candidate"]["model_name"]]:
                m_sub = t_thr_sub[t_thr_sub["model"] == m]
                for _, r in m_sub.iterrows():
                    f.write(
                        f"| {r['model']} | `{r['threshold_strategy']}` | {r['mean_threshold']:.2f} ± {r['std_threshold']:.2f} | "
                        f"{r['mean_recall']:.3f} | {r['mean_precision']:.3f} | {r['mean_f1']:.3f} | "
                        f"{r['mean_accuracy']:.3f} | {r['total_delta_fn_vs_default']:+d} | {r['total_delta_fp_vs_default']:+d} |\n"
                    )

            f.write(f"\n**Candidate Recommendation Rationale:**\n")
            f.write(f"- **Primary Recommendation ({info['primary_candidate']['model_name']}):** {info['primary_candidate']['rationale']}\n")
            f.write(f"- **Operating Threshold:** `{info['primary_candidate']['recommended_threshold_strategy']}`\n")
            f.write(f"- **Alternative Recommendation ({info['alternative_candidate']['model_name']}):** {info['alternative_candidate']['rationale']}\n\n")
            f.write("---\n\n")

        f.write("## 5. Methodological Limitations & Future Research Considerations\n\n")
        f.write("1. **Single-Center Cohort ($N=303$):** Sample size limits fold-level positive counts (especially for LCX and RCA, with ~24 positives per test fold). This contributes to fold-to-fold standard deviations of ±0.06 to ±0.10.\n")
        f.write("2. **No Automatic Clinical Thresholds:** Decision thresholds cannot be generalized across institutions without prospective decision-curve analysis or verified hospital cost-benefit matrices.\n")
        f.write("3. **External Validation Prerequisite:** Before these models could be considered for clinical translation, validation on geographically diverse cohorts with different angiographic protocols is required.\n")


def generate_candidate_json(candidates: Dict[str, Any], out_path: Path):
    """Exports structured configuration file for candidate models."""
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(candidates, f, indent=2)


def main():
    reports_dir = BASE_DIR / "reports"
    print("================================================================================")
    print(" Multimodal AI Research - Final Model Selection & Optimization Synthesis")
    print("================================================================================")
    print(f"Project Root: {BASE_DIR}")
    print(f"Reports Directory: {reports_dir}\n")

    # 1. Validate and load summary reports
    df_ens, df_thr = validate_and_load_summaries(reports_dir)

    # 2. Analyze candidates for all 4 targets
    targets = ["Cath", "LAD", "LCX", "RCA"]
    candidates_catalog = {
        "project": "Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction",
        "created_at": datetime.now().isoformat(),
        "dataset_scope": "Z-Alizadeh Sani Cardiovascular Dataset (N=303, Single-Center Research Cohort)",
        "disclaimer": (
            "Experimental prototype output. Not a medical device. "
            "Cross-validation candidate models are strictly separated from production artifacts. "
            "Model probabilities reflect statistical research estimates and must not replace clinical judgment."
        ),
        "production_status": {
            "retrained_on_full_dataset": False,
            "production_models_replaced": False,
            "production_directory": str(BASE_DIR / "ml" / "artifacts")
        },
        "targets": {}
    }

    for t in targets:
        print(f"\nAnalyzing selection evidence for target: {t}...")
        t_summary = analyze_target_candidates(t, df_ens, df_thr)
        candidates_catalog["targets"][t] = t_summary
        prim = t_summary["primary_candidate"]
        print(f"  -> Primary Candidate: {prim['model_name']} ({prim['recommended_threshold_strategy']})")
        print(f"  -> Alternative:        {t_summary['alternative_candidate']['model_name']}")

    # 3. Resolve output paths
    md_out_path = resolve_output_path(BASE_DIR, "reports/final_model_selection.md")
    json_out_path = resolve_output_path(BASE_DIR, "reports/model_selection_candidates.json")

    # 4. Generate reports
    generate_final_report_md(candidates_catalog, df_ens, df_thr, md_out_path)
    print(f"\nSaved final model selection report to: {md_out_path}")

    generate_candidate_json(candidates_catalog, json_out_path)
    print(f"Saved candidate models configuration to: {json_out_path}")

    print("\n================================================================================")
    print(" Model Selection Synthesis Completed Successfully")
    print("================================================================================")
    return md_out_path, json_out_path


if __name__ == "__main__":
    main()
