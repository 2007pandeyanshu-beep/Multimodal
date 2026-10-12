import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, Center } from '@react-three/drei';
import * as THREE from 'three';

interface BackgroundHeartProps {
  reducedMotion: boolean;
}

function CalibratedHeartModel({ reducedMotion }: BackgroundHeartProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/heart.glb');

  // Clone scene and apply rich anatomical material properties
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const originalMat = mesh.material as THREE.MeshStandardMaterial;
          const mat = originalMat.clone();
          mat.transparent = true;
          mat.opacity = 0.88; // Rich opacity: reveals authentic surface texture and coronary contours
          mat.roughness = 0.38;
          mat.metalness = 0.12;
          mat.depthWrite = true; // Crisp z-buffering for anatomical depth
          mat.needsUpdate = true;
          mesh.material = mat;
        }
      }
    });
    return clone;
  }, [scene]);

  // Physiological resting cardiac cycle (72 BPM ≈ 0.833s period)
  const BPM = 72;
  const cyclePeriod = 60 / BPM;

  // Calibrated scale: comfortable presence with zero clipping of aortic arch or apex
  const baseScale = 1.72;

  useFrame((state) => {
    if (!groupRef.current) return;

    if (reducedMotion) {
      groupRef.current.scale.set(baseScale, baseScale, baseScale);
      return;
    }

    const t = state.clock.getElapsedTime();
    const cycleTime = t % cyclePeriod;
    const p = cycleTime / cyclePeriod;

    // Physiological biphasic cardiac pulse (systole + dicrotic notch)
    let pulseFactor = 0;
    if (p < 0.18) {
      pulseFactor = Math.sin((p / 0.18) * Math.PI);
    } else if (p >= 0.22 && p < 0.36) {
      pulseFactor = 0.34 * Math.sin(((p - 0.22) / 0.14) * Math.PI);
    }

    const scale = baseScale * (1 + pulseFactor * 0.026);
    groupRef.current.scale.set(scale, scale, scale);

    // Subtle, natural anatomical drifting rotation (slow and calm)
    groupRef.current.rotation.y = t * 0.05 + Math.sin(t * 0.1) * 0.03;
    groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.02 - 0.015;
    groupRef.current.rotation.z = Math.cos(t * 0.06) * 0.02;
  });

  return (
    <group ref={groupRef} dispose={null}>
      <Center top={false}>
        <primitive object={clonedScene} />
      </Center>
    </group>
  );
}

useGLTF.preload('/models/heart.glb');

interface AtmosphericCardiacBackgroundProps {
  reducedMotion: boolean;
}

export const AtmosphericCardiacBackground: React.FC<
  AtmosphericCardiacBackgroundProps
> = ({ reducedMotion }) => {
  // Performance optimization: native IntersectionObserver (zero scroll event listeners)
  const [isHeroVisible, setIsHeroVisible] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const heroEl = document.getElementById('hero-section');
    if (!heroEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.02,
      }
    );

    observer.observe(heroEl);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className="absolute top-0 inset-x-0 h-[880px] pointer-events-none overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {/* 3D Anatomical Heart Scene */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Canvas
          frameloop={isHeroVisible ? 'always' : 'never'}
          camera={{ position: [0, 0.05, 5.5], fov: 40 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true,
          }}
          dpr={[1, typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.5) : 1]}
        >
          {/* Natural key light revealing anatomical texture */}
          <ambientLight intensity={1.4} />

          <directionalLight
            position={[3, 4, 4]}
            intensity={1.8}
            color="#ffffff"
          />

          {/* Anterior fill light */}
          <directionalLight
            position={[-4, 2, 3]}
            intensity={1.1}
            color="#f0fdf4"
          />

          {/* High-definition Cyan/Teal Rim Highlight */}
          <directionalLight
            position={[4, 2, -3]}
            intensity={3.4}
            color="#38bdf8"
          />

          {/* Muted Lavender Contour Rim Highlight */}
          <directionalLight
            position={[-4, 3, -3]}
            intensity={2.8}
            color="#a78bfa"
          />

          {/* Subtle Coral Ventricular Base Accent */}
          <pointLight
            position={[0, -3.2, 1.8]}
            intensity={1.4}
            color="#fb7185"
            distance={8}
          />

          <Suspense fallback={null}>
            <Float
              speed={reducedMotion ? 0 : 0.6}
              rotationIntensity={reducedMotion ? 0 : 0.04}
              floatIntensity={reducedMotion ? 0 : 0.10}
            >
              <CalibratedHeartModel reducedMotion={reducedMotion} />
            </Float>
          </Suspense>
        </Canvas>
      </div>

      {/* Subtle Central Contrast Mask: ensures crystal-clear deep navy text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 50% 42%, rgba(250, 251, 252, 0.70) 0%, rgba(250, 251, 252, 0.38) 50%, rgba(250, 251, 252, 0.90) 100%)',
        }}
      />
    </div>
  );
};
