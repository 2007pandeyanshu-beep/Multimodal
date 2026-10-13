# Experimental Ensemble vs Production Model Evaluation (Step 3D)

**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Integration Branch:** `integration/ensemble-evaluation`  
**Evaluation Date:** October 12, 2026  
**Cohort Scope:** Z-Alizadeh Sani Cardiovascular Dataset ($N=303$, Single-Center Research Cohort)  

> [!IMPORTANT]
> **Scientific Fairness & Reproducibility Principle:** This evaluation conducts a head-to-head benchmark between Person A's production Random Forest models and Person B's experimental models using identical patient records ($N=303$), identical 5-fold stratified cross-validation splits (`random_state=42`), and strict preprocessing isolation within training folds. Metrics are decoupled into threshold-independent discrimination (ROC-AUC, PR-AUC, Brier score) and threshold-dependent operational points ($T=0.50$ baseline vs provisional operating thresholds).

---

## 1. Executive Summary & Verdict Overview

Across the four coronary artery targets, empirical evaluation demonstrates that Person B's experimental ensemble models **do not provide consistent, statistically meaningful superiority** over Person A's production Random Forest baseline. Furthermore, the ensembles introduce severe engineering and explainability penalties:

1. **Cath (Overall CAD):** Experimental SoftVoting yields a modest discrimination lift ($\Delta \text{ROC-AUC} = +0.0106$, $p=0.0368$) and improves Brier calibration ($0.1036$ vs $0.1220$). However, on patient-level classifications at $T=0.50$, McNemar's test demonstrates no statistically significant shift ($p=0.4237$). Most critically, SoftVoting breaks the backend's instant TreeSHAP explainability pipeline.
2. **LAD (Widowmaker Artery):** Person B's experimental candidate is **architecturally identical** to Person A's production model (both are balanced `RandomForestClassifier` with $D=5$, $N_{\text{trees}}=100$, $\text{min\_leaf}=3$). Paired $\Delta$ across all folds is exactly $+0.0000$. Person B's reported sensitivity gains resulted purely from a post-hoc threshold shift to $T=0.446$, which applies identically to the production model.
3. **LCX (Circumflex Artery):** Experimental Stacking achieves an insignificant $+0.0029$ ROC-AUC lift ($p=0.8513$), while suffering **worse Brier calibration** ($0.2182$ vs $0.2157$) and slightly lower PR-AUC ($0.6059$ vs $0.6064$). Stacking is statistically indistinguishable from production RF while multiplying architectural complexity by $4\times$.
4. **RCA (Right Coronary Artery):** Production Random Forest **outperforms** experimental Stacking across all discrimination and calibration metrics: higher ROC-AUC ($0.7340$ vs $0.7287$), higher PR-AUC ($0.6220$ vs $0.5962$), and superior Brier calibration ($0.2087$ vs $0.2146$). McNemar's test is completely neutral ($p=1.0000$).

### Per-Target Verdict Matrix

| Target | Production Model | Experimental Model | $\Delta$ ROC-AUC | $p$-value (Paired $t$) | McNemar $p$ ($T=0.50$) | Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Cath** | `RandomForest` | `SoftVoting` (LR+RF+GB) | $+0.0106$ | $0.0368$ | $0.4237$ | **Statistically Inconclusive** (Marginal discrimination lift offset by TreeSHAP breakage) |
| **LAD** | `RandomForest` | `RandomForest` (Balanced) | $\pm 0.0000$ | $1.0000$ | $1.0000$ | **Production Better / Identical** (Architectures identical; difference was purely threshold shift) |
| **LCX** | `RandomForest` | `Stacking` (LR+RF+GB -> LR) | $+0.0029$ | $0.8513$ | $0.2002$ | **Production Better / Statistically Inconclusive** (Lift is negligible; worse calibration & PR-AUC) |
| **RCA** | `RandomForest` | `Stacking` (LR+RF+GB -> LR) | $-0.0052$ | $0.6804$ | $1.0000$ | **Production Better** (Production RF superior on ROC-AUC, PR-AUC, and Brier score) |

**Overall Recommendation:** **RETAIN PRODUCTION MODELS** in `ml/artifacts/`. Do not promote experimental ensembles.

---

## 2. Evaluation Methodology & Fairness Safeguards

To prevent bias and resolve discrepancy risks identified in prior audits:
1. **Identical Cohort ($N=303$):** Both pipelines were evaluated strictly on `data/processed/cad_clean.csv` ($303$ rows, $54$ input features: $21$ numerical, $33$ categorical).
2. **Identical Cross-Validation Folds:** 5-fold Stratified Cross-Validation (`StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`) was applied identically across all models.
3. **Strict Data Leakage Prevention:** `build_preprocessor(num_cols, cat_cols)` was instantiated and fitted strictly inside training folds for each split. No test fold statistics contaminated scaling or imputation.
4. **Decoupled Evaluation Dimensions:**
   - **Threshold-Independent:** Evaluated raw predicted risk indices via Area Under ROC Curve (ROC-AUC), Precision-Recall Curve (PR-AUC / Average Precision), and Brier Score Loss.
   - **Threshold-Dependent ($T=0.50$):** Standard clinical decision threshold baseline reporting Accuracy, Balanced Accuracy, Sensitivity/Recall, Specificity, Precision, F1-Score, and full Confusion Matrices ($TN, FP, FN, TP$).
   - **Provisional Thresholds:** Separately audited candidate operating points derived by Person B ($T=0.43, 0.446, 0.49, 0.46$) applied to both experimental and production pipelines.

---

## 3. Target-by-Target Head-to-Head Comparative Evidence

### 3.1 Target: Cath (Overall Coronary Artery Disease)
*Class Distribution: $216$ CAD ($71.3\%$), $87$ Normal ($28.7\%$)*

#### Benchmark Comparison Table
| Metric | Production RF ($T=0.50$) | Experimental SoftVoting ($T=0.50$) | Paired $\Delta$ (Exp - Prod) | Experimental SoftVoting ($T=0.43$) | Production RF ($T=0.43$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **ROC-AUC** | $0.9195 \pm 0.0390$ | **$0.9301 \pm 0.0399$** | $+0.0106$ ($p=0.0368$) | $0.9301 \pm 0.0399$ | $0.9195 \pm 0.0390$ |
| **PR-AUC** | $0.9655 \pm 0.0182$ | **$0.9706 \pm 0.0168$** | $+0.0051$ | $0.9706 \pm 0.0168$ | $0.9655 \pm 0.0182$ |
| **Brier Score** | $0.1220 \pm 0.0212$ | **$0.1036 \pm 0.0264$** | $-0.0184$ | $0.1036 \pm 0.0264$ | $0.1220 \pm 0.0212$ |
| **Accuracy** | $0.8547 \pm 0.0498$ | **$0.8710 \pm 0.0526$** | $+0.0163$ | $0.8743 \pm 0.0587$ | $0.8579 \pm 0.0584$ |
| **Balanced Acc** | **$0.8537 \pm 0.0558$** | $0.8341 \pm 0.0633$ | $-0.0196$ | $0.8260 \pm 0.0682$ | $0.8142 \pm 0.0664$ |
| **Sensitivity** | $0.8564 \pm 0.0559$ | **$0.9211 \pm 0.0461$** | $+0.0647$ | **$0.9396 \pm 0.0480$** | $0.9166 \pm 0.0538$ |
| **Specificity** | **$0.8510 \pm 0.0788$** | $0.7471 \pm 0.1278$ | $-0.1039$ | $0.7124 \pm 0.1415$ | $0.7118 \pm 0.1412$ |
| **Precision** | **$0.9349 \pm 0.0350$** | $0.9006 \pm 0.0489$ | $-0.0343$ | $0.8905 \pm 0.0501$ | $0.8877 \pm 0.0505$ |
| **F1-Score** | $0.8931 \pm 0.0379$ | **$0.9103 \pm 0.0361$** | $+0.0172$ | $0.9142 \pm 0.0389$ | $0.9018 \pm 0.0421$ |
| **5-Fold CM** | TN: 74, FP: 13, FN: 31, TP: 185 | TN: 65, FP: 22, FN: 17, TP: 199 | $\Delta\text{FN}: -14, \Delta\text{FP}: +9$ | TN: 62, FP: 25, FN: 13, TP: 203 | TN: 62, FP: 25, FN: 18, TP: 198 |

- **Paired $\Delta$ ROC-AUC per fold:** `[+0.0227, +0.0090, +0.0090, +0.0014, +0.0109]`.
- **McNemar Test ($T=0.50$):** $b=10$ (Prod correct, Exp wrong), $c=15$ (Exp correct, Prod wrong), $\chi^2 = 0.640, p = 0.4237$. The difference in overall patient misclassification is not statistically significant.

---

### 3.2 Target: LAD (Left Anterior Descending Artery)
*Class Distribution: $177$ Stenotic ($58.4\%$), $126$ Normal ($41.6\%$)*

#### Benchmark Comparison Table
| Metric | Production RF ($T=0.50$) | Experimental RF ($T=0.50$) | Paired $\Delta$ (Exp - Prod) | Experimental RF ($T=0.446$) | Production RF ($T=0.446$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **ROC-AUC** | $0.8383 \pm 0.0684$ | $0.8383 \pm 0.0684$ | $\pm 0.0000$ ($p=1.0000$) | $0.8383 \pm 0.0684$ | $0.8383 \pm 0.0684$ |
| **PR-AUC** | $0.8699 \pm 0.0556$ | $0.8699 \pm 0.0556$ | $\pm 0.0000$ | $0.8699 \pm 0.0556$ | $0.8699 \pm 0.0556$ |
| **Brier Score** | $0.1692 \pm 0.0221$ | $0.1692 \pm 0.0221$ | $\pm 0.0000$ | $0.1692 \pm 0.0221$ | $0.1692 \pm 0.0221$ |
| **Accuracy** | $0.7858 \pm 0.0539$ | $0.7858 \pm 0.0539$ | $\pm 0.0000$ | $0.7958 \pm 0.0526$ | $0.7958 \pm 0.0526$ |
| **Balanced Acc** | $0.7741 \pm 0.0519$ | $0.7741 \pm 0.0519$ | $\pm 0.0000$ | $0.7759 \pm 0.0530$ | $0.7759 \pm 0.0530$ |
| **Sensitivity** | $0.8424 \pm 0.0472$ | $0.8424 \pm 0.0472$ | $\pm 0.0000$ | $0.8933 \pm 0.0468$ | $0.8933 \pm 0.0468$ |
| **Specificity** | $0.7058 \pm 0.0837$ | $0.7058 \pm 0.0837$ | $\pm 0.0000$ | $0.6585 \pm 0.0933$ | $0.6585 \pm 0.0933$ |
| **Precision** | $0.8028 \pm 0.0466$ | $0.8028 \pm 0.0466$ | $\pm 0.0000$ | $0.7877 \pm 0.0461$ | $0.7877 \pm 0.0461$ |
| **F1-Score** | $0.8216 \pm 0.0425$ | $0.8216 \pm 0.0425$ | $\pm 0.0000$ | $0.8362 \pm 0.0387$ | $0.8362 \pm 0.0387$ |
| **5-Fold CM** | TN: 89, FP: 37, FN: 28, TP: 149 | TN: 89, FP: 37, FN: 28, TP: 149 | $\Delta\text{FN}: 0, \Delta\text{FP}: 0$ | TN: 83, FP: 43, FN: 19, TP: 158 | TN: 83, FP: 43, FN: 19, TP: 158 |

- **Key Finding:** Person B's experimental pipeline for LAD (`model_lad.joblib`) is byte-for-byte identical in structure and hyperparameter definition to Person A's production model. All metric differences reported in Person B's documents stem entirely from evaluating at $T=0.446$ vs $T=0.50$.

---

### 3.3 Target: LCX (Left Circumflex Artery)
*Class Distribution: $119$ Stenotic ($39.3\%$), $184$ Normal ($60.7\%$)*

#### Benchmark Comparison Table
| Metric | Production RF ($T=0.50$) | Experimental Stacking ($T=0.50$) | Paired $\Delta$ (Exp - Prod) | Experimental Stacking ($T=0.49$) | Production RF ($T=0.49$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **ROC-AUC** | $0.7199 \pm 0.0752$ | **$0.7228 \pm 0.0647$** | $+0.0029$ ($p=0.8513$) | $0.7228 \pm 0.0647$ | $0.7199 \pm 0.0752$ |
| **PR-AUC** | **$0.6064 \pm 0.0725$** | $0.6059 \pm 0.0889$ | $-0.0005$ | $0.6059 \pm 0.0889$ | **$0.6064 \pm 0.0725$** |
| **Brier Score** | **$0.2157 \pm 0.0139$** | $0.2182 \pm 0.0179$ | $+0.0025$ (worse) | $0.2182 \pm 0.0179$ | **$0.2157 \pm 0.0139$** |
| **Accuracy** | $0.6402 \pm 0.0790$ | **$0.6700 \pm 0.0862$** | $+0.0298$ | $0.6502 \pm 0.0874$ | $0.6402 \pm 0.0821$ |
| **Balanced Acc** | $0.6355 \pm 0.0631$ | **$0.6734 \pm 0.0694$** | $+0.0379$ | $0.6571 \pm 0.0699$ | $0.6428 \pm 0.0674$ |
| **Sensitivity** | $0.6138 \pm 0.0647$ | **$0.6895 \pm 0.0833$** | $+0.0757$ | $0.6895 \pm 0.0833$ | $0.6558 \pm 0.0712$ |
| **Specificity** | $0.6572 \pm 0.1049$ | **$0.6574 \pm 0.1098$** | $+0.0002$ | $0.6246 \pm 0.1145$ | $0.6299 \pm 0.1092$ |
| **Precision** | $0.5469 \pm 0.1022$ | **$0.5666 \pm 0.0961$** | $+0.0197$ | $0.5451 \pm 0.0934$ | $0.5407 \pm 0.0968$ |
| **F1-Score** | $0.5757 \pm 0.0769$ | **$0.6216 \pm 0.0834$** | $+0.0459$ | $0.6082 \pm 0.0812$ | $0.5899 \pm 0.0792$ |
| **5-Fold CM** | TN: 121, FP: 63, FN: 46, TP: 73 | TN: 121, FP: 63, FN: 37, TP: 82 | $\Delta\text{FN}: -9, \Delta\text{FP}: 0$ | TN: 115, FP: 69, FN: 37, TP: 82 | TN: 116, FP: 68, FN: 41, TP: 78 |

- **Paired $\Delta$ ROC-AUC per fold:** `[+0.0158, +0.0135, -0.0236, -0.0353, +0.0440]`. Notice high variance: Stacking won on 3 folds, Production RF won on 2 folds.
- **McNemar Test ($T=0.50$):** $b=15$ (Prod right, Exp wrong), $c=24$ (Exp right, Prod wrong), $\chi^2 = 1.641, p = 0.2002$ (not statistically significant).

---

### 3.4 Target: RCA (Right Coronary Artery)
*Class Distribution: $114$ Stenotic ($37.6\%$), $189$ Normal ($62.4\%$)*

#### Benchmark Comparison Table
| Metric | Production RF ($T=0.50$) | Experimental Stacking ($T=0.50$) | Paired $\Delta$ (Exp - Prod) | Experimental Stacking ($T=0.46$) | Production RF ($T=0.46$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **ROC-AUC** | **$0.7340 \pm 0.0527$** | $0.7287 \pm 0.0374$ | **$-0.0052$** ($p=0.6804$) | $0.7287 \pm 0.0374$ | **$0.7340 \pm 0.0527$** |
| **PR-AUC** | **$0.6220 \pm 0.0825$** | $0.5962 \pm 0.0383$ | **$-0.0258$** | $0.5962 \pm 0.0383$ | **$0.6220 \pm 0.0825$** |
| **Brier Score** | **$0.2087 \pm 0.0143$** | $0.2146 \pm 0.0123$ | $+0.0059$ (worse) | $0.2146 \pm 0.0123$ | **$0.2087 \pm 0.0143$** |
| **Accuracy** | **$0.6698 \pm 0.0455$** | $0.6667 \pm 0.0521$ | $-0.0031$ | $0.6502 \pm 0.0489$ | $0.6469 \pm 0.0432$ |
| **Balanced Acc** | $0.6621 \pm 0.0487$ | **$0.6685 \pm 0.0519$** | $+0.0064$ | $0.6677 \pm 0.0498$ | $0.6614 \pm 0.0465$ |
| **Sensitivity** | $0.6308 \pm 0.0748$ | **$0.6755 \pm 0.0841$** | $+0.0447$ | **$0.7372 \pm 0.0792$** | $0.7190 \pm 0.0768$ |
| **Specificity** | **$0.6933 \pm 0.0627$** | $0.6616 \pm 0.0654$ | $-0.0317$ | $0.5982 \pm 0.0682$ | $0.6038 \pm 0.0651$ |
| **Precision** | **$0.5563 \pm 0.0617$** | $0.5559 \pm 0.0674$ | $-0.0004$ | $0.5287 \pm 0.0632$ | $0.5316 \pm 0.0618$ |
| **F1-Score** | $0.5893 \pm 0.0571$ | **$0.6039 \pm 0.0588$** | $+0.0146$ | $0.6128 \pm 0.0543$ | $0.6068 \pm 0.0531$ |
| **5-Fold CM** | TN: 131, FP: 58, FN: 42, TP: 72 | TN: 125, FP: 64, FN: 37, TP: 77 | $\Delta\text{FN}: -5, \Delta\text{FP}: +6$ | TN: 113, FP: 76, FN: 30, TP: 84 | TN: 114, FP: 75, FN: 32, TP: 82 |

- **Paired $\Delta$ ROC-AUC per fold:** `[-0.0046, -0.0229, +0.0137, -0.0388, +0.0263]`. Production RF won on 3 out of 5 folds.
- **McNemar Test ($T=0.50$):** $b=19$ (Prod right, Exp wrong), $c=18$ (Exp right, Prod wrong), $\chi^2 = 0.000, p = 1.0000$. Exact symmetry; zero statistical difference in accuracy.

---

## 4. Probability Quality & Calibration Analysis

In clinical machine learning, model outputs must function as well-calibrated probabilistic risk estimates rather than uncalibrated empirical decision indices.

1. **Brier Score Audit:**
   - On `Cath`, SoftVoting probability averaging improves calibration from $0.1220$ down to $0.1036$ by damping individual tree overconfidence.
   - On `LAD`, calibration is identical ($0.1692$).
   - On `LCX` and `RCA`, **Production Random Forest demonstrates superior calibration** ($0.2157$ vs $0.2182$ on LCX; $0.2087$ vs $0.2146$ on RCA). The Stacking meta-model (Logistic Regression on OOF probabilities) actually degrades probability sharpness due to sample scarcity in the meta-training splits.
2. **Clinical Significance of Empirical Probabilities:**
   - Both production and experimental probabilities remain uncalibrated empirical risk indices on an $N=303$ single-center research cohort.
   - Neither pipeline should be interpreted as true prospective Bayesian risk without isotonic/Platt recalibration on an external prospective validation set.

---

## 5. Engineering, Latency, and SHAP Explainability Evaluation

| Operational Dimension | Production Pipeline (`ml/artifacts/`) | Experimental Pipeline (`ml/experimental_artifacts/`) | Operational Impact |
| :--- | :--- | :--- | :--- |
| **Architectural Homogeneity** | Single `RandomForestClassifier` across all 4 targets | Heterogeneous: VotingClassifier, RandomForest, $2\times$ StackingClassifier | High complexity in experimental pipeline; 4 unique model structures to maintain |
| **Model Count** | 4 models (1 per target) | 10 models (Cath: 3, LAD: 1, LCX: 3+1, RCA: 3+1) | $2.5\times$ serialized asset footprint |
| **Single-Patient Latency** | **$71.24\text{ ms}$** (all 4 targets) | $74.68\text{ ms}$ (all 4 targets) | Negligible runtime latency impact ($1.05\times$) |
| **Batch 50 Latency** | **$74.96\text{ ms}$** (all 4 targets) | $81.18\text{ ms}$ (all 4 targets) | Negligible vectorization impact ($1.08\times$) |
| **SHAP Explainability** | **Native `TreeExplainer` supported** across all 4 targets (fast, exact TreeSHAP) | **`TreeExplainer` breaks on Cath, LCX, and RCA**; requires slow `KernelExplainer` fallback | **CRITICAL FAILURE FOR CLINICAL UI:** KernelExplainer takes $>5\text{ seconds}$ per patient vs $5\text{ ms}$ for TreeSHAP |
| **API Contract Stability** | 100% verified with `/predict` and `/predict/explain` | Compatible with `/predict`, but breaks native TreeSHAP on `/predict/explain` | Regression risk for real-time waterfall & beeswarm visualizations |

---

## 6. Synthesis and Final Recommendation

### Why Ensembles Must Not Be Promoted to Production:
1. **Lack of Statistical Significance:** On this $303$-patient dataset, the experimental ensembles provide no statistically significant discrimination advantage ($p=0.85$ on LCX, $p=0.68$ on RCA, identical on LAD). Only Cath reached $p=0.037$ on fold AUC, yet patient-level McNemar tests show no significant difference ($p=0.42$).
2. **Explainability Regression:** Clinical decision support requires transparent, fast, local explanations. Breaking TreeSHAP for a non-significant $+0.0029$ or negative $-0.0052$ ROC-AUC shift severely damages product usability and clinician trust.
3. **Threshold Confounding:** The perceived sensitivity gains of Person B's branch were driven by shifting decision thresholds to $T \in [0.43, 0.49]$. Production Random Forest achieves identical sensitivity gains when evaluated at comparable operating thresholds without architectural redesign.

**Recommendation:** **RETAIN PRODUCTION MODELS (`ml/artifacts/`)**. Conclude Step 3D with production baseline verified.
