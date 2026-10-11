# Phase 4: Isolated Experimental Inference API Implementation & Validation Report

**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Execution Date:** 2026-10-12  
**Status:** Validated, Tested & Functionally Isolated  

> [!IMPORTANT]
> **Research Prototype Disclaimer:** This API serves experimental statistical models trained on a single-center cohort ($N=303$). These models are research prototypes and **must not be used as clinical diagnostic devices** or substitutes for physician judgment. Decision thresholds are provisional cross-validation benchmarks and require prospective multi-center calibration before clinical consideration.

---

## 1. Executive Summary

In Phase 4, an isolated experimental inference layer was implemented within the existing FastAPI backend. This layer allows researchers and frontend visualizers to evaluate the newly trained candidate model architectures (`Soft Voting` and `Stacking` ensembles) and their provisional classification thresholds without modifying the production API (`POST /predict`) or touching production artifacts in `ml/artifacts/`.

---

## 2. Implemented Endpoints & Schemas

| Endpoint | HTTP Method | Request Model | Response Model | Description |
| :--- | :---: | :--- | :--- | :--- |
| `/predict/experimental` | `POST` | `PatientInput` | `ExperimentalPredictionResponse` | Evaluates a single patient's 54 clinical measurements using candidate ensemble models in `ml/experimental_artifacts/` and applies provisional decision thresholds. |
| `/predict/experimental/batch` | `POST` | `BatchPredictionRequest` | `ExperimentalBatchPredictionResponse` | Vectorized batch scoring (up to 50 patients) preserving exact input order with provisional thresholds. |
| `/health/experimental` | `GET` | *None* | `ExperimentalHealthResponse` | Health check probe returning readiness and loading status for all 4 experimental target pipelines. |
| `/metadata/experimental` | `GET` | *None* | `ExperimentalMetadataResponse` | Exposes candidate architectures, provisional threshold values, rationale, and cross-validation metrics. |

### Prediction Response Payload Structure

The experimental prediction response extends the standard schema while preserving backward-compatible core fields:

```json
{
  "predictions": {
    "Cath": {
      "target": "Cath",
      "predicted_class": 1,
      "predicted_label": "CAD",
      "probability": 0.6756,
      "applied_threshold": 0.43,
      "threshold_strategy": "f1_optimized",
      "threshold_status": "provisional",
      "model_name": "SoftVoting",
      "model_type": "VotingClassifier",
      "standard_class": 1,
      "standard_label": "CAD"
    },
    "LAD": {
      "target": "LAD",
      "predicted_class": 1,
      "predicted_label": "Stenotic",
      "probability": 0.5246,
      "applied_threshold": 0.446,
      "threshold_strategy": "f1_optimized",
      "threshold_status": "provisional",
      "model_name": "RandomForest",
      "model_type": "RandomForestClassifier",
      "standard_class": 1,
      "standard_label": "Stenotic"
    },
    "LCX": {
      "target": "LCX",
      "predicted_class": 0,
      "predicted_label": "Normal",
      "probability": 0.2938,
      "applied_threshold": 0.49,
      "threshold_strategy": "youden_j",
      "threshold_status": "provisional",
      "model_name": "Stacking",
      "model_type": "StackingClassifier",
      "standard_class": 0,
      "standard_label": "Normal"
    },
    "RCA": {
      "target": "RCA",
      "predicted_class": 1,
      "predicted_label": "Stenotic",
      "probability": 0.5711,
      "applied_threshold": 0.46,
      "threshold_strategy": "youden_j",
      "threshold_status": "provisional",
      "model_name": "Stacking",
      "model_type": "StackingClassifier",
      "standard_class": 1,
      "standard_label": "Stenotic"
    }
  },
  "disclaimer": "Experimental prototype output. Isolated from production ml/artifacts/...",
  "pipeline_type": "experimental",
  "artifacts_source": "ml/experimental_artifacts"
}
```

---

## 3. Threshold Governance & Sensitivity Shifts

1. **Explicit Threshold Application:**
   - Raw continuous statistical probabilities $P(y=1)$ are preserved unmodified in `probability`.
   - `predicted_class` is calculated explicitly as $1$ if $P \ge T_{\text{prov}}$, else $0$.
   - `standard_class` records what the standard $T = 0.50$ baseline would have predicted.
2. **Empirical Sensitivity Recovery:**
   - In automated validation testing, an RCA patient with probability $0.4972$ was evaluated. Under the standard $0.50$ threshold, this patient was classified as negative (`standard_class: 0` — a False Negative).
   - Under the provisional threshold $T = 0.46$, the patient was correctly flagged as positive (`predicted_class: 1`), directly demonstrating operational sensitivity recovery on borderline cases.

---

## 4. Automated Test Suite Results

The automated integration test suite (`backend/tests/test_experimental_api.py`) executed all 8 scenarios:

| # | Test Scenario | Status | Latency | Outcome |
| :---: | :--- | :---: | :---: | :--- |
| 1 | **Experimental Health & Metadata** | ✅ PASS | 8.4 ms | `/health/experimental` returns healthy; `/metadata/experimental` returns all 4 target specifications. |
| 2 | **Valid Single-Patient Prediction** | ✅ PASS | 82.0 ms | HTTP 200 OK; returns valid schemas and bounded probabilities for Cath, LAD, LCX, RCA. |
| 3 | **Threshold-Based Label Application** | ✅ PASS | 149.5 ms | Proves provisional threshold governs `predicted_label` and demonstrates sensitivity shift on borderline patient. |
| 4 | **Batch Prediction & Index Stability** | ✅ PASS | 82.0 ms | Batch vectorization verified up to 50 patients; preserves exact input index mapping. |
| 5 | **Input Validation & Schema Strictness** | ✅ PASS | 3.4 ms | Missing fields, negative ages, and invalid categorical levels strictly rejected with HTTP 422. |
| 6 | **Target Leakage Exclusion** | ✅ PASS | 7.4 ms | Rejects forbidden features (`Cath`, `LAD`, `LCX`, `RCA`, `Exertional CP`) with HTTP 422. |
| 7 | **Service Degradation Error Handling** | ✅ PASS | 1.9 ms | Returns HTTP 503 Service Unavailable when experimental models are unready. |
| 8 | **Production Isolation Proof** | ✅ PASS | 191.7 ms | Verified that `/predict` strictly serves `RandomForest` from `ml/artifacts/`, while `/predict/experimental` serves ensembles from `ml/experimental_artifacts/`. |

**Total:** 8/8 Tests Passed (100% Pass Rate)

---

## 5. Production Isolation Audit

- `ml/artifacts/`: Completely untouched (timestamp preserved: October 10, 2026).
- `backend/model_loader.py`: Completely untouched.
- `ml/train.py`, `ml/evaluate.py`, `ml/transformers.py`: Completely untouched.
- `POST /predict` & `POST /predict/batch`: Unchanged; production clients continue functioning without modification.
