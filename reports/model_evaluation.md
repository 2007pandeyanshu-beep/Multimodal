# Model Evaluation & Benchmark Report (Phase 2)
**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Author:** Person A (ML & Backend Lead)  
**Methodology:** 5-Fold Stratified Cross-Validation with Strict Preprocessing Isolation  

---

## 1. Executive Summary & Benchmark Results

Candidate models evaluated:
1. **Logistic Regression (L2, Balanced):** Linear baseline with calibrated log-odds.
2. **Random Forest (Balanced):** Non-linear ensemble with bootstrap aggregation and tree regularization (`max_depth=5`, `min_samples_leaf=3`).
3. **Gradient Boosting:** Sequential boosted trees with shrinkage (`learning_rate=0.05`, `subsample=0.8`).

### Benchmark Comparison Table (Mean ± Std over 5 Stratified Folds)

| Target | Model | Accuracy | Recall (Sensitivity) | Precision | F1-Score | ROC-AUC | Brier Score | Total FN / TP |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cath** | LogisticRegression | 0.845 ± 0.048 | 0.856 ± 0.054 | 0.922 ± 0.044 | 0.887 ± 0.035 | **0.928 ± 0.037** | 0.106 | FN: 31 / TP: 185 |
| **Cath** | RandomForest | 0.855 ± 0.050 | 0.856 ± 0.056 | 0.935 ± 0.035 | 0.893 ± 0.038 | **0.919 ± 0.039** | 0.122 | FN: 31 / TP: 185 |
| **Cath** | GradientBoosting | 0.842 ± 0.054 | 0.921 ± 0.043 | 0.868 ± 0.052 | 0.892 ± 0.036 | **0.907 ± 0.049** | 0.116 | FN: 17 / TP: 199 |
| **LAD** | LogisticRegression | 0.733 ± 0.033 | 0.735 ± 0.065 | 0.793 ± 0.020 | 0.761 ± 0.037 | **0.816 ± 0.035** | 0.187 | FN: 47 / TP: 130 |
| **LAD** | RandomForest | 0.786 ± 0.054 | 0.842 ± 0.047 | 0.803 ± 0.047 | 0.822 ± 0.043 | **0.838 ± 0.068** | 0.169 | FN: 28 / TP: 149 |
| **LAD** | GradientBoosting | 0.776 ± 0.044 | 0.837 ± 0.031 | 0.794 ± 0.049 | 0.814 ± 0.033 | **0.845 ± 0.064** | 0.160 | FN: 29 / TP: 148 |
| **LCX** | LogisticRegression | 0.617 ± 0.059 | 0.588 ± 0.033 | 0.519 ± 0.061 | 0.549 ± 0.038 | **0.654 ± 0.055** | 0.257 | FN: 49 / TP: 70 |
| **LCX** | RandomForest | 0.640 ± 0.079 | 0.614 ± 0.065 | 0.547 ± 0.102 | 0.576 ± 0.077 | **0.720 ± 0.075** | 0.216 | FN: 46 / TP: 73 |
| **LCX** | GradientBoosting | 0.673 ± 0.036 | 0.504 ± 0.021 | 0.606 ± 0.070 | 0.549 ± 0.037 | **0.715 ± 0.057** | 0.213 | FN: 59 / TP: 60 |
| **RCA** | LogisticRegression | 0.650 ± 0.032 | 0.623 ± 0.112 | 0.538 ± 0.034 | 0.569 ± 0.035 | **0.706 ± 0.032** | 0.238 | FN: 43 / TP: 71 |
| **RCA** | RandomForest | 0.670 ± 0.045 | 0.631 ± 0.075 | 0.556 ± 0.062 | 0.589 ± 0.057 | **0.734 ± 0.053** | 0.209 | FN: 42 / TP: 72 |
| **RCA** | GradientBoosting | 0.667 ± 0.033 | 0.429 ± 0.082 | 0.594 ± 0.091 | 0.489 ± 0.048 | **0.693 ± 0.051** | 0.220 | FN: 65 / TP: 49 |

---

## 2. Clinical Model Selection & Tradeoff Analysis

### Target 1: Overall CAD (`Cath`)
- **Production Estimator:** **Random Forest** (`RandomForestClassifier`, balanced weights, `max_depth=5`)
- **Validation Metrics (5-Fold CV):** Accuracy: **0.8547 ± 0.0498**, F1: **0.8931 ± 0.0379**, Precision: **0.9349 ± 0.0350**, Recall: **0.8564 ± 0.0559**, ROC-AUC: **0.9195 ± 0.0390**, Brier Score: **0.1220 ± 0.0212**.
- **Alternative Evaluated:** **Logistic Regression** (Accuracy: 0.8445 ± 0.0475, F1: 0.8867 ± 0.0349, Precision: 0.9225 ± 0.0443, Recall: 0.8562 ± 0.0542, ROC-AUC: **0.9279 ± 0.0375**, Brier Score: **0.1061 ± 0.0375**).
- **Trade-off Analysis & Selection Criterion:**
  - *Neither model is universally best across all criteria.*
  - **Random Forest** achieves superior Accuracy (+1.0%), higher F1 (+0.6%), and higher Precision (0.935 vs 0.923; 13 FP vs 16 FP), while achieving identical sensitivity (185 TP, 31 FN). This minimizes false-positive clinical alarms and maintains architectural homogeneity with the vessel pipelines (simplifying downstream SHAP explainability and 3D visualization color-mapping).
  - **Logistic Regression** remains a valid alternative that achieves marginally superior ROC-AUC (+0.008) and lower mean Brier score (0.1061 vs 0.1220), indicating well-calibrated log-odds probabilities.
  - Random Forest was selected as the default production pipeline for its false-positive reduction and pipeline uniformity, while documenting both models transparently.

### Target 2: LAD Stenosis (`LAD`)
- **Production Estimator:** **Random Forest** (`RandomForestClassifier`, balanced weights, `max_depth=5`)
- **Validation Metrics (5-Fold CV):** Accuracy: **0.7858 ± 0.0540**, ROC-AUC: **0.8383 ± 0.0680**, Recall: **0.8424 ± 0.0470**, Precision: **0.8030 ± 0.0470**, F1: **0.8216 ± 0.0420**, Brier: **0.1692 ± 0.0221**.
- **Clinical Rationale:** The LAD (anterior descending artery) supplies the critical anterior myocardium. Random Forest significantly reduces missed stenoses (Recall 84.2%, 149 detected vs 28 missed) compared to Logistic Regression (Recall 73.5%, 47 missed), while improving F1 (+6.1%) and Brier score.

### Target 3: LCX Stenosis (`LCX`)
- **Production Estimator:** **Random Forest** (`RandomForestClassifier`, balanced weights, `max_depth=5`)
- **Validation Metrics (5-Fold CV):** Accuracy: **0.6402 ± 0.0790**, ROC-AUC: **0.7199 ± 0.0750**, Recall: **0.6138 ± 0.0650**, Precision: **0.5470 ± 0.1020**, F1: **0.5757 ± 0.0770**, Brier: **0.2157 ± 0.0139**.
- **Clinical Rationale:** While unweighted Gradient Boosting had higher apparent accuracy (0.673), its sensitivity collapsed to 50.4% (missing 59 out of 119 diseased patients!). Random Forest with balanced weights catches 73 stenotic cases (Recall 61.4%) and achieves the best ROC-AUC (0.720).

### Target 4: RCA Stenosis (`RCA`)
- **Production Estimator:** **Random Forest** (`RandomForestClassifier`, balanced weights, `max_depth=5`)
- **Validation Metrics (5-Fold CV):** Accuracy: **0.6698 ± 0.0450**, ROC-AUC: **0.7340 ± 0.0530**, Recall: **0.6308 ± 0.0750**, Precision: **0.5560 ± 0.0620**, F1: **0.5893 ± 0.0570**, Brier: **0.2087 ± 0.0143**.
- **Clinical Rationale:** Gradient Boosting missed 65 out of 114 RCA patients (Recall only 42.9%). Random Forest captures 72 positive cases (Recall 63.1%) and achieves the highest ROC-AUC (0.734) and lowest Brier score.

---

## 3. Methodological Rigor & Clinical Safety Checklist

1. **Zero Data Leakage:** Imputers, scalers, and encoders were strictly fit within the training fold of each cross-validation split during benchmarking.
2. **Forbidden Inputs Excluded:** `Cath`, `LAD`, `LCX`, `RCA`, and `Exertional CP` were excluded with programmatic assertions.
3. **Small Sample Protection ($N=303$):** Tree depth was restricted (`max_depth=5`) and minimum leaf size enforced (`min_samples_leaf=3`) to avoid memorizing idiosyncratic noise.
4. **Validation Scope vs. External Validation:** The 5-fold cross-validation results reflect internal validation on this single-center dataset (Z-Alizadeh Sani cohort). They must **not** be construed as independent prospective or external multi-center clinical validation.
5. **Final Production Model Scope:** Following model selection via 5-fold cross-validation, the four production `.joblib` pipelines were fitted on all **303 available patient records** to maximize statistical power for inference.
6. **Probability Bounds:** Predicted risk probabilities are strictly bounded within $[0, 1]$ and verified via Brier calibration metrics.
