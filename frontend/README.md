# CardioVision AI — Frontend Application
**Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction**

Interactive React + Vite + Three.js application featuring an anatomically realistic 3D beating heart and standardized patient risk intake assessment form.

---

## 1. Quick Start

### Prerequisites
* Node.js v18+ or v20+
* npm v9+

### Installation
From the repository root:
```bash
cd frontend
npm install
```

### Start Development Server
```bash
npm run dev
```
* **Local Web Interface:** [http://localhost:5173/](http://localhost:5173/)
* **Vite Network URL:** Accessible across your local LAN.

### Production Build
```bash
npm run build
```

---

## 2. Features

* **Interactive 3D Anatomical Heart:**
  * Rendered with React Three Fiber (`@react-three/fiber`) & Drei (`@react-three/drei`).
  * Physiologically responsive resting cardiac pulse (~72 BPM) with non-linear ejection & dicrotic phases.
  * Free rotation (`OrbitControls`), zoom, and ambient medical lighting.
* **Clinical Patient Intake Form:**
  * 3 Organized sections: Patient Demographics & History, Clinical Measurements & Lipids, Exercise Stress & ECG.
  * 3 Fast-load clinical benchmark presets (Cleveland & Z-Alizadeh Sani cohorts).
  * Formatted 54-feature JSON payload generator ready for FastAPI backend inference (`POST http://localhost:8000/api/predict`).
  * Honest clinical safety standalone mode — never fabricates fake prediction scores when backend is disconnected.
* **Futuristic Medical HUD:**
  * Real-time scanline, depth reticles, and clinical telemetry brackets.
