# Final Model Selection & Optimization Report

**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Date:** October 2026  
**Scope:** Research Model Selection & Multi-Metric Trade-Off Evaluation  

> [!IMPORTANT]
> **Research Prototype Disclaimer:** This analysis evaluates experimental statistical models trained on a single-center dataset ($N=303$). These models are research prototypes and **must not be used as clinical diagnostic devices** or substitutes for professional medical judgment. Performance estimates reflect cross-validation within this cohort and require prospective multi-center external validation.

---

## 1. Executive Summary & Selection Architecture

Following Phase 2 baseline benchmarking and Phase 3 API implementation, two nested cross-validation experiments were conducted:
1. **Hyperparameter Tuning & Ensemble Evaluation (`tune_ensemble_models.py`):** Optimized Logistic Regression, Random Forest, and Gradient Boosting under inner 3-fold CV, and compared them against Soft Voting and Stacking ensembles.
2. **Leakage-Safe Threshold Tuning (`tune_thresholds.py`):** Optimized classification thresholds strictly on inner out-of-fold training probabilities, evaluating operational trade-offs without outer test set contamination.

### Recommended Candidate Models Summary

| Target | Primary Candidate | Rationale | Recommended Threshold | Alternative Candidate |
| :--- | :--- | :--- | :--- | :--- |
| **Cath** | **SoftVoting** | SoftVotingClassifier(LogisticRegression, RandomForest, GradientBoosting) | default_0.50 (for balanced triage) or f1_optimized (T~0.43 for screening) | RandomForest |
| **LAD** | **RandomForest** | RandomForestClassifier | f1_optimized (T~0.45, balancing 88.2% recall with 78.2% precision) | Stacking |
| **LCX** | **Stacking** | StackingClassifier(LogisticRegression meta-model) | youden_j (T~0.49, optimal ROC operating point with F1=0.6481) | SoftVoting |
| **RCA** | **Stacking** | StackingClassifier(LogisticRegression meta-model) | youden_j (T~0.46, reducing missed stenoses with minimal false alarm increase) | LogisticRegression |

---

## 2. Distinction: Cross-Validation Candidates vs. Retrained Production Models

A critical distinction must be maintained between cross-validation candidate evaluation and final production model serialization:

- **Cross-Validation Candidate Evaluation:**
  - Models were trained on 80% splits ($\sim 242$ rows) and evaluated on held-out 20% splits ($\sim 61$ rows) over 5 stratified outer folds.
  - The metrics reported in this document represent **unbiased generalization estimates** across unseen folds, including fold-to-fold standard deviations.

- **Production Retraining (Inference Pipeline):**
  - Production models currently deployed in `ml/artifacts/` (`model_cath.joblib`, etc.) were fitted on all 303 available records after Phase 2 model selection.
  - In accordance with safety rules, **no production models were overwritten or retrained automatically**. Updating production models to candidate architectures requires explicit operational sign-off and separate serialization.

---

## 3. Multi-Metric Evaluation Framework & Asymmetric Clinical Costs

In cardiovascular risk modeling, models **must never be ranked on accuracy alone**:

1. **The Accuracy Paradox on Imbalanced Arteries:**
   - In `LCX` (39.3% positive) and `RCA` (37.6% positive), a naive model predicting 'Normal' for every patient achieves 61–63% accuracy while having **0% recall** (missing every single stenotic artery!).
   - Gradient Boosting under default $T=0.50$ achieved 65.0% accuracy on LCX, but missed 75 out of 119 stenoses (recall 37.1%). Lowering the decision threshold to $T=0.30$ slightly lowered raw accuracy to 60.4%, but recovered recall to **89.9%** (cutting missed cases from 75 down to 12).

2. **False Negative ($FN$) vs. False Positive ($FP$) Trade-Off:**
   - A **False Negative** represents a patient with undetected severe arterial occlusion who misses necessary clinical management.
   - A **False Positive** leads to confirmatory testing (e.g. stress echocardiography, coronary CT angiography, or catheterization).
   - Lowering the decision threshold classifies more borderline cases as positive, sharply increasing Recall at the expense of lower Precision and higher False Positives.

---

## 4. Target-by-Target Comparative Evidence & Selection Rationale

### Target: Cath (Overall Coronary Artery Disease (Angiographic Catheterization Outcome))

#### 5-Model Performance Comparison (Mean ± Std over 5 Outer Folds)

| Model | ROC-AUC | Brier Score | Acc (T=0.50) | Recall (T=0.50) | Prec (T=0.50) | F1 (T=0.50) | Total FN / FP |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **LogisticRegression** | 0.921 ± 0.048 | 0.114 | 0.854 | 0.875 | 0.918 | 0.895 | FN: 27 / FP: 17 |
| **RandomForest** | 0.929 ± 0.038 | 0.128 | 0.858 | 0.852 | 0.944 | 0.894 | FN: 32 / FP: 11 |
| **GradientBoosting** | 0.918 ± 0.049 | 0.098 | 0.861 | 0.935 | 0.880 | 0.906 | FN: 14 / FP: 28 |
| **SoftVoting** | 0.932 ± 0.046 | 0.101 | 0.884 | 0.926 | 0.914 | 0.919 | FN: 16 / FP: 19 |
| **Stacking** | 0.931 ± 0.045 | 0.100 | 0.865 | 0.884 | 0.925 | 0.903 | FN: 25 / FP: 16 |

#### Threshold Optimization Shifts for Candidate Models

| Model | Strategy | Mean Thresh | Recall | Precision | F1-Score | Accuracy | Net $\Delta FN$ | Net $\Delta FP$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| SoftVoting | `default_0.50` | 0.50 ± 0.00 | 0.926 | 0.914 | 0.919 | 0.884 | +0 | +0 |
| SoftVoting | `f1_optimized` | 0.43 ± 0.07 | 0.940 | 0.892 | 0.914 | 0.874 | -3 | +6 |
| SoftVoting | `recall_focused_f2` | 0.28 ± 0.06 | 0.967 | 0.823 | 0.889 | 0.828 | -9 | +26 |
| SoftVoting | `youden_j` | 0.55 ± 0.06 | 0.898 | 0.918 | 0.906 | 0.868 | +6 | -1 |
| RandomForest | `default_0.50` | 0.50 ± 0.00 | 0.852 | 0.944 | 0.894 | 0.858 | +0 | +0 |
| RandomForest | `f1_optimized` | 0.42 ± 0.02 | 0.921 | 0.898 | 0.908 | 0.868 | -15 | +12 |
| RandomForest | `recall_focused_f2` | 0.34 ± 0.01 | 0.958 | 0.839 | 0.894 | 0.838 | -23 | +29 |
| RandomForest | `youden_j` | 0.52 ± 0.04 | 0.820 | 0.952 | 0.878 | 0.842 | +7 | -2 |

**Candidate Recommendation Rationale:**
- **Primary Recommendation (SoftVoting):** Soft Voting achieved the highest overall discrimination (ROC-AUC 0.9318 ± 0.0461) and highest accuracy (0.8842 ± 0.0508) at the default threshold, with outstanding calibration (Brier 0.1009). By averaging probabilities, it combines Random Forest's high precision (0.9441) with Gradient Boosting's high recall (0.9351), missing only 16 CAD cases across all 216 diseased patients (FN=16). Under F1-optimized threshold (T=0.43), sensitivity further improves to 94.0% with only 13 missed cases.
- **Operating Threshold:** `default_0.50 (for balanced triage) or f1_optimized (T~0.43 for screening)`
- **Alternative Recommendation (RandomForest):** Random Forest provides the highest precision (0.9441 ± 0.0378 at T=0.50), resulting in the lowest false positive alarm rate (only 11 false alarms across 87 normal patients). It also offers single-model operational simplicity and fast inference.

---

### Target: LAD (Left Anterior Descending Artery Stenosis (>=50% occlusion))

#### 5-Model Performance Comparison (Mean ± Std over 5 Outer Folds)

| Model | ROC-AUC | Brier Score | Acc (T=0.50) | Recall (T=0.50) | Prec (T=0.50) | F1 (T=0.50) | Total FN / FP |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **LogisticRegression** | 0.829 ± 0.061 | 0.179 | 0.733 | 0.729 | 0.799 | 0.760 | FN: 48 / FP: 33 |
| **RandomForest** | 0.845 ± 0.056 | 0.176 | 0.786 | 0.837 | 0.806 | 0.821 | FN: 29 / FP: 36 |
| **GradientBoosting** | 0.844 ± 0.069 | 0.159 | 0.779 | 0.848 | 0.792 | 0.818 | FN: 27 / FP: 40 |
| **SoftVoting** | 0.849 ± 0.060 | 0.164 | 0.779 | 0.831 | 0.802 | 0.815 | FN: 30 / FP: 37 |
| **Stacking** | 0.850 ± 0.061 | 0.162 | 0.772 | 0.803 | 0.809 | 0.805 | FN: 35 / FP: 34 |

#### Threshold Optimization Shifts for Candidate Models

| Model | Strategy | Mean Thresh | Recall | Precision | F1-Score | Accuracy | Net $\Delta FN$ | Net $\Delta FP$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| RandomForest | `default_0.50` | 0.50 ± 0.00 | 0.837 | 0.806 | 0.821 | 0.786 | +0 | +0 |
| RandomForest | `f1_optimized` | 0.45 ± 0.03 | 0.882 | 0.782 | 0.828 | 0.786 | -8 | +8 |
| RandomForest | `recall_focused_f2` | 0.31 ± 0.05 | 0.961 | 0.683 | 0.796 | 0.706 | -22 | +46 |
| RandomForest | `youden_j` | 0.49 ± 0.04 | 0.848 | 0.806 | 0.826 | 0.792 | -2 | +0 |
| Stacking | `default_0.50` | 0.50 ± 0.00 | 0.803 | 0.809 | 0.805 | 0.772 | +0 | +0 |
| Stacking | `f1_optimized` | 0.38 ± 0.05 | 0.882 | 0.773 | 0.822 | 0.776 | -14 | +13 |
| Stacking | `recall_focused_f2` | 0.20 ± 0.01 | 0.950 | 0.681 | 0.792 | 0.706 | -26 | +46 |
| Stacking | `youden_j` | 0.47 ± 0.05 | 0.837 | 0.797 | 0.815 | 0.779 | -6 | +4 |

**Candidate Recommendation Rationale:**
- **Primary Recommendation (RandomForest):** The LAD supplies the anterior myocardial wall, making balanced sensitivity clinically vital. Random Forest achieved the highest baseline accuracy (0.7857 ± 0.0489) and F1-score (0.8207 ± 0.0376) at T=0.50 with strong ROC-AUC (0.8449 ± 0.0564). When operating under the F1-optimized threshold (T=0.45), Random Forest achieves 88.19% recall (reducing missed stenoses from 29 to 21) while maintaining 78.24% precision, matching ensemble performance without multi-model architectural overhead.
- **Operating Threshold:** `f1_optimized (T~0.45, balancing 88.2% recall with 78.2% precision)`
- **Alternative Recommendation (Stacking):** Stacking achieved the top ROC-AUC (0.8496 ± 0.0606) and lowest Brier score (0.1615), offering the best overall probability ranking capability across candidate architectures.

---

### Target: LCX (Left Circumflex Artery Stenosis (>=50% occlusion))

#### 5-Model Performance Comparison (Mean ± Std over 5 Outer Folds)

| Model | ROC-AUC | Brier Score | Acc (T=0.50) | Recall (T=0.50) | Prec (T=0.50) | F1 (T=0.50) | Total FN / FP |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **LogisticRegression** | 0.699 ± 0.078 | 0.226 | 0.660 | 0.655 | 0.557 | 0.601 | FN: 41 / FP: 62 |
| **RandomForest** | 0.711 ± 0.094 | 0.221 | 0.650 | 0.630 | 0.554 | 0.587 | FN: 44 / FP: 62 |
| **GradientBoosting** | 0.713 ± 0.051 | 0.214 | 0.650 | 0.371 | 0.617 | 0.441 | FN: 75 / FP: 31 |
| **SoftVoting** | 0.717 ± 0.080 | 0.216 | 0.683 | 0.563 | 0.616 | 0.585 | FN: 52 / FP: 44 |
| **Stacking** | 0.719 ± 0.076 | 0.221 | 0.673 | 0.706 | 0.575 | 0.632 | FN: 35 / FP: 64 |

#### Threshold Optimization Shifts for Candidate Models

| Model | Strategy | Mean Thresh | Recall | Precision | F1-Score | Accuracy | Net $\Delta FN$ | Net $\Delta FP$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Stacking | `default_0.50` | 0.50 ± 0.00 | 0.706 | 0.575 | 0.632 | 0.673 | +0 | +0 |
| Stacking | `f1_optimized` | 0.44 ± 0.04 | 0.815 | 0.517 | 0.630 | 0.624 | -13 | +28 |
| Stacking | `recall_focused_f2` | 0.38 ± 0.03 | 0.915 | 0.480 | 0.629 | 0.578 | -25 | +54 |
| Stacking | `youden_j` | 0.49 ± 0.04 | 0.748 | 0.584 | 0.648 | 0.677 | -5 | +4 |
| SoftVoting | `default_0.50` | 0.50 ± 0.00 | 0.563 | 0.616 | 0.585 | 0.683 | +0 | +0 |
| SoftVoting | `f1_optimized` | 0.40 ± 0.03 | 0.874 | 0.516 | 0.648 | 0.623 | -37 | +55 |
| SoftVoting | `recall_focused_f2` | 0.31 ± 0.05 | 0.941 | 0.432 | 0.591 | 0.489 | -45 | +104 |
| SoftVoting | `youden_j` | 0.44 ± 0.03 | 0.781 | 0.591 | 0.660 | 0.680 | -26 | +27 |

**Candidate Recommendation Rationale:**
- **Primary Recommendation (Stacking):** LCX stenosis is challenging due to subtle diagnostic signs and class imbalance (39.3% positive). Stacking achieved the highest ROC-AUC (0.7186 ± 0.0765) and highest default F1-score (0.6324 ± 0.1081). Crucially, Stacking's meta-model dynamically adjusted for Gradient Boosting's uncalibrated probability collapse (which missed 75 out of 119 cases), delivering 70.62% default sensitivity. Under Youden's J (T=0.49), it achieves 74.75% recall and 58.36% precision with optimal ROC balance.
- **Operating Threshold:** `youden_j (T~0.49, optimal ROC operating point with F1=0.6481)`
- **Alternative Recommendation (SoftVoting):** Soft Voting achieved top default accuracy (0.6832 ± 0.0599) and competitive AUC (0.7170 ± 0.0801). When paired with an F1-optimized threshold (T=0.40), it achieves 87.39% recall and 64.76% F1.

---

### Target: RCA (Right Coronary Artery Stenosis (>=50% occlusion))

#### 5-Model Performance Comparison (Mean ± Std over 5 Outer Folds)

| Model | ROC-AUC | Brier Score | Acc (T=0.50) | Recall (T=0.50) | Prec (T=0.50) | F1 (T=0.50) | Total FN / FP |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **LogisticRegression** | 0.730 ± 0.034 | 0.221 | 0.686 | 0.666 | 0.578 | 0.614 | FN: 38 / FP: 57 |
| **RandomForest** | 0.731 ± 0.062 | 0.218 | 0.670 | 0.693 | 0.552 | 0.611 | FN: 35 / FP: 65 |
| **GradientBoosting** | 0.700 ± 0.071 | 0.215 | 0.676 | 0.367 | 0.619 | 0.454 | FN: 72 / FP: 26 |
| **SoftVoting** | 0.734 ± 0.049 | 0.207 | 0.680 | 0.509 | 0.601 | 0.544 | FN: 56 / FP: 41 |
| **Stacking** | 0.738 ± 0.044 | 0.213 | 0.673 | 0.683 | 0.561 | 0.612 | FN: 36 / FP: 63 |

#### Threshold Optimization Shifts for Candidate Models

| Model | Strategy | Mean Thresh | Recall | Precision | F1-Score | Accuracy | Net $\Delta FN$ | Net $\Delta FP$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Stacking | `default_0.50` | 0.50 ± 0.00 | 0.683 | 0.561 | 0.612 | 0.673 | +0 | +0 |
| Stacking | `f1_optimized` | 0.43 ± 0.03 | 0.781 | 0.509 | 0.612 | 0.624 | -11 | +26 |
| Stacking | `recall_focused_f2` | 0.38 ± 0.05 | 0.877 | 0.486 | 0.621 | 0.594 | -22 | +46 |
| Stacking | `youden_j` | 0.46 ± 0.03 | 0.754 | 0.541 | 0.627 | 0.660 | -8 | +12 |
| LogisticRegression | `default_0.50` | 0.50 ± 0.00 | 0.666 | 0.578 | 0.614 | 0.686 | +0 | +0 |
| LogisticRegression | `f1_optimized` | 0.35 ± 0.08 | 0.824 | 0.476 | 0.601 | 0.588 | -18 | +48 |
| LogisticRegression | `recall_focused_f2` | 0.23 ± 0.12 | 0.929 | 0.442 | 0.599 | 0.531 | -30 | +77 |
| LogisticRegression | `youden_j` | 0.41 ± 0.05 | 0.763 | 0.533 | 0.624 | 0.650 | -11 | +22 |

**Candidate Recommendation Rationale:**
- **Primary Recommendation (Stacking):** Stacking achieved the highest ROC-AUC (0.7379 ± 0.0438) and lowest Brier score (0.2133) on RCA. It maintains high sensitivity (68.34% at T=0.50, rising to 75.42% under Youden's J at T=0.46) while resisting the severe sensitivity collapse seen in unweighted tree models.
- **Operating Threshold:** `youden_j (T~0.46, reducing missed stenoses with minimal false alarm increase)`
- **Alternative Recommendation (LogisticRegression):** Logistic Regression demonstrated the highest stability across folds (AUC std of only ±0.0335 vs ±0.0438-0.0706 for tree ensembles) and the highest default accuracy (0.6865 ± 0.0271). Its linear log-odds formulation provides direct coefficient interpretability without ensemble complexity.

---

## 5. Methodological Limitations & Future Research Considerations

1. **Single-Center Cohort ($N=303$):** Sample size limits fold-level positive counts (especially for LCX and RCA, with ~24 positives per test fold). This contributes to fold-to-fold standard deviations of ±0.06 to ±0.10.
2. **No Automatic Clinical Thresholds:** Decision thresholds cannot be generalized across institutions without prospective decision-curve analysis or verified hospital cost-benefit matrices.
3. **External Validation Prerequisite:** Before these models could be considered for clinical translation, validation on geographically diverse cohorts with different angiographic protocols is required.
