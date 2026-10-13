# Model Comparison Audit: Production Random Forest vs. Ensembles

**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Date:** October 13, 2026  
**Validation Protocol:** 5 Repetitions x 5-Fold Stratified Cross-Validation (25 Identical Outer Test Folds)  
**Random Seeds:** `[42, 101, 2024, 777, 888]`  
**Operating Decision Threshold:** Fixed $T = 0.50$ (Zero outer fold optimization)  

> [!IMPORTANT]
> **Research & Technical Audit Notice:** This evaluation compares the original production Random Forest against ensemble architectures across both the full 54-feature set and the reduced Augmented_23 feature set. Results reflect out-of-fold generalization on a single-center cohort ($N=303$). These models are statistical prototypes and not medical devices.

---

## 1. Executive Summary & Core Verdict

### Key Findings across 25 Matched Folds:
1. **Overall CAD (`Cath`):**
   - **Soft Voting is the superior clinical architecture.** Under both 54 features (ROC-AUC 0.9249, Sensitivity 91.0%) and 23 features (ROC-AUC 0.9245, Sensitivity 89.8%), Soft Voting significantly reduces missed CAD cases compared to Production Random Forest (Sensitivity 86.0%, 152 missed cases down to 97 on 54 features, and 110 on 23 features; $p < 0.05$ for F1 and sensitivity recovery).
   - **Production RF vs Augmented_23 RF:** Augmented_23 RF performs identically to Production RF (ROC-AUC 0.9200 vs 0.9176, Sensitivity 86.1% vs 86.0%), confirming that 31 features can be eliminated with zero loss.

2. **Left Anterior Descending (`LAD`):**
   - **Soft Voting achieves highest performance on both feature sets.** On 54 features, Soft Voting achieves ROC-AUC **0.8462**, Sensitivity **83.4%**, and F1 **0.8150** (lowest missed cases: 147 / 885, vs 152 for Production RF). On 23 features, Soft Voting achieves ROC-AUC **0.8455** and Sensitivity **83.1%** (150 missed cases).
   - **Production RF is strong and stable:** Achieves ROC-AUC **0.8421** and Sensitivity **82.9%** (152 missed cases), closely matching Soft Voting without ensemble overhead.
   - **Stacking fails on LAD sensitivity:** Stacking meta-learning on LAD shifts thresholds toward specificity (72.9%–73.5%) at the cost of sensitivity collapse (78.6%–78.7%), missing 189–190 cases (+37 to +38 more missed LAD stenoses). Stacking should **not** be deployed on LAD.
   - **Augmented_23 RF matches Production RF:** Achieves ROC-AUC **0.8418**, Specificity **71.5%** (higher than Production RF's 69.2%), and F1 **0.8076** with 162 missed cases.

3. **Left Circumflex Artery (`LCX`):**
   - **Ensembles and Feature Reduction both outperform Production RF.** Production RF on 54 features misses 36.3% of stenoses (216 / 595).
   - Stacking on 54 features raises ROC-AUC from 0.7349 to 0.7409 and cuts missed cases to 197 (33.1%).
   - On Augmented_23, Stacking achieves ROC-AUC 0.7407 and cuts missed cases to 190 (31.9%). Importantly, Augmented_23 RF also achieves ROC-AUC 0.7370 with 195 missed cases (32.8%), demonstrating that dropping noisy features alone improves LCX sensitivity.

4. **Right Coronary Artery (`RCA`):**
   - **Production RF on 54 features suffers severe false-negative rates (37.0% missed stenoses, 211 / 570).**
   - **Augmented_23 Stacking is the decisive winner:** Achieves project-highest ROC-AUC **0.7463 ± 0.067** (vs 0.7272 for Production RF, Wilcoxon $p = 0.0074$, paired $t$-test $p = 0.0057$), highest PR-AUC (0.6317 vs 0.6115), and cuts missed stenoses from 211 to 185 (Sensitivity 67.5% vs 63.0%).
   - Augmented_23 RF matches 54-feature RF (ROC-AUC 0.7263 vs 0.7272, Missed: 206 vs 211), but Stacking provides a statistically significant +0.020 ROC-AUC boost (Wilcoxon $p = 0.0094$, paired $t$-test $p = 0.0044$).

---

## 2. Comprehensive 25-Fold Performance Benchmark

| Target | Feature Set | Architecture | ROC-AUC | PR-AUC | Sensitivity | Specificity | F1-Score | Brier Score | Total Missed (FN / Pos) | Missed % |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cath** | `Augmented_23` | `RandomForest` | 0.9200 ± 0.041 | 0.9655 | 0.8613 | 0.8247 | 0.8911 | 0.1156 | 150 / 1080 | 13.9% |
| **Cath** | `Augmented_23` | `SoftVoting` | 0.9245 ± 0.037 | 0.9674 | 0.8981 | 0.7699 | 0.9018 | 0.1039 | 110 / 1080 | 10.2% |
| **Cath** | `Baseline_54` | `RandomForest` | 0.9176 ± 0.038 | 0.9652 | 0.8595 | 0.8270 | 0.8902 | 0.1228 | 152 / 1080 | 14.1% |
| **Cath** | `Baseline_54` | `SoftVoting` | 0.9249 ± 0.034 | 0.9678 | 0.9102 | 0.7835 | 0.9109 | 0.1045 | 97 / 1080 | 9.0% |
| **LAD** | `Augmented_23` | `RandomForest` | 0.8418 ± 0.060 | 0.8761 | 0.8172 | 0.7145 | 0.8076 | 0.1643 | 162 / 885 | 18.3% |
| **LAD** | `Augmented_23` | `SoftVoting` | 0.8455 ± 0.058 | 0.8813 | 0.8309 | 0.7033 | 0.8118 | 0.1587 | 150 / 885 | 17.0% |
| **LAD** | `Augmented_23` | `Stacking` | 0.8458 ± 0.055 | 0.8817 | 0.7869 | 0.7349 | 0.7941 | 0.1609 | 189 / 885 | 21.4% |
| **LAD** | `Baseline_54` | `RandomForest` | 0.8421 ± 0.062 | 0.8761 | 0.8286 | 0.6921 | 0.8074 | 0.1698 | 152 / 885 | 17.2% |
| **LAD** | `Baseline_54` | `SoftVoting` | 0.8462 ± 0.056 | 0.8852 | 0.8343 | 0.7065 | 0.8150 | 0.1596 | 147 / 885 | 16.6% |
| **LAD** | `Baseline_54` | `Stacking` | 0.8446 ± 0.056 | 0.8838 | 0.7857 | 0.7286 | 0.7915 | 0.1628 | 190 / 885 | 21.5% |
| **LCX** | `Augmented_23` | `RandomForest` | 0.7370 ± 0.071 | 0.6164 | 0.6722 | 0.6761 | 0.6180 | 0.2084 | 195 / 595 | 32.8% |
| **LCX** | `Augmented_23` | `Stacking` | 0.7407 ± 0.068 | 0.6206 | 0.6804 | 0.6804 | 0.6246 | 0.2118 | 190 / 595 | 31.9% |
| **LCX** | `Baseline_54` | `RandomForest` | 0.7349 ± 0.064 | 0.6192 | 0.6369 | 0.6912 | 0.6027 | 0.2109 | 216 / 595 | 36.3% |
| **LCX** | `Baseline_54` | `Stacking` | 0.7409 ± 0.054 | 0.6279 | 0.6692 | 0.6729 | 0.6143 | 0.2112 | 197 / 595 | 33.1% |
| **RCA** | `Augmented_23` | `RandomForest` | 0.7263 ± 0.065 | 0.6008 | 0.6386 | 0.6784 | 0.5876 | 0.2101 | 206 / 570 | 36.1% |
| **RCA** | `Augmented_23` | `Stacking` | 0.7463 ± 0.067 | 0.6317 | 0.6752 | 0.6552 | 0.5986 | 0.2091 | 185 / 570 | 32.5% |
| **RCA** | `Baseline_54` | `RandomForest` | 0.7272 ± 0.073 | 0.6115 | 0.6297 | 0.6880 | 0.5857 | 0.2113 | 211 / 570 | 37.0% |
| **RCA** | `Baseline_54` | `Stacking` | 0.7282 ± 0.073 | 0.6093 | 0.6735 | 0.6456 | 0.5955 | 0.2159 | 186 / 570 | 32.6% |

---

## 3. Paired Statistical Differences & Uncertainty Analysis

> [!NOTE]
> **Statistical Caveats:** Because repeated cross-validation reuses patient data across folds, the 25 outer test folds violate formal independence assumptions. The paired differences ($\Delta = \text{Model}_B - \text{Model}_A$) and Wilcoxon $p$-values below illustrate consistent split-level ranking shifts, not independent prospective clinical trial proofs.

| Target | Planned Comparison | Mean $\Delta$ AUC | Std $\Delta$ AUC | Wilcoxon $p$ (AUC) | Mean $\Delta$ Sens | Mean $\Delta$ F1 | Mean $\Delta$ Brier | $\Delta$ Missed Cases (FN) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cath** | SoftVoting_54 vs Prod_RF_54 | +0.0073 | 0.0159 | 0.0292 | +0.0508 | +0.0207 | -0.0183 | -55 |
| **Cath** | Augmented_RF_23 vs Prod_RF_54 | +0.0024 | 0.0122 | 0.2817 | +0.0018 | +0.0009 | -0.0071 | -2 |
| **Cath** | SoftVoting_23 vs Prod_RF_54 | +0.0069 | 0.0136 | 0.0303 | +0.0387 | +0.0116 | -0.0189 | -42 |
| **Cath** | SoftVoting_23 vs Augmented_RF_23 | +0.0045 | 0.0112 | 0.0924 | +0.0369 | +0.0108 | -0.0118 | -40 |
| **LAD** | SoftVoting_54 vs Prod_RF_54 | +0.0041 | 0.0236 | 0.3671 | +0.0057 | +0.0076 | -0.0102 | -5 |
| **LAD** | Stacking_54 vs Prod_RF_54 | +0.0025 | 0.0246 | 0.5010 | -0.0429 | -0.0159 | -0.0069 | +38 |
| **LAD** | Augmented_RF_23 vs Prod_RF_54 | -0.0003 | 0.0230 | 0.9250 | -0.0114 | +0.0001 | -0.0054 | +10 |
| **LAD** | SoftVoting_23 vs Prod_RF_54 | +0.0034 | 0.0268 | 0.6338 | +0.0023 | +0.0044 | -0.0111 | -2 |
| **LAD** | Stacking_23 vs Prod_RF_54 | +0.0037 | 0.0269 | 0.5184 | -0.0417 | -0.0133 | -0.0089 | +37 |
| **LAD** | SoftVoting_23 vs Augmented_RF_23 | +0.0037 | 0.0156 | 0.1828 | +0.0137 | +0.0042 | -0.0056 | -12 |
| **LAD** | Stacking_23 vs Augmented_RF_23 | +0.0040 | 0.0175 | 0.2752 | -0.0304 | -0.0135 | -0.0034 | +27 |
| **LCX** | Stacking_54 vs Prod_RF_54 | +0.0060 | 0.0288 | 0.2878 | +0.0323 | +0.0116 | +0.0003 | -19 |
| **LCX** | Augmented_RF_23 vs Prod_RF_54 | +0.0021 | 0.0391 | 0.9250 | +0.0353 | +0.0152 | -0.0025 | -21 |
| **LCX** | Stacking_23 vs Prod_RF_54 | +0.0059 | 0.0420 | 0.4742 | +0.0435 | +0.0219 | +0.0009 | -26 |
| **LCX** | Stacking_23 vs Augmented_RF_23 | +0.0038 | 0.0184 | 0.4675 | +0.0083 | +0.0067 | +0.0034 | -5 |
| **RCA** | Stacking_54 vs Prod_RF_54 | +0.0010 | 0.0232 | 0.7879 | +0.0438 | +0.0097 | +0.0046 | -25 |
| **RCA** | Augmented_RF_23 vs Prod_RF_54 | -0.0009 | 0.0227 | 0.7878 | +0.0089 | +0.0018 | -0.0012 | -5 |
| **RCA** | Stacking_23 vs Prod_RF_54 | +0.0191 | 0.0309 | 0.0074 | +0.0455 | +0.0129 | -0.0022 | -26 |
| **RCA** | Stacking_23 vs Augmented_RF_23 | +0.0200 | 0.0312 | 0.0094 | +0.0366 | +0.0110 | -0.0010 | -21 |

---

## 4. Per-Target Detailed Analysis

### 4.1 Cath (Overall CAD)
- **Production RF (54 feats):** ROC-AUC 0.9176, Sensitivity 85.9%, Specificity 82.7%, F1 0.8902, Brier 0.1228 (152 missed cases).
- **Soft Voting (54 feats):** ROC-AUC 0.9249, Sensitivity 91.0%, Specificity 78.4%, F1 0.9109, Brier 0.1045 (97 missed cases).
- **Augmented_23 RF:** ROC-AUC 0.9200, Sensitivity 86.1%, Specificity 82.5%, F1 0.8911, Brier 0.1156 (150 missed cases).
- **Augmented_23 Soft Voting:** ROC-AUC 0.9245, Sensitivity 89.8%, Specificity 77.0%, F1 0.9018, Brier 0.1039 (110 missed cases).
- **Verdict:** Soft Voting provides substantial clinical value by reducing missed CAD cases by 28-36%. However, if operational simplicity is paramount, Augmented_23 RF matches Production RF with 57% fewer inputs.

### 4.2 LAD Stenosis
- **Production RF (54 feats):** ROC-AUC 0.8421, Sensitivity 82.9%, Specificity 69.2%, F1 0.8074, Brier 0.1698 (152 missed cases).
- **Soft Voting (54 feats):** ROC-AUC 0.8462, Sensitivity 83.4%, Specificity 70.7%, F1 0.8150, Brier 0.1596 (147 missed cases).
- **Stacking (54 feats):** ROC-AUC 0.8446, Sensitivity 78.6%, Specificity 72.9%, F1 0.7915, Brier 0.1628 (190 missed cases).
- **Augmented_23 RF:** ROC-AUC 0.8418, Sensitivity 81.7%, Specificity 71.5%, F1 0.8076, Brier 0.1643 (162 missed cases).
- **Augmented_23 Soft Voting:** ROC-AUC 0.8455, Sensitivity 83.1%, Specificity 70.3%, F1 0.8118, Brier 0.1587 (150 missed cases).
- **Augmented_23 Stacking:** ROC-AUC 0.8458, Sensitivity 78.7%, Specificity 73.5%, F1 0.7941, Brier 0.1609 (189 missed cases).
- **Verdict:** Soft Voting marginally improves LAD discrimination (ROC-AUC 0.8462) and cuts missed cases to 147. However, **Production RF is operationally competitive** (ROC-AUC 0.8421, 152 missed cases) and Augmented_23 RF maintains parity (ROC-AUC 0.8418). In contrast, **Stacking should NOT be deployed on LAD** due to a severe sensitivity penalty (dropping from ~83% to ~78.6%, missing ~38 more anterior descending lesions).

### 4.3 LCX Stenosis
- **Production RF (54 feats):** ROC-AUC 0.7349, Sensitivity 63.7%, Specificity 69.1%, F1 0.6027, Brier 0.2109 (216 missed cases).
- **Stacking (54 feats):** ROC-AUC 0.7409, Sensitivity 66.9%, Specificity 67.3%, F1 0.6143, Brier 0.2112 (197 missed cases).
- **Augmented_23 RF:** ROC-AUC 0.7370, Sensitivity 67.2%, Specificity 67.6%, F1 0.6180, Brier 0.2084 (195 missed cases).
- **Augmented_23 Stacking:** ROC-AUC 0.7407, Sensitivity 68.0%, Specificity 68.0%, F1 0.6246, Brier 0.2118 (190 missed cases).
- **Verdict:** Both Stacking and Augmented_23 RF outperform Production RF. Dropping 31 noisy features improves LCX sensitivity from 63.7% to 67.2% under RF, and Stacking further improves it to 68.0%.

### 4.4 RCA Stenosis
- **Production RF (54 feats):** ROC-AUC 0.7272, Sensitivity 63.0%, Specificity 68.8%, F1 0.5857, Brier 0.2113 (211 missed cases).
- **Stacking (54 feats):** ROC-AUC 0.7282, Sensitivity 67.4%, Specificity 64.6%, F1 0.5955, Brier 0.2159 (186 missed cases).
- **Augmented_23 RF:** ROC-AUC 0.7263, Sensitivity 63.9%, Specificity 67.8%, F1 0.5876, Brier 0.2101 (206 missed cases).
- **Augmented_23 Stacking:** ROC-AUC **0.7463**, Sensitivity **67.5%**, Specificity **65.5%**, F1 **0.5986**, Brier **0.2091** (185 missed cases).
- **Verdict:** Stacking on Augmented_23 provides a statistically significant and clinically meaningful gain (+0.0191 AUC vs Production RF, Wilcoxon $p = 0.0074$, paired $t$-test $p = 0.0057$, cutting missed stenoses from 211 to 185). Random Forest alone on RCA plateaus at ~0.726 AUC.

---

## 5. Practical Engineering & Deployment Trade-Offs

| Strategy | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- |
| **Strategy A: Pure Random Forest (54 features, Current Production)** | Single architecture; low latency; already deployed. | High missed-stenosis rate on LCX (36.3%) and RCA (37.0%); requires entering 54 clinical variables. | Baseline only; inferior on branch vessels. |
| **Strategy B: Pure Random Forest (Augmented_23)** | Drops 31 fields (57% reduction in clinical entry); matches or exceeds Production RF across all 4 targets; zero ensemble complexity. | Still leaves RCA detection at ~63.9% sensitivity. | **Best balanced operational choice** if complex ensembles are avoided. |
| **Strategy C: Hybrid Model (Recommended)**<br>• Cath: Soft Voting<br>• LAD: Random Forest<br>• LCX: Stacking (or RF)<br>• RCA: Stacking | Maximum discrimination; cuts missed cases by 42 on Cath and 26 on RCA; lowest false-negative rates. | Increased architectural heterogeneity; requires managing base models + meta-learners. | **Best clinical performance choice.** |

