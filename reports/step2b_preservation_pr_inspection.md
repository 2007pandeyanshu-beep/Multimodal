# CardioVision AI — Step 2B: Working-Tree Preservation & Ensemble PR Inspection Report

**Date of Audit:** October 12, 2026  
**Auditor Role:** Senior Git Integration Engineer & ML Systems Reviewer  
**Repository Workspace:** `D:\Multimodal`  
**Current Branch:** `person-a-ml-backend`  
**Current HEAD Commit:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`  
**Audit Scope:** Read-only working-tree preservation analysis and Person B ensemble PR inspection.

---

## 1. Preflight Verification and Safety Status

In accordance with mandatory safety instructions, all preflight commands were executed and recorded directly.

| Preflight Command | Output | Benchmark | Verification Status |
| :--- | :--- | :--- | :---: |
| `git rev-parse --show-toplevel` | `D:/Multimodal` | `D:\Multimodal` | **MATCH** |
| `git branch --show-current` | `person-a-ml-backend` | `person-a-ml-backend` | **MATCH** |
| `git rev-parse HEAD` | `a5876e7958a354e9bc10195ac62f43b8a8191e2f` | `a5876e7958a354e9bc10195ac62f43b8a8191e2f` | **MATCH** |
| `git diff --cached --stat` | *(0 bytes / empty)* | 0 staged changes | **MATCH** |
| `git status --short` | 14 modified tracked, 22 untracked items | Baseline working tree | **VERIFIED** |

### Absolute Safety Adherence
- **Zero Write / State Changes:** Zero `git add`, `commit`, `push`, `fetch`, `pull`, `checkout`, `switch`, `merge`, `rebase`, `reset`, `clean`, or `stash` commands were run.
- **Zero Repository Modifications:** No files were created, edited, renamed, or deleted outside of this read-only audit report.
- **Zero Remote Mutations:** Remote references were not fetched or modified.

---

## 2. Complete Working-Tree Preservation Inventory

### 2.1 Modified Tracked Files Inventory (14 Files, Unstaged)

| # | File Path | Status | Change Summary | Relevance to Person A | Integration Sensitivity |
| :---: | :--- | :---: | :--- | :--- | :---: |
| 1 | `backend/app.py` | Unstaged | Added `POST /predict/explain` (TreeSHAP) and `GET /explain/global` endpoints; added validation error handling and service readiness checks. | **Core Person A** (Explainability API) | **HIGH** (Routing / endpoint collision) |
| 2 | `backend/model_loader.py` | Unstaged | Implemented `TreeExplainer` caching for all 4 targets, `explain_single()` with tree prior positive-class slicing, and `get_global_shap_summary()`. | **Core Person A** (ML Manager & SHAP) | **CRITICAL** (Requires single tree classifier; ensemble will break SHAP) |
| 3 | `backend/schemas.py` | Unstaged | Added Pydantic explainability schemas (`ExplainRequest`, `ExplainResponse`, `TargetExplanation`, etc.) and `EXPLAINABILITY_DISCLAIMER`. | **Core Person A** (Data Contracts) | **HIGH** (Schema validation contract) |
| 4 | `ml/transformers.py` | Unstaged | Added authoritative `CANONICAL_FEATURE_ORDER` (54 features) and `StringCastTransformer.get_feature_names_out()`. | **Core Person A** (Pipeline Schema) | **CRITICAL** (54-feature order and transformer contract) |
| 5 | `frontend/src/App.tsx` | Unstaged | Complete workspace orchestration; coordinates 5 destinations (`overview`, `explorer`, `report`, `review`, `features`), modal state, and active assessment. | **Core Person A** (App Shell) | **HIGH** (Top-level view coordination) |
| 6 | `frontend/src/components/Header.tsx` | Unstaged | Redesigned header with quick assessment trigger, workspace navigation links, mobile menu, and responsive layout. | **Person A** (UI Navigation) | **MEDIUM** (Layout conflict) |
| 7 | `frontend/src/components/HeartCanvas.tsx` | Unstaged | Enhanced Three.js canvas to support BodyParts3D GLB model (`coronary_heart_bp3d.glb`), vessel-specific risk color coding, and raycaster fallback. | **Shared / Person A** (3D Visualizer) | **HIGH** (Originally Person B; refactored by Person A) |
| 8 | `frontend/src/components/PatientAssessmentForm.tsx` | Unstaged | Refactored legacy 1174-line form calling non-existent `/api/predict` into a backward-compatibility bridge delegating to `PatientProfileWizard`. | **Shared / Person A** (Intake Shim) | **HIGH** (Person B's original form; major textual conflict site) |
| 9 | `frontend/src/components/PatientAssessmentModal.tsx` | Unstaged | Modal dialog wrapper around `PatientProfileWizard`. | **Person A** (Modal UI) | **MEDIUM** (Modal container) |
| 10 | `frontend/src/components/ScanningFrame.tsx` | Unstaged | Visual polish, responsive framing, and scanning indicator. | **Person A** (Visual Polish) | **LOW** (Presentation only) |
| 11 | `frontend/src/index.css` | Unstaged | Added `@media print` rules for A4 clinical PDF generation, Apple Health styling, and custom scrollbars. | **Person A** (Styles & Print) | **MEDIUM** (Print CSS) |
| 12 | `frontend/tsconfig.app.json` | Unstaged | TypeScript build configuration updates. | **Person A** (Build Config) | **LOW** (Compiler settings) |
| 13 | `frontend/package.json` | Unstaged | Added `canvas-confetti` and `@types/canvas-confetti` dependencies. | **Shared / Person A** (Dependencies) | **LOW** (Textual union) |
| 14 | `frontend/package-lock.json` | Unstaged | Lockfile updates for `canvas-confetti`. | **Shared / Person A** (Dependencies) | **LOW** (Regenerable) |

### 2.2 Untracked Artifact Sets Inventory (22 Items)

| Item Path | Type | Item Count / Size | Description & Role |
| :--- | :---: | :---: | :--- |
| `backend/tests/test_explainability.py` | File | 366 lines (15 KB) | 20 unit/integration tests verifying TreeSHAP endpoints, additivity, and schemas. |
| `frontend/.env.example` | File | 6 lines | Environment template specifying `VITE_API_BASE_URL`. |
| `frontend/public/models/coronary_heart_bp3d.glb` | File | 2.5 MB | BodyParts3D anatomical 3D heart asset used in 3D explorer. |
| `frontend/public/models/BODYPARTS3D_LICENSE.txt` | File | 24 lines | CC BY-SA 2.1 JP license attribution for the anatomical asset. |
| `frontend/src/api/` | Directory | 7 modules + 15 test files | Typed API client (`client.ts`), 54-feature adapter (`featureAdapter.ts`), feature catalogue (`clinicalFeaturesData.ts`), state management, and 15 test suites. |
| `frontend/src/components/CoronaryResultsCanvas.tsx` | File | 350+ lines | 3D results canvas rendering coronary branches with raycaster selection. |
| `frontend/src/components/PredictionResultsView.tsx` | File | 200+ lines | Multi-target prediction risk summary cards and workspace gateway. |
| `frontend/src/components/landing/` | Directory | 14 TSX files | Immersive landing page sections (`CinematicHero`, `VascularNetwork`, `ModelArchitecture`, etc.). |
| `frontend/src/components/wizard/` | Directory | 11 TSX/TS files | 5-step clinical intake wizard (`Step1Profile` through `Step5Review`, metadata, types). |
| `frontend/src/components/workspace/` | Directory | 7 TSX files | 5 workspace destinations: `PredictionOverviewView`, `CardiovascularExplorerView`, `AssessmentReportView`, `ModelReviewView`, `FeatureExplorerView`, `WorkspaceNavBar`, `CardioVisionWorkspace`. |
| `reports/` | Directory | 35+ markdown files, PDFs, images | Project documentation, evaluation metrics, and Phase 1 through 5.1 audit reports. |
| `verify_pdf_options.py`, `verify_pdf_render.py` | Files | 2 Python scripts | Chrome DevTools Protocol scripts for automated headless PDF verification. |

---

## 3. Person B Ensemble PR Inspection Findings

### 3.1 Local and Remote Git Inspection
A complete read-only query of all local branches, remote branches, tags, and commit history was performed:
- **Local Branches:** `main` (`a5876e7`), `person-a-ml-backend` (`a5876e7`), `person-b-frontend` (`a5876e7`), `ml-backend` (`f66cd60`).
- **Remote Branches:** `origin/main` (`a5876e7`), `origin/person-a-ml-backend` (`a5876e7`), `origin/person-b-frontend` (`a5876e7`), `origin/ml-backend` (`f66cd60`), `origin/frotend` (`d46dd9e`).
- **Commit History:** Exactly 4 commits exist in the entire Git database (`816e4a6`, `d46dd9e`, `f66cd60`, `a5876e7`).
- **PR #1 Context:** The only pull request recorded in the Git graph is PR #1 (`f66cd60`), merged on October 10, 2026, which merged Person B's initial frontend (`d46dd9e`) into `origin/ml-backend`.
- **Ensemble Branches / Commits:** **Zero local or remote-tracking branches, tags, or commits containing Person B's ensemble PR exist.**

### 3.2 External Access Status: BLOCKED
Direct inspection of Person B's ensemble PR via GitHub is **BLOCKED** due to:
1. **No Local Remote Fetch:** Per preflight safety restrictions, `git fetch` was not run.
2. **Private Repository Authentication:** The GitHub repository `2007pandeyanshu-beep/Multimodal` is private (HTTP GET `/repos/.../pulls` returns HTTP 404 without authentication).
3. **No GitHub CLI:** `gh` is not installed on this workstation.
4. **No Exported Credentials:** No `GITHUB_TOKEN` or `GH_TOKEN` is available in the current environment.

### 3.3 Missing PR Information Summary
- PR number, title, and description.
- Source branch name and HEAD commit SHA.
- Complete file diff and commit list.
- Ensemble model type (Voting, Stacking, or Bagging), constituent algorithms, and artifact paths.
- Input schema, feature ordering, and whether it adheres to the canonical 54-feature standard.

---

## 4. File-Level and Semantic Integration Risks

```mermaid
flowchart TD
    subgraph PersonA["Person A Baseline (Working Tree)"]
        A1["ml/transformers.py (54 Canonical Features)"]
        A2["backend/model_loader.py (Single Tree TreeSHAP)"]
        A3["backend/schemas.py (Strict 54-Feature Extra=Forbid)"]
        A4["frontend/src/api/client.ts (Endpoints: /predict, /predict/explain, /explain/global)"]
    end
    subgraph PersonB["Person B Ensemble PR (External / Unfetched)"]
        B1["Ensemble Models (Voting / Stacking)"]
        B2["Potential Custom Schemas / Snake_Case Aliases"]
        B3["Potential Legacy Form Integration (/api/predict)"]
    end
    B1 -.->|CRITICAL SEMANTIC BREAK: shap.TreeExplainer fails on ensembles| A2
    B2 -.->|CRITICAL SCHEMA MISMATCH: HTTP 422 Extra=Forbid| A3
    B3 -.->|HIGH TEXTUAL CONFLICT: 1100-line diff collision| A4
```

| ID | Component / File | Severity | Risk Nature | Technical Details & Mitigation |
| :---: | :--- | :---: | :--- | :--- |
| **RISK-01** | `backend/model_loader.py` | **CRITICAL** | **Semantic Incompatibility** | `TreeExplainer(classifier)` requires a single tree estimator. If Person B replaces `classifier` with a `VotingClassifier` or `StackingClassifier`, SHAP explanation endpoints will raise `ModelNotSupportedError` / `TypeError`, breaking `/predict/explain` and `/explain/global`. |
| **RISK-02** | `backend/schemas.py` & `ml/transformers.py` | **CRITICAL** | **Schema Contamination** | `PatientInput` strictly enforces `extra="forbid"` on the 54 canonical features. If Person B trained the ensemble on the legacy 25-feature subset or re-introduced `Exertional CP`, all inference calls will return HTTP 422. |
| **RISK-03** | `frontend/src/components/PatientAssessmentForm.tsx` | **HIGH** | **Textual Conflict** | Person A converted this file into a bridge shim delegating to `PatientProfileWizard`. If Person B continued editing the 1174-line monolithic form, a massive textual merge collision will occur. |
| **RISK-04** | `backend/app.py` | **HIGH** | **Endpoint Divergence** | If Person B modified `/predict` response schemas or added alternate ensemble endpoints, Git merge will produce textual conflicts and break the frontend client contract. |
| **RISK-05** | `reports/phase2_integrity_audit/verified_metrics.csv` | **MEDIUM** | **Scientific Inconsistency** | UI Model Review metrics match verified 5-fold CV benchmarks ($N=303$). Displaying ensemble predictions without updated, reproducible cross-validation artifacts creates scientific inconsistency. |

---

## 5. Safe Working-Tree Preservation Plan

> [!CAUTION]
> Person A's baseline is currently **uncommitted** in the working tree. Running `git checkout`, `git switch`, `git reset`, or `git pull` before preserving this work will result in **immediate, irreversible loss of modifications**.

### 5.1 Three-Level Preservation Strategy
1. **Level 1 (Idiomatic Git Commit on `person-a-ml-backend`):**
   - Stage all 14 modified tracked files and all untracked source directories.
   - Commit cleanly on `person-a-ml-backend` with a structured message:
     ```bash
     git commit -m "feat(cardiovision): complete Phases 2-5.1 full-stack cardiovascular platform baseline"
     ```
   - This freezes the baseline into an immutable Git commit object.
2. **Level 2 (Remote Synchronization):**
   - Push `person-a-ml-backend` to `origin/person-a-ml-backend` to ensure cloud-redundant backup.
3. **Level 3 (Isolated Integration Branching):**
   - Never merge Person B's ensemble directly into `person-a-ml-backend` or `main`.
   - Branch a dedicated `integration/ensemble-evaluation` branch from `main` once Person A's baseline is merged to `main`.

### 5.2 Preservation Status Distinctions
- **Actually Executed:** Read-only Git queries and working-tree status inspections. Zero files were staged, committed, or modified.
- **Requires Explicit Authorization:**
  1. Staging and committing Person A's working-tree changes to `person-a-ml-backend`.
  2. Pushing `person-a-ml-backend` to GitHub.
  3. Running `git fetch origin` to retrieve Person B's ensemble branch.

---

## 6. Decision & Status Table

| Area / Investigation Item | Status | Evidence & Rationale |
| :--- | :---: | :--- |
| **Git Preflight & Immutability** | **VERIFIED** | HEAD `a5876e7` matches; 0 staged changes; working tree untouched. |
| **14 Modified Tracked Files** | **SOURCE-INSPECTED** | Inspected via `git diff --stat`; all changes align with Person A's baseline. |
| **22 Untracked Artifact Sets** | **SOURCE-INSPECTED** | Inspected via `git status --short`; complete test, component, and report inventory. |
| **Baseline Test Readiness** | **VERIFIED** | ML pipeline: 6/6 passed; Backend pytest: 32/32 passed; Frontend build: clean (638ms). |
| **Person B Ensemble PR on Local/Remote Refs** | **VERIFIED** | 0 ensemble commits or branches exist in local or remote tracking references. |
| **Person B Ensemble PR on GitHub** | **BLOCKED** | Private repository; no GitHub CLI or auth token; `git fetch` prohibited. |
| **TreeSHAP Ensemble Compatibility** | **SOURCE-INSPECTED** | Code directly relies on single tree classifier; ensemble will break explainability without adapter. |
| **Working-Tree Commit & Push** | **REQUIRES AUTHORIZATION** | Necessary to protect Person A's work before any branch switching. |
| **Remote Fetch of Person B Branch** | **REQUIRES AUTHORIZATION** | Necessary to inspect Person B's PR diff once working tree is safe. |

---

## 7. Recommended Next Action

### **Single Recommended Action:** Commit and Secure Person A's Baseline

Execute this single recommended action across three concrete substeps:

1. **Substep 1 (Stage & Commit Baseline):** With explicit user authorization, stage all working-tree changes and commit them cleanly to `person-a-ml-backend`.
2. **Substep 2 (Push & Verify Remote):** Push `person-a-ml-backend` to `origin/person-a-ml-backend` and verify working tree is completely clean (`git status --short` returns empty).
3. **Substep 3 (Fetch & Isolate Person B):** Once the baseline is secured, run `git fetch origin`, create an isolated branch `integration/ensemble-evaluation`, and evaluate Person B's ensemble without risking Person A's code.

---
*Report certified by Senior Git Integration Engineer & ML Systems Reviewer.*
