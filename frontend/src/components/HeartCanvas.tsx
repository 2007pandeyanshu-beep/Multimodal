import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Center, Float } from '@react-three/drei';
import * as THREE from 'three';

interface HeartModelProps {
  reducedMotion: boolean;
}

function HeartModel({ reducedMotion }: HeartModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Load the CC-BY-4.0 Realistic Human Heart GLB model
  const { scene } = useGLTF('/models/heart.glb');

  // Clone scene so materials/textures remain independent if re-rendered
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Enhance material properties while strictly preserving natural anatomical textures
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.roughness = Math.max(0.4, mat.roughness ?? 0.5);
          mat.metalness = Math.min(0.2, mat.metalness ?? 0.1);
          mat.envMapIntensity = 0.8;
          mat.needsUpdate = true;
        }
      }
    });
    return clone;
  }, [scene]);

  // Cardiac cycle parameters: Resting rate of ~72 BPM (period = 60 / 72 ≈ 0.833 seconds)
  const BPM = 72;
  const cyclePeriod = 60 / BPM; // 0.8333s

  useFrame((state) => {
    if (!groupRef.current) return;

    if (reducedMotion) {
      groupRef.current.scale.set(1.4, 1.4, 1.4);
      return;
    }

    const t = state.clock.getElapsedTime();
    const cycleTime = t % cyclePeriod;
    const p = cycleTime / cyclePeriod; // 0.0 -> 1.0

    // Non-linear cardiac pulse formula
    // Phase 1: Ventricular Systole (S1 "lub") ~ first 18% of cycle
    // Phase 2: Dicrotic Notch / Atrial Kick (S2 "dub") ~ between 22% and 36%
    // Phase 3: Diastolic relaxation & resting pause ~ remaining cycle
    let pulseFactor = 0;
    if (p < 0.18) {
      // Smooth sinusoidal primary ejection peak
      pulseFactor = Math.sin((p / 0.18) * Math.PI);
    } else if (p >= 0.22 && p < 0.36) {
      // Secondary subtle dicrotic wave
      pulseFactor = 0.42 * Math.sin(((p - 0.22) / 0.14) * Math.PI);
    } else {
      // Natural resting relaxation
      pulseFactor = 0;
    }

    // Restrained, physiological scale expansion (roughly 3.8% radial, 4.5% vertical)
    // Scale baseline is 1.4 to fill the right viewport comfortably
    const baseScale = 1.42;
    const scaleX = baseScale * (1 + pulseFactor * 0.038);
    const scaleY = baseScale * (1 + pulseFactor * 0.046);
    const scaleZ = baseScale * (1 + pulseFactor * 0.036);

    groupRef.current.scale.set(scaleX, scaleY, scaleZ);

    // Subtle natural anatomical drifting rotation
    groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.12 + 0.1;
    groupRef.current.rotation.x = Math.sin(t * 0.25) * 0.05 - 0.05;
    groupRef.current.rotation.z = Math.cos(t * 0.3) * 0.04;
  });

  return (
    <group ref={groupRef} dispose={null}>
      <Center>
        <primitive object={clonedScene} />
      </Center>
    </group>
  );
}

// Preload the GLB model asset
useGLTF.preload('/models/heart.glb');

function LoadingHeartFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 24, 24]} />
      <meshStandardMaterial
        color="#0284c7"
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}

interface HeartCanvasProps {
  reducedMotion: boolean;
}

export const HeartCanvas: React.FC<HeartCanvasProps> = ({ reducedMotion }) => {
  return (
    <div className="relative w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 46 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
        }}
        dpr={[1, 2]}
      >
        {/* Natural Key Light: Warm/neutral illumination preserving organic anatomical tissues */}
        <ambientLight intensity={1.1} />
        <directionalLight
          position={[4, 5, 4]}
          intensity={1.6}
          color="#ffffff"
          castShadow
        />

        {/* Secondary Fill Light: Soft neutral light from anterior-left */}
        <directionalLight
          position={[-4, 2, 3]}
          intensity={0.8}
          color="#f1f5f9"
        />

        {/* Cool-Blue Rim Light: Back-right highlight for exquisite anatomical edge definition against navy */}
        <directionalLight
          position={[5, 3, -4]}
          intensity={3.2}
          color="#38bdf8"
        />

        {/* Secondary Cool-Blue Contour Light: Upper-left rear rim */}
        <directionalLight
          position={[-4, 4, -4]}
          intensity={2.0}
          color="#60a5fa"
        />

        {/* Soft cyan bottom fill light */}
        <pointLight
          position={[0, -4, 2]}
          intensity={0.7}
          color="#06b6d4"
          distance={8}
        />

        {/* 3D Heart Model with floating container */}
        <Suspense fallback={<LoadingHeartFallback />}>
          <Float
            speed={reducedMotion ? 0 : 1.2}
            rotationIntensity={reducedMotion ? 0 : 0.15}
            floatIntensity={reducedMotion ? 0 : 0.25}
          >
            <HeartModel reducedMotion={reducedMotion} />
          </Float>
        </Suspense>

        {/* Interactive OrbitControls for user exploration */}
        <OrbitControls
          enableZoom={true}
          minDistance={3.5}
          maxDistance={8.5}
          enablePan={false}
          enableRotate={!reducedMotion}
          dampingFactor={0.06}
          rotateSpeed={0.8}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
};
