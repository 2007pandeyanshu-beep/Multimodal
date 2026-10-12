/**
 * frontend/src/components/CoronaryResultsCanvas.tsx
 * Dedicated, reusable 3D cardiovascular assessment canvas for the clinical workspace.
 * Integrates verified multi-mesh BodyParts3D Release 4.0 anatomical asset (CC BY-SA 2.1 JP)
 * with a premium distinct three-artery color system:
 *   - LAD: Coral Red (#E94F70)
 *   - LCX: Violet (#8B5CF6)
 *   - RCA: Teal (#0891B2)
 *   - LMCA: Deep Crimson (#BE123C)
 *   - Aorta: Warm Ivory/Alabaster (#f1e5e6)
 *   - Myocardium: Warm Cardiac Crimson (#CF727C) with soft velvet shading (roughness 0.68)
 * Features an interactive compact artery color legend, responsive floating prediction cards,
 * smooth camera presets, raycast selection, and bidirectional prediction synchronization.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  Suspense,
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import {
  Activity,
  RotateCcw,
  Compass,
  Eye,
  AlertTriangle,
  RotateCw,
  Heart,
  Info,
  Layers,
  X,
  Crosshair,
} from 'lucide-react';
import { HeartModel } from './HeartCanvas.tsx';
import type { PredictionResponse, TargetName } from '../api/types.ts';

export type CameraPresetKey = 'anterior' | 'lateral' | 'posterior' | 'superior' | 'reset';

interface PresetConfig {
  key: CameraPresetKey;
  label: string;
  sublabel: string;
  description: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: Record<CameraPresetKey, PresetConfig> = {
  anterior: {
    key: 'anterior',
    label: 'Anterior',
    sublabel: 'Frontal',
    description: 'Sternocostal anterior surface • LAD arterial territory (Coral Red #E94F70)',
    position: [0, 0.4, 4.2],
    target: [0, 0, 0],
  },
  lateral: {
    key: 'lateral',
    label: 'Left Lateral',
    sublabel: 'Lateral LV',
    description: 'Obtuse cardiac margin & lateral left ventricle • LCX territory (Violet #8B5CF6)',
    position: [3.6, 0.5, 2.2],
    target: [0, 0, 0],
  },
  posterior: {
    key: 'posterior',
    label: 'Right Posterior',
    sublabel: 'Inferior / Base',
    description: 'Diaphragmatic surface & posterior base • RCA territory (Teal #0891B2)',
    position: [-3.4, -0.4, 2.2],
    target: [0, 0, 0],
  },
  superior: {
    key: 'superior',
    label: 'Superior',
    sublabel: 'Base / Ostia',
    description: 'Aortic root & coronary ostia • Left main root (Crimson #BE123C)',
    position: [0, 4.0, 1.0],
    target: [0, 0, 0],
  },
  reset: {
    key: 'reset',
    label: 'Overview',
    sublabel: 'Reset',
    description: 'Default anatomical overview with standard framing',
    position: [0, 0.4, 4.2],
    target: [0, 0, 0],
  },
};

// Target metadata for 3D HUD, legend & hover cards
export interface ArteryMetaItem {
  key: TargetName | 'Cath';
  meshName: string;
  shortLabel: string;
  fullName: string;
  fma: string;
  territory: string;
  course: string;
  color: string;
  colorName: string;
  badgeClass: string;
}

export const ARTERY_METADATA: Record<string, ArteryMetaItem> = {
  LAD: {
    key: 'LAD',
    meshName: 'Artery_LAD',
    shortLabel: 'LAD',
    fullName: 'Left Anterior Descending Artery',
    fma: 'FMA:3862',
    territory: 'Anterior wall, interventricular septum & cardiac apex',
    course: 'Originates from LMCA; courses along anterior interventricular sulcus.',
    color: '#E94F70',
    colorName: 'Coral Red',
    badgeClass: 'text-[#E94F70] bg-rose-50 border-rose-200',
  },
  LCX: {
    key: 'LCX',
    meshName: 'Artery_LCX',
    shortLabel: 'LCX',
    fullName: 'Left Circumflex Artery',
    fma: 'FMA:3895',
    territory: 'Lateral and posterior left ventricular myocardium',
    course: 'Branches from LMCA; tracks along the left atrioventricular groove.',
    color: '#8B5CF6',
    colorName: 'Violet',
    badgeClass: 'text-[#8B5CF6] bg-violet-50 border-violet-200',
  },
  RCA: {
    key: 'RCA',
    meshName: 'Artery_RCA',
    shortLabel: 'RCA',
    fullName: 'Right Coronary Artery',
    fma: 'FMA:50039',
    territory: 'Right ventricle, posterior septum & inferior wall',
    course: 'Arises from right aortic sinus; descends down right coronary sulcus to crux.',
    color: '#0891B2',
    colorName: 'Teal',
    badgeClass: 'text-[#0891B2] bg-cyan-50 border-cyan-200',
  },
  Cath: {
    key: 'Cath',
    meshName: 'Artery_LMCA',
    shortLabel: 'LMCA',
    fullName: 'Left Main Coronary Artery Stem',
    fma: 'FMA:50040',
    territory: 'Coronary trunk supplying left ventricular vascular tree',
    course: 'Short trunk from left aortic sinus bifurcating into LAD and LCX.',
    color: '#BE123C',
    colorName: 'Deep Crimson',
    badgeClass: 'text-[#BE123C] bg-red-50 border-red-200',
  },
};

// --------------------------------------------------------------------------
// WebGL Error Boundary (catches 3D context failure gracefully)
// --------------------------------------------------------------------------
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CoronaryResultsCanvas WebGL Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full h-80 sm:h-96 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 mb-3 border border-amber-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            3D Anatomical Stage Unavailable
          </h4>
          <p className="text-xs text-slate-600 max-w-md mb-4 leading-relaxed">
            Your browser or graphics environment could not initialize WebGL rendering.
            The 2D multi-target prediction assessment and clinical feature disclosures
            below remain fully operational.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-300 shadow-2xs transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Retry 3D Stage</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --------------------------------------------------------------------------
// 3D Loading Fallback (Apple Health Minimal frosted indicator)
// --------------------------------------------------------------------------
function ResultsCanvasLoadingFallback() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs">
      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 shadow-xs text-rose-600 mb-3 animate-pulse">
        <Heart className="w-6 h-6 animate-bounce" />
      </div>
      <span className="text-xs font-mono font-bold tracking-wider text-slate-800 uppercase">
        Loading Anatomical Model
      </span>
      <span className="text-[11px] text-slate-500 mt-0.5 font-sans">
        BodyParts3D Release 4.0 Multi-Mesh (CC BY-SA 2.1 JP)
      </span>
    </div>
  );
}

// --------------------------------------------------------------------------
// Smooth Camera Preset Controller (Interpolates in useFrame)
// --------------------------------------------------------------------------
interface CameraRigProps {
  targetPreset: PresetConfig;
  isTransitioning: boolean;
  onTransitionEnd: () => void;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  autoRotate: boolean;
}

function CameraRig({
  targetPreset,
  isTransitioning,
  onTransitionEnd,
  controlsRef,
  autoRotate,
}: CameraRigProps) {
  const { camera } = useThree();
  const targetPosVec = useRef(new THREE.Vector3());
  const targetLookVec = useRef(new THREE.Vector3());

  useEffect(() => {
    targetPosVec.current.set(...targetPreset.position);
    targetLookVec.current.set(...targetPreset.target);
  }, [targetPreset]);

  useFrame((_, delta) => {
    if (!isTransitioning) return;

    // Smooth spherical/vector lerp towards preset position
    const lerpSpeed = Math.min(1.0, delta * 3.8);
    camera.position.lerp(targetPosVec.current, lerpSpeed);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookVec.current, lerpSpeed);
      controlsRef.current.update();
    }

    // Check completion threshold
    const dist = camera.position.distanceTo(targetPosVec.current);
    if (dist < 0.03) {
      camera.position.copy(targetPosVec.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLookVec.current);
        controlsRef.current.update();
      }
      onTransitionEnd();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      minDistance={3.2}
      maxDistance={8.0}
      enablePan={false}
      enableRotate={true}
      dampingFactor={0.06}
      rotateSpeed={0.8}
      autoRotate={autoRotate}
      autoRotateSpeed={0.6}
      maxPolarAngle={Math.PI * 0.85}
      minPolarAngle={Math.PI * 0.15}
    />
  );
}

// --------------------------------------------------------------------------
// Lighting Setup (Soft medical stage illumination highlighting natural cardiac tissue)
// --------------------------------------------------------------------------
function StageLighting() {
  return (
    <>
      {/* Soft Balanced Ambient Light */}
      <ambientLight intensity={1.30} color="#fffaf5" />

      {/* Main Anterior Key Light (Softened directional light, prevents harsh specular faceting) */}
      <directionalLight
        position={[4, 5, 4]}
        intensity={1.5}
        color="#ffffff"
        castShadow
      />

      {/* Soft Warm Fill Light */}
      <directionalLight
        position={[-4, 2, 3]}
        intensity={0.9}
        color="#fdf2f4"
      />

      {/* Cool Sky-Blue Rim Highlight (Edge definition) */}
      <directionalLight
        position={[5, 3, -4]}
        intensity={2.0}
        color="#38bdf8"
      />

      {/* Upper-Left Subtle Warm Contour Light */}
      <directionalLight
        position={[-4, 4, -4]}
        intensity={1.3}
        color="#fda4af"
      />

      {/* Subtle Bottom Fill for Ventricular Depth */}
      <pointLight
        position={[0, -4, 2]}
        intensity={0.5}
        color="#fb7185"
        distance={8}
      />
    </>
  );
}

// --------------------------------------------------------------------------
// Anatomical Coronary Heart (BodyParts3D Release 4.0 Verified Multi-Mesh)
// --------------------------------------------------------------------------
interface AnatomicalCoronaryHeartProps {
  reducedMotion: boolean;
  enablePulsing: boolean;
  selectedTarget: TargetName | null;
  onSelectTarget?: (target: TargetName | null) => void;
  hoveredTarget: TargetName | 'Cath' | null;
  onHoverTarget: (target: TargetName | 'Cath' | null, event?: ThreeEvent<PointerEvent>) => void;
}

function AnatomicalCoronaryHeart({
  reducedMotion,
  enablePulsing,
  selectedTarget,
  onSelectTarget,
  hoveredTarget,
  onHoverTarget,
}: AnatomicalCoronaryHeartProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Load verified BodyParts3D GLB
  const { scene } = useGLTF('/models/coronary_heart_bp3d.glb');

  // Extract geometries by verified node names
  const meshes = useMemo(() => {
    const myo = scene.getObjectByName('Heart_Myocardium') as THREE.Mesh | undefined;
    const aorta = scene.getObjectByName('Aorta_Root') as THREE.Mesh | undefined;
    const lmca = scene.getObjectByName('Artery_LMCA') as THREE.Mesh | undefined;
    const lad = scene.getObjectByName('Artery_LAD') as THREE.Mesh | undefined;
    const lcx = scene.getObjectByName('Artery_LCX') as THREE.Mesh | undefined;
    const rca = scene.getObjectByName('Artery_RCA') as THREE.Mesh | undefined;

    return {
      myo: myo?.geometry,
      aorta: aorta?.geometry,
      lmca: lmca?.geometry,
      lad: lad?.geometry,
      lcx: lcx?.geometry,
      rca: rca?.geometry,
    };
  }, [scene]);

  // Cardiac pulse parameters: resting rate ~72 BPM
  const BPM = 72;
  const cyclePeriod = 60 / BPM;

  useFrame((state) => {
    if (!groupRef.current) return;

    if (reducedMotion || !enablePulsing) {
      groupRef.current.scale.set(1.8, 1.8, 1.8);
      return;
    }

    const t = state.clock.getElapsedTime();
    const cycleTime = t % cyclePeriod;
    const p = cycleTime / cyclePeriod;

    let pulseFactor = 0;
    if (p < 0.18) {
      pulseFactor = Math.sin((p / 0.18) * Math.PI);
    } else if (p >= 0.22 && p < 0.36) {
      pulseFactor = 0.42 * Math.sin(((p - 0.22) / 0.14) * Math.PI);
    }

    // Subtle 2.2% physiological pulse scale expansion
    const baseScale = 1.8;
    const s = baseScale * (1 + pulseFactor * 0.022);
    groupRef.current.scale.set(s, s, s);
  });

  // Calculate selection and hover states
  const hasSelection = selectedTarget !== null;

  const isLadActive = selectedTarget === 'LAD';
  const isLcxActive = selectedTarget === 'LCX';
  const isRcaActive = selectedTarget === 'RCA';
  const isLmcaActive = selectedTarget === 'Cath';

  const isLadHovered = hoveredTarget === 'LAD';
  const isLcxHovered = hoveredTarget === 'LCX';
  const isRcaHovered = hoveredTarget === 'RCA';
  const isLmcaHovered = hoveredTarget === 'Cath';

  // Vessel opacities: dim non-selected vessels moderately when one is selected
  const ladOpacity = hasSelection ? (isLadActive ? 1.0 : 0.40) : 1.0;
  const lcxOpacity = hasSelection ? (isLcxActive ? 1.0 : 0.40) : 1.0;
  const rcaOpacity = hasSelection ? (isRcaActive ? 1.0 : 0.40) : 1.0;
  const lmcaOpacity = hasSelection ? (isLmcaActive ? 1.0 : 0.40) : 1.0;

  // Myocardium opacity: warm, substantial volume (0.82 neutral, 0.55 when focused)
  const myoOpacity = hasSelection ? 0.55 : 0.82;

  // Audit preservation note: Phase 3E.3 coral references preserved for historical compatibility:
  // Legacy aliases: LAD #ff5c7c, LCX #ff6b8b, RCA #ff4d6d, LMCA #e11d48

  return (
    <group
      ref={groupRef}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={1.8}
      dispose={null}
    >
      {/* 1. Heart Myocardium (Warm cardiac crimson/rose #CF727C with velvety roughness 0.68) */}
      {meshes.myo && (
        <mesh
          geometry={meshes.myo}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTarget?.(null);
          }}
        >
          <meshStandardMaterial
            color="#CF727C"
            transparent
            opacity={myoOpacity}
            roughness={0.68}
            metalness={0.05}
            side={THREE.DoubleSide}
            depthWrite={true}
          />
        </mesh>
      )}

      {/* 2. Ascending Aorta Root (Warm alabaster/ivory #f1e5e6) */}
      {meshes.aorta && (
        <mesh
          geometry={meshes.aorta}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <meshStandardMaterial
            color="#f1e5e6"
            transparent
            opacity={0.88}
            roughness={0.45}
            metalness={0.12}
            side={THREE.DoubleSide}
            depthWrite={true}
          />
        </mesh>
      )}

      {/* 3. Left Main Coronary Artery (LMCA) — Deep Crimson Anchor (#BE123C) */}
      {meshes.lmca && (
        <mesh
          geometry={meshes.lmca}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTarget?.(selectedTarget === 'Cath' ? null : 'Cath');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverTarget('Cath', e);
          }}
          onPointerMove={(e) => {
            e.stopPropagation();
            onHoverTarget('Cath', e);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            onHoverTarget(null);
          }}
        >
          <meshStandardMaterial
            color="#BE123C"
            roughness={0.25}
            metalness={0.18}
            transparent
            opacity={lmcaOpacity}
            emissive={isLmcaActive ? '#F43F5E' : (isLmcaHovered ? '#FB7185' : '#000000')}
            emissiveIntensity={isLmcaActive ? 0.65 : (isLmcaHovered ? 0.45 : 0)}
          />
        </mesh>
      )}

      {/* 4. Left Anterior Descending Artery (LAD) — Coral Red (#E94F70) */}
      {meshes.lad && (
        <mesh
          geometry={meshes.lad}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTarget?.(selectedTarget === 'LAD' ? null : 'LAD');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverTarget('LAD', e);
          }}
          onPointerMove={(e) => {
            e.stopPropagation();
            onHoverTarget('LAD', e);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            onHoverTarget(null);
          }}
        >
          <meshStandardMaterial
            color="#E94F70"
            roughness={0.25}
            metalness={0.18}
            transparent
            opacity={ladOpacity}
            emissive={isLadActive ? '#38bdf8' : (isLadHovered ? '#FDA4AF' : '#000000')}
            emissiveIntensity={isLadActive ? 0.50 : (isLadHovered ? 0.45 : 0)}
          />
        </mesh>
      )}

      {/* 5. Left Circumflex Artery (LCX) — Distinct Violet (#8B5CF6) */}
      {meshes.lcx && (
        <mesh
          geometry={meshes.lcx}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTarget?.(selectedTarget === 'LCX' ? null : 'LCX');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverTarget('LCX', e);
          }}
          onPointerMove={(e) => {
            e.stopPropagation();
            onHoverTarget('LCX', e);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            onHoverTarget(null);
          }}
        >
          <meshStandardMaterial
            color="#8B5CF6"
            roughness={0.25}
            metalness={0.18}
            transparent
            opacity={lcxOpacity}
            emissive={isLcxActive ? '#C4B5FD' : (isLcxHovered ? '#DDD6FE' : '#000000')}
            emissiveIntensity={isLcxActive ? 0.55 : (isLcxHovered ? 0.45 : 0)}
          />
        </mesh>
      )}

      {/* 6. Right Coronary Artery (RCA) — Distinct Teal (#0891B2) */}
      {meshes.rca && (
        <mesh
          geometry={meshes.rca}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTarget?.(selectedTarget === 'RCA' ? null : 'RCA');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverTarget('RCA', e);
          }}
          onPointerMove={(e) => {
            e.stopPropagation();
            onHoverTarget('RCA', e);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            onHoverTarget(null);
          }}
        >
          <meshStandardMaterial
            color="#0891B2"
            roughness={0.25}
            metalness={0.18}
            transparent
            opacity={rcaOpacity}
            emissive={isRcaActive ? '#38BDF8' : (isRcaHovered ? '#67E8F9' : '#000000')}
            emissiveIntensity={isRcaActive ? 0.55 : (isRcaHovered ? 0.45 : 0)}
          />
        </mesh>
      )}
    </group>
  );
}

// Preload verified GLB model
useGLTF.preload('/models/coronary_heart_bp3d.glb');

// --------------------------------------------------------------------------
// Compact Artery Color Legend Component
// --------------------------------------------------------------------------
interface ArteryColorLegendProps {
  selectedTarget: TargetName | null;
  onSelectTarget?: (target: TargetName | null) => void;
}

export function ArteryColorLegend({
  selectedTarget,
  onSelectTarget,
}: ArteryColorLegendProps) {
  return (
    <div
      className="absolute bottom-3 right-3 z-20 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-xs px-2.5 py-1.5 flex items-center gap-2 select-none pointer-events-auto"
      role="region"
      aria-label="Coronary Artery Color Legend"
    >
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
        Arteries:
      </span>
      <div className="flex items-center gap-1">
        {/* LAD Entry */}
        <button
          type="button"
          onClick={() => onSelectTarget?.(selectedTarget === 'LAD' ? null : 'LAD')}
          title="Coral Red: Left Anterior Descending Artery (Click to focus)"
          aria-label="Focus LAD (Coral Red)"
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all ${
            selectedTarget === 'LAD'
              ? 'bg-rose-50 text-rose-900 font-bold border border-rose-300 shadow-2xs'
              : 'hover:bg-slate-100/80 text-slate-600'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#E94F70] shadow-2xs shrink-0" />
          <span className="font-semibold text-[11px]">LAD</span>
        </button>

        {/* LCX Entry */}
        <button
          type="button"
          onClick={() => onSelectTarget?.(selectedTarget === 'LCX' ? null : 'LCX')}
          title="Violet: Left Circumflex Artery (Click to focus)"
          aria-label="Focus LCX (Violet)"
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all ${
            selectedTarget === 'LCX'
              ? 'bg-violet-50 text-violet-900 font-bold border border-violet-300 shadow-2xs'
              : 'hover:bg-slate-100/80 text-slate-600'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shadow-2xs shrink-0" />
          <span className="font-semibold text-[11px]">LCX</span>
        </button>

        {/* RCA Entry */}
        <button
          type="button"
          onClick={() => onSelectTarget?.(selectedTarget === 'RCA' ? null : 'RCA')}
          title="Teal: Right Coronary Artery (Click to focus)"
          aria-label="Focus RCA (Teal)"
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all ${
            selectedTarget === 'RCA'
              ? 'bg-cyan-50 text-cyan-900 font-bold border border-cyan-300 shadow-2xs'
              : 'hover:bg-slate-100/80 text-slate-600'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#0891B2] shadow-2xs shrink-0" />
          <span className="font-semibold text-[11px]">RCA</span>
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Interactive Hover Prediction Card Component
// --------------------------------------------------------------------------
interface FloatingPredictionCardProps {
  target: TargetName | 'Cath';
  isSelected: boolean;
  predictionResponse?: PredictionResponse | null;
  position: { x: number; y: number } | null;
  containerBounds: { width: number; height: number } | null;
  onDismiss: () => void;
  onSelect: (target: TargetName | null) => void;
}

function FloatingPredictionCard({
  target,
  isSelected,
  predictionResponse,
  position,
  containerBounds,
  onDismiss,
  onSelect,
}: FloatingPredictionCardProps) {
  const meta = ARTERY_METADATA[target];
  if (!meta) return null;

  // Retrieve actual model prediction
  const pred = predictionResponse?.predictions ? predictionResponse.predictions[target] : undefined;
  const hasPrediction = pred !== undefined && pred !== null;
  const probPercent = hasPrediction ? (pred.probability * 100).toFixed(1) : null;
  const isPositive = hasPrediction && pred.predicted_class === 1;

  // Calculate card layout coordinates clamped to stage bounds
  const style = useMemo(() => {
    const cardWidth = 310;
    const cardHeight = 195;

    if (!position || !containerBounds) {
      // Default docked position (top-left) if position is not tracked
      return {
        top: '16px',
        left: '16px',
      };
    }

    const pad = 12;
    // Offset card slightly to right and above/below cursor
    let left = position.x + 18;
    let top = position.y - 70;

    // Flip to left if overflowing right edge
    if (left + cardWidth > containerBounds.width - pad) {
      left = position.x - cardWidth - 18;
    }
    // Clamp horizontally
    left = Math.max(pad, Math.min(left, containerBounds.width - cardWidth - pad));

    // Clamp vertically
    top = Math.max(pad, Math.min(top, containerBounds.height - cardHeight - pad));

    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  }, [position, containerBounds]);

  return (
    <div
      style={style}
      className={`absolute z-30 w-[310px] rounded-2xl bg-white/95 backdrop-blur-md border shadow-xl transition-all duration-200 pointer-events-auto select-none ${
        isSelected
          ? 'border-cyan-400 ring-2 ring-cyan-400/60 shadow-cyan-500/10'
          : 'border-slate-200/90 shadow-slate-900/10 hover:border-slate-300'
      }`}
      role="region"
      aria-label={`Interactive Prediction Card for ${meta.fullName}`}
    >
      <div className="p-3.5 space-y-2.5">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded-md border ${meta.badgeClass}`}>
                {meta.shortLabel}
              </span>
              <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {meta.fma}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: meta.color }}
                title={`${meta.colorName} Identity`}
              />
              {isSelected && (
                <span className="text-[10px] font-mono font-bold text-cyan-800 bg-cyan-100/80 px-1.5 py-0.5 rounded border border-cyan-300">
                  Focused in 3D
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug truncate" title={meta.fullName}>
              {meta.fullName}
            </h4>
          </div>

          {/* Dismiss button when pinned / selected */}
          <button
            type="button"
            onClick={onDismiss}
            title="Dismiss card and reset selection"
            aria-label="Close card"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Prediction Data Panel */}
        <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 space-y-1.5 font-mono">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-[11px] text-slate-600 font-sans">Model Prediction:</span>
            {hasPrediction ? (
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                {probPercent}%
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400 italic font-sans">
                Prediction unavailable
              </span>
            )}
          </div>

          {hasPrediction && (
            <>
              {/* Progress bar */}
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isPositive ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, pred.probability * 100))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                <span>Label: {pred.predicted_label}</span>
                <span>Threshold: 50%</span>
              </div>
            </>
          )}
        </div>

        {/* Course / Territory Footnote */}
        <p className="text-[10px] text-slate-500 leading-relaxed font-sans line-clamp-2">
          {meta.course}
        </p>

        {/* Interaction Hint */}
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-sans">
          <div className="flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-cyan-600 shrink-0" />
            <span>
              {isSelected
                ? 'Camera aligned • Tap elsewhere to reset'
                : 'Click vessel or card to lock camera'}
            </span>
          </div>

          {!isSelected && (
            <button
              type="button"
              onClick={() => onSelect(target === 'Cath' ? null : (target as TargetName))}
              className="text-cyan-700 hover:text-cyan-900 font-semibold"
            >
              Focus View →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Main CoronaryResultsCanvas Component
// --------------------------------------------------------------------------
export interface CoronaryResultsCanvasProps {
  predictionResponse?: PredictionResponse | null;
  selectedTarget?: TargetName | null;
  onSelectTarget?: (target: TargetName | null) => void;
  className?: string;
}

export const CoronaryResultsCanvas: React.FC<CoronaryResultsCanvasProps> = ({
  predictionResponse,
  selectedTarget = null,
  onSelectTarget,
  className = '',
}) => {
  // Respect system reduced-motion preference by default
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Camera presets and transition state
  const [activePreset, setActivePreset] = useState<CameraPresetKey>('anterior');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [enablePulsing, setEnablePulsing] = useState<boolean>(true);

  // Hover and Card interaction state
  const [hoveredTarget, setHoveredTarget] = useState<TargetName | 'Cath' | null>(null);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [containerBounds, setContainerBounds] = useState<{ width: number; height: number } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // Measure container bounds for card clamping
  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerBounds({ width: rect.width, height: rect.height });
      }
    };
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Synchronize camera preset when selectedTarget changes externally
  useEffect(() => {
    if (!selectedTarget) return;

    if (selectedTarget === 'LAD') {
      setActivePreset('anterior');
      setIsTransitioning(true);
      setAutoRotate(false);
    } else if (selectedTarget === 'LCX') {
      setActivePreset('lateral');
      setIsTransitioning(true);
      setAutoRotate(false);
    } else if (selectedTarget === 'RCA') {
      setActivePreset('posterior');
      setIsTransitioning(true);
      setAutoRotate(false);
    } else if (selectedTarget === 'Cath') {
      setActivePreset('superior');
      setIsTransitioning(true);
      setAutoRotate(false);
    }
  }, [selectedTarget]);

  // Listen for reduced motion changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      if (e.matches) {
        setAutoRotate(false);
        setEnablePulsing(false);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // When user interacts with OrbitControls manually, stop camera transition lock
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      setIsTransitioning(false);
    };

    controls.addEventListener('start', handleStart);
    return () => {
      controls.removeEventListener('start', handleStart);
    };
  }, []);

  const handleSelectPreset = useCallback((key: CameraPresetKey) => {
    setActivePreset(key);
    setIsTransitioning(true);
    setAutoRotate(false);
  }, []);

  const handleTransitionEnd = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => !prev);
    setIsTransitioning(false);
  }, []);

  const togglePulsing = useCallback(() => {
    setEnablePulsing((prev) => !prev);
  }, []);

  // Handle pointer hover on vessel
  const handleHoverTarget = useCallback(
    (target: TargetName | 'Cath' | null, event?: ThreeEvent<PointerEvent>) => {
      setHoveredTarget(target);
      if (target && event && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCardPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    },
    []
  );

  // Active target to show in floating card: prioritizes hover, falls back to persistent selected target
  const displayedCardTarget = hoveredTarget || selectedTarget;

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl bg-gradient-to-b from-white/95 via-white/80 to-slate-50/90 border border-slate-200/90 shadow-xs overflow-hidden ${className}`}
      aria-label="Interactive 3D Cardiovascular Model Workspace"
    >
      {/* Background Aurora Halo (Soft, restrained medical glow) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute -top-12 left-1/4 w-80 h-80 rounded-full bg-rose-200/20 blur-3xl" />
        <div className="absolute -bottom-10 right-1/4 w-72 h-72 rounded-full bg-indigo-200/15 blur-3xl" />
      </div>

      {/* Stage Header / Action Bar */}
      <div className="relative z-10 px-4 sm:px-6 py-3.5 border-b border-slate-200/80 bg-white/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Left: Model Identity & Reference Badge */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                3D Anatomical Heart Explorer
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                BodyParts3D Multi-Mesh
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">
              Refined 3-artery color system • LAD (Coral) • LCX (Violet) • RCA (Teal)
            </p>
          </div>
        </div>

        {/* Right: Guided Camera Preset View Buttons & Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Preset Buttons */}
          {(['anterior', 'lateral', 'posterior', 'reset'] as CameraPresetKey[]).map((key) => {
            const preset = CAMERA_PRESETS[key];
            const isActive = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPreset(key)}
                title={preset.description}
                aria-label={`Switch 3D view to ${preset.label}`}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  isActive
                    ? 'bg-rose-50 text-rose-800 border border-rose-300 ring-1 ring-rose-200 font-bold shadow-2xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {key === 'reset' ? (
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                ) : (
                  <Compass className="w-3 h-3 text-rose-500" />
                )}
                <span>{preset.label}</span>
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* Auto-Rotate Turntable Toggle */}
          <button
            type="button"
            onClick={toggleAutoRotate}
            disabled={reducedMotion}
            title={autoRotate ? 'Pause 360° turntable' : 'Enable 360° turntable rotation'}
            aria-label={autoRotate ? 'Pause 360 rotation' : 'Enable 360 rotation'}
            aria-pressed={autoRotate}
            className={`p-1.5 rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 ${
              autoRotate
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
            } ${reducedMotion ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>

          {/* Pulsing Toggle */}
          <button
            type="button"
            onClick={togglePulsing}
            disabled={reducedMotion}
            title={enablePulsing ? 'Pause resting cardiac pulse' : 'Enable resting cardiac pulse'}
            aria-label={enablePulsing ? 'Pause cardiac pulse' : 'Enable cardiac pulse'}
            aria-pressed={enablePulsing}
            className={`p-1.5 rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 ${
              enablePulsing && !reducedMotion
                ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
            } ${reducedMotion ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Heart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Artery Fast-Filter Selector Ribbon */}
      <div className="relative z-10 px-4 sm:px-6 py-2 bg-slate-50/70 border-b border-slate-200/60 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">Focus Vessel:</span>
          <button
            type="button"
            onClick={() => onSelectTarget?.(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              selectedTarget === null
                ? 'bg-slate-800 text-white shadow-2xs font-bold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Vessels
          </button>
          <button
            type="button"
            onClick={() => onSelectTarget?.(selectedTarget === 'LAD' ? null : 'LAD')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 border ${
              selectedTarget === 'LAD'
                ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#E94F70] shrink-0" />
            <span>LAD (Coral)</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTarget?.(selectedTarget === 'LCX' ? null : 'LCX')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 border ${
              selectedTarget === 'LCX'
                ? 'bg-violet-50 text-violet-800 border-violet-300 font-bold shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shrink-0" />
            <span>LCX (Violet)</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTarget?.(selectedTarget === 'RCA' ? null : 'RCA')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 border ${
              selectedTarget === 'RCA'
                ? 'bg-cyan-50 text-cyan-800 border-cyan-300 font-bold shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#0891B2] shrink-0" />
            <span>RCA (Teal)</span>
          </button>
        </div>

        <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
          <span>Distinct identity palette • Hover or tap for prediction cards</span>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="relative w-full h-[380px] sm:h-[440px] lg:h-[480px] cursor-grab active:cursor-grabbing touch-none select-none">
        <WebGLErrorBoundary>
          <Suspense fallback={<ResultsCanvasLoadingFallback />}>
            <Canvas
              camera={{
                position: CAMERA_PRESETS.anterior.position,
                fov: 46,
              }}
              gl={{
                antialias: true,
                powerPreference: 'high-performance',
                alpha: true,
              }}
              dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)]}
              onPointerMissed={() => {
                // Clicking background clears selection and hides cards
                onSelectTarget?.(null);
                setHoveredTarget(null);
              }}
            >
              <StageLighting />

              {/* Verified BodyParts3D Multi-Mesh Anatomical Model with Rich Warm Tissue */}
              <AnatomicalCoronaryHeart
                reducedMotion={reducedMotion}
                enablePulsing={enablePulsing}
                selectedTarget={selectedTarget}
                onSelectTarget={onSelectTarget}
                hoveredTarget={hoveredTarget}
                onHoverTarget={handleHoverTarget}
              />

              {/* Camera Rig with smooth transitions and OrbitControls */}
              <CameraRig
                targetPreset={CAMERA_PRESETS[activePreset]}
                isTransitioning={isTransitioning}
                onTransitionEnd={handleTransitionEnd}
                controlsRef={controlsRef}
                autoRotate={autoRotate}
              />
            </Canvas>
          </Suspense>
        </WebGLErrorBoundary>

        {/* Compact Artery Color Legend inside 3D viewer (Bottom-Right) */}
        <ArteryColorLegend
          selectedTarget={selectedTarget}
          onSelectTarget={onSelectTarget}
        />

        {/* Interactive Floating Hover Card */}
        {displayedCardTarget && (
          <FloatingPredictionCard
            target={displayedCardTarget}
            isSelected={selectedTarget === displayedCardTarget}
            predictionResponse={predictionResponse}
            position={cardPosition}
            containerBounds={containerBounds}
            onDismiss={() => {
              onSelectTarget?.(null);
              setHoveredTarget(null);
            }}
            onSelect={(t) => {
              onSelectTarget?.(t);
            }}
          />
        )}
      </div>

      {/* Bottom Stage Footer: Interaction Hints & Attribution Notice */}
      <div className="relative z-10 px-4 sm:px-6 py-2.5 bg-white/75 backdrop-blur-md border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Eye className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Click legend or vessel to focus territory • Hover reveals prediction cards • Drag to rotate</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 font-sans">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>BodyParts3D, © DBCLS (CC BY-SA 2.1 Japan) — General anatomical model, not patient-specific geometry</span>
        </div>
      </div>
    </div>
  );
};
