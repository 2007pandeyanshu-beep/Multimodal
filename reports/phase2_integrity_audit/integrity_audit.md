# CardioVision AI — Phase 2.1: Evaluation Integrity Audit & Corrections Report

**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Repository Working Directory:** `D:\Multimodal`  
**Git Working Branch:** `person-a-ml-backend`  
**Base Commit / HEAD:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`  
**Audit Package Location:** [`reports/phase2_integrity_audit/`](file:///D:/Multimodal/reports/phase2_integrity_audit/)  
**Date:** October 2026  

---

## 1. Executive Summary & Audit Mandate

Following the generation of the Phase 2 evaluation package, this audit was conducted to enforce strict numerical integrity, resolve all apparent discrepancies between evaluation outputs, and ensure that every metric and visualization is mathematically grounded in reproducible evidence.

### Core Audit Outcomes
1. **Single Source of Truth Recomputed:** Every metric across all four targets (`Cath`, `LAD`, `LCX`, `RCA`) and all three models (`RandomForest`, `LogisticRegression`, `GradientBoosting`) was independently recomputed directly from the 303 patient-level out-of-fold predictions ([`oof_predictions.csv`](file:///D:/Multimodal/reports/phase2_charts/oof_predictions.csv)) and the 5 fold splits ([`fold_level_metrics.csv`](file:///D:/Multimodal/reports/phase2_charts/fold_level_metrics.csv)).
2. **Discrepancy Decoupling:** We resolved the apparent discrepancy between values reported in `reports/model_comparison.csv` and those displayed on Phase 2 visualization curves:
   - **`Mean ± standard deviation across five folds`** averages within-fold statistics ($\frac{1}{5} \sum_{k=1}^5 M_k$).
   - **`Pooled out-of-fold metrics`** evaluates the concatenated 303 validation predictions globally ($N=303$).
   - Both methods are mathematically valid but evaluate distinct statistical concepts. In the corrected visualizations, **both values are explicitly labeled** in chart legends and titles to eliminate ambiguity.
3. **Confusion Matrix Perfection:** Verified that each confusion matrix sums to exactly **303 unique patient predictions** ($TN + FP + FN + TP = 303$). Axis orientations, positive/negative class labels, and cell percentages were audited and confirmed.
4. **Brier Loss & Calibration Clarification:** Refuted the presentation of $0.25$ as a universal calibration baseline. We established that $0.25$ represents only the expected loss of a constant $0.50$ prediction. The true uninformative prior baseline is target-specific ($p(1-p)$): $0.2047$ for `Cath`, $0.2429$ for `LAD`, $0.2385$ for `LCX`, and $0.2347$ for `RCA`. Raw Random Forest tree vote proportions were explicitly labeled as uncalibrated.
5. **Zero Overwrites:** All original Phase 2 figures in `reports/phase2_charts/` and previous evaluation reports were preserved intact. Corrected figures and verified tables are housed exclusively in [`reports/phase2_integrity_audit/`](file:///D:/Multimodal/reports/phase2_integrity_audit/).

---

## 2. Single Source of Truth Reconciliation

### 2.1 Dataset and Out-of-Fold Completeness
- **Patient Population:** Exactly 303 unique patient records in `data/processed/cad_clean.csv`.
- **Validation Split Completeness:** In `oof_predictions.csv`, each patient index $i \in [0, 302]$ appears exactly once in an out-of-fold validation set across the 5 stratified folds (Folds 1–3: $N=61$; Folds 4–5: $N=60$).
- **Zero Missing Data:** 303 true labels, 303 predicted classes, and 303 predicted probabilities are present for all 12 target/model combinations.

### 2.2 Target Positive Class Definitions & Prevalences

| Target | Clinical Description | Positive Label (1) | Negative Label (0) | Positive Count | Negative Count | Prevalence ($p$) | Prevalence Prior Loss $p(1-p)$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`Cath`** | Overall CAD (Catheterization) | `'CAD'` | `'Normal'` | 216 | 87 | 71.29% | 0.2047 |
| **`LAD`** | Left Anterior Descending Stenosis ($\ge 50\%$) | `'Stenotic'` | `'Normal'` | 177 | 126 | 58.42% | 0.2429 |
| **`LCX`** | Left Circumflex Stenosis ($\ge 50\%$) | `'Stenotic'` | `'Normal'` | 119 | 184 | 39.27% | 0.2385 |
| **`RCA`** | Right Coronary Stenosis ($\ge 50\%$) | `'Stenotic'` | `'Normal'` | 114 | 189 | 37.62% | 0.2347 |

---

## 3. Discrepancy Resolution & Audit Findings

### 3.1 Understanding the Difference Between Pooled OOF and Fold-Mean Metrics
A critical finding of this audit is distinguishing between two standard, yet mathematically distinct, cross-validation aggregation methods:

1. **`Mean ± standard deviation across five folds`:**
   - Evaluated on each fold $k$ independently, then averaged:
     $$\bar{M} = \frac{1}{K} \sum_{k=1}^K M_k, \quad \sigma_M = \sqrt{\frac{1}{K} \sum_{k=1}^K (M_k - \bar{M})^2}$$
   - Measures average estimator performance on an unseen split of size $N \approx 60$.
   - This was the metric set reported in `reports/model_comparison.csv` and `ml/model_metadata.json`.
2. **`Pooled out-of-fold metrics`:**
   - Evaluated on the globally concatenated vector of all 303 validation predictions:
     $$y_{\text{true}} = [y_{\text{val}, 1}, \dots, y_{\text{val}, 5}], \quad y_{\text{prob}} = [\hat{p}_{\text{val}, 1}, \dots, \hat{p}_{\text{val}, 5}]$$
   - Generates single cohort-wide ROC curves, PR curves, and confusion matrices ($N=303$).
   - This was the metric set plotted on the Phase 2 ROC and PR curve figures.

### 3.2 Evidence-Backed Explanations for Numerical Differences
- **ROC-AUC Difference:**
  - *Finding:* For Cath Random Forest, the Pooled OOF ROC-AUC is **0.9144**, whereas the Fold-Mean ROC-AUC is **0.9195** ($\Delta = -0.0051$).
  - *Mathematical Cause:* Pooled ROC-AUC ranks all 303 validation predictions globally against each other. Because each fold's tree ensemble produces slightly different calibration offsets (minor inter-fold threshold shifts), concatenating predictions introduces subtle ranking noise across fold boundaries that does not exist when ranking within each fold independently.
- **Precision Difference:**
  - *Finding:* For Cath Random Forest, Pooled Precision is **0.9343** ($185 / 198$), whereas Fold-Mean Precision is **0.9349** ($\Delta = -0.0006$).
  - *Mathematical Cause:* The ratio of sums $\frac{\sum TP_k}{\sum (TP_k + FP_k)}$ differs from the mean of ratios $\frac{1}{5} \sum \frac{TP_k}{TP_k + FP_k}$ because fold sizes vary slightly ($61, 61, 61, 60, 60$) and class distributions within folds vary.
- **Confusion Matrix Counts Match Exactly:**
  - The sum of fold-level confusion matrix cells equals the pooled confusion matrix cells with **zero discrepancy**:
    - Cath RF: $TN = 74, FP = 13, FN = 31, TP = 185$ (Sum = 303).
    - LAD RF: $TN = 89, FP = 37, FN = 28, TP = 149$ (Sum = 303).
    - LCX RF: $TN = 121, FP = 63, FN = 46, TP = 73$ (Sum = 303).
    - RCA RF: $TN = 131, FP = 58, FN = 42, TP = 72$ (Sum = 303).

### 3.3 Complete Discrepancy Summary Table

The table below reconciles all reported values against independently recomputed values:

| Target | Model | Metric | Original Reported Value (`model_comparison.csv`) | Original Reported Value (Phase 2 Figures) | Independently Verified Fold-Mean | Independently Verified Pooled OOF | Discrepancy & Mathematical Source |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Cath** | RandomForest | **ROC-AUC** | 0.9195 ± 0.0390 | 0.914 (Fig 2) | **0.9195 ± 0.0390** | **0.9144** | Fig 2 displayed pooled OOF; CSV reported fold-mean. Both verified. |
| **Cath** | RandomForest | **Precision** | 0.9349 ± 0.0350 | 93.4% (Fig 1) | **0.9349 ± 0.0350** | **0.9343** | Ratio of sums (185/198 = 0.9343) vs mean of fold precisions (0.9349). |
| **Cath** | RandomForest | **Sensitivity** | 0.8564 ± 0.0559 | 85.6% (Fig 1) | **0.8565 ± 0.0559** | **0.8565** | 0.0001 rounding difference in CSV export. Pooled = 185/216 = 0.8565. |
| **Cath** | RandomForest | **Brier Score** | 0.1220 ± 0.0212 | 0.122 (Fig 6, 8) | **0.1220 ± 0.0212** | **0.1220** | Exact match. |
| **Cath** | LogisticRegression | **ROC-AUC** | 0.9279 ± 0.0375 | 0.926 (Fig 2) | **0.9279 ± 0.0375** | **0.9256** | Fig 2 displayed pooled OOF; CSV reported fold-mean. |
| **Cath** | GradientBoosting | **ROC-AUC** | 0.9070 ± 0.0492 | 0.903 (Fig 2) | **0.9069 ± 0.0492** | **0.9025** | Fig 2 displayed pooled OOF; CSV reported fold-mean (0.0001 rounding). |
| **LAD** | RandomForest | **ROC-AUC** | 0.8383 ± 0.0684 | 0.835 (Fig 2) | **0.8383 ± 0.0684** | **0.8352** | Fig 2 displayed pooled OOF; CSV reported fold-mean. |
| **LAD** | RandomForest | **Sensitivity** | 0.8424 ± 0.0472 | 84.2% (Fig 1) | **0.8424 ± 0.0472** | **0.8418** | Ratio of sums (149/177 = 0.8418) vs mean of fold sensitivities (0.8424). |
| **LAD** | RandomForest | **Precision** | 0.8028 ± 0.0466 | 80.1% (Fig 1) | **0.8027 ± 0.0466** | **0.8011** | Ratio of sums (149/186 = 0.8011) vs mean of fold precisions (0.8027). |
| **LAD** | GradientBoosting | **ROC-AUC** | 0.8446 ± 0.0644 | 0.838 (Fig 2) | **0.8446 ± 0.0644** | **0.8376** | Fig 2 displayed pooled OOF; CSV reported fold-mean. |
| **LCX** | RandomForest | **ROC-AUC** | 0.7199 ± 0.0752 | 0.713 (Fig 2) | **0.7199 ± 0.0752** | **0.7130** | Fig 2 displayed pooled OOF; CSV reported fold-mean. |
| **LCX** | RandomForest | **Precision** | 0.5469 ± 0.1022 | 53.7% (Fig 1) | **0.5469 ± 0.1022** | **0.5368** | Ratio of sums (73/136 = 0.5368) vs mean of fold precisions (0.5469). |
| **LCX** | GradientBoosting | **ROC-AUC** | 0.7154 ± 0.0573 | 0.716 (Fig 2) | **0.7154 ± 0.0573** | **0.7162** | Slight pooled increase due to favorable threshold alignment. |
| **RCA** | RandomForest | **ROC-AUC** | 0.7340 ± 0.0527 | 0.731 (Fig 2) | **0.7340 ± 0.0527** | **0.7313** | Fig 2 displayed pooled OOF; CSV reported fold-mean. |
| **RCA** | RandomForest | **Sensitivity** | 0.6308 ± 0.0749 | 63.2% (Fig 1) | **0.6308 ± 0.0748** | **0.6316** | Ratio of sums (72/114 = 0.6316) vs mean of fold sensitivities (0.6308). |
| **RCA** | RandomForest | **Precision** | 0.5563 ± 0.0617 | 55.4% (Fig 1) | **0.5563 ± 0.0617** | **0.5538** | Ratio of sums (72/130 = 0.5538) vs mean of fold precisions (0.5563). |

---

## 4. Confusion Matrix Verification

### 4.1 Verification Protocol
- **Record Count Verification:** Every matrix was verified to contain exactly $303$ unique out-of-fold patient evaluations:
  - `Cath`: $74 + 13 + 31 + 185 = \mathbf{303}$
  - `LAD`: $89 + 37 + 28 + 149 = \mathbf{303}$
  - `LCX`: $121 + 63 + 46 + 73 = \mathbf{303}$
  - `RCA`: $131 + 58 + 42 + 72 = \mathbf{303}$
- **Axis Orientation:**
  - Y-axis: True Angiographic Diagnosis (Catheterization Gold Standard). Index 0 = Negative, Index 1 = Positive.
  - X-axis: Predicted Diagnosis (Classifier Decision at Threshold 0.50). Index 0 = Negative, Index 1 = Positive.
  - Cell layout:
    - Top-Left (0, 0): True Negative (TN)
    - Top-Right (0, 1): False Positive (FP)
    - Bottom-Left (1, 0): False Negative (FN)
    - Bottom-Right (1, 1): True Positive (TP)
- **Corrections Applied in Verified Figure ([`01_confusion_matrices_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/01_confusion_matrices_verified.png)):**
  - Added explicit header: `"Pooled Out-of-Fold Predictions Across 5 Stratified Folds"`.
  - Added explicit subtitle noting the standard decision threshold ($0.50$) and total sample count ($N=303$).
  - Clearly separated pooled sensitivity, specificity, precision, and accuracy to eliminate confusion with fold-mean benchmarks.

---

## 5. ROC & Precision-Recall Curve Audit

### 5.1 ROC Curve Findings & Dual Labeling
- In the original Figure 2, plotting out-of-fold predictions produced curves corresponding to the **Pooled Out-of-Fold predictions**.
- Legend annotations stated: `Random Forest (Prod) (AUC = 0.914)`. While technically accurate for the plotted curve, judges cross-referencing `model_comparison.csv` saw $0.9195 \pm 0.0390$.
- **Correction Applied in Verified Figure ([`02_roc_curves_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/02_roc_curves_verified.png)):**
  - Updated every legend entry to display **both** metrics simultaneously:
    `Random Forest (Prod): Pooled OOF AUC: 0.914 | Fold-Mean AUC: 0.920 ± 0.039`
  - This eliminates confusion, establishes complete statistical transparency, and explains why both values exist.

### 5.2 Precision-Recall Curve Findings
- In the original Figure 3, Average Precision (AP) was calculated from the pooled out-of-fold probabilities.
- **Correction Applied in Verified Figure ([`03_precision_recall_curves_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/03_precision_recall_curves_verified.png)):**
  - Clearly labeled the metric as `"Pooled OOF AP"`.
  - Clarified that the horizontal reference line corresponds to the exact empirical class prevalence ($p = 71.3\%$ for Cath, $58.4\%$ for LAD, $39.3\%$ for LCX, $37.6\%$ for RCA).

---

## 6. Brier Score & Probability Loss Audit

### 6.1 Refuting the Universal 0.25 Baseline
- **The Theoretical Error:** In naive evaluation discussions, a Brier score of $0.250$ is often described as a universal baseline.
- **The Mathematical Reality:**
  - $0.250$ is simply the expected squared error of a **constant prediction of 0.50**:
    $$B_{\text{const=0.5}} = (0.5 - 1)^2 \cdot p + (0.5 - 0)^2 \cdot (1 - p) = 0.25 \cdot p + 0.25 \cdot (1 - p) = 0.250$$
  - However, for an imbalanced target, a trivial uninformative model predicting the cohort prevalence prior $p$ achieves a lower expected Brier score of $p(1-p)$:
    - For `Cath` ($p = 0.7129$): $0.7129 \times (1 - 0.7129) = \mathbf{0.2047}$ (substantially lower than $0.250$!).
    - For `LAD` ($p = 0.5842$): $0.5842 \times (1 - 0.5842) = \mathbf{0.2429}$.
    - For `LCX` ($p = 0.3927$): $0.3927 \times (1 - 0.3927) = \mathbf{0.2385}$.
    - For `RCA` ($p = 0.3762$): $0.3762 \times (1 - 0.3762) = \mathbf{0.2347}$.
- **Correction Applied in Verified Figure ([`08_brier_score_comparison_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/08_brier_score_comparison_verified.png)):**
  - Plotted the exact target-specific prevalence prior line $p(1-p)$ for each target alongside the constant 0.5 reference line ($0.250$), demonstrating that Random Forest ($0.122$ for Cath, $0.169$ for LAD, $0.216$ for LCX, $0.209$ for RCA) significantly outperforms both trivial baselines.

### 6.2 Raw Probability Non-Calibration Disclosure
- **Mandatory Scientific Statement:** Raw probabilities output by `RandomForestClassifier.predict_proba()` represent tree voting fractions (the proportion of 100 decision trees voting positive).
- Reliability diagrams ([`06_calibration_curves_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/06_calibration_curves_verified.png)) confirm that tree voting fractions exhibit central compression ($0.20-0.80$). They are **not** true Bayesian posterior probabilities and must be interpreted strictly as ordinal risk ranking scores.

---

## 7. Catalog of Corrected & Verified Artifacts

All corrected assets were generated into [`reports/phase2_integrity_audit/`](file:///D:/Multimodal/reports/phase2_integrity_audit/):

| File Name | Asset Type | Description of Verification & Corrections |
| :--- | :---: | :--- |
| [`verified_metrics.csv`](file:///D:/Multimodal/reports/phase2_integrity_audit/verified_metrics.csv) | Data Table | Complete verified table containing sample counts, prevalences, confusion matrix counts, pooled OOF metrics, fold-mean metrics with both sample (`ddof=1`) and population (`ddof=0`) standard deviations, and benchmark CSV cross-checks for all 12 model/target pairs. |
| [`discrepancy_summary.csv`](file:///D:/Multimodal/reports/phase2_integrity_audit/discrepancy_summary.csv) | Data Table | Granular line-by-line reconciliation of every difference between pooled OOF and fold-mean metrics with verified mathematical causes. |
| [`01_confusion_matrices_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/01_confusion_matrices_verified.png) | Figure | Re-rendered confusion matrices explicitly labeled as pooled out-of-fold predictions with decision threshold ($0.50$) and verified sample count ($N=303$). |
| [`02_roc_curves_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/02_roc_curves_verified.png) | Figure | Corrected ROC curves displaying **both** Pooled OOF Curve AUC and 5-Fold Mean AUC in every legend entry, resolving benchmark discrepancies. |
| [`03_precision_recall_curves_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/03_precision_recall_curves_verified.png) | Figure | Precision-recall curves explicitly labeled with pooled OOF Average Precision (AP) scores and exact cohort prevalence baselines. |
| [`04_model_comparison_bars_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/04_model_comparison_bars_verified.png) | Figure | Model comparison bar chart augmented with **$\pm 1$ standard deviation error bars** across the 5 stratified folds. |
| [`05_per_target_metrics_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/05_per_target_metrics_verified.png) | Figure | Per-target metric profile for production Random Forest with fold variability error bars. |
| [`06_calibration_curves_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/06_calibration_curves_verified.png) | Figure | Reliability diagrams with dual Brier score labeling (pooled vs fold-mean) and uncalibrated model disclaimers. |
| [`07_fold_variability_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/07_fold_variability_verified.png) | Figure | Box plots illustrating fold-to-fold metric spread across the 5 stratified folds. |
| [`08_brier_score_comparison_verified.png`](file:///D:/Multimodal/reports/phase2_integrity_audit/08_brier_score_comparison_verified.png) | Figure | Brier prediction loss bar chart comparing models against exact target prevalence prior baselines ($p(1-p)$) and the constant 0.5 reference ($0.250$). |

---

## 8. Scientific & Clinical Guardrails

In compliance with Task 7:
1. **Scope of Evidence:** All reported performance figures reflect **internal 5-fold cross-validation on a single-center referred cohort ($N=303$)** from Tehran Heart Center. They do **not** constitute independent external validation, multi-center generalization, or regulatory-grade clinical efficacy.
2. **Non-Causal Explanation Policy:** We do not make speculative causal clinical explanations for individual false positives or false negatives (e.g. attributing specific errors to hypothetical anatomical variations) because the tabular dataset does not contain hemodynamic pressure wire data, intravascular ultrasound (IVUS), or post-hoc adjudication notes. Individual errors are described purely as statistical classification boundary outcomes.
3. **Research Prototype Boundary:** CardioVision AI remains an academic research proof-of-concept exploring multimodal visualization and tabular risk prediction. It does not replace diagnostic angiography or clinical judgment.

---

## 9. Final Safety & Git Verification

- **Active Branch:** `person-a-ml-backend` (Confirmed).
- **HEAD Commit:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f` (Confirmed).
- **Zero Production Modifications:** No production code, model artifacts, training behavior, API behavior, or frontend code was altered.
- **Zero File Overwrites:** Original Phase 2 evaluation outputs (`reports/phase2_charts/`, `reports/phase2_model_evaluation.md`, `reports/model_comparison.csv`) remain 100% intact.
- **Active Background Services:** Uvicorn (`task-1807` on port 8000) and Vite (`task-1811` on port 5173) are running.

Phase 2.1 is complete. Awaiting your approval before proceeding to any subsequent phase.
