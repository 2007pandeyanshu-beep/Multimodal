# Isolated Feature-Engineering Experiment Report

**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Date:** October 13, 2026  
**Execution Timestamp:** 2026-10-13T20:42:09.735042  
**Isolation Status:** Strictly isolated within `experiments/feature_selection/`  

> [!IMPORTANT]
> **Experimental Research Report:** This report documents a research experiment evaluating feature set reductions on the Z-Alizadeh Sani cohort ($N=303$). These models are **research prototypes** and must not replace existing production pipelines or be used as clinical diagnostic devices.

---

## 1. Executive Summary & Experimental Design

To test whether reducing feature dimensionality mitigates small-sample variance ($N=303$) without sacrificing discriminative performance, four feature configurations were evaluated across all 4 targets:

1. **`Baseline_54_RF`:** Existing 54-feature production input schema using Random Forest (`max_depth=5`, `class_weight='balanced'`).
2. **`Clinical_18_RF`:** A medically curated 18-feature shortlist (Demographics, Vitals, Core Medical History, Core ECG/Echo, and Lipid/Metabolic labs).
3. **`L1_Select_RF`:** Dynamic L1-penalized Logistic Regression (LASSO) feature selection inside each fold, followed by Random Forest trained on selected features.
4. **`L1_LogisticRegression`:** End-to-end regularized L1 Logistic Regression with inner cross-validation penalty tuning.

### Rigorous Leakage Prevention Protocol:
* **Identical Outer Folds:** 5-Fold Stratified Cross-Validation with fixed seed `42` across all configurations.
* **Strict Inner Preprocessing:** Scalers, one-hot encoders, and feature selectors were fitted strictly on each outer training fold ($\sim 242$ rows) and evaluated on unseen held-out test folds ($\sim 61$ rows).
* **Zero Target Leakage:** Targets (`Cath`, `LAD`, `LCX`, `RCA`) and zero-variance `Exertional CP` strictly excluded from all predictors.

---

## 2. Provenance & Environment Specifications

* **Raw Dataset SHA-256:** `739343245c2ba578b541370217531750d8e936022f928b83e0d91756caa3ff0b`
* **Cleaned Dataset SHA-256:** `7b1608c56149772916a182857a279c69807463e56efa5d8b0b192dd5b35d924f`
* **Python Environment:** Python 3.11.9 | `scikit-learn` 1.9.0 | `pandas` 2.3.3 | `numpy` 2.4.1
* **Total Patient Records ($N$):** 303

### Target Class Distributions ($N=303$):
| Target | Positive Label | Positive Count (%) | Negative Label | Negative Count (%) |
| :--- | :--- | :---: | :--- | :---: |
| **Cath** | CAD | 216 (71.3%) | Normal | 87 (28.7%) |
| **LAD** | Stenotic | 177 (58.4%) | Normal | 126 (41.6%) |
| **LCX** | Stenotic | 119 (39.3%) | Normal | 184 (60.7%) |
| **RCA** | Stenotic | 114 (37.6%) | Normal | 189 (62.4%) |

---

## 3. Comprehensive Performance Comparison

### Summary Table (Mean ± Std over 5 Stratified Folds)

| Target | Configuration | Mean Features | Jaccard Stability | ROC-AUC | PR-AUC (AP) | Sensitivity (Recall) | Specificity | F1-Score | Brier Score | Total Missed (FN) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cath** | `Baseline_54_RF` | 54.0 | 1.00 | 0.9195 ± 0.044 | 0.9655 ± 0.020 | 0.8565 ± 0.062 | 0.8510 ± 0.088 | 0.8931 ± 0.042 | 0.1220 ± 0.024 | 31 |
| **Cath** | `Clinical_18_RF` | 18.0 | 1.00 | 0.9216 ± 0.057 | 0.9677 ± 0.025 | 0.8564 ± 0.056 | 0.8039 ± 0.148 | 0.8851 ± 0.047 | 0.1155 ± 0.029 | 31 |
| **Cath** | `L1_Select_RF` | 31.0 | 0.54 | 0.9259 ± 0.060 | 0.9697 ± 0.024 | 0.8474 ± 0.062 | 0.8510 ± 0.140 | 0.8880 ± 0.046 | 0.1147 ± 0.031 | 33 |
| **Cath** | `L1_LogisticRegression` | 31.0 | 0.54 | 0.9213 ± 0.052 | 0.9678 ± 0.019 | 0.8563 ± 0.053 | 0.8379 ± 0.142 | 0.8913 ± 0.044 | 0.1117 ± 0.040 | 31 |
| **LAD** | `Baseline_54_RF` | 54.0 | 1.00 | 0.8383 ± 0.076 | 0.8699 ± 0.062 | 0.8424 ± 0.053 | 0.7058 ± 0.094 | 0.8216 ± 0.048 | 0.1692 ± 0.025 | 28 |
| **LAD** | `Clinical_18_RF` | 18.0 | 1.00 | 0.8491 ± 0.073 | 0.8858 ± 0.056 | 0.8197 ± 0.060 | 0.7538 ± 0.104 | 0.8219 ± 0.041 | 0.1618 ± 0.027 | 32 |
| **LAD** | `L1_Select_RF` | 17.8 | 0.49 | 0.8409 ± 0.071 | 0.8816 ± 0.051 | 0.7630 ± 0.073 | 0.7062 ± 0.093 | 0.7730 ± 0.038 | 0.1635 ± 0.030 | 42 |
| **LAD** | `L1_LogisticRegression` | 17.8 | 0.49 | 0.8399 ± 0.071 | 0.8751 ± 0.060 | 0.7178 ± 0.096 | 0.7535 ± 0.078 | 0.7563 ± 0.063 | 0.1722 ± 0.038 | 50 |
| **LCX** | `Baseline_54_RF` | 54.0 | 1.00 | 0.7199 ± 0.084 | 0.6064 ± 0.081 | 0.6138 ± 0.072 | 0.6572 ± 0.117 | 0.5757 ± 0.086 | 0.2157 ± 0.016 | 46 |
| **LCX** | `Clinical_18_RF` | 18.0 | 1.00 | 0.7321 ± 0.105 | 0.6183 ± 0.119 | 0.6888 ± 0.124 | 0.6523 ± 0.110 | 0.6206 ± 0.126 | 0.2080 ± 0.026 | 37 |
| **LCX** | `L1_Select_RF` | 22.0 | 0.44 | 0.7155 ± 0.090 | 0.5852 ± 0.106 | 0.6634 ± 0.100 | 0.6465 ± 0.080 | 0.6008 ± 0.093 | 0.2117 ± 0.023 | 40 |
| **LCX** | `L1_LogisticRegression` | 22.0 | 0.44 | 0.6911 ± 0.102 | 0.5875 ± 0.104 | 0.6714 ± 0.100 | 0.6731 ± 0.129 | 0.6195 ± 0.095 | 0.2275 ± 0.034 | 39 |
| **RCA** | `Baseline_54_RF` | 54.0 | 1.00 | 0.7340 ± 0.059 | 0.6220 ± 0.092 | 0.6308 ± 0.084 | 0.6933 ± 0.070 | 0.5893 ± 0.064 | 0.2087 ± 0.016 | 42 |
| **RCA** | `Clinical_18_RF` | 18.0 | 1.00 | 0.6957 ± 0.050 | 0.5408 ± 0.049 | 0.6411 ± 0.096 | 0.6512 ± 0.099 | 0.5757 ± 0.029 | 0.2183 ± 0.013 | 41 |
| **RCA** | `L1_Select_RF` | 40.0 | 0.51 | 0.7175 ± 0.056 | 0.6170 ± 0.065 | 0.6138 ± 0.085 | 0.6989 ± 0.116 | 0.5824 ± 0.070 | 0.2110 ± 0.018 | 44 |
| **RCA** | `L1_LogisticRegression` | 40.0 | 0.51 | 0.7401 ± 0.042 | 0.6086 ± 0.063 | 0.6664 ± 0.091 | 0.6987 ± 0.083 | 0.6140 ± 0.026 | 0.2110 ± 0.022 | 38 |

---

## 4. Target-by-Target Key Findings

### Target 1: Overall CAD (`Cath`)
* **Baseline (54 features):** ROC-AUC **0.9195 ± 0.044**, F1 0.8931, Missed CAD: 31.
* **Clinical Shortlist (18 features):** ROC-AUC **0.9216 ± 0.057**, F1 0.8851, Missed CAD: 31.
* **L1 Logistic Regression:** ROC-AUC **0.9213 ± 0.052**, F1 0.8913.
* **Finding:** The 18-feature clinical shortlist preserves strong diagnostic accuracy for overall CAD while discarding 36 lower-prevalence and redundant measures.

### Target 2: LAD Stenosis (`LAD`)
* **Baseline (54 features):** ROC-AUC **0.8383 ± 0.076**, Sensitivity 0.8424, Missed: 28.
* **Clinical Shortlist (18 features):** ROC-AUC **0.8491 ± 0.073**, Sensitivity 0.8197, Missed: 32.
* **L1 Selected + RF:** ROC-AUC **0.8409 ± 0.071** (mean 17.8 features).

### Target 3: LCX Stenosis (`LCX`)
* **Baseline (54 features):** ROC-AUC **0.7199 ± 0.084**, F1 0.5757.
* **Clinical Shortlist (18 features):** ROC-AUC **0.7321 ± 0.105**, F1 0.6206.
* **L1 Logistic Regression:** ROC-AUC **0.6911 ± 0.102**.

### Target 4: RCA Stenosis (`RCA`)
* **Baseline (54 features):** ROC-AUC **0.7340 ± 0.059**, F1 0.5893.
* **Clinical Shortlist (18 features):** ROC-AUC **0.6957 ± 0.050**, F1 0.5757.
* **L1 Logistic Regression:** ROC-AUC **0.7401 ± 0.042**.

---

## 5. Feature Selection Stability Analysis

Feature selection stability across outer CV folds was evaluated via Jaccard similarity:

* **Cath L1 Feature Stability:** Jaccard Index = **0.541**
* **LAD L1 Feature Stability:** Jaccard Index = **0.486**
* **LCX L1 Feature Stability:** Jaccard Index = **0.438**
* **RCA L1 Feature Stability:** Jaccard Index = **0.510**

> [!NOTE]
> On small datasets ($N=303$), purely algorithmic selection can vary across folds due to collinearity between related clinical predictors (e.g., electing `Typical Chest Pain` vs `Atypical`, or different ECG markers). A fixed clinical shortlist provides 100% stability across folds ($J=1.00$).

---

## 6. Recommendations & Integration Impact

1. **Preservation Invariant Maintained:** No application files, schemas, models, or frontend components were modified during this experiment.
2. **Clinical Viability:** The 18-feature clinical shortlist demonstrates comparable or superior stability across vessel targets with substantially lower intake burden.
3. **Next Steps:** Any migration from 54 features to 18 features must be preceded by formal user approval and follow the documented multi-layer schema migration plan.
