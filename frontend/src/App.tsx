import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AtmosphericCardiacBackground } from './components/landing/AtmosphericCardiacBackground';
import { ScrollVascularEnvironment } from './components/landing/ScrollVascularEnvironment';
import { CinematicHero } from './components/landing/CinematicHero';
import { ProblemApproachSection } from './components/landing/ProblemApproachSection';
import { PredictionTargetsSection } from './components/landing/PredictionTargetsSection';
import { HowItWorksSection } from './components/landing/HowItWorksSection';
import { ModelArchitectureSection } from './components/landing/ModelArchitectureSection';
import { TransparencySection } from './components/landing/TransparencySection';
import { ClosingCtaSection } from './components/landing/ClosingCtaSection';
import { Footer } from './components/landing/Footer';
import {
  AboutModal,
  FeaturesModal,
  ModelNoticeModal,
} from './components/InfoModals';
import { PatientAssessmentModal } from './components/PatientAssessmentModal';
import {
  parseHashDestination,
  type WorkspaceDestination,
} from './api/assessmentState.ts';

export default function App() {
  const [reducedMotion, setReducedMotion] = useState(false);

  // Modal dialog states
  const [activeModal, setActiveModal] = useState<
    'about' | 'features' | 'get-started' | 'assessment' | 'model-notice' | null
  >(null);

  // Active hash-based workspace destination
  const [workspaceDestination, setWorkspaceDestination] = useState<WorkspaceDestination | null>(() => {
    return typeof window !== 'undefined' ? parseHashDestination(window.location.hash) : null;
  });

  useEffect(() => {
    const handleHashChange = () => {
      setWorkspaceDestination(parseHashDestination(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Dynamic user preference for reduced motion
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mql.addEventListener('change', handleMotionChange);

    return () => {
      mql.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-full min-h-screen bg-[#FAFBFC] text-slate-900 font-sans selection:bg-sky-500/20 selection:text-sky-950">
      {/* Immersive 3D Atmospheric Background */}
      <AtmosphericCardiacBackground reducedMotion={reducedMotion} />

      {/* Continuous Scroll-Based Vascular Environment */}
      <ScrollVascularEnvironment reducedMotion={reducedMotion} />

      {/* Sticky Frosted Header */}
      <Header
        onOpenAbout={() => setActiveModal('about')}
        onOpenFeatures={() => setActiveModal('features')}
        onOpenGetStarted={() => setActiveModal('get-started')}
        onOpenModelNotice={() => setActiveModal('model-notice')}
      />

      {/* Main Landing Journey */}
      <main className="relative z-10 w-full flex flex-col print:hidden">
        {/* Section A: Cinematic Hero */}
        <CinematicHero
          reducedMotion={reducedMotion}
          onOpenGetStarted={() => setActiveModal('get-started')}
          onScrollToExplore={() => scrollToSection('problem-approach')}
        />

        {/* Section B: The Problem & Scientific Approach */}
        <ProblemApproachSection
          onOpenGetStarted={() => setActiveModal('get-started')}
        />

        {/* Section C: Four Dedicated Prediction Targets (Cath, LAD, LCX, RCA) */}
        <PredictionTargetsSection />

        {/* Section D: How It Works */}
        <HowItWorksSection
          onOpenGetStarted={() => setActiveModal('get-started')}
        />

        {/* Section E: Implemented Model Architecture */}
        <ModelArchitectureSection />

        {/* Section F: Transparency & Limitations */}
        <TransparencySection
          onOpenModelNotice={() => setActiveModal('model-notice')}
          onOpenFeatures={() => setActiveModal('features')}
        />

        {/* Section G: Closing Call to Action */}
        <ClosingCtaSection
          onOpenGetStarted={() => setActiveModal('get-started')}
          onOpenFeatures={() => setActiveModal('features')}
        />
      </main>

      {/* Footer */}
      <div className="print:hidden">
        <Footer
          onOpenAbout={() => setActiveModal('about')}
          onOpenFeatures={() => setActiveModal('features')}
          onOpenGetStarted={() => setActiveModal('get-started')}
          onOpenModelNotice={() => setActiveModal('model-notice')}
        />
      </div>

      {/* Interactive Safety & Information Modals */}
      <AboutModal
        isOpen={activeModal === 'about'}
        onClose={() => setActiveModal(null)}
      />
      <FeaturesModal
        isOpen={activeModal === 'features'}
        onClose={() => setActiveModal(null)}
      />
      <PatientAssessmentModal
        isOpen={
          activeModal === 'get-started' ||
          activeModal === 'assessment' ||
          workspaceDestination !== null
        }
        onClose={() => {
          setActiveModal(null);
          setWorkspaceDestination(null);
          if (typeof window !== 'undefined' && window.location.hash) {
            window.history.pushState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />
      <ModelNoticeModal
        isOpen={activeModal === 'model-notice'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
