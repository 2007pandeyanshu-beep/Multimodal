import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroLeft } from './components/HeroLeft';
import { HeartCanvas } from './components/HeartCanvas';
import { ScanningFrame } from './components/ScanningFrame';
import {
  AboutModal,
  FeaturesModal,
  ModelNoticeModal,
} from './components/InfoModals';
import { PatientAssessmentModal } from './components/PatientAssessmentModal';

const INTRO_DELAY_MS = 4500;

export default function App() {
  const [isRevealed, setIsRevealed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Modal dialog states
  const [activeModal, setActiveModal] = useState<
    'about' | 'features' | 'get-started' | 'assessment' | 'model-notice' | null
  >(null);

  // Intro sequence timing & accessibility
  useEffect(() => {
    // Check user preference for reduced motion
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);

    if (mql.matches) {
      // Immediate reveal if user prefers reduced motion
      setIsRevealed(true);
      setProgress(1);
      return;
    }

    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const currentRatio = Math.min(1, elapsed / INTRO_DELAY_MS);
      setProgress(currentRatio);

      if (currentRatio >= 1) {
        setIsRevealed(true);
        clearInterval(interval);
      }
    }, 25);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      if (e.matches) {
        setIsRevealed(true);
        setProgress(1);
      }
    };
    mql.addEventListener('change', handleMotionChange);

    return () => {
      clearInterval(interval);
      mql.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#070d1e] text-slate-100 overflow-x-hidden flex flex-col justify-between font-sans">
      {/* Navigation Header */}
      <Header
        onOpenAbout={() => setActiveModal('about')}
        onOpenFeatures={() => setActiveModal('features')}
        onOpenGetStarted={() => setActiveModal('get-started')}
        isRevealed={isRevealed}
      />

      {/* Main Split Layout Container */}
      <main className="relative w-full min-h-screen flex flex-col lg:flex-row items-stretch">
        {/* Left Side: Crisp Off-White Background with Dark Navy Typography */}
        <div
          className="relative w-full lg:w-[54%] xl:w-[52%] bg-[#F8FAFC] min-h-[60vh] lg:min-h-screen z-20 flex items-center shadow-2xl transition-all"
          style={{
            // Sharp diagonal divider cutting down to the bottom right on desktop
            clipPath:
              typeof window !== 'undefined' && window.innerWidth >= 1024
                ? 'polygon(0 0, 100% 0, 85% 100%, 0 100%)'
                : 'none',
          }}
        >
          {/* Subtle warm off-white clinical background texture */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#f1f5f9] pointer-events-none" />

          {/* Left Content (Eyebrow, Intro telemetry, Main headline, Supporting text, CTA) */}
          <HeroLeft
            isRevealed={isRevealed}
            progress={progress}
            onOpenGetStarted={() => setActiveModal('get-started')}
            onOpenFeatures={() => setActiveModal('features')}
          />
        </div>

        {/* Right Side: Deep Navy Background with 3D Anatomical Heart & Scanning Frame */}
        <div className="relative w-full lg:w-[52%] lg:-ml-[6%] xl:w-[54%] xl:-ml-[6%] min-h-[500px] lg:min-h-screen bg-[#070d1e] flex items-center justify-center overflow-hidden z-10">
          {/* Deep Navy Atmosphere & Subtle Cool-Blue Glow Backdrop */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_50%,rgba(14,165,233,0.14),rgba(7,13,30,0.95)_70%)]" />
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Faint Cyan Scanning Frame & HUD Overlays */}
          <ScanningFrame
            onOpenModelInfo={() => setActiveModal('model-notice')}
          />

          {/* 3D Realistic Anatomical Heart Canvas */}
          <div className="relative w-full h-[520px] sm:h-[600px] lg:h-full min-h-full">
            <HeartCanvas reducedMotion={reducedMotion} />
          </div>
        </div>
      </main>

      {/* Interactive Information & Safety Modals */}
      <AboutModal
        isOpen={activeModal === 'about'}
        onClose={() => setActiveModal(null)}
      />
      <FeaturesModal
        isOpen={activeModal === 'features'}
        onClose={() => setActiveModal(null)}
      />
      <PatientAssessmentModal
        isOpen={activeModal === 'get-started' || activeModal === 'assessment'}
        onClose={() => setActiveModal(null)}
      />
      <ModelNoticeModal
        isOpen={activeModal === 'model-notice'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
