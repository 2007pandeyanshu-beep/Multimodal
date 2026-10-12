# CardioVision AI — Phase 3C: Three-Page Architecture & UX Redesign Audit Report

**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Repository Working Directory:** `D:\Multimodal`  
**Git Working Branch:** `person-a-ml-backend`  
**Base Commit / HEAD:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`  
**Audit Mode:** Strictly Read-Only (Architecture Audit, Information Architecture Design & Scientific UI/UX Proposal)  
**Report Generation Date:** 2026-10-11  

---

## 1. Verified Git and Workspace Safety Status

### 1.1 Branch and Commit Verification
Prior to executing any architectural inspections or formulating design proposals, the Git repository environment was empirically verified:
- **Active Git Branch:** `person-a-ml-backend` (verified identical to `origin/person-a-ml-backend`).
- **HEAD Commit SHA:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`.
- **Working Tree Integrity:** Exactly 10 modified tracked files and 20 untracked files/directories were recorded and preserved without modification. Zero destructive Git operations (commits, pushes, stashes, checkouts, resets, cleans, or rebases) were executed.
- **Safety Precondition:** The destination report path `reports/phase3c_architecture_redesign_audit.md` was verified to not exist prior to creation (`Test-Path` returned `False`). No existing reports, evaluation outputs, model artifacts, or source files were modified or overwritten.
- **Active Background Processes:**
  - FastAPI / Uvicorn server: Active on `http://0.0.0.0:8000` (Task `task-1807`, healthy).
  - Vite / React development server: Active on `http://localhost:5173` (Task `task-1811`, HTTP 200).

### 1.2 Preserved Repository Files Inventory
| Path | Status | Role / Preservation Note |
| :--- | :---: | :--- |
| `frontend/package.json` | Modified (Tracked) | Preserved without new dependencies |
| `frontend/package-lock.json` | Modified (Tracked) | Lockfile integrity preserved |
| `frontend/src/App.tsx` | Modified (Tracked) | Main landing page entry container |
| `frontend/src/components/Header.tsx` | Modified (Tracked) | Application top navigation header |
| `frontend/src/components/HeartCanvas.tsx` | Modified (Tracked) | Exported `HeartModel` with `enableDrift` control |
| `frontend/src/components/PatientAssessmentForm.tsx` | Modified (Tracked) | Workspace form wrapper hosting wizard |
| `frontend/src/components/PatientAssessmentModal.tsx` | Modified (Tracked) | Full-screen modal container |
| `frontend/src/components/ScanningFrame.tsx` | Modified (Tracked) | Landing page 3D heart HUD overlay |
| `frontend/src/index.css` | Modified (Tracked) | Global styles and custom keyframes |
| `frontend/tsconfig.app.json` | Modified (Tracked) | TypeScript compiler options |
| `frontend/src/components/CoronaryResultsCanvas.tsx` | Untracked (Preserved) | Dedicated 3D assessment canvas with camera presets |
| `frontend/src/components/PredictionResultsView.tsx` | Untracked (Preserved) | Results report view hosting 3D stage and 4 cards |
| `frontend/src/api/` | Untracked (Preserved) | Canonical types, API client, presentation utils, tests |
| `frontend/src/components/wizard/` | Untracked (Preserved) | 5-step Apple Health Minimal patient wizard |
| `frontend/src/components/landing/` | Untracked (Preserved) | Soft Aurora Light landing page sections |
| `reports/phase1_ml_architecture_audit.md` | Untracked (Preserved) | Phase 1 ML architecture audit report |
| `reports/phase2_model_evaluation.md` | Untracked (Preserved) | Phase 2 multi-target model evaluation report |
| `reports/phase2_integrity_audit/` | Untracked (Preserved) | Phase 2.1 evaluation integrity audit suite |
| `reports/phase3a_3d_visualization_audit.md` | Untracked (Preserved) | Phase 3A 3D visualization audit report |

---

## 2. Existing Frontend Architecture and Navigation Map

### 2.1 Current Application Topology
The existing frontend application is organized as a single-page application (SPA) without a client-side routing library (`react-router-dom` is **not installed** in `package.json`). All views are mediated via React state within `App.tsx` and `PatientAssessmentModal.tsx`:

```
┌────────────────────────────────────────────────────────────────────────┐
│ App.tsx (Root Viewport)                                                │
│  ├── AtmosphericCardiacBackground (WebGL background canvas)            │
│  ├── ScrollVascularEnvironment (SVG scroll-based vascular art)         │
│  ├── Header (Sticky frosted navigation)                                │
│  ├── Main Landing Scroll                                               │
│  │    ├── CinematicHero (Headline, badges, CTAs)                       │
│  │    ├── ProblemApproachSection (Clinical rationale)                  │
│  │    ├── PredictionTargetsSection (Cath, LAD, LCX, RCA definitions)   │
│  │    ├── HowItWorksSection (54-feature pipeline flow)                 │
│  │    ├── ModelArchitectureSection (Random Forest + Scikit-Learn)      │
│  │    ├── TransparencySection (Tehran cohort limitations, disclaimers) │
│  │    └── ClosingCtaSection                                            │
│  └── Footer                                                            │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ triggers: activeModal === 'assessment'
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PatientAssessmentModal.tsx (Fixed full-screen overlay: fixed inset-0)  │
│  └── PatientAssessmentForm.tsx                                         │
│       └── PatientProfileWizard.tsx                                     │
│            ├── WorkspaceHeader (Step title, demo presets, exit button) │
│            ├── WorkspaceSidebar (5 steps: profile, history, vitals...) │
│            ├── Step 1-5 Forms (32px padded white card)                 │
│            └── [When Prediction Returned]                              │
│                 └── PredictionResultsView.tsx                          │
│                      ├── Header & Session Telemetry                    │
│                      ├── CoronaryResultsCanvas.tsx (3D Heart Stage)    │
│                      ├── Target 1: Cath Card                           │
│                      ├── Targets 2-4: LAD, LCX, RCA Cards              │
│                      ├── Scientific Interpretation Callout             │
│                      ├── 54-Feature Provenance Accordion (Assumed/Meas)│
│                      └── Official Prototype Disclaimer                 │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Critical UX Deficiencies in the Current Architecture
1. **Vertical Monolithic Stacking (The "Scroll of Death"):** Once inference finishes on Step 5, `PredictionResultsView` is injected into the bottom of the same scrollable container as the 5-step wizard. The clinician/user must scroll through thousands of vertical pixels containing input fields, validation summaries, the 3D canvas, four prediction cards, and provenance tables.
2. **Conflation of Distinct Clinical Modalities:** 
   - Interactive 3D spatial anatomy exploration (visual inspection of LAD/LCX/RCA sulci).
   - Quantitative risk decision-making (the 4 target probabilities and threshold comparisons).
   - Clinical provenance auditing (which of the 54 parameters were measured vs. assumed).
   - Scientific model evaluation (5-fold cross-validation ROC curves, PR curves, confusion matrices).
   All four are currently forced into a single vertical page, degrading cognitive clarity.
3. **Absence of Dedicated URL / Navigation State:** If the user refreshes their browser, the modal closes and returns to the landing page hero, losing active results unless manually rehydrated.

---

## 3. Current Assessment and Prediction State Lifecycle

### 3.1 Data Flow from Wizard to Inference
The current end-to-end data lifecycle operates across three distinct tiers:

```
[1. User Input in Wizard]
    ├── WizardFormData (54 form attributes, initialized strictly blank)
    ├── LocalStorage Draft Auto-Save ('cardiovision_assessment_draft_v1')
    └── Synthetic Demo Preset Injection (e.g. "Typical Stenotic Patient")
            │
            ▼
[2. Feature Adaptation & Boundary Validation]
    ├── adaptWizardDataToCanonical() in wizardMetadata.ts
    ├── Partitioning: measuredFieldsProvided vs assumedDefaultsUsed
    ├── Range clamping & deterministic BMI calculation
    └── Strict validation: zero empty fields allowed
            │
            ▼
[3. FastAPI Backend Inference Contract]
    ├── POST http://localhost:8000/predict
    ├── Payload: CanonicalPatientInput (54 features, extra="forbid")
    └── Response: PredictionResponse
            ├── predictions: { Cath, LAD, LCX, RCA }
            │     └── each: { target, predicted_class, predicted_label, probability }
            └── disclaimer: string
            │
            ▼
[4. Results State Presentation]
    ├── setPredictionResponse(response)
    ├── setAssessmentSessionId(generated UUID)
    ├── setAssessmentTimestamp(ISO string)
    └── Mounted inside PredictionResultsView
```

### 3.2 State Volatility & Refresh Behavior
- **Draft Preservation:** Form inputs are safely preserved in `localStorage` under `cardiovision_assessment_draft_v1`.
- **Inference Response Volatility:** `predictionResponse` is currently stored **only in transient component memory** (`useState` in `PatientProfileWizard.tsx`).
- **Failure Vulnerability:** If a user accidentally reloads the page or hits `Escape`, the modal closes, destroying `predictionResponse` in memory. The user is forced to re-submit the assessment to recover their results.
- **Architectural Requirement:** Active assessment outputs, session tokens, and input provenance must be cached in `sessionStorage` (`cardiovision_active_assessment`) so that users can navigate freely between pages, reload the page, or inspect model evaluations without losing their patient's risk profile.

---

## 4. Proposed Three-Page vs. Four-Page Architecture

### 4.1 Comparative Evaluation

| Dimension | Three-Page Architecture (Overview, 3D Explorer, Report+Review) | Four-Page Architecture (Overview, 3D Explorer, Report, Model Review) |
| :--- | :--- | :--- |
| **Information Architecture** | Conflates single-patient assessment dossier with cohort-level population machine learning benchmarking. | **Strictly segregates individual patient care from cohort population science.** Highly defensible before clinical and ML judges. |
| **Cognitive Load** | High on Page C: Clinicians must scroll past ROC curves, PR curves, and Brier scores to find patient blood panel provenance. | **Low & Purpose-Built**: Each page has one clear objective and one intended audience. |
| **Print / Export Suitability** | Poor: PDF export would require awkward pagination slicing between patient data and population ROC curves. | **Superior**: Page C is designed from day one as an exact 1-page printable clinical dossier. |
| **Model Review Access** | Locked: Users cannot view ROC curves or confusion matrices without first completing a patient assessment. | **Unlocked**: Hackathon judges and ML researchers can inspect model evaluation directly without filling out a 54-feature form. |
| **SHAP Integration** | Messy: Local waterfall explanations and global beeswarm plots compete for screen real estate. | **Clean**: Local patient waterfall belongs on Page A/C; global cohort feature importance belongs on Page D. |

### 4.2 Definitive Recommendation: Four-Page Architecture
**We strongly recommend a Four-Destination Information Architecture.** Merging scientific model evaluation into a patient's individual assessment report merely to satisfy an arbitrary 3-page count violates core biomedical informatics principles:
- **Patient Assessment is Dynamic & Ephemeral:** Reflects Patient $X$ at timestamp $T$.
- **Model Evaluation is Standing & Population-Wide:** Reflects the 5-fold cross-validation performance of the scikit-learn models on the $N=303$ Tehran Heart Center cohort.
- **Audience Divergence:** A treating cardiologist reviewing an assessment wants risk scores and laboratory provenance (Pages A, B, C); a technical judge, ML auditor, or regulatory reviewer wants ROC curves, calibration diagrams, and fold variability (Page D).

---

## 5. Page-by-Page Wireframe Descriptions and Component Hierarchy

The redesigned assessment workspace operates as an expansive, Apple Health Minimal tabbed environment:

### 5.1 Shared Workspace Shell & Navigation Bar
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  [♥ CardioVision AI]  Assessment Workspace              Session: #CV-2026-9042 • 10-11 18:45  [✕ Exit] │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  [ 1. Prediction Overview ]   [ 2. 3D Anatomy Explorer ]   [ 3. Patient Report ]   [ 4. Model Review ] │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 Page A: Prediction Overview (Clinical Decision Hub)
**Purpose:** Rapid, high-contrast synthesis of multi-target coronary artery disease risk estimates.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  PAGE A: PREDICTION OVERVIEW                                                                           │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐  ┌──────────────────────┐  │
│  │ PRIMARY OUTCOME: CATHETERIZATION (Cath)                                │  │ QUICK ACTIONS        │  │
│  │ Decision: CAD DETECTED (Class 1)                 Posterior: 84.2%      │  │ [ Launch 3D Explorer]│  │
│  │ [██████████████████████████████████████░░░░░░░░] Threshold: 50.0%      │  │ [ View Full Report  ]│  │
│  │ Territory: Global Coronary Tree (≥50% stenosis in ≥1 major vessel)     │  │ [ Adjust 54 Inputs  ]│  │
│  └────────────────────────────────────────────────────────────────────────┘  └──────────────────────┘  │
│                                                                                                        │
│  VESSEL-SPECIFIC STENOSIS LOCALIZATION (Independent Multi-Artery Predictions)                           │
│  ┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────┐              │
│  │ LAD (Anterior Descending)│  │ LCX (Left Circumflex)    │  │ RCA (Right Coronary)     │              │
│  │ Status: STENOTIC (Class 1│  │ Status: NORMAL (Class 0) │  │ Status: NORMAL (Class 0) │              │
│  │ Probability: 73.1%       │  │ Probability: 28.4%       │  │ Probability: 31.5%       │              │
│  │ [████████████████░░░░░░] │  │ [██████░░░░░░░░░░░░░░░░] │  │ [███████░░░░░░░░░░░░░░░] │              │
│  │ Anterior LV & Apex       │  │ Lateral LV Wall          │  │ Inferior Wall & RV       │              │
│  │ [Inspect in 3D →]        │  │ [Inspect in 3D →]        │  │ [Inspect in 3D →]        │              │
│  └──────────────────────────┘  └──────────────────────────┘  └──────────────────────────┘              │
│                                                                                                        │
│  KEY PREDICTION DRIVERS (Local TreeSHAP Attribution Summary)                                           │
│  • Age (62 yrs): +8.4% risk   • Typical CP (Yes): +14.2% risk   • Resting ECG (Normal): -6.1% risk     │
│                                                                                                        │
│  ℹ Research Prototype Notice: Predictions represent statistical population risk. Not a final diagnosis.│
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.3 Page B: 3D Cardiovascular Explorer (Spatial Anatomy Suite)
**Purpose:** Deep, interactive visual exploration of coronary arterial anatomy and vessel-specific risk mapping.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  PAGE B: 3D CARDIOVASCULAR EXPLORER                                                                    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  VIEW PRESETS: [ Anterior (LAD) ]  [ Left Lateral (LCX) ]  [ Right Posterior (RCA) ]  [ Reset View ]   │
│  DISPLAY MODES: [● Realistic Tissue]  [○ Transparent Myocardium]  [✔ 72 BPM Pulse]  [○ 360° Turntable] │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                        │
│                                    ▲ Superior (Aorta / Pulmonary)                                      │
│                                                                                                        │
│                                           ╭──────────╮                                                 │
│                                          ╱    Aorta   ╲                                                │
│                                         │   ┌───────┐  │                                               │
│                                         │   │  R3F  │  │   ◀── (Interactive 3D Heart Model)            │
│                 [LAD Tooltip Callout]   │   │ Heart │  │                                               │
│                 "LAD: Stenotic (73.1%)" │   │  Mesh │  │   Coronary Pathways Overlaid:                 │
│                 Territory: Anterior LV  │   └───────┘  │   • LAD: Coral Glow (High Risk)               │
│                                         │              │   • LCX: Emerald Path (Low Risk)              │
│                                          ╲    Apex    ╱    • RCA: Emerald Path (Low Risk)              │
│                                           ╰──────────╯                                                 │
│                                    ▼ Inferior                                                          │
│                                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ SELECTED ARTERY TELEMETRY: Left Anterior Descending (LAD)                                         │  │
│  │ • Stenosis Risk: 73.1% (High Likelihood)       • Anatomical Pathway: Anterior Interventricular   │  │
│  │ • Perfusion Territory: Anterior LV & Septum    • Model Decision Threshold: ≥50% occlusion        │  │
│  │ • Cath Finding: Primary driver of positive overall catheterization outcome                       │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│  ℹ Notice: General anatomical reference. Arterial trajectories depict territories, not patient CT scans.│
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.4 Page C: Assessment Report (Print-Ready Clinical Dossier)
**Purpose:** Formal, auditable record of patient biometrics, laboratory values, feature provenance, and model decisions. Structured for direct future conversion into a clean 1-page PDF.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  PAGE C: PATIENT ASSESSMENT DOSSIER                                        [ Print / Export PDF (Soon)]│
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  CLINICAL SESSION METADATA                                                                             │
│  Patient Ref: Synthetic Demo Profile #1        Assessment Date: 2026-10-11 18:45:12 UTC                │
│  Cohort Reference: Tehran Heart Center (N=303) Pipeline: Balanced Random Forest Ensemble v1.0.0       │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  MULTI-TARGET ANGIOGRAPHIC RISK ASSESSMENT                                                             │
│  Target Arterial Structure            Model Likelihood   Predicted Label   Standard Decision Cutoff    │
│  -----------------------------------  ----------------   ---------------   ------------------------    │
│  Cath (Overall Coronary Disease)           84.2%         CAD Positive               ≥50.0%             │
│  LAD (Left Anterior Descending)            73.1%         Stenotic                   ≥50.0%             │
│  LCX (Left Circumflex)                     28.4%         Normal                     ≥50.0%             │
│  RCA (Right Coronary Artery)               31.5%         Normal                     ≥50.0%             │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  INPUT FEATURE PROVENANCE AUDIT (54 Canonical Parameters)                                              │
│  ┌──────────────────────────────────────────────┐  ┌─────────────────────────────────────────────────┐ │
│  │ Measured / Patient-Specific (28 Features)    │  │ Cohort Baseline Assumptions (26 Features)       │ │
│  │ Age: 62 yrs        BP: 145 mmHg   FBS: 112   │  │ ESR: 12 mm/hr (Cohort Median)                   │ │
│  │ BMI: 28.4 kg/m²    PR: 82 bpm     Chol: 235  │  │ K: 4.3 mEq/L (Cohort Median)                    │ │
│  │ Typical CP: Yes    ECG: Normal    EF: 50%    │  │ Lung Rales: No (Cohort Mode)                    │ │
│  └──────────────────────────────────────────────┘  └─────────────────────────────────────────────────┘ │
│  ⚠ Assumption Disclosure: Cohort defaults represent statistical population medians. They must NOT be    │
│    interpreted as clinical confirmation of normal lab values in an individual patient.                 │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  SCIENTIFIC & REGULATORY DISCLAIMER                                                                    │
│  CardioVision AI is an academic research prototype. Predictions do NOT replace formal coronary       │
│  angiography, myocardial perfusion scintigraphy, or licensed physician evaluation.                     │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.5 Page D: Model Review & Explainability (Scientific Research Suite)
**Purpose:** Standalone, transparent scientific benchmarking suite for hackathon judges, peer reviewers, and ML engineers.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  PAGE D: SCIENTIFIC MODEL BENCHMARKING & SHAP REVIEW                                                   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  SELECT TARGET: [● Cath (Overall CAD)]  [○ LAD Artery]  [○ LCX Artery]  [○ RCA Artery]                 │
│  BENCHMARK SUITE: [ 5-Fold ROC ]  [ PR Curves ]  [ Confusion Matrix ]  [ Calibration ]  [ Global SHAP ]│
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐  ┌───────────────────────────────────────────┐ │
│  │ INTERACTIVE ROC CURVE (Cath: AUC = 0.9195)          │  │ MODEL PERFORMANCE COMPARISON (5-Fold CV)  │ │
│  │ 1.0┌─────────────────────────────────────────────┐  │  │ Metric       RandomForest  LogReg  GradBoost│ │
│  │    │                    ╭─────────── RandomForest│  │  │ Accuracy     85.5%         84.5%   84.1%    │ │
│  │ T  │                 ╭──╯            (AUC=0.9195)│  │  │ ROC-AUC      0.9195        0.9279  0.9089   │ │
│  │ P  │              ╭──╯               LogReg      │  │  │ Recall       85.6%         85.6%   92.1%    │ │
│  │ R  │           ╭──╯                  (AUC=0.9279)│  │  │ Precision    93.5%         92.3%   86.9%    │ │
│  │    │        ╭──╯                                 │  │  │ F1 Score     0.8931        0.8876  0.8925   │ │
│  │ 0.0└────────┴────────────────────────────────────┘  │  │ Brier Score  0.1220        0.1061  0.1156   │ │
│  │   0.0             FPR                        1.0 │  │  └───────────────────────────────────────────┘ │
│  └────────────────────────────────────────────────────┘                                                │
│                                                                                                        │
│  GLOBAL FEATURE IMPORTANCE (TreeSHAP Mean |SHAP Value| Across N=303 Patients)                          │
│  Typical Chest Pain  [████████████████████████████████████████] +0.182                                 │
│  Age                 [██████████████████████████] +0.118                                               │
│  Regional RWMA       [█████████████████████] +0.096                                                    │
│  St Elevation        [████████████████] +0.074                                                         │
│  Systolic BP         [████████████] +0.058                                                             │
│                                                                                                        │
│  ℹ Methodology Note: Evaluated via 5-Fold Stratified Cross-Validation on Z-Alizadeh Sani Cohort (N=303)│
│    Preprocessing isolated per fold (no data leakage). Production models fitted with balanced weights.   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Proposed Navigation and State-Preservation Strategy

### 6.1 Zero-Dependency Hash Routing
To preserve our strict dependency hygiene (zero new packages installed in `package.json`), navigation between the four destinations should be driven by a lightweight **browser hash router**:

- `#workspace/overview` $\to$ Page A: Prediction Overview
- `#workspace/explorer` $\to$ Page B: 3D Cardiovascular Explorer
- `#workspace/report` $\to$ Page C: Assessment Report
- `#workspace/review` $\to$ Page D: Model Review & Explainability

```typescript
// Proposed lightweight hook: useWorkspaceNavigation.ts
export type WorkspaceView = 'overview' | 'explorer' | 'report' | 'review';

export function useWorkspaceNavigation(defaultView: WorkspaceView = 'overview') {
  const [activeView, setActiveView] = useState<WorkspaceView>(() => {
    const hash = window.location.hash.replace('#workspace/', '') as WorkspaceView;
    return ['overview', 'explorer', 'report', 'review'].includes(hash) ? hash : defaultView;
  });

  const navigateTo = (view: WorkspaceView) => {
    window.location.hash = `workspace/${view}`;
    setActiveView(view);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#workspace/', '') as WorkspaceView;
      if (['overview', 'explorer', 'report', 'review'].includes(hash)) {
        setActiveView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return { activeView, navigateTo };
}
```

### 6.2 Session Rehydration & Empty-State Resilience
To eliminate state loss upon page refresh:
1. **Persistent Session Storage:** When `POST /predict` returns, cache the entire assessment payload under `cardiovision_active_assessment`:
   ```typescript
   interface ActiveAssessmentSession {
     sessionId: string;
     timestamp: string;
     inputData: WizardFormData;
     canonicalInput: CanonicalPatientInput;
     predictionResponse: PredictionResponse;
     measuredFields: MeasuredField[];
     assumedDefaults: AssumedField[];
     activeDemoPresetId: string | null;
   }
   ```
2. **Rehydration on Mount:** When entering the workspace, the application immediately inspects `sessionStorage`. If an active assessment exists, all four pages hydrate instantaneously.
3. **Graceful Empty State:** If a user navigates directly to `#workspace/overview`, `#workspace/explorer`, or `#workspace/report` without having submitted an assessment:
   - Pages A, B, and C display a friendly, clean Apple Health card: *"No Patient Assessment Active."*
   - Offers two immediate one-click buttons:
     - `[Load Demo Patient (CAD Positive)]` $\implies$ immediately injects synthetic test fixture and hydrates all views.
     - `[Enter New Patient Assessment]` $\implies$ launches the 5-step wizard.
   - **Page D (Model Review) remains 100% accessible at all times**, because cohort-level model evaluations do not depend on an individual patient's data!

---

## 7. Critical 3D Visualization Audit: Approaches A, B & C

### 7.1 Detailed Comparison Matrix

| Evaluation Criterion | Approach A: Procedural Curves over Existing `heart.glb` | Approach B: Dedicated Segmented GLTF Asset (BodyParts3D / NIH 3D) | Approach C: Hybrid (Existing `heart.glb` + Coordinate-Snapped Arteries) |
| :--- | :--- | :--- | :--- |
| **Anatomical Plausibility** | **Low to Moderate:** `heart.glb` is a continuous ZBrush artistic mesh; procedural splines risk looking like floating wires. | **Maximum:** Meshes derived directly from clinical CT/MRI segmentations with true anatomical ostia and sulci contours. | **High:** Existing photorealistic heart retained with anchor points snapped to empirical surface vertices. |
| **Artery Selectability (LAD, LCX, RCA)** | **Moderate:** Requires synthetic Raycast hit-boxes around procedural `<Tube>` geometry. | **Native & Flawless:** Each artery is a discrete named mesh (`Artery_LAD`, `Artery_LCX`, `Artery_RCA`) with native pointer events. | **High:** Clickable tube meshes coupled with HTML hotspot callouts. |
| **Asset Licensing & Legal Provenance** | Retains existing CC-BY-4.0 asset (`neshallads`). | BodyParts3D: CC BY-SA 2.1 Japan; NIH 3D: Public Domain / CC0. Fully compliant. | Retains existing CC-BY-4.0 asset; zero external asset dependencies. |
| **Engineering Effort & Dependencies** | Low: Uses `@react-three/drei` `<Tube>` and `<CatmullRomCurve3>` already installed. | **High:** Requires Blender decimation, material authoring, Draco compression, and coordinate re-alignment. | **Balanced & Achievable:** Uses existing codebase assets and installed Drei primitives. |
| **Runtime Performance on Student Laptops** | **Excellent:** $< 5$ draw calls, lightweight geometry ($< 2,000$ tube vertices). | Moderate to High: Multi-mesh GLTFs can introduce 15–20 draw calls and 50k+ vertices unless heavily optimized. | **Excellent:** 1 heart mesh draw call + 3 artery tube draw calls. |
| **Clinical Impression Risk** | Moderate: Floating tubes may look toy-like if not properly offset from the myocardium. | **Low:** Clinicians recognize true anatomical branching. | **Low:** When paired with explicit anatomical territory disclosures. |

### 7.2 Strategic Visualization Recommendation: Hybrid Tier (Approach C)
**We recommend Approach C for the hackathon prototype:**
1. **Preserve Current Proven Performance:** The existing asset `heart.glb` is already preloaded, cached in GPU memory, and renders smoothly at 60 FPS on standard student laptops.
2. **Surface-Snapped Catmull-Rom Arteries:** Rather than floating generic splines in space, the control points must be derived by sampling empirical vertex coordinates along the surface sulci of `heart.glb` (anterior groove for LAD, left AV groove for LCX, right AV groove for RCA).
3. **Radial Offset Safety ($\Delta n = +0.038$):** Applying a tiny outward normal offset prevents unsightly z-fighting and vertex clipping while keeping the vessels visually integrated with the myocardial wall.
4. **Emissive Risk Glow:** Arteries glow with calibrated risk colors (`#10b981` normal, `#f59e0b` borderline, `#f43f5e` stenotic) matching the posterior probability of the current assessment.
5. **Cath Representation:** Cath is visualized as a **luminescent ambient stage halo and global myocardial perfusion badge**, reinforcing that Cath is an overall diagnosis, not an individual vessel.

---

## 8. Anatomical Alignment Verification Requirements

To satisfy strict scientific review, any procedural vascular trajectory must satisfy these empirical criteria before implementation:

### 8.1 Empirical Sulcus Coordinate Mapping for `heart.glb`
Based on our vertex inspection in Phase 3B:
- **Aortic Root / Coronary Ostia Origin:** Coordinates near `[0.12, 1.15, 0.22]` (superior anterior root).
- **LAD Trajectory (Anterior Interventricular Sulcus):**
  - Origin: `[0.10, 1.05, 0.28]` (left coronary sinus branching below pulmonary trunk).
  - Mid-course: `[-0.05, 0.25, 0.88]` (tracing down the sternocostal groove).
  - Distal / Apex: `[0.18, -1.35, 0.15]` (wrapping around the cardiac apex).
- **LCX Trajectory (Left Atrioventricular Groove):**
  - Origin: `[-0.15, 0.95, 0.25]` (branching leftward from left main trunk).
  - Lateral Margin: `[-0.85, 0.35, 0.10]` (coursing along obtuse margin).
  - Posterior Termination: `[-0.55, 0.10, -0.45]` (posterior left ventricular free wall).
- **RCA Trajectory (Right Atrioventricular Sulcus):**
  - Origin: `[0.28, 0.95, 0.20]` (right coronary sinus).
  - Acute Margin: `[0.75, 0.10, 0.35]` (right atrioventricular groove).
  - Posterior Crux / PDA: `[0.35, -0.65, -0.40]` (diaphragmatic surface towards crux).

### 8.2 Mandatory Scientific Disclaimers
The 3D Explorer must display this visible label:
> *"Standard Anatomical Reference: Vascular pathways illustrate canonical arterial branch territories for machine-learning risk visualization. They do not depict patient-specific coronary angiography or individualized plaque geometry."*

---

## 9. Interactive Evaluation Chart Migration Plan

All 8 static evaluation PNGs from `reports/phase2_charts/` can be migrated to interactive web components using native React SVG (zero external charting libraries required):

| Static Artifact | Proposed Interactive Web Component | Underlying Data Source | Interactive Features |
| :--- | :--- | :--- | :--- |
| `01_confusion_matrices.png` | `InteractiveConfusionMatrix.tsx` | `reports/phase2_charts/fold_level_metrics.csv` | Target switcher (`[Cath] [LAD] [LCX] [RCA]`); hover tooltips on TN, FP, FN, TP displaying percentages and clinical sensitivity/specificity. |
| `02_roc_curves.png` | `InteractiveRocCurve.tsx` | `reports/phase2_charts/oof_predictions.csv` (303 points) | Toggle algorithms (Random Forest vs Logistic Regression vs Gradient Boosting); hover cursor tracking (FPR, TPR, threshold); AUC legend badge. |
| `03_precision_recall_curves.png` | `InteractivePrCurve.tsx` | `reports/phase2_charts/oof_predictions.csv` | Precision vs Recall curves with horizontal prevalence baseline (Cath=71.3%, LAD=58.4%, LCX=28.1%, RCA=36.6%). |
| `04_model_comparison_bars.png` | `ModelComparisonBarChart.tsx` | `ml/artifacts/model_metadata.json` | Grouped bar chart comparing Accuracy, ROC-AUC, Recall, Precision, and F1 across models with sortable columns. |
| `05_per_target_metrics.png` | `TargetPerformanceRadar.tsx` | `ml/artifacts/model_metadata.json` | Radar or multi-axis bar comparing the 4 targets to illustrate class imbalance effects on LCX and RCA. |
| `06_calibration_curves.png` | `CalibrationCurvePlot.tsx` | `reports/phase2_charts/oof_predictions.csv` | 5-bin reliability diagram with perfect calibration diagonal ($y=x$) and Brier score metrics. |
| `07_fold_variability.png` | `FoldVariabilityPlot.tsx` | `reports/phase2_charts/fold_level_metrics.csv` | 5-fold strip plot with mean $\pm$ standard deviation error bars showing cross-validation stability. |
| `08_brier_score_comparison.png` | `BrierScoreComparison.tsx` | `ml/artifacts/model_metadata.json` | Horizontal comparison bar highlighting calibration error across pipelines. |

---

## 10. SHAP Integration Plan

### 10.1 Scientific Scope & Clinical Discipline
- **SHAP Explains the Model, Not the Biology:** A high SHAP value indicates that the Random Forest algorithm placed heavy decision weight on a feature; it does **not** prove medical causality or disease mechanism.
- **Population SHAP vs. Local SHAP:** Must be separated across Page D (Model Review) and Page A (Prediction Overview).

### 10.2 Global SHAP (Page D: Model Review)
1. **Offline Computation:** Use Python's `shap.TreeExplainer` on the fitted production Random Forest pipelines (`ml/artifacts/model_cath.joblib`, etc.) across all 303 training samples.
2. **Serialized JSON Artifact:** Export the top 15 mean absolute SHAP values per target to `ml/artifacts/shap_global_summary.json` (~8 KB).
3. **Web Visualization:** An interactive horizontal bar chart with target tabs (`Cath`, `LAD`, `LCX`, `RCA`). Hovering a feature reveals its clinical definition and median cohort value.

### 10.3 Local Assessment SHAP (Page A: Prediction Overview & Page C: Report)
1. **Lightweight Backend Payload:** Augment `PredictionResponse` or provide an optional `/predict/explain` endpoint returning the top 5 positive and top 5 negative SHAP attributions for the current patient's 54 inputs:
   ```json
   "attributions": {
     "Cath": [
       { "feature": "Typical Chest Pain", "value": 1, "shap_value": 0.142, "direction": "increases_risk" },
       { "feature": "Age", "value": 62, "shap_value": 0.084, "direction": "increases_risk" },
       { "feature": "Resting ECG", "value": "Normal", "shap_value": -0.061, "direction": "decreases_risk" }
     ]
   }
   ```
2. **Web Visualization:** A clean waterfall bar chart showing the baseline expected value, positive risk drivers (rose `#f43f5e`), and negative risk mitigators (teal `#10b981`).

---

## 11. Accessibility, Performance, Fallback, and Responsive Design

### 11.1 Performance & Hardware Discipline
- **Canvas Rendering Cap:** Enforce `dpr={[1, Math.min(window.devicePixelRatio, 1.5)]}` in all Three.js contexts to prevent GPU fill-rate throttling on high-DPI laptop displays.
- **On-Demand Rendering:** Switch `frameloop="demand"` on Page B when the user is not actively orbiting the camera or running turntable rotation.
- **Zero Heavy Post-Processing:** Do not import `EffectComposer` or multi-pass bloom filters; achieve luminous arterial styling using Three.js native `MeshStandardMaterial` emissive properties.

### 11.2 Universal Accessibility (WCAG AAA)
- **Reduced Motion:** Full integration with `prefers-reduced-motion`. Disables 360° turntable, freezes cardiac pulse scaling, and disables camera lerp animations.
- **Colorblind Palettes:** Pair color coding with text badges, numerical percentages, and distinct icons (e.g. checkmark for Normal, warning triangle for Borderline, shield for Stenotic).
- **Keyboard Navigation:** Every view preset button, artery selection tag, and chart tab is fully focusable with visible focus rings (`focus:ring-2 focus:ring-cyan-500`).

### 11.3 Graceful WebGL Degradation
- If WebGL initialization fails or the graphics context is lost:
  - Page B renders a clean fallback card: *"3D Stage Unavailable — Browser WebGL Disabled"*.
  - An interactive 2D coronary vascular diagram (SVG) automatically replaces the 3D viewport.
  - Pages A, C, and D remain 100% operational without interruption.

---

## 12. Risks, Unresolved Decisions, Dependencies & Acceptance Criteria

### 12.1 Engineering Risks & Mitigations
1. **State Loss on Refresh:** Mitigated by `sessionStorage` rehydration hook (`cardiovision_active_assessment`).
2. **Artery Clipping on Heart Mesh:** Mitigated by applying a $+0.038$ radial offset along surface normals for all Catmull-Rom tube vertices.
3. **Dependency Bloat:** Mitigated by strictly rejecting new NPM packages (`react-router-dom`, charting libraries); using native React SVG and hash routing.

### 12.2 Open Decisions for User Alignment
1. **Workspace Entry Mode:** When a user clicks "Get Started" on the landing page, should they see:
   - *Option 1 (Recommended):* The 5-step assessment wizard directly, transitioning to the 4-page workspace upon submission.
   - *Option 2:* The 4-page workspace immediately with a synthetic demo patient preloaded, allowing them to edit parameters via an "Adjust Inputs" drawer.
2. **SHAP Endpoint Architecture:** Compute SHAP values dynamically in `POST /predict` (adds ~120ms latency) vs. an on-demand endpoint `POST /predict/explain` triggered only when the user clicks "Inspect Explainability".

---

## 13. Phased Implementation Sequence

The proposed redesign is divided into four strictly bounded, testable phases:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 3C.1: Workspace Shell & Multi-View Navigation Framework          │
│ • Implement useWorkspaceNavigation hash router (Pages A, B, C, D)       │
│ • Implement sessionStorage rehydration & empty-state handlers          │
│ • Refactor PatientAssessmentModal to host tabbed workspace navigation  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 3C.2: 3D Cardiovascular Explorer (Page B) & Artery Splines       │
│ • Expand CoronaryResultsCanvas to full-height Page B view              │
│ • Overlay calibrated LAD, LCX, RCA Catmull-Rom splines on heart.glb    │
│ • Implement raycast artery selection cards & camera presets            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 3C.3: Clinical Assessment Dossier (Page C) & Provenance Audit    │
│ • Build print-optimized assessment dossier with 54-feature audit table │
│ • Implement strict measured vs. cohort-assumed parameter segregation   │
│ • Prepare clean print stylesheet for future 1-page PDF export          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 3C.4: Scientific Model Review & SHAP Explainability (Page D)     │
│ • Build interactive SVG evaluation charts (ROC, PR, Matrices, Calib)   │
│ • Compute and integrate offline TreeSHAP global feature importance     │
│ • Implement per-assessment local waterfall attribution bars            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Precise File Modification & Creation Matrix for Future Phases

The table below catalogs every file that will be created or modified in future phases:

| Phase | Target File Path | Action | Description |
| :--- | :--- | :---: | :--- |
| **3C.1** | `frontend/src/hooks/useWorkspaceNavigation.ts` | **Create** | Zero-dependency hash router hook (`#workspace/overview`, etc.) |
| **3C.1** | `frontend/src/components/workspace/WorkspaceShell.tsx` | **Create** | Frosted Apple Health header with 4-page segmented tab bar |
| **3C.1** | `frontend/src/components/workspace/EmptyAssessmentCard.tsx` | **Create** | Clean empty state prompting demo profile or new assessment |
| **3C.1** | `frontend/src/components/PatientAssessmentModal.tsx` | **Modify** | Host `WorkspaceShell` and manage session rehydration |
| **3C.2** | `frontend/src/components/workspace/CardiovascularExplorerView.tsx`| **Create** | Dedicated Page B view with full-height 3D stage and telemetry |
| **3C.2** | `frontend/src/components/CoronaryResultsCanvas.tsx` | **Modify** | Add surface-snapped artery splines and raycast click selection |
| **3C.3** | `frontend/src/components/workspace/AssessmentDossierView.tsx` | **Create** | Dedicated Page C view with 54-feature provenance tables |
| **3C.4** | `frontend/src/components/workspace/ModelReviewView.tsx` | **Create** | Dedicated Page D view hosting interactive evaluation charts |
| **3C.4** | `frontend/src/components/charts/InteractiveRocCurve.tsx` | **Create** | Native SVG ROC curve with multi-algorithm toggles |
| **3C.4** | `frontend/src/components/charts/InteractiveConfusionMatrix.tsx` | **Create** | Native SVG confusion matrix with hover counts |
| **3C.4** | `frontend/src/components/charts/GlobalShapBarChart.tsx` | **Create** | Native SVG TreeSHAP feature importance bar chart |
| **3C.4** | `ml/artifacts/shap_global_summary.json` | **Create** | Precomputed TreeSHAP feature attributions across N=303 cohort |

---

## 15. Git Status Before and After the Audit

### Before Audit Inspection
- **Branch:** `person-a-ml-backend`
- **HEAD Commit:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`
- **Status:** 10 modified tracked files, 20 untracked files/directories.

### After Audit Completion
- **Branch:** `person-a-ml-backend` (strictly unchanged).
- **HEAD Commit:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f` (strictly unchanged).
- **Files Created:** Exactly **1** new file (`reports/phase3c_architecture_redesign_audit.md`).
- **Files Modified / Deleted:** Exactly **0** source code, asset, or test files were modified or deleted.

---

**AUDIT CONCLUSION:** Phase 3C architecture redesign audit is complete. All findings and proposals are grounded in the verified codebase and ML artifacts. **No implementation code has been written. Awaiting explicit human approval before beginning Phase 3C.1.**
