# CardioVision AI — Phase 3A: 3D Cardiovascular Visualization Architecture Audit & Reference Research

**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Repository Working Directory:** `D:\Multimodal`  
**Git Working Branch:** `person-a-ml-backend`  
**Base Commit / HEAD:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`  
**Audit Mode:** Strictly Read-Only (Architecture Audit, 3D Geometry Audit & Open-Source Research)  
**Report Generation Date:** 2026-10-11  

---

## 1. Verified Repository State and Git Safety Findings

### 1.1 Branch and Commit Verification
Prior to executing any audit inspections or technical research, the Git repository environment was empirically verified:
- **Active Git Branch:** `person-a-ml-backend` (verified up to date with `origin/person-a-ml-backend`).
- **HEAD Commit SHA:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`.
- **Git Status Integrity:** Exactly 9 previously modified tracked files and 18 untracked files/directories were identified and preserved without alteration. Zero commits, stashes, checkouts, resets, cleans, or rebases were executed.
- **Background Task Verification:**
  - FastAPI / Uvicorn server: Active on `http://0.0.0.0:8000` (Task `task-1807`).
  - Vite / React development server: Active on `http://localhost:5173` (Task `task-1811`).
- **File Collision Check:** The destination audit report path `reports/phase3a_3d_visualization_audit.md` was verified to not exist prior to creation (`Test-Path` returned `False`). No existing reports or source files were overwritten or modified.

### 1.2 Preserved Workspace Files Inventory
| Path | Status | Role / Preservation Note |
| :--- | :---: | :--- |
| `frontend/package.json` | Modified (Tracked) | Dependency definitions (preserved) |
| `frontend/package-lock.json` | Modified (Tracked) | Lockfile integrity (preserved) |
| `frontend/src/App.tsx` | Modified (Tracked) | Main landing page application container (preserved) |
| `frontend/src/components/Header.tsx` | Modified (Tracked) | Application top navigation header (preserved) |
| `frontend/src/components/PatientAssessmentForm.tsx` | Modified (Tracked) | Canonical patient assessment form (preserved) |
| `frontend/src/components/PatientAssessmentModal.tsx` | Modified (Tracked) | Modal wrapper for assessment workflow (preserved) |
| `frontend/src/components/ScanningFrame.tsx` | Modified (Tracked) | 3D heart stage overlay HUD (preserved) |
| `frontend/src/index.css` | Modified (Tracked) | Global styles and custom keyframe animations (preserved) |
| `frontend/tsconfig.app.json` | Modified (Tracked) | TypeScript configuration (preserved) |
| `frontend/src/api/` | Untracked (Preserved) | Type contracts, client adapter, and presentation utilities |
| `frontend/src/components/wizard/` | Untracked (Preserved) | 5-step Apple Health Minimal patient wizard |
| `frontend/src/components/landing/` | Untracked (Preserved) | Soft Aurora Light landing page sections |
| `frontend/src/components/PredictionResultsView.tsx` | Untracked (Preserved) | 4-target clinical prediction results report view |
| `reports/phase1_ml_architecture_audit.md` | Untracked (Preserved) | Phase 1 machine learning architecture audit report |
| `reports/phase2_model_evaluation.md` | Untracked (Preserved) | Phase 2 multi-target model evaluation report |
| `reports/phase2_integrity_audit/` | Untracked (Preserved) | Phase 2.1 evaluation integrity audit suite |

---

## 2. Existing Frontend and 3D Rendering Architecture

### 2.1 Technology Stack & Rendering Infrastructure
The CardioVision AI frontend is configured with modern web graphics and UI libraries:
- **Core Framework:** React 19.2.8 with TypeScript 6.0.2, bundled via Vite 8.3.0.
- **Styling System:** Tailwind CSS 4.3.3 supplemented with custom CSS animations in `src/index.css`.
- **3D Graphics Engine:**
  - `three` (`v0.186.1`): Underlying WebGL rendering engine.
  - `@react-three/fiber` (`v9.8.1`): Declarative React reconciler for Three.js scenes.
  - `@react-three/drei` (`v10.7.9`): Utility abstractions for R3F (`useGLTF`, `Center`, `Float`, `OrbitControls`, `Line`, `Tube`, `Html`).
- **Animation Libraries:**
  - `animejs` (`v4.5.0`): Scoped timelines (`createScope`, `createTimeline`) driving hero section and landing page element entrances.
  - Custom RAF (RequestAnimationFrame) loops driving mouse parallax and Three.js `useFrame` render hooks.

### 2.2 Current 3D Implementation: `HeartCanvas.tsx`
The primary 3D component in the codebase is `frontend/src/components/HeartCanvas.tsx` (191 lines). Its operational architecture comprises:
1. **Model Loading:** Invokes `useGLTF('/models/heart.glb')` with top-level preloading (`useGLTF.preload('/models/heart.glb')`).
2. **Scene Traversal & Cloning:** Uses `useMemo` to clone the loaded glTF scene, traversing children to ensure materials are isolated, enabling shadow casting/receiving, and clamping roughness ($\ge 0.4$) and metalness ($\le 0.2$) while preserving organic anatomical textures.
3. **Multi-Source Anatomical Lighting Rig:**
   - Ambient Light: Neutral white illumination (intensity: `1.1`).
   - Directional Key Light: Position `[4, 5, 4]`, intensity `1.6`, casting soft shadows.
   - Fill Light: Position `[-4, 2, 3]`, intensity `0.8`, color `#f1f5f9`.
   - Cool-Blue Rim Light: Position `[5, 3, -4]`, intensity `3.2`, color `#38bdf8` (sky-blue) providing silhouette definition.
   - Secondary Contour Light: Position `[-4, 4, -4]`, intensity `2.0`, color `#60a5fa`.
   - Bottom Fill Point Light: Position `[0, -4, 2]`, intensity `0.7`, color `#06b6d4` (cyan).
4. **Physiological Cardiac Cycle Animation:** Implements a dual-phase non-linear cardiac pulse equation inside `useFrame`:
   - Resting Rate: $72\text{ BPM} \implies \text{Period } T = \frac{60}{72} \approx 0.833\text{ seconds}$.
   - Phase 1 (Ventricular Systole / S1 "lub"): $0 \le p < 0.18$, sinusoidal scale expansion.
   - Phase 2 (Dicrotic Notch / Atrial Kick / S2 "dub"): $0.22 \le p < 0.36$, secondary dampened peak ($0.42 \times \sin$).
   - Phase 3 (Diastolic Relaxation & Rest): $p \ge 0.36$, resting baseline.
   - Scaling: Baseline scale $1.42$, dynamic expansion $+3.8\%$ radial, $+4.6\%$ vertical.
   - Natural Drifting: Subtle harmonic rotations on Y ($0.35\text{ rad/s}$), X ($0.25\text{ rad/s}$), and Z ($0.30\text{ rad/s}$).
5. **Camera & Interaction Controls:**
   - Perspective Camera: Position `[0, 0, 5.8]`, field of view $46^\circ$.
   - OrbitControls: Bounded distance ($3.5$ to $8.5$), damping factor $0.06$, rotation enabled, pan disabled.
   - Accessibility: Full `prefers-reduced-motion` integration (disables pulse scaling, float motion, and auto-rotation).

### 2.3 Integration Gap: Landing Page vs. Workspace
- **Landing Page Integration:** `HeroSection.tsx` mounts `HeartCanvas` inside a luminous frosted container (`backdrop-blur-2xl`) overlaid with `ScanningFrame.tsx` (medical HUD brackets, live cycle status, and simulation notices).
- **Assessment Workspace Gap:** In `frontend/src/components/PredictionResultsView.tsx`, model outputs are currently rendered **strictly as 2D cards** (Cath, LAD, LCX, RCA) with progress bars and tabular provenance disclosures. **`HeartCanvas` is NOT yet mounted or integrated into the patient assessment results workspace.**
- **Architectural Consequence:** When a clinician or user completes a 5-step assessment, the 3D heart is completely absent from the results screen. The core value proposition of CardioVision AI — visually connecting machine-learning coronary risk to 3D cardiac anatomy — remains disconnected in the active workspace.

---

## 3. Actual Backend Prediction-Response Contracts

### 3.1 Endpoint Specifications
The FastAPI inference backend (`backend/app.py`) exposes the following endpoints relevant to visualization:

| Endpoint | Method | Input Schema | Response Schema | Description |
| :--- | :---: | :--- | :--- | :--- |
| `/predict` | `POST` | `PatientInput` | `PredictionResponse` | Single patient multi-target CAD inference |
| `/predict/batch` | `POST` | `BatchPredictionRequest` | `BatchPredictionResponse` | Bounded batch inference ($\le 100$ records) |
| `/health` | `GET` | None | `HealthResponse` | Model manager readiness and loaded flags |
| `/metadata` | `GET` | None | `MetadataResponse` | Feature schemas, targets, and disclaimer |

### 3.2 Canonical Prediction Response Structure
When `POST /predict` is invoked with a valid 54-feature payload, the backend returns:

```json
{
  "predictions": {
    "Cath": {
      "target": "Cath",
      "predicted_class": 1,
      "predicted_label": "CAD",
      "probability": 0.842
    },
    "LAD": {
      "target": "LAD",
      "predicted_class": 1,
      "predicted_label": "Stenotic",
      "probability": 0.731
    },
    "LCX": {
      "target": "LCX",
      "predicted_class": 0,
      "predicted_label": "Normal",
      "probability": 0.284
    },
    "RCA": {
      "target": "RCA",
      "predicted_class": 0,
      "predicted_label": "Normal",
      "probability": 0.315
    }
  },
  "disclaimer": "CardioVision AI is an educational and research prototype. Model outputs represent statistical risk estimations and must not be used as clinical diagnostic decisions."
}
```

### 3.3 Target Definitions & Clinical Semantics
Grounded in `backend/schemas.py`, `ml/transformers.py`, and `frontend/src/api/presentationUtils.ts`:

1. **`Cath` (Angiographic CAD Outcome):**
   - **Clinical Criterion:** Invasive coronary angiography confirming significant obstructive CAD ($\ge 50\%$ diameter stenosis in at least one major coronary artery).
   - **Anatomical Meaning:** Global coronary arterial tree status. It is **NOT** an individual artery segment!
   - **Labels:** Class `1` = `"CAD"`, Class `0` = `"Normal"`.
2. **`LAD` (Left Anterior Descending Artery):**
   - **Clinical Criterion:** Significant luminal diameter reduction ($\ge 50\%$) on angiography.
   - **Anatomical Territory:** Anterior interventricular sulcus supplying the anterior left ventricular free wall and anterior 2/3 of the interventricular septum.
   - **Labels:** Class `1` = `"Stenotic"`, Class `0` = `"Normal"`.
3. **`LCX` (Left Circumflex Artery):**
   - **Clinical Criterion:** Significant luminal diameter reduction ($\ge 50\%$) on angiography.
   - **Anatomical Territory:** Left atrioventricular groove supplying the lateral and posterolateral left ventricular free wall.
   - **Labels:** Class `1` = `"Stenotic"`, Class `0` = `"Normal"`.
4. **`RCA` (Right Coronary Artery):**
   - **Clinical Criterion:** Significant luminal diameter reduction ($\ge 50\%$) on angiography.
   - **Anatomical Territory:** Right atrioventricular sulcus supplying the right ventricle, inferior wall, and posterior 1/3 of the interventricular septum.
   - **Labels:** Class `1` = `"Stenotic"`, Class `0` = `"Normal"`.

### 3.4 Runtime Error, Degraded & Loading States
- **HTTP 422 Unprocessable Entity:** Payload violates Pydantic constraints (e.g. out-of-range blood pressure, missing features, unexpected extra fields). The client receives an array of field errors.
- **HTTP 503 Service Unavailable:** Backend models not initialized or failed to load. Handled via `ApiError` with type `'unavailable'`.
- **Network / Timeout Failure:** Frontend client (`frontend/src/api/client.ts`) enforces an 8,000ms `AbortController` timeout.
- **Client State Handling:** `PatientAssessmentModal.tsx` and `PatientProfileWizard.tsx` maintain strict state machine transitions (`idle` $\to$ `submitting` $\to$ `success` / `error`). On API error, `predictions` is set to `null` to guarantee stale predictions are never rendered.

---

## 4. Current Anatomy Assets and Geometry Capabilities

### 4.1 Asset Inventory & Metadata
The repository contains exactly one 3D asset file:
- **File Path:** `frontend/public/models/heart.glb`
- **File Size on Disk:** `7,555,476` bytes (~7.21 MB).
- **Format:** Binary glTF 2.0 (GLB container).
- **Embedded Metadata (Extracted from GLB JSON chunk):**
  - **Asset Title:** `"Realistic Human Heart"`
  - **Author:** `neshallads` (`https://sketchfab.com/neshallads`)
  - **Source URL:** `https://sketchfab.com/3d-models/realistic-human-heart-3f8072336ce94d18b3d0d055a1ece089`
  - **License:** `CC-BY-4.0` (Creative Commons Attribution 4.0 International)
  - **Generator Tooling:** ZBrush $\to$ FBX exporter $\to$ Sketchfab 14.10.0 pipeline.

### 4.2 Detailed Geometric Structure (Empirical Inspection)
An automated binary inspection of `heart.glb` revealed the exact scene graph:
```
Scene Graph Hierarchy:
Node 0: Sketchfab_model (mesh: none, children: [1])
  └── Node 1: 657c3bff23dc4b9b8f508b0d10bcd0c1.fbx (mesh: none, children: [2])
        └── Node 2: RootNode (mesh: none, children: [3])
              └── Node 3: hart:ZBrush_defualt_group (mesh: none, children: [4])
                    └── Node 4: hart:ZBrush_defualt_group_Heart Tex_0 (mesh: 0, children: [])

Mesh Catalog:
- Mesh 0: "hart:ZBrush_defualt_group_Heart Tex_0" (Exactly 1 primitive)

Material Catalog:
- Material 0: "Heart_Tex" (Standard PBR with diffuse, roughness, and normal maps)
```

### 4.3 Key Geometric Limitations & Capabilities
1. **Monolithic Single-Mesh Design:** The entire heart — including the myocardium, ventricles, atria, ascending aorta, pulmonary artery, and surface sulci — is unified into a **single contiguous mesh with a single material**.
2. **Absence of Discrete Artery Meshes:** There are **zero separate mesh primitives or nodes** for the coronary arteries (`LAD`, `LCX`, `RCA`).
3. **No Vertex Groups or Morph Targets:** The glTF model does not expose sub-mesh vertex groups or morph target channels for independent vascular animation or highlighting.
4. **Critical Architectural Conclusion:**
   - Any attempt to color an individual artery by traversing `scene.traverse()` and modifying `mesh.material.color` will color the **entire heart**, not the specific artery.
   - Dynamic arterial risk visualization **cannot** be accomplished solely by shader parameter changes on `heart.glb` without adding dedicated vascular geometry (either parametric 3D curves/tubes overlaid on the model, or an anatomically segmented replacement asset).

---

## 5. Relevant GitHub Repositories and Open-Source References

An exhaustive audit of public repositories, clinical 3D visualization frameworks, and biomedical repositories was performed to identify proven technical patterns and assets.

### 5.1 Anatomical & Cardiovascular 3D References

#### Reference 1: `karansuraj/pvc-heart-tool`
- **Repository URL:** [https://github.com/karansuraj/pvc-heart-tool](https://github.com/karansuraj/pvc-heart-tool)
- **Primary Domain:** Electrophysiology educational viewer for Premature Ventricular Contraction (PVC) localization and ECG correlation.
- **Technical Architecture:** Built with React, TypeScript, Three.js, and **React Three Fiber**.
- **Key Techniques:**
  - Uses Draco-compressed GLTF heart models to optimize network payloads and memory usage.
  - Implements 3D anatomical "hotspot" spatial markers mapped to ventricular anatomical coordinates.
  - Provides bounded `OrbitControls` with smooth camera focus transitions to specific cardiac walls (anterior, lateral, inferior).
- **Application to CardioVision AI:** Serves as a validated blueprint for organizing camera controls, performance optimizations, and interactive anatomical callouts in React Three Fiber.
- **License & Attribution:** MIT License. Suitable for direct adaptation of camera and R3F control patterns.

#### Reference 2: `simonreisinger/Interactive-3D-Human-Heart-Visualization`
- **Repository URL:** [https://github.com/simonreisinger/Interactive-3D-Human-Heart-Visualization](https://github.com/simonreisinger/Interactive-3D-Human-Heart-Visualization)
- **Primary Domain:** Interactive educational WebGL heart anatomy explorer.
- **Technical Architecture:** Three.js, WebGL, BodyParts3D dataset integration.
- **Key Techniques:**
  - Segmented anatomical mesh hierarchy allowing individual selection and isolation of coronary arteries (LAD, LCX, RCA) and veins.
  - Three.js `Raycaster` mouse picking that detects clicked anatomical structures, applies highlighting shaders, and presents educational contextual cards.
  - Visibility toggles allowing peeling back ventricular myocardium to inspect deep coronary sulci.
- **Application to CardioVision AI:** Demonstrates how mouse hover/click interactions should map to coronary arteries and clinical detail cards.
- **License & Attribution:** MIT License for application code; 3D models derived from BodyParts3D (CC BY-SA 2.1 Japan).

#### Reference 3: `Database Center for Life Science (DBCLS) - BodyParts3D / Anatomography`
- **Portal URL:** [https://lifesciencedb.jp/bp3d/](https://lifesciencedb.jp/bp3d/)
- **Primary Domain:** Open-access biomedical anatomical dictionary developed by the University of Tokyo and DBCLS.
- **Key Data Assets:** Provides segmented 3D polygon meshes for all human anatomical structures, specifically:
  - `BP1311`: Right Coronary Artery (RCA) and branches.
  - `BP9874`: Anterior Interventricular Branch of Left Coronary Artery (LAD).
  - `BP9875`: Circumflex Branch of Left Coronary Artery (LCX).
  - `BP2024`: Myocardium / Ventricles.
- **Application to CardioVision AI:** The canonical open-access source if CardioVision AI requires pre-segmented coronary artery mesh geometries with precise clinical nomenclature.
- **License & Attribution:** Creative Commons Attribution-ShareAlike 2.1 Japan (CC BY-SA 2.1 JP). Requires visible clinical attribution if 3D geometry is utilized.

#### Reference 4: `NIH 3D Print Exchange / NIH 3D Portal`
- **Portal URL:** [https://3d.nih.gov/](https://3d.nih.gov/)
- **Primary Domain:** Biomedical 3D asset repository hosted by the National Institutes of Health (NIH).
- **Key Data Assets:** Features CT angiography-derived cardiac datasets, including whole-heart models with segmented coronary trees (e.g., Models `3DPX-000781`, `3DPX-010531`).
- **Application to CardioVision AI:** Public-domain clinical scans converted into STL/OBJ/GLTF formats that can be imported without commercial or educational licensing hurdles.
- **License & Attribution:** Public Domain / CC0 (US Government Works).

### 5.2 Rendering, Shaders & Component Tooling References

#### Reference 5: `pmndrs/drei` (React Three Fiber Helper Suite)
- **Repository URL:** [https://github.com/pmndrs/drei](https://github.com/pmndrs/drei)
- **Installed Status:** Already installed in the project (`@react-three/drei` `v10.7.9`).
- **Relevant Submodules & Primitives:**
  - `<Tube>` and `<CatmullRomCurve3>`: Allows procedural generation of smooth 3D vascular tubes directly in JSX from an array of 3D control points.
  - `<Line>` (from `three-stdlib`): Lightweight anti-aliased fat lines for arterial centerlines and pulsing lumen waves.
  - `<Html>`: High-performance HTML annotations projected directly over 3D coordinates, with occlusion testing and screen-space responsiveness.
  - `<Center>` & `<Float>`: Controlled presentation framing.
- **Application to CardioVision AI:** Eliminates the need to download or install external packages. All required procedural vascular rendering and interactive tagging primitives already exist within the installed dependencies.
- **License:** MIT License.

#### Reference 6: `FNNDSC/ami` (AMI Medical Imaging JavaScript Toolkit)
- **Repository URL:** [https://github.com/FNNDSC/ami](https://github.com/FNNDSC/ami)
- **Primary Domain:** Specialized medical imaging framework natively extending Three.js.
- **Key Techniques:** Continuous colormap LUT (Look-Up Table) shaders mapping scalar values to normalized clinical color spectrums (e.g. green $\to$ yellow $\to$ red) with high perceptual uniformity.
- **Application to CardioVision AI:** Provides the mathematical basis for smoothly interpolating posterior stenosis probability values ($0.0 \le p \le 1.0$) into accessible color gradients.
- **License:** Apache 2.0. Suitable for algorithmic inspiration.

---

## 6. Comparison of Possible Implementation Approaches

To bridge the gap between model predictions and 3D visualization, three distinct architectural approaches were evaluated:

| Criterion | Approach A: Parametric 3D Tubes on `heart.glb` | Approach B: Pre-Segmented Multi-Mesh GLTF | Approach C: Synchronized Dual 3D + 2D SVG View |
| :--- | :--- | :--- | :--- |
| **Architectural Concept** | Procedural 3D spline curves (`CatmullRomCurve3` + `TubeGeometry`) rendered over the anatomical sulci of existing `heart.glb`. | Replace/augment `heart.glb` with a multi-mesh asset (BodyParts3D) with named nodes (`Artery_LAD`, `Artery_LCX`, `Artery_RCA`). | Retain `heart.glb` for whole-heart pulsing; pair with an adjacent interactive 2D coronary arterial tree diagram. |
| **New Dependencies** | **Zero** (uses `@react-three/drei` already installed). | Zero (uses Three.js/R3F). | Zero (uses React SVG / Lucide). |
| **New 3D Assets on Disk** | **Zero** (preserves existing 7.2 MB `heart.glb`). | Requires importing new $\sim 4\text{--}8\text{ MB}$ GLTF asset. | Zero. |
| **Coronary Highlight Precision** | **High**: Glowing 3D vascular branches overlaid directly along anterior and atrioventricular sulci. | **Very High**: Exact polygonal boundary of each arterial wall. | **High (2D)**: Schematic branch coloring, but detached from the 3D heart body. |
| **Hover & Click Raycasting** | Native R3F `onPointerOver` / `onClick` on `<mesh>` tube instances. | Native R3F `onClick` on named submesh primitives. | Standard DOM SVG click/hover handlers. |
| **Mobile & GPU Performance** | Lightweight ($< 3$ additional draw calls, low vertex overhead). | Moderate (depends on mesh decimation and Draco compression). | Maximum performance (standard 2D SVG vector rendering). |
| **Implementation Complexity** | **Low to Moderate**: Defining 6–10 spatial control points per artery to trace heart sulci. | **High**: Authoring, cleaning, decimation, and texturing in Blender prior to import. | **Low**: Standard SVG diagram and React state binding. |
| **Risk of Visual Artifacts** | Z-fighting if tubes intersect heart surface (mitigated by slight radial offset $+0.05$). | Texture misalignment if anatomical parts are textured inconsistently. | Minimal. |
| **Scientific Integrity** | Clear: Procedural highlight represents statistical branch territory, not patient anatomy. | Higher risk of clinicians assuming the mesh depicts the patient's individual CT scan. | Clear: Diagrammatic presentation reinforces statistical nature of predictions. |

### Strategic Recommendation
**Approach A (Parametric 3D Vascular Curves Overlaid on Existing `heart.glb`) supplemented with Approach C as an accessible fallback** is the optimal path for CardioVision AI.
- It preserves the existing 3D realistic heart asset without adding multi-megabyte files or new dependencies.
- It leverages the existing R3F and Drei tools already installed in `frontend/package.json`.
- It cleanly decouples statistical risk coloring from organic cardiac tissue textures, ensuring the whole heart remains photorealistic while the coronary paths pulse with predictive intelligence.

---

## 7. Proposed Anatomy-to-Prediction Visual Mapping

### 7.1 Clinical Integrity Rules & Non-Negotiable Distinctions
To protect patient safety and prevent misleading visualization:
1. **No Fabricated Focal Lesions:** Tabular Random Forest models predict the *statistical probability of $\ge 50\%$ diameter stenosis* in major arterial territories. The model does **NOT** predict the longitudinal millimeter coordinate, calcium score, plaque vulnerability, or geometric narrowing shape. The system must **never** render a simulated focal "blockage pinching point" or simulated plaque clot at an arbitrary coordinate.
2. **Territorial Path Highlighting:** Arterial branches must be visualized as *continuous vascular paths* illuminating their entire anatomical territory, accompanied by an explicit clinical disclaimer.
3. **Primary Cath Segregation:** `Cath` represents global obstructive CAD across the entire coronary tree ($\ge 50\%$ in $\ge 1$ vessel). It is an overall outcome, **not an individual artery**. `Cath` must **never** be mapped to a specific vessel.

### 7.2 Safe Visual Encoding Matrix

| Model Target | Anatomical Structure & Sulcus | Perfusion Territory | Normal ($p < 0.35$) | Borderline ($0.35 \le p < 0.50$) | Stenotic ($p \ge 0.50$) | Degraded / Unavailable |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`Cath`** | Global Coronary Arterial Circulation | Whole myocardium perfusion | Cool Cyan / Emerald halo around 3D heart stage (`#06b6d4`) | Warm Amber diagnostic halo (`#f59e0b`) | Luminous Rose / Coral warning halo (`#f43f5e`) | Neutral Slate border (`#94a3b8`) |
| **`LAD`** | Left Anterior Descending Artery (Anterior Interventricular Sulcus) | Anterior LV wall, anterior 2/3 of interventricular septum, cardiac apex | Emerald/Teal luminous tube (`#10b981`), steady calm flow | Amber tube (`#f59e0b`), moderate pulse rate | Intense Coral tube (`#f43f5e`), active high-frequency warning pulse | Translucent Neutral Slate tube (`#94a3b8`, 30% opacity) |
| **`LCX`** | Left Circumflex Artery (Left Atrioventricular Groove) | Lateral & posterolateral LV free wall | Emerald/Teal luminous tube (`#10b981`), steady calm flow | Amber tube (`#f59e0b`), moderate pulse rate | Intense Coral tube (`#f43f5e`), active high-frequency warning pulse | Translucent Neutral Slate tube (`#94a3b8`, 30% opacity) |
| **`RCA`** | Right Coronary Artery (Right Atrioventricular Sulcus) | Right ventricle, inferior LV wall, posterior 1/3 of septum | Emerald/Teal luminous tube (`#10b981`), steady calm flow | Amber tube (`#f59e0b`), moderate pulse rate | Intense Coral tube (`#f43f5e`), active high-frequency warning pulse | Translucent Neutral Slate tube (`#94a3b8`, 30% opacity) |

### 7.3 Accessible Color Palette (Apple Health Minimal Alignment)
The color mapping is calibrated to avoid reliance on green-red hue discrimination alone (supporting deuteranopia and protanopia color-blindness):
- **Normal / Low Risk ($p < 35\%$):** `#10b981` (Emerald) + checkmark icon + `"Normal (Low Risk)"` badge.
- **Borderline / Intermediate ($35\% \le p < 50\%$):** `#f59e0b` (Amber) + triangle alert icon + `"Borderline Risk"` badge.
- **Stenotic / High Risk ($p \ge 50\%$):** `#f43f5e` (Rose Coral) + shield warning icon + `"Stenotic (High Risk)"` badge.
- **Dual Visual Encoding:** Every risk state combines color, pulse frequency, percentage text, and an explicit category label.

### 7.4 Interactive Inspection & Camera Waypoints
When the user clicks or hovers over a vascular branch or a target card in `PredictionResultsView.tsx`:
1. **Interactive Hover Tooltip:** A Drei `<Html distanceFactor={10}>` annotation appears over the artery anchor displaying:
   - Target name (e.g. `LAD: Left Anterior Descending`).
   - Posterior probability percentage (e.g. `73.1%`).
   - Binary classification decision (e.g. `Stenotic (Class 1)`).
   - Clinical criterion (e.g. `≥50% diameter reduction`).
2. **Camera Pivot Waypoints:**
   - Default view: Position `[0, 0, 5.8]` (Anterior whole-heart overview).
   - LAD Focus: Position `[0.8, -0.4, 4.6]` (Angled anterior-apical view).
   - LCX Focus: Position `[-3.8, 0.6, 3.2]` (Left lateral-posterior view).
   - RCA Focus: Position `[3.6, -0.5, 3.4]` (Right lateral-inferior view).

---

## 8. Minimal Implementation Plan with Ordered Steps

The implementation for Phase 3B must be strictly staged into five incremental, testable steps:

### Step 1: Create Dedicated 3D Assessment Canvas (`CoronaryResultsCanvas.tsx`)
- Build a dedicated, isolated R3F canvas component in `frontend/src/components/CoronaryResultsCanvas.tsx`.
- Reuse existing lighting rig, `heart.glb` loading logic, and camera bounds from `HeartCanvas.tsx`.
- Accept `predictions: Record<TargetName, TargetPrediction> | null` as typed props.
- Add WebGL `ErrorBoundary` and loading spinner fallback.

### Step 2: Implement Parametric Vascular Curves (LAD, LCX, RCA)
- Define 3 parametric cubic Bézier / Catmull-Rom spline curves mapped along the anatomical surface coordinates of `heart.glb`:
  - `LADCurve`: Tracing from the aortic root down the anterior interventricular sulcus to the apex.
  - `LCXCurve`: Branching from the left main root around the left AV groove to the obtuse margin.
  - `RCACurve`: Tracing from the right coronary sinus down the right AV groove to the posterior descending branch.
- Render each curve using `@react-three/drei` `<Tube>` or `THREE.TubeGeometry` with smooth mesh capping and a customizable radius ($r \approx 0.035$).

### Step 3: Wire Reactive Probability Shaders & Materials
- Create a lightweight custom shader or `MeshStandardMaterial` for the vascular tubes.
- Dynamically bind `predictions[target].probability` to:
  - Base emissive color (`#10b981` $\to$ `#f59e0b` $\to$ `#f43f5e`).
  - Emissive intensity (calibrated glow matching risk severity).
  - Pulse frequency synchronized with the cardiac cycle.
- Bind `predictions['Cath']` to the stage environment halo and status badge.

### Step 4: Implement Interactive Raycasting, Annotations & Camera Controls
- Attach R3F `onPointerOver`, `onPointerOut`, and `onClick` handlers to each arterial tube.
- Integrate floating Drei `<Html>` annotations anchored to the midpoint of each vessel.
- Implement camera transition interpolation (using standard lerp in `useFrame`) when a specific artery is selected from the UI or canvas.

### Step 5: Mount 3D Visualizer into `PredictionResultsView.tsx` with Disclaimers
- Embed `CoronaryResultsCanvas` into `frontend/src/components/PredictionResultsView.tsx` within an Apple Health Minimal responsive layout:
  - Desktop: Side-by-side or stacked prominent 3D interactive stage above the 4 target cards.
  - Mobile: Clean responsive aspect-ratio card with touch controls.
- Add toggle controls: "Rotate 3D", "Reset Camera", "Anterior", "Lateral", "Posterior".
- Add prominent scientific disclaimer card below the canvas:
  > *"Educational & Research Prototype: Predictions represent statistical population probabilities based on tabular clinical measurements (Tehran Heart Center Cohort N=303). This 3D visualization illustrates arterial branch territories and does not depict patient-specific CT imaging or localized plaque morphology."*

---

## 9. Performance, Accessibility, Scientific Integrity & Failure-State Considerations

### 9.1 Performance & Hardware Constraints
CardioVision AI is intended to run smoothly on standard student laptops and mid-range devices without dedicated GPUs:
- **Pixel Ratio Capping:** Enforce `dpr={[1, Math.min(window.devicePixelRatio, 1.5)]}` in `Canvas` configuration to prevent GPU fill-rate exhaustion on 4K/Retina displays.
- **On-Demand Rendering Optimization:** When auto-rotation is paused and user interaction ceases, transition `frameloop` from `"always"` to `"demand"` to drop GPU utilization to 0%.
- **No Heavy Post-Processing:** Avoid expensive full-screen bloom passes (`EffectComposer` / UnrealBloom); achieve high-contrast luminous vascular effects using Three.js native `MeshStandardMaterial` emissive properties and point lights.
- **Draw Call Discipline:** The entire 3D results scene requires fewer than 10 draw calls (1 heart mesh + 3 vascular tubes + lighting).

### 9.2 Accessibility & Universal Design
- **Motion Sensitivity (`prefers-reduced-motion`):** Automatically detects OS-level reduced motion preferences. When enabled, freezes heart pulsing, halts camera auto-drifting, and sets static vascular glows.
- **Keyboard Navigation:** Every selectable artery in the 3D stage is paired with keyboard-focusable buttons (`Tab` navigation) that trigger identical camera focus and data card expansions.
- **Screen Reader Support:** Full ARIA tree with `aria-live="polite"` announcing probability updates, and tabular data disclosures for non-visual exploration.
- **Color Contrast:** All typography exceeds WCAG AAA standards ($> 7:1$ contrast ratio) against white and slate backgrounds.

### 9.3 Scientific Integrity & Diagnostic Disclaimers
- **Strict Prohibition on Fabricated Data:** Zero mock prediction values or simulated plaque geometries. The 3D stage only renders if valid backend inference data is returned.
- **Explicit Scope Communication:** Clear separation between:
  1. *Statistical Model Probability* (posterior random forest score).
  2. *Decision Threshold Label* (standard $\ge 50\%$ cutoff).
  3. *Invasive Catheterization Truth* (definitive angiographic diagnosis).

### 9.4 Failure and Degraded States
- **WebGL Context Loss:** If the browser drops the WebGL context (e.g. system memory pressure), the `ErrorBoundary` displays a clean Apple Health-style notice with a "Reload 3D View" button while the 2D results cards remain 100% interactive.
- **Missing or Partial Predictions:** If a target is missing from the API response, its corresponding artery tube renders in neutral translucent slate with a `"Data Unavailable"` tooltip.
- **Backend API Timeout / 503:** The wizard displays an inline error alert banner with retry functionality; no empty or partially initialized 3D model is displayed.

---

## 10. Risks, Unknowns, and Decisions Requiring Human Approval

### 10.1 Key Engineering Risks
1. **Spline Alignment Calibration (Approach A):** Calibrating the 3D Catmull-Rom spline control points to match the exact organic surface contours of `heart.glb` requires careful spatial coordinates. If vertices clip inside the heart wall, tubes will be partially obscured. *Mitigation:* Apply a tiny normal offset ($+0.04$ to $+0.06$ units) along the surface normal.
2. **React 19 / R3F 9.8 Compatibility:** The project runs React `19.2.8` with `@react-three/fiber` `9.8.1`. Any new dependencies could trigger peer dependency conflicts. *Mitigation:* Strictly use already installed packages (`three`, `@react-three/fiber`, `@react-three/drei`).
3. **Workspace Visual Density:** Adding a 3D canvas into `PredictionResultsView.tsx` could make the results page feel crowded if not properly proportioned. *Mitigation:* Employ Apple Health Minimal layout principles with generous whitespace, rounded container cards, and collapsible view controls.

### 10.2 Decisions Requiring Human Approval Before Phase 3B
1. **Visualizer Placement Decision:** Should the 3D cardiovascular visualizer be:
   - *Option 1 (Recommended):* Integrated directly into `PredictionResultsView.tsx` in a side-by-side or stacked card above the target cards?
   - *Option 2:* Rendered inside a dedicated expandable modal/drawer ("Inspect 3D Coronary Anatomy")?
2. **Artery Representation Approach:** Confirm human approval for **Approach A** (parametric 3D tubes overlaid on `heart.glb`) vs. sourcing an external segmented mesh asset (Approach B).
3. **Interactive Camera Motion:** Confirm whether users should have unrestricted 360-degree `OrbitControls` rotation, or guided view buttons ("Anterior", "Left Lateral", "Right Posterior") with restricted pitch/roll to prevent disorientation.

---

## 11. Separation of Verified Facts, Recommendations, and Unresolved Questions

### 11.1 Verified Empirical Facts
- `heart.glb` is a monolithic single-mesh asset (1 primitive, 1 material, CC-BY-4.0 by `neshallads`). It contains **no individual submeshes** for LAD, LCX, or RCA.
- The backend `/predict` endpoint returns predictions for exactly 4 targets: `Cath` (global CAD outcome), `LAD`, `LCX`, and `RCA`.
- In the active frontend, `HeartCanvas.tsx` is implemented with an anatomical 72 BPM pulse equation and mounted in `HeroSection.tsx`, but is **completely absent from `PredictionResultsView.tsx`**.
- The frontend has Three.js `0.186.1`, `@react-three/fiber` `9.8.1`, and `@react-three/drei` `10.7.9` already installed; all required parametric curve and tube primitives are available with zero new packages.

### 11.2 Architectural Recommendations
- Implement **Approach A**: Overlay parametric 3D vascular curves (`CatmullRomCurve3` + `<Tube>`) directly along the anatomical sulci of `heart.glb`.
- Map `Cath` to a global cardiac state halo / perfusion badge; map `LAD`, `LCX`, and `RCA` to their respective arterial branches.
- Use an accessible diverging/sequential color scale (`#10b981` normal, `#f59e0b` borderline, `#f43f5e` stenotic) paired with text labels and percentages.
- Cap rendering pixel ratio to $\le 1.5$ and implement on-demand rendering when idle for student laptop performance.
- Include mandatory clinical disclaimers clarifying that the visualizer illustrates statistical branch risk, not patient-specific lesion geometry.

### 11.3 Unresolved Questions for User Alignment
- Confirm human preference regarding layout positioning of the 3D stage within `PredictionResultsView.tsx` (top full-width container vs. split two-column layout).
- Confirm whether camera controls should provide guided anatomical preset buttons in addition to standard touch/mouse orbit controls.

---

**AUDIT CONCLUSION:** Phase 3A architecture audit and reference research is complete. All findings are empirically verified from the codebase and assets. **No code modifications or implementations have been executed. Awaiting explicit user approval before proceeding to Phase 3B.**
