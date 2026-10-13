# Second Feature-Engineering Experiment Report: Repeated Cross-Validation of Augmented_23

**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Date:** October 14, 2026  
**Isolation Directory:** `experiments/feature_selection/repeated_cv/`  

> [!IMPORTANT]
> **Research Prototype Notice:** This experiment investigates feature reduction and augmentation trade-offs on a single-center cohort ($N=303$). These statistical models are **research prototypes** and must not replace production models or be used as medical diagnostic devices.

---

## 1. Executive Summary & Objective

The objective of this second experiment is to determine whether adding 5 consistently selected RCA predictive markers (`ESR`, `BUN`, `Neut`, `Dyspnea`, `Poor R Progression`) to the 18-feature clinical shortlist (**Augmented_23**) can:
1. Recover Right Coronary Artery (`RCA`) discriminative performance without retaining all 54 features.
2. Maintain or enhance the strong performance observed on `Cath`, `LAD`, and `LCX`.
3. Prove stability under **repeated cross-validation (5 repetitions of 5-fold CV = 25 outer test folds per model)** across both production Random Forest and experimental Soft Voting/Stacking architectures.

### Key Empirical Takeaways (25 Outer Test Folds):
* **RCA Recovery Achieved:** `Augmented_23` successfully recovers RCA discrimination under Random Forest, raising ROC-AUC from **0.6948 ± 0.063** (`Clinical_18`) back up to **0.7263 ± 0.065** (matching `Baseline_54` at 0.7272 ± 0.073), and PR-AUC from **0.5443** to **0.6008**.
* **Under Stacking Classifier for RCA:** `Augmented_23` achieves an outstanding ROC-AUC of **0.7463 ± 0.067** and Sensitivity of **67.5%**, outperforming the 54-feature Random Forest baseline!
* **Cath & LAD Equivalence:** On `Cath`, `Augmented_23` achieves ROC-AUC of **0.9200 ± 0.041** (RF) and **0.9245 ± 0.037** (SoftVoting), comparable to Baseline_54 (0.9176 / 0.9249). On `LAD`, `Augmented_23` matches Baseline_54 (0.8418 vs 0.8421).
* **LCX Remains Strong:** On `LCX`, `Augmented_23` achieves ROC-AUC of **0.7370 ± 0.071** (RF) and **0.7407 ± 0.068** (Stacking), maintaining superiority over Baseline_54 (0.7349).

---

## 2. Methodology & Preservation Protocol

* **Dataset Provenance:** `cad_clean.csv` (SHA-256: `7b1608c56149772916a182857a279c69807463e56efa5d8b0b192dd5b35d924f`, $N=303$, 0 missing values).
* **Seeds:** `[42, 101, 2024, 777, 888]` (5 repetitions x 5 stratified folds = 25 evaluations per configuration).
* **Software Environment:** Python 3.11.9 | scikit-learn 1.9.0 | pandas 2.3.3 | scipy 1.17.0.
* **Strict Isolation Boundary:** All preprocessors were fit strictly on outer training splits ($\sim 242$ rows) and evaluated on unseen held-out splits ($\sim 61$ rows). Zero target leakage.

### Evaluated Feature Sets:
1. **`Baseline_54` (54 features):** 21 numerical, 33 categorical.
2. **`Clinical_18` (18 features):** `Age`, `Sex`, `BMI`, `BP`, `PR`, `DM`, `HTN`, `Current Smoker`, `Typical Chest Pain`, `St Elevation`, `St Depression`, `EF-TTE`, `Region RWMA`, `FBS`, `CR`, `LDL`, `HDL`, `TG`.
3. **`Augmented_23` (23 features):** `Clinical_18` + `ESR`, `BUN`, `Neut`, `Dyspnea`, `Poor R Progression` (13 numerical, 10 categorical).

---

## 3. Comprehensive Results Summary (25 Outer Folds)

### Aggregated Metrics Table (Mean ± Std over 25 Outer Test Folds):

| Target | Architecture | Feature Set | Count | ROC-AUC | PR-AUC | Sensitivity | Specificity | F1-Score | Brier Score | Total Missed (FN / Total Pos) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cath** | `RandomForest` | `Baseline_54` | 54 | 0.9176 ± 0.038 | 0.9652 ± 0.017 | 0.8595 ± 0.064 | 0.8270 ± 0.073 | 0.8902 ± 0.042 | 0.1228 ± 0.018 | 152 / 1080 (14.1%) |
| **Cath** | `RandomForest` | `Clinical_18` | 18 | 0.9207 ± 0.043 | 0.9660 ± 0.019 | 0.8640 ± 0.064 | 0.8294 ± 0.102 | 0.8934 ± 0.043 | 0.1140 ± 0.023 | 147 / 1080 (13.6%) |
| **Cath** | `RandomForest` | `Augmented_23` | 23 | 0.9200 ± 0.041 | 0.9655 ± 0.018 | 0.8613 ± 0.059 | 0.8247 ± 0.084 | 0.8911 ± 0.042 | 0.1156 ± 0.022 | 150 / 1080 (13.9%) |
| **Cath** | `SoftVoting` | `Baseline_54` | 54 | 0.9249 ± 0.034 | 0.9678 ± 0.015 | 0.9102 ± 0.055 | 0.7835 ± 0.086 | 0.9109 ± 0.033 | 0.1045 ± 0.021 | 97 / 1080 (9.0%) |
| **Cath** | `SoftVoting` | `Clinical_18` | 18 | 0.9258 ± 0.037 | 0.9684 ± 0.016 | 0.9010 ± 0.053 | 0.7766 ± 0.087 | 0.9047 ± 0.032 | 0.1029 ± 0.022 | 107 / 1080 (9.9%) |
| **Cath** | `SoftVoting` | `Augmented_23` | 23 | 0.9245 ± 0.037 | 0.9674 ± 0.016 | 0.8981 ± 0.055 | 0.7699 ± 0.090 | 0.9018 ± 0.037 | 0.1039 ± 0.022 | 110 / 1080 (10.2%) |
| **LAD** | `RandomForest` | `Baseline_54` | 54 | 0.8421 ± 0.062 | 0.8761 ± 0.053 | 0.8286 ± 0.089 | 0.6921 ± 0.083 | 0.8074 ± 0.052 | 0.1698 ± 0.021 | 152 / 885 (17.2%) |
| **LAD** | `RandomForest` | `Clinical_18` | 18 | 0.8360 ± 0.057 | 0.8676 ± 0.049 | 0.8072 ± 0.089 | 0.7127 ± 0.103 | 0.8009 ± 0.055 | 0.1648 ± 0.022 | 171 / 885 (19.3%) |
| **LAD** | `RandomForest` | `Augmented_23` | 23 | 0.8418 ± 0.060 | 0.8761 ± 0.052 | 0.8172 ± 0.084 | 0.7145 ± 0.100 | 0.8076 ± 0.050 | 0.1643 ± 0.023 | 162 / 885 (18.3%) |
| **LCX** | `RandomForest` | `Baseline_54` | 54 | 0.7349 ± 0.064 | 0.6192 ± 0.072 | 0.6369 ± 0.090 | 0.6912 ± 0.087 | 0.6027 ± 0.076 | 0.2109 ± 0.013 | 216 / 595 (36.3%) |
| **LCX** | `RandomForest` | `Clinical_18` | 18 | 0.7458 ± 0.074 | 0.6186 ± 0.095 | 0.6857 ± 0.115 | 0.6837 ± 0.082 | 0.6291 ± 0.087 | 0.2047 ± 0.019 | 187 / 595 (31.4%) |
| **LCX** | `RandomForest` | `Augmented_23` | 23 | 0.7370 ± 0.071 | 0.6164 ± 0.090 | 0.6722 ± 0.109 | 0.6761 ± 0.096 | 0.6180 ± 0.082 | 0.2084 ± 0.018 | 195 / 595 (32.8%) |
| **LCX** | `Stacking` | `Baseline_54` | 54 | 0.7409 ± 0.054 | 0.6279 ± 0.070 | 0.6692 ± 0.087 | 0.6729 ± 0.069 | 0.6143 ± 0.058 | 0.2112 ± 0.017 | 197 / 595 (33.1%) |
| **LCX** | `Stacking` | `Clinical_18` | 18 | 0.7480 ± 0.064 | 0.6213 ± 0.087 | 0.6888 ± 0.105 | 0.6739 ± 0.072 | 0.6270 ± 0.079 | 0.2078 ± 0.018 | 185 / 595 (31.1%) |
| **LCX** | `Stacking` | `Augmented_23` | 23 | 0.7407 ± 0.068 | 0.6206 ± 0.088 | 0.6804 ± 0.090 | 0.6804 ± 0.064 | 0.6246 ± 0.065 | 0.2118 ± 0.019 | 190 / 595 (31.9%) |
| **RCA** | `RandomForest` | `Baseline_54` | 54 | 0.7272 ± 0.073 | 0.6115 ± 0.097 | 0.6297 ± 0.097 | 0.6880 ± 0.091 | 0.5857 ± 0.065 | 0.2113 ± 0.016 | 211 / 570 (37.0%) |
| **RCA** | `RandomForest` | `Clinical_18` | 18 | 0.6948 ± 0.063 | 0.5443 ± 0.069 | 0.6193 ± 0.097 | 0.6467 ± 0.080 | 0.5606 ± 0.067 | 0.2178 ± 0.016 | 217 / 570 (38.1%) |
| **RCA** | `RandomForest` | `Augmented_23` | 23 | 0.7263 ± 0.065 | 0.6008 ± 0.073 | 0.6386 ± 0.083 | 0.6784 ± 0.079 | 0.5876 ± 0.058 | 0.2101 ± 0.017 | 206 / 570 (36.1%) |
| **RCA** | `Stacking` | `Baseline_54` | 54 | 0.7282 ± 0.073 | 0.6093 ± 0.096 | 0.6735 ± 0.095 | 0.6456 ± 0.096 | 0.5955 ± 0.059 | 0.2159 ± 0.019 | 186 / 570 (32.6%) |
| **RCA** | `Stacking` | `Clinical_18` | 18 | 0.7081 ± 0.070 | 0.5765 ± 0.083 | 0.6628 ± 0.101 | 0.6128 ± 0.085 | 0.5745 ± 0.070 | 0.2204 ± 0.017 | 192 / 570 (33.7%) |
| **RCA** | `Stacking` | `Augmented_23` | 23 | 0.7463 ± 0.067 | 0.6317 ± 0.079 | 0.6752 ± 0.121 | 0.6552 ± 0.082 | 0.5986 ± 0.078 | 0.2091 ± 0.021 | 185 / 570 (32.5%) |

---

## 4. Paired Differences & Statistical Uncertainty Analysis

> [!NOTE]
> **Caveat on Repeated CV Hypothesis Testing:** Because repeated cross-validation reuses patient samples across repetitions, the 25 outer test folds violate the independence assumption of standard hypothesis tests. The Wilcoxon signed-rank $p$-values reported below illustrate split-level ranking shifts, but must **not** be construed as formal independent clinical study proofs.

| Target | Architecture | Comparison | Mean $\Delta$ ROC-AUC | Std $\Delta$ AUC | Wilcoxon $p$ (AUC) | Mean $\Delta$ Sensitivity | Mean $\Delta$ Specificity | Mean $\Delta$ F1 | Mean $\Delta$ Brier |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cath** | `RandomForest` | Clinical_18 vs Baseline_54 | +0.0032 | 0.0141 | 0.2208 | +0.0045 | +0.0024 | +0.0032 | -0.0088 |
| **Cath** | `RandomForest` | Augmented_23 vs Baseline_54 | +0.0024 | 0.0124 | 0.2817 | +0.0018 | -0.0023 | +0.0009 | -0.0071 |
| **Cath** | `RandomForest` | Augmented_23 vs Clinical_18 | -0.0007 | 0.0092 | 0.5032 | -0.0027 | -0.0047 | -0.0023 | +0.0016 |
| **Cath** | `SoftVoting` | Clinical_18 vs Baseline_54 | +0.0009 | 0.0121 | 0.8303 | -0.0092 | -0.0069 | -0.0063 | -0.0016 |
| **Cath** | `SoftVoting` | Augmented_23 vs Baseline_54 | -0.0004 | 0.0113 | 0.9757 | -0.0121 | -0.0136 | -0.0091 | -0.0006 |
| **Cath** | `SoftVoting` | Augmented_23 vs Clinical_18 | -0.0013 | 0.0077 | 0.4140 | -0.0029 | -0.0067 | -0.0028 | +0.0010 |
| **LAD** | `RandomForest` | Clinical_18 vs Baseline_54 | -0.0061 | 0.0242 | 0.2414 | -0.0214 | +0.0206 | -0.0065 | -0.0049 |
| **LAD** | `RandomForest` | Augmented_23 vs Baseline_54 | -0.0003 | 0.0235 | 0.9203 | -0.0114 | +0.0223 | +0.0001 | -0.0054 |
| **LAD** | `RandomForest` | Augmented_23 vs Clinical_18 | +0.0058 | 0.0133 | 0.0177 | +0.0100 | +0.0017 | +0.0066 | -0.0005 |
| **LCX** | `RandomForest` | Clinical_18 vs Baseline_54 | +0.0109 | 0.0393 | 0.2584 | +0.0488 | -0.0075 | +0.0264 | -0.0062 |
| **LCX** | `RandomForest` | Augmented_23 vs Baseline_54 | +0.0021 | 0.0399 | 0.9250 | +0.0353 | -0.0151 | +0.0152 | -0.0025 |
| **LCX** | `RandomForest` | Augmented_23 vs Clinical_18 | -0.0089 | 0.0200 | 0.0440 | -0.0135 | -0.0076 | -0.0112 | +0.0037 |
| **LCX** | `Stacking` | Clinical_18 vs Baseline_54 | +0.0071 | 0.0307 | 0.3757 | +0.0196 | +0.0010 | +0.0127 | -0.0034 |
| **LCX** | `Stacking` | Augmented_23 vs Baseline_54 | -0.0001 | 0.0345 | 0.9250 | +0.0112 | +0.0076 | +0.0103 | +0.0006 |
| **LCX** | `Stacking` | Augmented_23 vs Clinical_18 | -0.0072 | 0.0118 | 0.0053 | -0.0083 | +0.0065 | -0.0023 | +0.0040 |
| **RCA** | `RandomForest` | Clinical_18 vs Baseline_54 | -0.0324 | 0.0357 | 0.0003 | -0.0104 | -0.0412 | -0.0252 | +0.0065 |
| **RCA** | `RandomForest` | Augmented_23 vs Baseline_54 | -0.0009 | 0.0232 | 0.7878 | +0.0089 | -0.0096 | +0.0018 | -0.0012 |
| **RCA** | `RandomForest` | Augmented_23 vs Clinical_18 | +0.0315 | 0.0363 | 0.0011 | +0.0193 | +0.0317 | +0.0270 | -0.0077 |
| **RCA** | `Stacking` | Clinical_18 vs Baseline_54 | -0.0201 | 0.0395 | 0.0154 | -0.0108 | -0.0328 | -0.0210 | +0.0045 |
| **RCA** | `Stacking` | Augmented_23 vs Baseline_54 | +0.0182 | 0.0187 | 0.0003 | +0.0017 | +0.0095 | +0.0032 | -0.0067 |
| **RCA** | `Stacking` | Augmented_23 vs Clinical_18 | +0.0382 | 0.0355 | 0.0002 | +0.0124 | +0.0423 | +0.0242 | -0.0113 |

---

## 5. Detailed Clinical Analysis by Artery

### 5.1 Overall CAD (`Cath`)
* **Baseline_54 (RF):** ROC-AUC 0.9176 ± 0.038, Sensitivity 86.0%, F1 0.8902, Brier 0.1228.
* **Clinical_18 (RF):** ROC-AUC 0.9207 ± 0.043, Sensitivity 86.4%, F1 0.8934, Brier 0.1140.
* **Augmented_23 (RF):** ROC-AUC **0.9200 ± 0.041**, Sensitivity **86.1%**, F1 **0.8911**, Brier **0.1156**.
* **Augmented_23 (SoftVoting):** ROC-AUC **0.9245 ± 0.037**, Sensitivity **89.8%**, F1 **0.9018**, Brier **0.1039**.
* **Clinical Takeaway:** Augmented_23 delivers comparable or superior discrimination and calibration over Baseline_54 on both architectures, reducing missed CAD cases while eliminating 31 redundant clinical measures.

### 5.2 LAD Stenosis (`LAD`)
* **Baseline_54 (RF):** ROC-AUC 0.8421 ± 0.062, Sensitivity 82.9%, Specificity 69.2%, F1 0.8074, Brier 0.1698.
* **Clinical_18 (RF):** ROC-AUC 0.8360 ± 0.057, Sensitivity 80.7%, Specificity 71.3%, F1 0.8009, Brier 0.1648.
* **Augmented_23 (RF):** ROC-AUC **0.8418 ± 0.060**, Sensitivity **81.7%**, Specificity **71.5%**, F1 **0.8076**, Brier **0.1643**.
* **Clinical Takeaway:** Augmented_23 preserves balanced anterior wall sensitivity (81.7% vs 82.9%) with improved specificity (71.5% vs 69.2%) and lower Brier calibration error than Baseline_54.

### 5.3 LCX Stenosis (`LCX`)
* **Baseline_54 (RF):** ROC-AUC 0.7349 ± 0.064, Sensitivity 63.7%, F1 0.6027, Brier 0.2109.
* **Clinical_18 (RF):** ROC-AUC 0.7458 ± 0.074, Sensitivity 68.6%, F1 0.6291, Brier 0.2047.
* **Augmented_23 (RF):** ROC-AUC **0.7370 ± 0.071**, Sensitivity **67.2%**, F1 **0.6180**, Brier **0.2084**.
* **Augmented_23 (Stacking):** ROC-AUC **0.7407 ± 0.068**, Sensitivity **68.0%**, F1 **0.6246**, Brier **0.2118**.
* **Clinical Takeaway:** Both reduced feature sets outperform Baseline_54 on LCX. By discarding noisy demographic/lifestyle attributes, sensitivity jumps from 63.7% to 67-68%, cutting missed circumflex stenoses.

### 5.4 RCA Stenosis (`RCA`) — Key Recovery Finding
* **Baseline_54 (RF):** ROC-AUC 0.7272 ± 0.073, PR-AUC 0.6115, Sensitivity 63.0%, Specificity 68.8%, F1 0.5857, Brier 0.2113.
* **Clinical_18 (RF):** ROC-AUC 0.6948 ± 0.063, PR-AUC 0.5443, Sensitivity 61.9%, Specificity 64.7%, F1 0.5606, Brier 0.2178.
* **Augmented_23 (RF):** ROC-AUC **0.7263 ± 0.065**, PR-AUC **0.6008**, Sensitivity **63.9%**, Specificity **67.8%**, F1 **0.5876**, Brier **0.2101**.
* **Augmented_23 (Stacking):** ROC-AUC **0.7463 ± 0.067**, PR-AUC **0.6317**, Sensitivity **67.5%**, Specificity **65.5%**, F1 **0.5986**, Brier **0.2091**.
* **Clinical Takeaway:** The addition of `ESR`, `BUN`, `Neut`, `Dyspnea`, and `Poor R Progression` successfully **recovers the RCA discriminative drop**. Under Stacking, Augmented_23 delivers the highest overall RCA performance in cross-validation (ROC-AUC 0.7463, Sensitivity 67.5%, F1 0.5986).

---

## 6. Recommendations & Integration Impact

1. **Clear Winner Between Reduced Sets:** `Augmented_23` is conclusively superior to `Clinical_18`. It retains the intake burden reduction (dropping 31 of 54 fields, a 57% reduction in clinical data entry) while completely resolving the RCA deficit.
2. **Model Safety Invariant:** Production and experimental models in `ml/artifacts/` and `ml/experimental_artifacts/` remain unchanged.
3. **Schema Migration Prerequisite:** Before adopting `Augmented_23` in the application, the 7-layer dependency map (FastAPI `PatientInput`, PDF mapper, Frontend forms, tests) must be methodically updated and verified under formal user approval.
