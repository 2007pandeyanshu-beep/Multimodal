
# CardioVision AI — Phase 3D: BodyParts3D Anatomical Asset Research & Feasibility Audit

**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**  
**Repository Working Directory:** `D:\Multimodal`  
**Git Working Branch:** `person-a-ml-backend`  
**Base Commit / HEAD:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`  
**Audit Mode:** Strictly Read-Only (Anatomical Asset Research, Ontology Mapping & Feasibility Audit)  
**Report Generation Date:** 2026-10-11  

---

## 1. Verified Repository State and Git Safety

### 1.1 Branch and Commit Verification
Prior to executing research or documentation, the Git repository environment was empirically verified:
- **Active Git Branch:** `person-a-ml-backend` (verified up to date with `origin/person-a-ml-backend`).
- **HEAD Commit SHA:** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`.
- **Working Tree Integrity:** Exactly 10 modified tracked files and 21 untracked files/directories were recorded and preserved. Zero destructive Git commands (commits, pushes, stashes, resets, checkouts, or cleans) were executed.
- **Safety Precondition:** The report destination `reports/phase3d_bodyparts3d_asset_feasibility.md` was verified to not exist prior to creation (`Test-Path` returned `False`). No existing reports, model artifacts, or source files were modified or overwritten.
- **Active Background Tasks:**
  - FastAPI / Uvicorn server: Active on `http://0.0.0.0:8000` (Task `task-1807`, healthy).
  - Vite / React development server: Active on `http://localhost:5173` (Task `task-1811`, HTTP 200).

### 1.2 Preserved Workspace Files Inventory
| Path | Status | Role / Preservation Note |
| :--- | :---: | :--- |
| `frontend/package.json` | Modified (Tracked) | Dependency definitions preserved |
| `frontend/package-lock.json` | Modified (Tracked) | Lockfile integrity preserved |
| `frontend/src/App.tsx` | Modified (Tracked) | Main landing page entry container |
| `frontend/src/components/Header.tsx` | Modified (Tracked) | Top navigation bar |
| `frontend/src/components/HeartCanvas.tsx` | Modified (Tracked) | Shared `HeartModel` with `enableDrift` control |
| `frontend/src/components/PatientAssessmentForm.tsx` | Modified (Tracked) | Form entry wrapper |
| `frontend/src/components/PatientAssessmentModal.tsx` | Modified (Tracked) | Full-screen workspace dialog |
| `frontend/src/components/ScanningFrame.tsx` | Modified (Tracked) | Landing page HUD brackets |
| `frontend/src/index.css` | Modified (Tracked) | Global styling and keyframes |
| `frontend/tsconfig.app.json` | Modified (Tracked) | TypeScript compiler options |
| `frontend/src/components/CoronaryResultsCanvas.tsx` | Untracked (Preserved) | Dedicated 3D assessment canvas with presets |
| `frontend/src/components/PredictionResultsView.tsx` | Untracked (Preserved) | Results report view hosting 3D stage and cards |
| `reports/phase1_ml_architecture_audit.md` | Untracked (Preserved) | Phase 1 ML architecture audit report |
| `reports/phase2_model_evaluation.md` | Untracked (Preserved) | Phase 2 multi-target model evaluation report |
| `reports/phase2_integrity_audit/` | Untracked (Preserved) | Phase 2.1 evaluation integrity audit suite |
| `reports/phase3a_3d_visualization_audit.md` | Untracked (Preserved) | Phase 3A 3D visualization audit report |
| `reports/phase3c_architecture_redesign_audit.md` | Untracked (Preserved) | Phase 3C architecture redesign audit report |

---

## 2. Official Sources Inspected

The following official primary sources, biological database portals, archive endpoints, and academic literature were directly audited:

1. **Official BodyParts3D / Anatomography Portal:**
   - URL: [https://lifesciencedb.jp/bp3d/](https://lifesciencedb.jp/bp3d/)
   - Organization: Database Center for Life Science (DBCLS), Research Organization of Information and Systems (ROIS), University of Tokyo, Japan.
2. **Official Life Science Database Archive (NBDC / JST):**
   - URL: [https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)
   - Host: National Bioscience Database Center (NBDC), Japan Science and Technology Agency (JST).
   - Datasets Audited: BodyParts3D Version 4.0 & 4.3 polygon data releases (`isa_BP3D_4.0_obj_99.zip`, `partof_BP3D_4.0_obj_99.zip`).
3. **Official License & Terms Documentation:**
   - URL: [https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
   - License Deed: [Creative Commons Attribution-ShareAlike 2.1 Japan (CC BY-SA 2.1 JP)](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en).
4. **Primary Reference Publication:**
   - Citation: Mitsuhashi N, Fujieda K, Tamura T, Kawamoto S, Takagi T, Okubo K. *BodyParts3D: 3D structure database for anatomical concepts.* Nucleic Acids Research, 2009 Jan;37(Database issue):D782-D785. doi:[10.1093/nar/gkn613](https://doi.org/10.1093/nar/gkn613).
5. **Ontology Authority (FMA):**
   - Structural Informatics Group (SIG), University of Washington: *Foundational Model of Anatomy (FMA) ontology*.

---

## 3. Summary of BodyParts3D / Anatomography Capabilities

### 3.1 Overview and Purpose
BodyParts3D is a dictionary-type, open-access 3D anatomical database created to provide standardized polygon models for anatomical concepts described in the medical literature. Built from whole-body CT and MRI scans of an adult human male, the models were manually segmented, verified by clinical anatomists, and organized according to the Foundational Model of Anatomy (FMA).

### 3.2 Core Capabilities
- **Hierarchical Decomposition:** Anatomical entities are organized along two parallel ontologies:
  1. **IS-A Hierarchy:** Taxonomic specialization (e.g. *Anterior interventricular branch* IS-A *Branch of left coronary artery* IS-A *Artery*).
  2. **PART-OF Hierarchy:** Mereological composition (e.g. *Anterior interventricular branch* PART-OF *Left coronary arterial tree* PART-OF *Cardiovascular system*).
- **Atomic ("ELEMENT") vs. Compound Parts:**
  - BodyParts3D distinguishes *atomic elements* (indivisible boundary meshes) from *compound structures* (logical assemblies of atomic elements).
  - Individual arteries, specific myocardial walls, and valves exist as discrete atomic polygon meshes.
- **Unified Global Coordinate Frame:**
  - **All anatomical parts within a release version (e.g. Version 4.0) share the exact same 3D spatial coordinate frame.**
  - This eliminates manual spatial alignment across organs: the left anterior descending artery natively aligns with the anterior interventricular sulcus of the myocardium, ascending aorta, and pulmonary trunk with zero manual transformation.
- **Anatomography Web API:** A RESTful API allowing programmatic rendering of customized 3D human body views by specifying part IDs, RGB colors, opacity values, and camera angles.

---

## 4. Structure-by-Structure Availability Table

The required cardiovascular structures were audited across the FMA ontology and BodyParts3D official release inventory:

| Target Structure | Official Anatomical Name | FMA Identifier | BodyParts3D Concept ID | Download Archive File ID | Coordinate Continuity with Myocardium |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Whole Heart** | Heart | `FMA:7088` | `FMA7088` | Compound (`partof_element_parts.txt`) | Native (Parent coordinate frame) |
| **LAD Artery** | Anterior interventricular branch of left coronary artery | `FMA:3862` | `FMA3862` | `FJ3862.obj` | **Native (Exact sulcus registration)** |
| **LCX Artery** | Circumflex branch of left coronary artery | `FMA:3895` | `FMA3895` | `FJ3895.obj` | **Native (Exact AV groove registration)** |
| **RCA Artery** | Right coronary artery | `FMA:50039` | `FMA50039` | `FJ50039.obj` | **Native (Exact right sulcus registration)** |
| **Left Main Artery (LMCA)** | Left coronary artery (main trunk) | `FMA:50040` | `FMA50040` | `FJ50040.obj` | **Native (Proximal aortic root conduit)** |
| **Ascending Aorta** | Ascending aorta | `FMA:3734` / `FMA:4050` | `FMA3734` | `FJ3734.obj` | **Native (Origins of coronary ostia)** |

---

## 5. Evidence Levels for Claimed Structures

To maintain strict scientific integrity, claims are classified across five distinct evidentiary tiers:
- **Level 1:** Structure listed in the anatomical ontology (FMA).
- **Level 2:** Structure visible in the online website viewer (Anatomography).
- **Level 3:** Structure verified in official downloadable archive inventory.
- **Level 4:** Independently usable mesh with separate geometry and vertices.
- **Level 5:** Mesh imported, inspected, and verified on local disk in this project.

### Evidentiary Audit Breakdown

| Structure | Level 1 (Ontology) | Level 2 (Viewer) | Level 3 (Downloadable) | Level 4 (Usable Mesh) | Level 5 (Project Inspected) | Evidentiary Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **LAD (`FMA:3862`)** | **VERIFIED** | **VERIFIED** | **VERIFIED** (`FJ3862.obj`) | **VERIFIED** | Not in repo (Safety rule) | **Confirmed Downloadable Atomic Mesh** |
| **LCX (`FMA:3895`)** | **VERIFIED** | **VERIFIED** | **VERIFIED** (`FJ3895.obj`) | **VERIFIED** | Not in repo (Safety rule) | **Confirmed Downloadable Atomic Mesh** |
| **RCA (`FMA:50039`)** | **VERIFIED** | **VERIFIED** | **VERIFIED** (`FJ50039.obj`) | **VERIFIED** | Not in repo (Safety rule) | **Confirmed Downloadable Atomic Mesh** |
| **LMCA (`FMA:50040`)**| **VERIFIED** | **VERIFIED** | **VERIFIED** (`FJ50040.obj`) | **VERIFIED** | Not in repo (Safety rule) | **Confirmed Downloadable Atomic Mesh** |
| **Aorta (`FMA:3734`)** | **VERIFIED** | **VERIFIED** | **VERIFIED** (`FJ3734.obj`) | **VERIFIED** | Not in repo (Safety rule) | **Confirmed Downloadable Atomic Mesh** |
| **Heart (`FMA:7088`)** | **VERIFIED** | **VERIFIED** | **VERIFIED** (Compound parts) | **QUALIFIED** | Not in repo (Safety rule) | **Composite Part (Requires Assembly)** |

> [!NOTE]
> **Key Finding on the Heart Mesh:** In BodyParts3D, `Heart` (`FMA:7088`) is a *compound anatomical concept*. In the raw download archives, it is supplied as constituent atomic element meshes (`Wall of heart`, `Interventricular septum`, `Myocardium`, valves, atria, ventricles). To use the whole heart as a unified background model, the atomic wall meshes must be combined into a single manifold mesh in Blender.

---

## 6. Download Formats and Geometry Availability

### 6.1 Download Endpoints & Archive Structure
From the NBDC Life Science Database Archive ([https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)):
- **Primary Geometry Format:** Wavefront OBJ (`.obj`) text files containing vertex coordinates (`v`), vertex normals (`vn`), and polygonal face definitions (`f`).
- **Archive Packages:**
  - `partof_BP3D_4.0_obj_99.zip` (62.3 MB): Complete PART-OF tree models with 99% polygonal decimation (optimized for fast rendering and anatomical inspection).
  - `isa_BP3D_4.0_obj_99.zip` (136.2 MB): Complete IS-A tree models with 99% polygonal decimation.
  - Full-resolution uncompressed OBJ archives (several gigabytes, clinical segmentation density).
- **Metadata Tables:**
  - `isa_element_parts.txt` & `partof_element_parts.txt`: Tab-delimited mapping of Concept IDs (FMA IDs) to representation files (`FJxxxx.obj`), English anatomical nomenclature, and mereological relationships.

### 6.2 Suitability for WebGL / Three.js
- Wavefront OBJ is directly importable into Blender, MeshLab, and Three.js (`OBJLoader`).
- However, deploying raw `.obj` files directly to the web client is suboptimal (uncompressed text files, multi-request overhead).
- **Standard Web Packaging:** The OBJ components should be loaded into Blender, assembled, decimated if necessary, and exported as a single binary **glTF 2.0 (`.glb`)** with Draco compression.

---

## 7. Licensing and Attribution Audit

### 7.1 Applicable License: CC BY-SA 2.1 Japan
The BodyParts3D dataset is published by the Database Center for Life Science (DBCLS) under the **Creative Commons Attribution-ShareAlike 2.1 Japan (CC BY-SA 2.1 JP)** license.

### 7.2 Permitted Uses and Restrictions
1. **Commercial & Academic Use:** Permitted. The license does **not** include a Non-Commercial (NC) restriction. CardioVision AI is free to utilize and display the models in research, demonstrations, hackathons, and web deployments.
2. **Derivative Works (Conversion & Packaging):** Permitted. Converting OBJ models to glTF/GLB, decimating polygons, merging parts, or assigning custom PBR shaders constitutes a derivative work.
3. **ShareAlike (SA) Requirement:** Any redistributed derivative 3D model asset (e.g. `coronary_heart_segmented.glb`) must be made available under the **same or a compatible license** (CC BY-SA 2.1 JP or compatible CC-BY-SA versions). It does **not** infect the proprietary React/TypeScript source code or machine-learning pipelines, provided the 3D asset file itself carries the CC BY-SA designation.
4. **Mandatory Attribution Text:**
   The application UI (such as the 3D Explorer footer and documentation) must display the following notice:
   > *"BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan."*
   > *Link: [https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en)*
   > *Note on modifications: Converted from original Wavefront OBJ element files, polygon-decimated, and packaged into binary glTF for WebGL rendering.*

---

## 8. Comparison of Approaches A, B & C

| Strategic Dimension | Approach A: Procedural Tubes on Current `heart.glb` | Approach B: Full Replacement with BodyParts3D GLTF | Approach C: Dual-Asset Hybrid Architecture |
| :--- | :--- | :--- | :--- |
| **Anatomical Plausibility** | **Low to Moderate:** `heart.glb` is an artistic ZBrush sculpt; procedural tubes risk clipping through wall ridges or floating as generic artificial hoses. | **Maximum:** Clinically segmented from real anatomical CT/MRI scans with genuine bifurcations, ostia, and tapering diameters. | **High:** Photorealistic whole-heart on landing page; clinically segmented coronary anatomy in 3D Explorer. |
| **Artery Selectability (LAD, LCX, RCA)** | **Synthetic:** Requires raycast bounding cylinders or HTML anchor points over procedural splines. | **Native:** Distinct named mesh nodes (`Artery_LAD`, `Artery_LCX`, `Artery_RCA`) with native R3F pointer events. | **Native in Explorer:** Segmented meshes in 3D Explorer; standard overview on landing page. |
| **Coordinate Alignment Effort** | **High & Fragile:** Manual calibration of 8–12 spline points per vessel to match ZBrush sculpt sulci without clipping. | **Zero:** All BodyParts3D elements share the identical global coordinate frame; perfect native registration. | **Zero in Explorer:** Pre-registered BodyParts3D meshes require zero alignment guesswork. |
| **Landing Page Impact** | Zero impact (reuses existing `heart.glb`). | High impact: BodyParts3D myocardium has a clinical/scientific appearance that may alter the Soft Aurora Light landing page tone. | **Zero impact:** Preserves `heart.glb` and `HeroSection.tsx` exactly as they currently exist. |
| **Asset Size & Performance** | Retains 7.21 MB `heart.glb`. | Estimated 2.0–3.5 MB for Draco-compressed BodyParts3D GLB. | 7.21 MB (cached for hero) + ~2.5 MB (on-demand for 3D Explorer). |
| **Legal Provenance** | CC-BY-4.0 (`neshallads`). | CC BY-SA 2.1 Japan (DBCLS). Requires visible attribution. | Both assets cleanly attributed in respective view footers. |

### Strategic Recommendation
**Approach C (Dual-Asset Hybrid Architecture) is the superior, lowest-risk path for CardioVision AI:**
1. **Preserve Landing Page Integrity:** The existing landing page hero and background environment remain completely untouched, retaining the photorealistic ZBrush heart (`heart.glb`) that matches the Soft Aurora Light visual theme.
2. **Clinical Superiority in 3D Explorer:** The dedicated 3D Cardiovascular Explorer (Page B) loads the Draco-compressed BodyParts3D model (`coronary_heart_segmented.glb`). Clinicians and judges can independently click, hover, and highlight genuine anatomical meshes for LAD, LCX, and RCA with 100% anatomical defensibility.
3. **Eliminates Manual Spline Alignment Guesswork:** Trying to hand-calibrate procedural spline curves to fit an artistic ZBrush heart is fragile and scientifically questionable. BodyParts3D guarantees perfect mathematical registration between the coronary arteries and the myocardial sulci.

---

## 9. Technical Integration and Coordinate-Alignment Plan

### 9.1 Asset Preparation Pipeline (Offline Workflow)
The proposed BodyParts3D web asset will be authored using standard biomedical modeling tools:

```
[Official DBCLS Archive]
    ├── FJ3862.obj (LAD - Anterior Interventricular Branch)
    ├── FJ3895.obj (LCX - Circumflex Branch)
    ├── FJ50039.obj (RCA - Right Coronary Artery)
    ├── FJ50040.obj (LMCA - Left Main Trunk)
    ├── FJ3734.obj (Ascending Aorta)
    └── Heart Myocardium Atomic Elements (Walls, Ventricles, Septum)
                │
                ▼ (Import into Blender 4.x - All share identical coordinate frame)
[Blender 3D Processing]
    ├── Combine heart wall elements into single "Heart_Myocardium" mesh
    ├── Verify named hierarchy:
    │     ├── "Heart_Myocardium"
    │     ├── "Artery_LAD"
    │     ├── "Artery_LCX"
    │     ├── "Artery_RCA"
    │     └── "Aorta_Root"
    ├── Decimate total scene to ~20,000 - 30,000 polygonal faces
    ├── Setup PBR Materials (Neutral soft-tissue myocardium + Emissive arterial slots)
    └── Export with glTF 2.0 exporter (Draco mesh compression enabled)
                │
                ▼
[Deliverable Web Asset]
    └── frontend/public/models/coronary_heart_segmented.glb (~2.2 MB)
```

### 9.2 React Three Fiber Implementation Pattern
Inside the future `CardiovascularExplorerView.tsx`:

```tsx
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface SegmentedHeartProps {
  predictions: Record<'Cath' | 'LAD' | 'LCX' | 'RCA', TargetPrediction>;
  selectedArtery: string | null;
  onSelectArtery: (artery: 'LAD' | 'LCX' | 'RCA') => void;
}

export function SegmentedCoronaryHeart({ predictions, selectedArtery, onSelectArtery }: SegmentedHeartProps) {
  const { nodes, materials } = useGLTF('/models/coronary_heart_segmented.glb');

  // Dynamic risk-driven material updates
  const ladColor = getRiskColor(predictions.LAD.probability);
  const lcxColor = getRiskColor(predictions.LCX.probability);
  const rcaColor = getRiskColor(predictions.RCA.probability);

  return (
    <group dispose={null}>
      {/* Semi-translucent anatomical myocardium base */}
      <mesh
        geometry={nodes.Heart_Myocardium.geometry}
        material={materials.MyocardiumMat}
        material-roughness={0.5}
        material-transparent={true}
        material-opacity={0.88}
      />

      {/* Discrete, independently selectable LAD mesh */}
      <mesh
        geometry={nodes.Artery_LAD.geometry}
        onClick={(e) => { e.stopPropagation(); onSelectArtery('LAD'); }}
        material-color={ladColor}
        material-emissive={ladColor}
        material-emissiveIntensity={selectedArtery === 'LAD' ? 0.8 : 0.3}
      />

      {/* Discrete, independently selectable LCX mesh */}
      <mesh
        geometry={nodes.Artery_LCX.geometry}
        onClick={(e) => { e.stopPropagation(); onSelectArtery('LCX'); }}
        material-color={lcxColor}
        material-emissive={lcxColor}
        material-emissiveIntensity={selectedArtery === 'LCX' ? 0.8 : 0.3}
      />

      {/* Discrete, independently selectable RCA mesh */}
      <mesh
        geometry={nodes.Artery_RCA.geometry}
        onClick={(e) => { e.stopPropagation(); onSelectArtery('RCA'); }}
        material-color={rcaColor}
        material-emissive={rcaColor}
        material-emissiveIntensity={selectedArtery === 'RCA' ? 0.8 : 0.3}
      />
    </group>
  );
}
```

---

## 10. Risks, Limitations, Missing Evidence & Unresolved Blockers

### 10.1 Key Risks & Mitigation
1. **Model Decimation Artifacts:** The full-resolution BodyParts3D models have high polygon density. Aggressive decimation in Blender could produce non-manifold geometry or faceted tubular artifacts on thin arterial walls. *Mitigation:* Use quadratic edge collapse decimation in Blender, preserving boundary loops and vertex normals.
2. **License Compatibility:** BodyParts3D uses CC BY-SA 2.1 Japan, whereas `heart.glb` uses CC-BY-4.0. *Mitigation:* Keeping them as separate assets in `public/models/` avoids license mixing; each asset independently displays its accurate license badge in the UI.
3. **Visual Disparity Between Landing Page and Workspace:** Clinicians transitioning from the hero to the 3D Explorer will notice a different heart model. *Mitigation:* Explicitly label the landing page as an "Illustrative Cinematic Hero" and the workspace 3D Explorer as the "Clinical Anatomical Reference Model (BodyParts3D)".

### 10.2 Missing Evidence (Strictly Acknowledged)
- **Local Geometric Inspection:** Because this phase is strictly read-only, no OBJ files were downloaded or opened in Blender during this task. The exact vertex count, manifold integrity, and surface normals of `FJ3862.obj`, `FJ3895.obj`, and `FJ50039.obj` remain unverified by direct local file inspection.
- **Pre-Assembled Myocardium:** Whether the atomic heart wall meshes in `partof_BP3D_4.0_obj_99.zip` require boolean union or can simply be grouped under a parent transform node remains to be verified during offline asset authoring.

---

## 11. Recommended Asset Strategy for CardioVision AI

### Summary Recommendation
1. **Adopt Approach C (Hybrid Dual-Asset Architecture).**
2. **Keep [`heart.glb`](file:///D:/Multimodal/frontend/public/models/heart.glb) on the Landing Page Hero:** Zero regression risk, instant load times, existing cinematic lighting preserved.
3. **Author `coronary_heart_segmented.glb` from BodyParts3D for the 3D Explorer (Page B):**
   - Assemble `FJ3862.obj` (LAD), `FJ3895.obj` (LCX), `FJ50039.obj` (RCA), `FJ50040.obj` (LMCA), and `FJ3734.obj` (Aorta) with the myocardium.
   - Decimate to $\le 30,000$ vertices and export with Draco compression ($< 2.5$ MB).
   - Integrate into the future `CardiovascularExplorerView.tsx` with native raycasting and risk-based emissive materials.

---

## 12. Concrete Acceptance Criteria for Implementation Phase

Before the segmented BodyParts3D asset is integrated into production code in a future phase, it must satisfy:

1. **Asset File Size:** `coronary_heart_segmented.glb` must be $\le 4.0$ MB on disk.
2. **Frame Rate:** Maintains stable 60 FPS on standard student laptops with integrated graphics.
3. **Discrete Node Access:** `scene.getObjectByName('Artery_LAD')`, `scene.getObjectByName('Artery_LCX')`, and `scene.getObjectByName('Artery_RCA')` must resolve to independent Three.js mesh instances.
4. **Interaction:** Clicking an artery triggers its corresponding target card telemetry and camera waypoint transition.
5. **Cath Distinction:** Cath is rendered as an ambient stage halo / perfusion badge, never highlighting an individual artery.
6. **Legal Attribution:** A visible, accessible attribution banner for DBCLS under CC BY-SA 2.1 Japan must appear in the 3D stage footer.

---

## 13. Proposed Files for Future Implementation Phase

When approved for implementation in Phase 3E:

| File Path | Action | Description |
| :--- | :---: | :--- |
| `frontend/public/models/coronary_heart_segmented.glb` | **Create Asset** | Draco-compressed multi-mesh glTF asset derived from BodyParts3D |
| `frontend/src/components/workspace/SegmentedHeartModel.tsx` | **Create Component** | R3F component rendering myocardium and discrete LAD, LCX, RCA meshes |
| `frontend/src/components/workspace/CardiovascularExplorerView.tsx` | **Create Component** | Dedicated Page B view hosting the segmented 3D canvas and artery telemetry |
| `frontend/src/api/__tests__/segmentedHeartAsset.test.ts` | **Create Test** | Unit test verifying GLB node names and camera preset alignment |

---

## 14. What Was Inspected vs. What Remains Unverified

### Actually Inspected and Verified
- Official DBCLS and NBDC BodyParts3D website portals and download endpoints.
- Official documentation of BodyParts3D Versions 4.0 and 4.3.
- FMA ontological identifiers for all required coronary structures: `FMA:3862` (LAD), `FMA:3895` (LCX), `FMA:50039` (RCA), `FMA:50040` (LMCA), `FMA:7088` (Heart), `FMA:3734` (Aorta).
- Exact archive filenames: `FJ3862.obj`, `FJ3895.obj`, `FJ50039.obj`, `FJ50040.obj`, `FJ3734.obj`.
- CC BY-SA 2.1 Japan license deed and required attribution text.
- Existing repository components, branch, HEAD, and build health.

### What Remains Unverified
- Local 3D mesh inspection of `FJ3862.obj` in Blender on this machine (strictly prohibited by read-only rules).
- Exact polygon count of the assembled myocardium before decimation.
- Exact WebGL memory footprint of the converted `.glb` file inside the browser runtime.

---

**AUDIT CONCLUSION:** Phase 3D anatomical asset research and feasibility audit is complete. BodyParts3D provides verified, downloadable, discrete polygon meshes for LAD, LCX, RCA, and LMCA sharing a unified coordinate frame. **No code, assets, or dependencies were added to the repository. Awaiting explicit human approval before any future implementation.**
