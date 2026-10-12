import React, { useEffect, useState, useRef } from 'react';

interface AuroraBackgroundProps {
  reducedMotion?: boolean;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  reducedMotion = false,
}) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 30 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;

    let rafId: number;
    let targetX = 50;
    let targetY = 30;
    let currentX = 50;
    let currentY = 30;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized percentage across window
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
    };

    const animateGlow = () => {
      // Smooth interpolation for silky non-jittery glow tracking
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      setMousePos({ x: currentX, y: currentY });
      rafId = requestAnimationFrame(animateGlow);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(animateGlow);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Off-white baseline background */}
      <div className="absolute inset-0 bg-[#F8FAFC]" />

      {/* Subtle Dot Grid Pattern (React Bits / Magic UI inspired) */}
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Aurora Node 1: Soft Cyan Floating Orb */}
      <div
        className="absolute -top-[10%] left-[5%] w-[600px] sm:w-[750px] h-[500px] sm:h-[650px] rounded-full blur-[130px] opacity-70 animate-aurora-1 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, rgba(6, 182, 212, 0.12) 50%, transparent 75%)',
        }}
      />

      {/* Aurora Node 2: Soft Lavender Floating Orb */}
      <div
        className="absolute top-[15%] right-[0%] w-[550px] sm:w-[700px] h-[550px] sm:h-[700px] rounded-full blur-[140px] opacity-65 animate-aurora-2 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, rgba(192, 132, 252, 0.10) 50%, transparent 75%)',
        }}
      />

      {/* Aurora Node 3: Soft Coral / Rose Floating Orb */}
      <div
        className="absolute top-[48%] left-[25%] w-[500px] sm:w-[650px] h-[450px] sm:h-[600px] rounded-full blur-[150px] opacity-50 animate-aurora-3 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(251, 113, 133, 0.20) 0%, rgba(253, 164, 175, 0.08) 55%, transparent 75%)',
        }}
      />

      {/* Aurora Node 4: Lower Page Sky-Blue Accent */}
      <div
        className="absolute bottom-[-10%] right-[15%] w-[600px] h-[500px] rounded-full blur-[140px] opacity-60 animate-aurora-1 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(99, 102, 241, 0.10) 60%, transparent 80%)',
        }}
      />

      {/* Restrained Cursor-Reactive Glow (silky follower) */}
      {!reducedMotion && (
        <div
          className="absolute w-[450px] h-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px] pointer-events-none transition-opacity duration-700 opacity-45"
          style={{
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
            background:
              'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(167, 139, 250, 0.15) 45%, transparent 70%)',
          }}
        />
      )}
    </div>
  );
};
