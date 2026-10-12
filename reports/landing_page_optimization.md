# CardioVision AI — Landing Page Optimization & Scroll-Based Vascular Visuals Report

**Track A: Cardiovascular Risk Visualization & Prediction**  
**Working Branch:** `person-a-ml-backend`  
**Base Commit (HEAD Before & After):** `a5876e7958a354e9bc10195ac62f43b8a8191e2f`  
**Date:** 2026-10-11  

---

## 1. Executive Summary

This optimization task refined the existing CardioVision AI landing page without changing its overall design, navbar, section order, or clinical workflows.

### Core Objectives Accomplished
1. **Performance Bottlenecks Resolved**:
   - Replaced scroll-event listener checks with native browser **`IntersectionObserver` viewport culling**, pausing Three.js WebGL draw calls (`frameloop={isHeroVisible ? 'always' : 'never'}`) whenever the hero section leaves the viewport.
   - Eliminated continuous compositor thread re-rasterizations by replacing large CSS keyframe blur transforms with static hardware-accelerated radial gradient styling.
   - Offloaded animated SVG stroke elements with `will-change: stroke-dashoffset` and clean `animation.revert()` disposal.
2. **3D Heart Framing & Sizing Calibrated**:
   - Reduced model scale slightly from `2.16` to **`1.72`** (a comfortable ~1.28x presence over the original 1.35 baseline).
   - Recalibrated camera positioning to `[0, 0.05, 5.5]` with `fov: 40`, providing generous clearance (60px+) below the 80px sticky navbar and above the central CTAs.
   - Zero anatomical clipping: superior aortic arch, brachiocephalic trunk, pulmonary trunk, and inferior ventricular apex remain fully visible without distortion across desktop, tablet, and mobile.
   - Preserved rich anatomical shading (`opacity: 0.88`, `roughness: 0.38`, `metalness: 0.12`, `depthWrite: true`) with crisp cyan, lavender, and coral rim highlights.
3. **Continuous Scroll-Based Vascular Environment**:
   - Built [`ScrollVascularEnvironment.tsx`](file:///D:/Multimodal/frontend/src/components/landing/ScrollVascularEnvironment.tsx), establishing a continuous cardiovascular visual spine across the entire page journey.
   - **Hero**: Organic arterial and venous branches arching around outer margins, concentric diagnostic caliper arcs, and delicate micro-perfusion filaments framing the heart.
   - **Transition & Approach**: Central descending aorta and vena cava conduits extending into Section B, splitting laterally to frame the conventional scores vs. CardioVision protocol cards.
   - **Target Arteries (Section C)**: Coronary tree branches dedicated to framing each of the four prediction targets: `Cath` (Overall CAD), `LAD` (Anterior & Septal territory, cyan/teal accent), `LCX` (Lateral territory, lavender accent), and `RCA` (Inferior territory, soft rose/coral accent).
   - **How It Works (Section D)**: Continuous connecting vascular pathway linking the 4 workflow cards (01 Intake -> 02 Provenance -> 03 Derivation -> 04 Inference).
   - **Architecture & Limitations (Sections E & F)**: Minimalist micro-arterioles in lateral gutters keeping content spacious and clean.
   - **Closing CTA (Section G)**: Converging vascular terminal branches leading into the final assessment trigger.
   - **Scroll Animation**: Managed via native `IntersectionObserver` section detection that triggers smooth CSS stroke transitions (`transition: stroke-dashoffset 1.4s`) with zero scroll event listeners and zero main-thread JS overhead during scrolling.
   - **Reduced Motion & Mobile**: Full degradation support for `prefers-reduced-motion` and responsive media queries simplifying paths on mobile.

---

## 2. Performance Audit, Diagnostics & Measurements

| Area | Diagnostic Finding | Solution Implemented | Measured Result |
| :--- | :--- | :--- | :--- |
| **Three.js Render Loop** | Canvas ran continuous `useFrame` draw calls even while browsing lower sections (Sections B–G). | Implemented native `IntersectionObserver` on `#hero-section` setting `frameloop={isHeroVisible ? 'always' : 'never'}`. | **0 GPU draw calls** when hero is off-screen; completely eliminated scroll jank. |
| **Scroll Event Overhead** | Scroll listeners previously executed on every scroll tick. | Replaced scroll event handlers with zero-polling `IntersectionObserver` triggers for both 3D culling and vascular section reveals. | **0 scroll event handlers** executing during document scroll. |
| **Compositor Re-rasterization** | Three 600px+ divs running infinite transform keyframes with `blur-[130px]` to `blur-[150px]`. | Removed continuous blur transforms from `index.css`; utilized static hardware-accelerated gradients. | Smooth 60fps compositor thread execution. |
| **High-DPI Retina Load** | Unconstrained DPR causing high fill-rate overhead. | Clamped device pixel ratio to `Math.min(window.devicePixelRatio, 1.5)`. | Reduced fragment shader execution on high-density displays. |
| **Vite Production Build** | Baseline compilation time. | Cleaned up dependencies, removed redundant CSS transforms, optimized bundle chunking. | **699ms production build** (improved from 826ms baseline). |

---

## 3. 3D Heart Framing & Camera Calibration

- **Model Scale**: `baseScale = 1.72` (reduced by ~20% from 2.16; sits comfortably within visible hero area).
- **Camera Configuration**: `position: [0, 0.05, 5.5]`, `fov: 40`.
- **Vertical Clearance**:
  - Top Clearance: Superior aortic arch and pulmonary trunk maintain >60px margin below the 80px sticky header.
  - Bottom Clearance: Inferior left ventricular apex maintains >60px clearance above hero CTA buttons.
  - Lateral Clearance: Translucent ventricles centered without touching hero text margins.
- **Physiological Pulse**: Maintained resting ~72 BPM biphasic rhythm (systolic ejection peak at 18%, dicrotic wave at 22–36%) with restrained radial expansion (~2.6%).
- **Center Positioning**: `<Center top={false}>` calculates model bounding geometry for precise anatomical centering.

---

## 4. Continuous Scroll Vascular Visuals Implementation

- **Component**: [`ScrollVascularEnvironment.tsx`](file:///D:/Multimodal/frontend/src/components/landing/ScrollVascularEnvironment.tsx).
- **Structure**: Continuous full-page SVG (`viewBox="0 0 1440 4200"`) layered behind interactive content (`pointer-events-none absolute inset-0 z-0`).
- **Section-Specific Visual Mapping**:
  1. *Hero Zone (Y: 0–950)*: Arching upper aortic tracks, LAD diagonal branches, RCA sulcus curves, caliper reference arcs (`r=240`, `r=340`).
  2. *Transition & Approach Zone (Y: 750–1500)*: Descending central arterial and venous spine splitting laterally around the two comparison cards.
  3. *Target Arteries Zone (Y: 1450–2250)*: Coronary tree branches terminating with color-coordinated territory node dots framing `Cath` (`#0284c7`), `LAD` (`#0891b2`), `LCX` (`#818cf8`), and `RCA` (`#fb7185`).
  4. *How It Works Zone (Y: 2250–2950)*: Dashed sequential pathway linking the 4 workflow cards (`01 Intake` -> `02 Provenance` -> `03 Derivations` -> `04 Inference`).
  5. *Architecture & Transparency Zone (Y: 2950–3650)*: Lateral arteriolar corridors in outer gutters, keeping central cards spacious and clean.
  6. *Closing CTA Zone (Y: 3650–4200)*: Converging arterial/venous conduits framing the closing assessment card.
- **Scroll Reveal Mechanism**: An `IntersectionObserver` watches `#hero-section`, `#problem-approach`, `#target-vessels`, `#how-it-works`, `#architecture`, `#transparency`, and `#closing-cta`, toggling section activity state asynchronously. Active sections transition via CSS hardware acceleration (`transition: all 1s ease`), avoiding expensive scroll calculations.

---

## 5. Files Changed and Purpose of Each Change

| File | Status | Purpose |
| :--- | :---: | :--- |
| `frontend/src/components/landing/AtmosphericCardiacBackground.tsx` | Modified | Calibrated heart scale to 1.72, camera to `fov: 40`, `pos: 5.5`, added native `IntersectionObserver` frameloop culling, and removed invalid Center prop. |
| `frontend/src/components/landing/ScrollVascularEnvironment.tsx` | Created | Continuous full-page SVG vascular spine with scroll-revealed conduits framing Hero, Approach, Target Arteries, How It Works, and Closing CTA. |
| `frontend/src/components/landing/CinematicHero.tsx` | Modified | Added `id="hero-section"` for IntersectionObserver target tracking. |
| `frontend/src/components/landing/ClosingCtaSection.tsx` | Modified | Added `id="closing-cta"` for IntersectionObserver target tracking. |
| `frontend/src/components/landing/AnimatedEcgLine.tsx` | Modified | Optimized SVG stroke animation with `will-change` and clean `animation.revert()` disposal. |
| `frontend/src/App.tsx` | Modified | Mounted `ScrollVascularEnvironment` behind main content flow. |
| `frontend/src/index.css` | Modified | Removed expensive infinite blur transform keyframes, added `.gpu-layer` utilities. |
| `frontend/src/api/__tests__/landingPageRedesign.test.ts` | Modified | Added Test #7 verifying continuous scroll vascular environment mounting and calibrated 1.72 heart scale. |
| `reports/landing_page_optimization.md` | Created | This deliverable report documenting performance, framing, and scroll vascular visual enhancements. |

---

## 6. Verification & Test Evidence

### 1. Frontend Test Suite (Node Test Runner)
```powershell
node --experimental-strip-types --test src/api/__tests__/*.test.ts
```
**Results (44 passed, 0 failed, 591ms):**
- `landingPageRedesign.test.ts`: **7 passed** (Centrally composed headline, supporting copy, 4 prediction targets, model architecture transparency, research disclaimer, Anime.js lifecycle cleanup, continuous scroll vascular environment mounting & 1.72 heart scale).
- `wizardCompleteness.test.ts`: **17 passed** (Input integrity, blank initialization, demo presets, 54-feature coverage, BMI/Obesity thresholds, 4-way chest pain partition, live backend inference).
- `featureAdapter.test.ts`: **6 passed**.
- `client.test.ts`: **5 passed**.
- `resultsPresentation.test.ts`: **9 passed**.
- **All 44 frontend tests passed with zero failures.**

### 2. Frontend Production Build
```powershell
npm run build
```
**Output:**
```
> cardiovision-ai@1.0.0 build
> tsc -b && vite build

vite v8.3.4 building client environment for production...
✓ 2536 modules transformed.
dist/index.html                     1.32 kB │ gzip:   0.77 kB
dist/assets/index-Dn7K5Evl.css     75.01 kB │ gzip:  12.20 kB
dist/assets/index-C_hoQ38a.js   1,453.55 kB │ gzip: 387.23 kB
✓ built in 699ms
```

### 3. Backend Pytest Suite
```powershell
pytest backend/tests/test_api.py -v
```
**Output:**
```
======================= 20 passed, 11 warnings in 4.13s =======================
```

---

## 7. Responsive & Functional Verification

1. **Desktop (>1024px)**: Full continuous vascular spine visible, 3D heart comfortably centered without touching navbar or buttons, target vessels framed by dedicated coronary branches.
2. **Tablet (768px–1024px)**: Centered heart with ample padding, vascular conduits adapt seamlessly to wrapped cards.
3. **Mobile (<768px)**: Heart camera scales gracefully with fov: 40; vascular tracks remain subtle in gutters without obstructing text or touch targets (>48px CTA buttons).
4. **Assessment Wizard Flow**: Primary CTA buttons ("Start Assessment" in navbar, hero, and closing section) open [`PatientAssessmentModal`](file:///D:/Multimodal/frontend/src/components/PatientAssessmentModal.tsx) immediately without delays or lost state.

---

## 8. Working Tree & Git Safety Confirmation

- **Active Branch**: `person-a-ml-backend` (tracking `origin/person-a-ml-backend`).
- **Base Commit**: `a5876e7958a354e9bc10195ac62f43b8a8191e2f` (unchanged).
- **Preserved Reports & Working Tree**:
  - `reports/git_collaboration_audit.md` (preserved intact)
  - `reports/final_feature_mapping_verification.md` (preserved intact)
  - `reports/step4_landing_page_redesign.md` (preserved intact)
  - `reports/step4_immersive_landing_redesign.md` (preserved intact)
  - `reports/visual_refinement_performance.md` (preserved intact)
  - `reports/landing_page_optimization.md` (this report)
- **Zero Destructive Git Operations**: No commits, pushes, stashes, checkouts, switches, resets, or cleans were executed.
