import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { createScope, createTimeline } from 'animejs';
import { HeartCanvas } from '../HeartCanvas';
import { ScanningFrame } from '../ScanningFrame';
import { AnimatedEcgLine } from './AnimatedEcgLine';

interface HeroSectionProps {
  reducedMotion: boolean;
  onOpenGetStarted: () => void;
  onOpenModelNotice: () => void;
  onOpenFeatures: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  reducedMotion,
  onOpenGetStarted,
  onOpenModelNotice,
  onOpenFeatures,
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const heartStageRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  // Anime.js Entrance Timeline
  useEffect(() => {
    if (reducedMotion || !heroRef.current) return;

    const scope = createScope({ root: heroRef.current });
    scope.add(() => {
      const tl = createTimeline({
        defaults: {
          ease: 'outCubic',
        },
      });

      tl.add('.hero-anim-badge', {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 650,
      })
        .add(
          '.hero-anim-title',
          {
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 800,
          },
          '-=350'
        )
        .add(
          '.hero-anim-copy',
          {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 650,
          },
          '-=450'
        )
        .add(
          '.hero-anim-cta',
          {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 600,
          },
          '-=400'
        )
        .add(
          '.hero-anim-highlights',
          {
            opacity: [0, 1],
            translateY: [15, 0],
            duration: 550,
          },
          '-=350'
        )
        .add(
          '.hero-anim-heart-stage',
          {
            opacity: [0, 1],
            scale: [0.95, 1],
            duration: 900,
          },
          '-=750'
        );
    });

    return () => {
      scope.revert();
    };
  }, [reducedMotion]);

  // Restrained mouse parallax for 3D stage
  useEffect(() => {
    if (reducedMotion) return;

    let rafId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalized between -1 and 1, clamped to max 12px translation
      targetX = ((e.clientX - innerWidth / 2) / (innerWidth / 2)) * 10;
      targetY = ((e.clientY - innerHeight / 2) / (innerHeight / 2)) * 8;
    };

    const updateParallax = () => {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      setParallaxOffset({ x: currentX, y: currentY });
      rafId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={heroRef}
      className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col justify-center px-4 sm:px-8 lg:px-12 py-12 lg:py-16 max-w-7xl mx-auto"
      aria-label="CardioVision Hero Section"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Typography & CTAs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-center max-w-2xl">
          {/* Eyebrow Badge & ECG Pulse */}
          <div className="hero-anim-badge flex flex-wrap items-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
              </span>
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-slate-800">
                Cardiovascular Risk Intelligence
              </span>
            </div>

            {/* Decorative ECG mini-trace */}
            <div className="w-28 sm:w-36 h-6 hidden sm:block">
              <AnimatedEcgLine reducedMotion={reducedMotion} />
            </div>
          </div>

          {/* Primary Headline */}
          <h1 className="hero-anim-title text-4xl sm:text-5xl lg:text-6xl xl:text-[4.15rem] font-black tracking-tight text-slate-950 leading-[1.08] mb-6">
            See Beyond the{' '}
            <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-rose-500 bg-clip-text text-transparent">
              Heartbeat.
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="hero-anim-copy text-lg sm:text-xl text-slate-700 leading-relaxed font-normal mb-8 max-w-xl">
            Explore cardiovascular risk predictions through machine learning and structured patient assessment.
          </p>

          {/* CTA Buttons */}
          <div className="hero-anim-cta flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
            {/* Primary CTA */}
            <button
              onClick={onOpenGetStarted}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-slate-950 hover:bg-slate-900 active:bg-black rounded-2xl shadow-xl hover:shadow-sky-950/20 hover:ring-2 hover:ring-sky-500/50 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Get Started with Patient Assessment"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            {/* Secondary CTA */}
            <button
              onClick={scrollToHowItWorks}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-slate-700 hover:text-slate-950 bg-white/90 hover:bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <span>How It Works</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Clinical Highlights Matrix */}
          <div className="hero-anim-highlights pt-8 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 border border-slate-200/60 shadow-xs">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600 mt-0.5 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 block mb-0.5">
                  Multi-Artery Localization
                </span>
                <span className="text-slate-600 leading-normal">
                  Independent target predictions for LAD, LCX, and RCA vessel involvement.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 border border-slate-200/60 shadow-xs">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 mt-0.5 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 block mb-0.5">
                  Strict Data Provenance
                </span>
                <span className="text-slate-600 leading-normal">
                  54 canonical clinical features with zero silent default imputation.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Anatomical Heart Stage (5 cols) */}
        <div className="lg:col-span-5 flex justify-center items-center w-full">
          <div
            ref={heartStageRef}
            className="hero-anim-heart-stage relative w-full aspect-square max-w-[520px] sm:max-w-[560px] lg:max-w-none h-[480px] sm:h-[540px] lg:h-[620px] rounded-3xl p-1 overflow-hidden transition-transform duration-150 ease-out"
            style={{
              transform: reducedMotion
                ? 'none'
                : `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
            }}
          >
            {/* Soft Luminous Frosted Container */}
            <div className="relative w-full h-full rounded-[22px] bg-gradient-to-b from-white/95 via-white/80 to-slate-50/90 backdrop-blur-2xl border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.06)] overflow-hidden flex items-center justify-center">
              {/* Internal Aurora Glow Backdrop */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Soft Sky Halo */}
                <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />
                {/* Soft Lavender Halo */}
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-indigo-400/15 blur-3xl pointer-events-none" />
                {/* Soft Coral Rim Halo */}
                <div className="absolute top-1/2 right-10 w-48 h-48 rounded-full bg-rose-400/10 blur-2xl pointer-events-none" />
              </div>

              {/* HUD / Scanning Frame Overlay */}
              <ScanningFrame onOpenModelInfo={onOpenModelNotice} />

              {/* 3D Realistic Anatomical Heart Canvas */}
              <div className="relative w-full h-full z-0">
                <HeartCanvas reducedMotion={reducedMotion} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
