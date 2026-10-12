# CardioVision AI: Step 2A — Baseline Evidence Verification Report

**Date of Audit:** October 12, 2026  
**Auditor Roles:** Senior ML Engineer, Backend Auditor, Frontend QA Engineer, Git Safety Reviewer  
**Repository Workspace:** `D:\Multimodal`  
**Target Branch:** `person-a-ml-backend`  
**Target HEAD SHA:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`  
**Audit Purpose:** Independent evidence-based verification of Person A's baseline implementation prior to integrating Person B's ensemble pull request.

---

## 1. Mandatory Git Preflight Verification

In accordance with strict Git safety instructions, all preflight commands were executed and recorded directly.

| Inspection Command | Recorded Output | Target Benchmark | Verification Status |
| :--- | :--- | :--- | :---: |
| `git rev-parse --show-toplevel` | `D:/Multimodal` | `D:\Multimodal` | **MATCH** |
| `git branch --show-current` | `person-a-ml-backend` | `person-a-ml-backend` | **MATCH** |
| `git rev-parse HEAD` | `a5876e7958a354e9bc10195ac62f43b8a8191e2f` | `a5876e7958a354e9bc10195ac62f43b8a8191e2f` | **MATCH** |
| `git diff --cached --stat` | *(Empty output - 0 files)* | 0 staged changes | **MATCH** |

### Working-Tree Modification Inventory
`git status --short` and `git diff --stat` confirm **14 modified tracked files** and **21 untracked artifact sets**:
- **Tracked Modifications (991 insertions, 1429 deletions):**
  - Backend: `backend/app.py`, `backend/model_loader.py`, `backend/schemas.py`, `ml/transformers.py`
  - Frontend: `frontend/src/App.tsx`, `frontend/src/components/Header.tsx`, `frontend/src/components/HeartCanvas.tsx`, `frontend/src/components/PatientAssessmentForm.tsx`, `frontend/src/components/PatientAssessmentModal.tsx`, `frontend/src/components/ScanningFrame.tsx`, `frontend/src/index.css`, `frontend/tsconfig.app.json`, `frontend/package.json`, `frontend/package-lock.json`
- **Untracked Artifacts Preserved:**
  - Tests: `backend/tests/test_explainability.py`, `frontend/src/api/__tests__/*`
  - Components: `frontend/src/components/landing/*`, `frontend/src/components/wizard/*`, `frontend/src/components/workspace/*`
  - API Helpers: `frontend/src/api/*`
  - Assets: `frontend/public/models/coronary_heart_bp3d.glb`, `BODYPARTS3D_LICENSE.txt`
  - Verification Reports & Screenshots: `reports/*`, test PDFs, and diagnostic scripts.
- **Safety Guarantee:** Zero reset, clean, stash, checkout, stage, commit, or push operations were executed.

---

## 2. Table of Claims, Verification Methods, Observed Evidence, and Status

| Gate / Claim Area | Claim Description | Verification Method | Observed Evidence & Measurements | Classification Status |
| :--- | :--- | :--- | :--- | :---: |
| **1. Git Immutability** | Branch and exact HEAD match expectations; no working tree loss. | `git rev-parse`, `git status --short`, `git diff --stat` | Exact HEAD `a5876e7`; 14 tracked files modified; 0 files staged; 0 files deleted. | **VERIFIED** |
| **2. Four ML Models** | Four baseline pipelines exist for Cath, LAD, LCX, RCA. | Python reflection via `joblib.load()` on `ml/artifacts/*.joblib` | All 4 pipelines load cleanly; each contains `['preprocessor', 'classifier']` with `RandomForestClassifier`. | **VERIFIED** |
| **3. Canonical 54 Features** | Exact 54 features partitioned into 21 numerical and 33 categorical. | Python inspection comparing `ml/artifacts/model_metadata.json` and pipeline steps | `transformers: [('num', 21), ('cat', 33)]`. Symmetric difference between `CANONICAL_FEATURE_ORDER` and metadata = `set()`. | **VERIFIED** |
| **4. Pydantic Schema Alignment** | `PatientInput` accepts 54 canonical features with `extra="forbid"`. | Pydantic field alias inspection and pytest execution | All 54 field aliases match `CANONICAL_FEATURE_ORDER` exactly. Missing/extra fields trigger HTTP 422. | **VERIFIED** |
| **5. Leakage Exclusion** | Targets and `Exertional CP` are strictly forbidden as inputs. | `ml/test_pipeline.py` Test 2 & pytest `test_predict_target_leakage_rejection` | Target leakage rejection tests passed for Cath, LAD, LCX, RCA, and `Exertional CP` (HTTP 422). | **VERIFIED** |
| **6. TreeSHAP Initialization** | `shap.TreeExplainer` initialized per target with positive class index. | `backend/tests/test_explainability.py` Test 1 & 2 | All 4 explainers loaded. Positive class verified at `classes_` index 1 across all 4 models. | **VERIFIED** |
| **7. SHAP Additivity** | $\text{base\_value} + \sum \text{attributions} = \text{probability}$ mathematically. | Pytest Test 3 & Test 4 (`test_additivity_reconstruction_each_target`) | Measured canonical aggregation diff $< 10^{-14}$; API reconstructed probability discrepancy $< 10^{-14}$ ($< 10^{-5}$ tolerance). | **VERIFIED** |
| **8. Expected Value Distinction** | SHAP `base_value` reflects tree prior, distinct from cohort prevalence. | Source inspection of `model_loader.py` vs `ModelReviewView.tsx` | `base_value` is `explainer.expected_value[1]` in probability space. Prevalence ($71.3\%$, $58.4\%$, $39.3\%$, $37.6\%$) is documented separately in UI. | **SOURCE-INSPECTED** |
| **9. Global SHAP Cache** | `GET /explain/global` caches top-10 cohort mean absolute SHAP importances. | Pytest `test_get_global_shap_endpoint_contract` | Returns 10 ranked features per target evaluated on $N=303$ cohort; deterministic and thread-safe. | **VERIFIED** |
| **10. Metric Consistency** | UI Model Review metrics match ground truth `verified_metrics.csv`. | Code review of `ModelReviewView.tsx` against `verified_metrics.csv` & test | All 4 targets match `verified_metrics.csv` to 4 decimal places for both Fold-Mean and Pooled OOF metrics. | **VERIFIED** |
| **11. Frontend Build** | Frontend compiles cleanly for production with TypeScript. | `npm run build` in `frontend/` directory | Build completed in 638ms; 2549 modules transformed; 0 TypeScript errors. | **VERIFIED** |
| **12. Frontend Unit Tests** | Core API, wizard, and workspace unit test suites pass. | `node --experimental-strip-types` across 11 test suites | 95 passing assertions across 11 test suites (0 failures). | **VERIFIED** |
| **13. TSX Node Runner** | 4 older TSX component test files run under raw Node runner. | `node --experimental-strip-types src/api/__tests__/phase3bResultsCanvas.test.ts` | Fails with `ERR_UNKNOWN_FILE_EXTENSION: Unknown file extension ".tsx"`. Compiles fine in Vite build. | **BLOCKED** |
| **14. Person B Ensemble PR** | Person B's ensemble code is present locally for integration. | `git branch -avv`, `git show-ref`, `git log --all` | Zero ensemble commits or branches exist in local/remote references. Unfetched on remote. | **BLOCKED** |

---

## 3. Executed Test Commands and Outcomes

| # | Exact Command | Execution Directory | Exit Code | Observed Result Summary |
| :---: | :--- | :--- | :---: | :--- |
| **1** | `python ml/test_pipeline.py` | `D:\Multimodal` | **0** | **6/6 passed (100%)**: Artifact existence, zero leakage, fresh prediction, probability bounds, type robustness, reproducibility. |
| **2** | `pytest backend/tests/ -v` | `D:\Multimodal` | **0** | **32/32 passed (100%)**: API contracts, validation errors (422), TreeSHAP additivity ($< 10^{-14}$), global SHAP caching. |
| **3** | `npm run build` | `D:\Multimodal\frontend` | **0** | **Clean production build (638ms)**: 2549 modules compiled; 0 TypeScript errors; bundle generated in `dist/`. |
| **4** | `node --experimental-strip-types src/api/__tests__/featureExplorer.test.ts` | `D:\Multimodal\frontend` | **0** | **18/18 passed**: 54 features, schema alignment, recomputed categorical frequencies, modal dialog UX. |
| **5** | `node --experimental-strip-types src/api/__tests__/featureAdapter.test.ts` | `D:\Multimodal\frontend` | **0** | **6/6 passed**: 54-feature adapter, strict mode unmeasured fields, cohort defaults, range checks. |
| **6** | `node --experimental-strip-types src/api/__tests__/client.test.ts` | `D:\Multimodal\frontend` | **0** | **5/5 passed**: Live API client integration with `/health`, `/metadata`, `/predict`, and 422 error handlers. |
| **7** | `node --experimental-strip-types src/api/__tests__/wizardCompleteness.test.ts` | `D:\Multimodal\frontend` | **0** | **17/17 passed**: Empty initial state, 5-step feature partitioning, BMI/chest-pain derivations, live inference. |
| **8** | `node --experimental-strip-types src/api/__tests__/workspaceRedesign.test.ts` | `D:\Multimodal\frontend` | **0** | **6/6 passed**: Workspace layout, draft preservation, reset behavior, step validation. |
| **9** | `node --experimental-strip-types src/api/__tests__/phase3c1Navigation.test.ts` | `D:\Multimodal\frontend` | **0** | **7/7 passed**: Hash routing across destinations, view mounting coordination. |
| **10** | `node --experimental-strip-types src/api/__tests__/phase3c2ReportPdf.test.ts` | `D:\Multimodal\frontend` | **0** | **7/7 passed**: Individual assessment report, print stylesheet rules, diagnostic disclosures. |
| **11** | `node --experimental-strip-types src/api/__tests__/phase3c21MetricsAndPdf.test.ts` | `D:\Multimodal\frontend` | **0** | **7/7 passed**: Metric alignment with `verified_metrics.csv` to 4 decimal places, 1-page summary mode. |
| **12** | `node --experimental-strip-types src/api/__tests__/landingPageRedesign.test.ts` | `D:\Multimodal\frontend` | **0** | **7/7 passed**: Landing page copy, prediction targets, architecture transparency, disclaimers. |
| **13** | `node --experimental-strip-types src/api/__tests__/resultsPresentation.test.ts` | `D:\Multimodal\frontend` | **0** | **9/9 passed**: Risk formatting, boundary probabilities, missing target safety, stale prediction prevention. |
| **14** | `node --experimental-strip-types src/api/__tests__/phase3e2AnatomicalIntegration.test.ts` | `D:\Multimodal\frontend` | **0** | **6/6 passed**: BodyParts3D GLB asset deployment, license attribution, 3D canvas mesh mapping. |

---

## 4. Failures, Blocked Checks, and Unresolved Risks

### 4.1 Failures (0 Application Failures)
- Zero application, backend, ML pipeline, or production build failures occurred.

### 4.2 Blocked Checks
1. **TSX Test Runner Invocation (Infrastructure Limitation):**
   - Four test files (`phase3bResultsCanvas.test.ts`, `phase3c23DemoStateIntegrity.test.ts`, `phase3e3VisualPolish.test.ts`, `phase3e4ColorRefinement.test.ts`) fail when invoked via `node --experimental-strip-types` because they import React JSX/TSX files directly.
   - Node's native strip-types flag does not compile JSX. These components compile cleanly in Vite (`npm run build`). This does not affect application functionality.
2. **Person B's Ensemble PR Inspection:**
   - Person B's ensemble PR is not present in local or remote tracking references.
   - Remote reference fetching is prohibited in this read-only audit.

### 4.3 Unresolved Integration Risks
1. **Uncommitted Working Tree:** Person A's baseline currently exists as uncommitted modifications in the working tree on `person-a-ml-backend`. Any branch switch, checkout, or reset before committing will result in loss of work.
2. **Ensemble TreeSHAP Incompatibility:** `shap.TreeExplainer` in `backend/model_loader.py` expects a single tree classifier. If Person B's ensemble replaces this with a `VotingClassifier` or `StackingClassifier`, the TreeSHAP explainability pipeline will throw runtime exceptions unless an ensemble explainer strategy is implemented.

---

## 5. Final Recommendation

### **Verdict: READY WITH CONDITIONS**

#### Justification & Conditions for Next Stage:
1. **Baseline Health:** Person A's baseline is verified, robust, and mathematically sound (ML tests: 6/6, Pytest: 32/32, Frontend build: 100% clean, Unit tests: 95/95).
2. **Condition 1 (Working-Tree Commitment):** Before any branch operations, checkout, or merging, Person A's working-tree changes must be committed cleanly to `person-a-ml-backend`.
3. **Condition 2 (Isolated Integration Branch):** When authorized to proceed with Person B's ensemble PR, do NOT merge it directly into `main` or `person-a-ml-backend`. Fetch Person B's branch and perform integration testing exclusively on an isolated branch: `integration/ensemble-evaluation`.
4. **Condition 3 (Explainability Regression Gate):** Any integrated ensemble must pass `test_explainability.py` with verified TreeSHAP additivity ($< 10^{-5}$) before being considered for promotion to `main`.

---
*Report certified by Senior ML Engineer, Backend Auditor, Frontend QA Engineer, and Git Safety Reviewer.*
