# Cardiovascular Model Threshold Optimization & Trade-Off Analysis

**Methodology:** Leakage-safe 5-Fold Stratified Nested Cross-Validation  
**Threshold Selection Scope:** Fitted strictly on Inner Out-Of-Fold Training Probabilities (Zero Outer Test Leakage)  
**Generated:** 2026-10-11 23:30:22  

> [!NOTE]
> **Provenance & Feature Scope Notice:**  
> The threshold tuning experiments documented in this report evaluated the **54-feature production baseline schema** (`Baseline_54`) during Phase 4 (October 11, 2026).  
> The current 23-feature research candidate pipelines (`Augmented_23` in `ml/research_artifacts_23/`) operate under the fixed standard decision threshold of **$T = 0.50$** pending prospective threshold optimization on the 23-feature schema.

---

## 1. Executive Summary & Objective Definitions

In cardiovascular risk prediction, a static default threshold of `p = 0.50` does not reflect the asymmetric clinical costs of classification errors. Missing a critically occluded artery (False Negative) has far more severe clinical consequences than scheduling a confirmatory diagnostic angiogram for a healthy patient (False Positive).

To investigate operational operating points, four threshold strategies were evaluated:
1. **`default_0.50`**: Uncalibrated standard decision threshold.
2. **`f1_optimized`**: Selects threshold maximizing $F_1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$, balancing sensitivity and false alarm rate equally.
3. **`recall_focused_f2`**: Selects threshold maximizing $F_2 = 5 \times \frac{\text{Precision} \times \text{Recall}}{4 \times \text{Precision} + \text{Recall}}$, placing double weight on Recall over Precision to minimize missed stenoses.
4. **`youden_j`**: Selects threshold maximizing Youden's index $J = \text{Sensitivity} + \text{Specificity} - 1$, balancing ROC operating points.

---

## 2. 5-Fold Cross-Validation Summary Across All Targets

### Target: Cath

| Model | Strategy | Selected Threshold | Recall (Sensitivity) | Precision | F1-Score | Accuracy | Net $\Delta FN$ | Net $\Delta FP$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| LogisticRegression | `default_0.50` | 0.50 ± 0.00 | 0.875 ± 0.057 | 0.918 ± 0.042 | 0.895 ± 0.041 | 0.854 ± 0.058 | +0 | +0 |
| LogisticRegression | `f1_optimized` | 0.34 ± 0.06 | 0.926 ± 0.054 | 0.902 ± 0.049 | 0.913 ± 0.046 | 0.874 ± 0.069 | -11 | +5 |
| LogisticRegression | `recall_focused_f2` | 0.15 ± 0.04 | 0.954 ± 0.042 | 0.794 ± 0.027 | 0.865 ± 0.014 | 0.789 ± 0.022 | -17 | +37 |
| LogisticRegression | `youden_j` | 0.54 ± 0.07 | 0.856 ± 0.068 | 0.921 ± 0.041 | 0.886 ± 0.043 | 0.845 ± 0.058 | +4 | -1 |
| RandomForest | `default_0.50` | 0.50 ± 0.00 | 0.852 ± 0.062 | 0.944 ± 0.038 | 0.894 ± 0.042 | 0.858 ± 0.054 | +0 | +0 |
| RandomForest | `f1_optimized` | 0.42 ± 0.02 | 0.921 ± 0.054 | 0.898 ± 0.037 | 0.908 ± 0.028 | 0.868 ± 0.038 | -15 | +12 |
| RandomForest | `recall_focused_f2` | 0.34 ± 0.01 | 0.958 ± 0.045 | 0.839 ± 0.028 | 0.894 ± 0.022 | 0.838 ± 0.032 | -23 | +29 |
| RandomForest | `youden_j` | 0.52 ± 0.04 | 0.820 ± 0.091 | 0.952 ± 0.027 | 0.878 ± 0.056 | 0.842 ± 0.065 | +7 | -2 |
| GradientBoosting | `default_0.50` | 0.50 ± 0.00 | 0.935 ± 0.034 | 0.880 ± 0.039 | 0.906 ± 0.025 | 0.861 ± 0.037 | +0 | +0 |
| GradientBoosting | `f1_optimized` | 0.55 ± 0.06 | 0.921 ± 0.038 | 0.882 ± 0.043 | 0.901 ± 0.033 | 0.855 ± 0.048 | +3 | -1 |
| GradientBoosting | `recall_focused_f2` | 0.25 ± 0.07 | 0.972 ± 0.027 | 0.810 ± 0.043 | 0.883 ± 0.026 | 0.815 ± 0.043 | -8 | +22 |
| GradientBoosting | `youden_j` | 0.74 ± 0.06 | 0.847 ± 0.076 | 0.921 ± 0.067 | 0.879 ± 0.048 | 0.835 ± 0.064 | +19 | -11 |
| SoftVoting | `default_0.50` | 0.50 ± 0.00 | 0.926 ± 0.045 | 0.914 ± 0.037 | 0.919 ± 0.035 | 0.884 ± 0.051 | +0 | +0 |
| SoftVoting | `f1_optimized` | 0.43 ± 0.07 | 0.940 ± 0.048 | 0.892 ± 0.049 | 0.914 ± 0.039 | 0.874 ± 0.059 | -3 | +6 |
| SoftVoting | `recall_focused_f2` | 0.28 ± 0.06 | 0.967 ± 0.043 | 0.823 ± 0.024 | 0.889 ± 0.027 | 0.828 ± 0.041 | -9 | +26 |
| SoftVoting | `youden_j` | 0.55 ± 0.06 | 0.898 ± 0.056 | 0.918 ± 0.058 | 0.906 ± 0.039 | 0.868 ± 0.056 | +6 | -1 |
| Stacking | `default_0.50` | 0.50 ± 0.00 | 0.884 ± 0.049 | 0.925 ± 0.041 | 0.903 ± 0.030 | 0.865 ± 0.043 | +0 | +0 |
| Stacking | `f1_optimized` | 0.30 ± 0.03 | 0.935 ± 0.048 | 0.892 ± 0.045 | 0.912 ± 0.035 | 0.871 ± 0.051 | -11 | +9 |
| Stacking | `recall_focused_f2` | 0.15 ± 0.02 | 0.963 ± 0.043 | 0.833 ± 0.034 | 0.892 ± 0.029 | 0.835 ± 0.043 | -17 | +26 |
| Stacking | `youden_j` | 0.49 ± 0.10 | 0.889 ± 0.055 | 0.918 ± 0.058 | 0.901 ± 0.038 | 0.861 ± 0.055 | -1 | +2 |

### Target: LAD

| Model | Strategy | Selected Threshold | Recall (Sensitivity) | Precision | F1-Score | Accuracy | Net $\Delta FN$ | Net $\Delta FP$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| LogisticRegression | `default_0.50` | 0.50 ± 0.00 | 0.729 ± 0.070 | 0.799 ± 0.033 | 0.760 ± 0.037 | 0.733 ± 0.033 | +0 | +0 |
| LogisticRegression | `f1_optimized` | 0.35 ± 0.07 | 0.870 ± 0.021 | 0.755 ± 0.048 | 0.808 ± 0.033 | 0.756 ± 0.052 | -25 | +18 |
| LogisticRegression | `recall_focused_f2` | 0.24 ± 0.09 | 0.944 ± 0.058 | 0.697 ± 0.042 | 0.801 ± 0.043 | 0.726 ± 0.060 | -38 | +40 |
| LogisticRegression | `youden_j` | 0.48 ± 0.06 | 0.786 ± 0.094 | 0.799 ± 0.046 | 0.790 ± 0.064 | 0.759 ± 0.066 | -10 | +2 |
| RandomForest | `default_0.50` | 0.50 ± 0.00 | 0.837 ± 0.039 | 0.806 ± 0.045 | 0.821 ± 0.038 | 0.786 ± 0.049 | +0 | +0 |
| RandomForest | `f1_optimized` | 0.45 ± 0.03 | 0.882 ± 0.053 | 0.782 ± 0.043 | 0.828 ± 0.037 | 0.786 ± 0.049 | -8 | +8 |
| RandomForest | `recall_focused_f2` | 0.31 ± 0.05 | 0.961 ± 0.028 | 0.683 ± 0.069 | 0.796 ± 0.042 | 0.706 ± 0.082 | -22 | +46 |
| RandomForest | `youden_j` | 0.49 ± 0.04 | 0.848 ± 0.075 | 0.806 ± 0.021 | 0.826 ± 0.043 | 0.792 ± 0.046 | -2 | +0 |
| GradientBoosting | `default_0.50` | 0.50 ± 0.00 | 0.848 ± 0.051 | 0.792 ± 0.051 | 0.818 ± 0.044 | 0.779 ± 0.055 | +0 | +0 |
| GradientBoosting | `f1_optimized` | 0.42 ± 0.05 | 0.887 ± 0.017 | 0.760 ± 0.063 | 0.818 ± 0.039 | 0.766 ± 0.060 | -7 | +11 |
| GradientBoosting | `recall_focused_f2` | 0.22 ± 0.08 | 0.961 ± 0.042 | 0.655 ± 0.031 | 0.778 ± 0.026 | 0.680 ± 0.042 | -20 | +50 |
| GradientBoosting | `youden_j` | 0.59 ± 0.03 | 0.763 ± 0.034 | 0.837 ± 0.082 | 0.796 ± 0.040 | 0.769 ± 0.054 | +15 | -12 |
| SoftVoting | `default_0.50` | 0.50 ± 0.00 | 0.831 ± 0.045 | 0.802 ± 0.049 | 0.815 ± 0.038 | 0.779 ± 0.049 | +0 | +0 |
| SoftVoting | `f1_optimized` | 0.43 ± 0.04 | 0.882 ± 0.040 | 0.773 ± 0.055 | 0.822 ± 0.040 | 0.776 ± 0.058 | -9 | +10 |
| SoftVoting | `recall_focused_f2` | 0.26 ± 0.04 | 0.955 ± 0.033 | 0.669 ± 0.043 | 0.785 ± 0.031 | 0.693 ± 0.057 | -22 | +48 |
| SoftVoting | `youden_j` | 0.52 ± 0.04 | 0.814 ± 0.066 | 0.807 ± 0.052 | 0.809 ± 0.048 | 0.776 ± 0.056 | +3 | -2 |
| Stacking | `default_0.50` | 0.50 ± 0.00 | 0.803 ± 0.045 | 0.809 ± 0.051 | 0.805 ± 0.042 | 0.772 ± 0.052 | +0 | +0 |
| Stacking | `f1_optimized` | 0.38 ± 0.05 | 0.882 ± 0.047 | 0.773 ± 0.055 | 0.822 ± 0.040 | 0.776 ± 0.058 | -14 | +13 |
| Stacking | `recall_focused_f2` | 0.20 ± 0.01 | 0.950 ± 0.054 | 0.681 ± 0.048 | 0.792 ± 0.036 | 0.706 ± 0.060 | -26 | +46 |
| Stacking | `youden_j` | 0.47 ± 0.05 | 0.837 ± 0.076 | 0.797 ± 0.047 | 0.815 ± 0.053 | 0.779 ± 0.060 | -6 | +4 |

### Target: LCX

| Model | Strategy | Selected Threshold | Recall (Sensitivity) | Precision | F1-Score | Accuracy | Net $\Delta FN$ | Net $\Delta FP$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| LogisticRegression | `default_0.50` | 0.50 ± 0.00 | 0.655 ± 0.093 | 0.557 ± 0.062 | 0.601 ± 0.070 | 0.660 ± 0.057 | +0 | +0 |
| LogisticRegression | `f1_optimized` | 0.44 ± 0.05 | 0.748 ± 0.053 | 0.508 ± 0.064 | 0.602 ± 0.046 | 0.607 ± 0.070 | -11 | +27 |
| LogisticRegression | `recall_focused_f2` | 0.35 ± 0.07 | 0.916 ± 0.070 | 0.451 ± 0.036 | 0.603 ± 0.035 | 0.525 ± 0.058 | -31 | +72 |
| LogisticRegression | `youden_j` | 0.51 ± 0.05 | 0.611 ± 0.173 | 0.533 ± 0.054 | 0.559 ± 0.096 | 0.637 ± 0.050 | +5 | +2 |
| RandomForest | `default_0.50` | 0.50 ± 0.00 | 0.630 ± 0.118 | 0.554 ± 0.117 | 0.587 ± 0.113 | 0.650 ± 0.102 | +0 | +0 |
| RandomForest | `f1_optimized` | 0.44 ± 0.01 | 0.815 ± 0.121 | 0.515 ± 0.073 | 0.628 ± 0.080 | 0.621 ± 0.088 | -22 | +31 |
| RandomForest | `recall_focused_f2` | 0.37 ± 0.05 | 0.925 ± 0.048 | 0.450 ± 0.025 | 0.605 ± 0.028 | 0.525 ± 0.039 | -35 | +73 |
| RandomForest | `youden_j` | 0.45 ± 0.02 | 0.781 ± 0.133 | 0.508 ± 0.065 | 0.611 ± 0.071 | 0.611 ± 0.079 | -18 | +30 |
| GradientBoosting | `default_0.50` | 0.50 ± 0.00 | 0.371 ± 0.129 | 0.617 ± 0.111 | 0.441 ± 0.092 | 0.650 ± 0.025 | +0 | +0 |
| GradientBoosting | `f1_optimized` | 0.30 ± 0.03 | 0.899 ± 0.058 | 0.500 ± 0.042 | 0.641 ± 0.046 | 0.604 ± 0.063 | -63 | +77 |
| GradientBoosting | `recall_focused_f2` | 0.24 ± 0.04 | 0.957 ± 0.048 | 0.449 ± 0.049 | 0.610 ± 0.050 | 0.514 ± 0.083 | -70 | +111 |
| GradientBoosting | `youden_j` | 0.34 ± 0.04 | 0.824 ± 0.041 | 0.522 ± 0.071 | 0.634 ± 0.039 | 0.620 ± 0.080 | -54 | +63 |
| SoftVoting | `default_0.50` | 0.50 ± 0.00 | 0.563 ± 0.053 | 0.616 ± 0.110 | 0.585 ± 0.064 | 0.683 ± 0.060 | +0 | +0 |
| SoftVoting | `f1_optimized` | 0.40 ± 0.03 | 0.874 ± 0.037 | 0.516 ± 0.050 | 0.648 ± 0.042 | 0.623 ± 0.062 | -37 | +55 |
| SoftVoting | `recall_focused_f2` | 0.31 ± 0.05 | 0.941 ± 0.044 | 0.432 ± 0.018 | 0.591 ± 0.014 | 0.489 ± 0.041 | -45 | +104 |
| SoftVoting | `youden_j` | 0.44 ± 0.03 | 0.781 ± 0.097 | 0.591 ± 0.093 | 0.660 ± 0.021 | 0.680 ± 0.068 | -26 | +27 |
| Stacking | `default_0.50` | 0.50 ± 0.00 | 0.706 ± 0.108 | 0.575 ± 0.111 | 0.632 ± 0.108 | 0.673 ± 0.106 | +0 | +0 |
| Stacking | `f1_optimized` | 0.44 ± 0.04 | 0.815 ± 0.086 | 0.517 ± 0.046 | 0.630 ± 0.045 | 0.624 ± 0.055 | -13 | +28 |
| Stacking | `recall_focused_f2` | 0.38 ± 0.03 | 0.915 ± 0.061 | 0.480 ± 0.023 | 0.629 ± 0.032 | 0.578 ± 0.034 | -25 | +54 |
| Stacking | `youden_j` | 0.49 ± 0.04 | 0.748 ± 0.076 | 0.584 ± 0.079 | 0.648 ± 0.039 | 0.677 ± 0.071 | -5 | +4 |

### Target: RCA

| Model | Strategy | Selected Threshold | Recall (Sensitivity) | Precision | F1-Score | Accuracy | Net $\Delta FN$ | Net $\Delta FP$ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| LogisticRegression | `default_0.50` | 0.50 ± 0.00 | 0.666 ± 0.082 | 0.578 ± 0.048 | 0.614 ± 0.026 | 0.686 ± 0.027 | +0 | +0 |
| LogisticRegression | `f1_optimized` | 0.35 ± 0.08 | 0.824 ± 0.065 | 0.476 ± 0.025 | 0.601 ± 0.012 | 0.588 ± 0.042 | -18 | +48 |
| LogisticRegression | `recall_focused_f2` | 0.23 ± 0.12 | 0.929 ± 0.046 | 0.442 ± 0.027 | 0.599 ± 0.033 | 0.531 ± 0.039 | -30 | +77 |
| LogisticRegression | `youden_j` | 0.41 ± 0.05 | 0.763 ± 0.046 | 0.533 ± 0.066 | 0.624 ± 0.043 | 0.650 ± 0.063 | -11 | +22 |
| RandomForest | `default_0.50` | 0.50 ± 0.00 | 0.693 ± 0.101 | 0.552 ± 0.062 | 0.611 ± 0.060 | 0.670 ± 0.050 | +0 | +0 |
| RandomForest | `f1_optimized` | 0.45 ± 0.03 | 0.762 ± 0.076 | 0.498 ± 0.075 | 0.597 ± 0.052 | 0.608 ± 0.080 | -8 | +27 |
| RandomForest | `recall_focused_f2` | 0.39 ± 0.03 | 0.912 ± 0.079 | 0.452 ± 0.044 | 0.601 ± 0.031 | 0.541 ± 0.065 | -25 | +64 |
| RandomForest | `youden_j` | 0.46 ± 0.02 | 0.736 ± 0.086 | 0.500 ± 0.073 | 0.591 ± 0.058 | 0.614 ± 0.074 | -5 | +22 |
| GradientBoosting | `default_0.50` | 0.50 ± 0.00 | 0.367 ± 0.095 | 0.619 ± 0.095 | 0.454 ± 0.095 | 0.676 ± 0.035 | +0 | +0 |
| GradientBoosting | `f1_optimized` | 0.27 ± 0.08 | 0.780 ± 0.139 | 0.494 ± 0.085 | 0.593 ± 0.055 | 0.594 ± 0.090 | -47 | +72 |
| GradientBoosting | `recall_focused_f2` | 0.15 ± 0.03 | 0.930 ± 0.101 | 0.385 ± 0.009 | 0.542 ± 0.018 | 0.412 ± 0.034 | -64 | +144 |
| GradientBoosting | `youden_j` | 0.33 ± 0.04 | 0.693 ± 0.138 | 0.507 ± 0.065 | 0.577 ± 0.062 | 0.624 ± 0.052 | -37 | +53 |
| SoftVoting | `default_0.50` | 0.50 ± 0.00 | 0.509 ± 0.072 | 0.601 ± 0.085 | 0.544 ± 0.045 | 0.680 ± 0.040 | +0 | +0 |
| SoftVoting | `f1_optimized` | 0.38 ± 0.04 | 0.807 ± 0.036 | 0.528 ± 0.066 | 0.634 ± 0.040 | 0.644 ± 0.074 | -34 | +45 |
| SoftVoting | `recall_focused_f2` | 0.26 ± 0.05 | 0.964 ± 0.044 | 0.428 ± 0.028 | 0.592 ± 0.025 | 0.498 ± 0.045 | -52 | +107 |
| SoftVoting | `youden_j` | 0.39 ± 0.03 | 0.781 ± 0.055 | 0.530 ± 0.065 | 0.628 ± 0.045 | 0.647 ± 0.073 | -31 | +41 |
| Stacking | `default_0.50` | 0.50 ± 0.00 | 0.683 ± 0.088 | 0.561 ± 0.072 | 0.612 ± 0.056 | 0.673 ± 0.056 | +0 | +0 |
| Stacking | `f1_optimized` | 0.43 ± 0.03 | 0.781 ± 0.083 | 0.509 ± 0.061 | 0.612 ± 0.046 | 0.624 ± 0.073 | -11 | +26 |
| Stacking | `recall_focused_f2` | 0.38 ± 0.05 | 0.877 ± 0.070 | 0.486 ± 0.052 | 0.621 ± 0.028 | 0.594 ± 0.064 | -22 | +46 |
| Stacking | `youden_j` | 0.46 ± 0.03 | 0.754 ± 0.071 | 0.541 ± 0.066 | 0.627 ± 0.050 | 0.660 ± 0.058 | -8 | +12 |

---

## 3. Key Observations & Trade-Off Findings

1. **Gradient Boosting Recovery on LCX and RCA:**
   - Under default `0.50`, Gradient Boosting suffered severe recall collapse on LCX ($37.1\%$) and RCA ($36.7\%$).
   - With `recall_focused_f2` or `youden_j`, the selected threshold shifted downward to $\sim 0.28 - 0.35$.
   - This dramatically cut false negatives (reducing missed cases by tens of patients), recovering sensitivity at the cost of additional false alarms.

2. **Asymmetric Trade-Offs:**
   - Lowering decision thresholds sharply increases Recall, but inevitably reduces Precision and raw Accuracy.
   - No single threshold is universally optimal: screening programs prioritize high Recall (`recall_focused_f2`), whereas invasive interventions require high Precision.

3. **Methodological Rigor:**
   - Thresholds were chosen strictly using inner out-of-fold cross-validation on training folds.
   - The outer test fold was held out and never used for threshold selection, guaranteeing unbiased validation estimates.
