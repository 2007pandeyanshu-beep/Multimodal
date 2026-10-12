import React, { useEffect, useRef } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Activity,
  Layers,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import { createScope, createTimeline } from 'animejs';
import { AnimatedEcgLine } from './AnimatedEcgLine';

interface CinematicHeroProps {
  reducedMotion: boolean;
  onOpenGetStarted: () => void;
  onScrollToExplore: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({
  reducedMotion,
  onOpenGetStarted,
  onScrollToExplore,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fast, elegant Anime.js coordinated entrance sequence
  useEffect(() => {
    if (reducedMotion || !containerRef.current) return;

    const scope = createScope({ root: containerRef.current });
    scope.add(() => {
      const tl = createTimeline({
        defaults: {
          ease: 'outCubic',
        },
      });

      tl.add('.hero-kicker', {
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 500,
      })
        .add(
          '.hero-line-1',
          {
            opacity: [0, 1],
            translateY: [24, 0],
            duration: 650,
          },
          '-=300'
        )
        .add(
          '.hero-line-2',
          {
            opacity: [0, 1],
            translateY: [24, 0],
            duration: 650,
          },
          '-=400'
        )
        .add(
          '.hero-identity',
          {
            opacity: [0, 1],
            scale: [0.96, 1],
            duration: 550,
          },
          '-=350'
        )
        .add(
          '.hero-copy',
          {
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 550,
          },
          '-=350'
        )
        .add(
          '.hero-ctas',
          {
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 500,
          },
          '-=300'
        )
        .add(
          '.hero-highlights',
          {
            opacity: [0, 1],
            translateY: [12, 0],
            duration: 500,
          },
          '-=250'
        )
        .add(
          '.hero-scroll-cue',
          {
            opacity: [0, 1],
            duration: 600,
          },
          '-=200'
        );
    });

    return () => {
      scope.revert();
    };
  }, [reducedMotion]);

  return (
    <section
      id="hero-section"
      ref={containerRef}
      className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col justify-between items-center px-4 sm:px-6 lg:px-8 pt-12 pb-8 max-w-5xl mx-auto text-center"
      aria-label="CardioVision AI Cinematic Hero"
    >
      <div className="flex-1 flex flex-col justify-center items-center w-full my-auto">
        {/* Eyebrow Kicker Badge */}
        <div className="hero-kicker inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md mb-6 sm:mb-8">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
          </span>
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-slate-800">
            Cardiovascular Intelligence Platform
          </span>
        </div>

        {/* Centrally Composed Two-Line Animated Headline */}
        <div className="space-y-1 sm:space-y-2 mb-6 max-w-4xl">
          <h1 className="hero-line-1 text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-black tracking-tight text-slate-950 leading-[1.12]">
            Every heartbeat tells a story.
          </h1>
          <h2 className="hero-line-2 text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-black tracking-tight text-slate-700 leading-[1.12]">
            Discover what lies beneath.
          </h2>
        </div>

        {/* Brand Identity & Supporting Copy */}
        <div className="max-w-2xl mx-auto mb-8 sm:mb-10 space-y-4">
          <div className="hero-identity inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 text-white shadow-xs">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-xs font-mono font-bold tracking-wider">
              CardioVision AI
            </span>
          </div>

          <p className="hero-copy text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed font-normal">
            Explore cardiovascular risk predictions through machine learning and structured patient assessment.
          </p>
        </div>

        {/* Working CTAs */}
        <div className="hero-ctas flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10">
          {/* Primary CTA */}
          <button
            onClick={onOpenGetStarted}
            className="w-full sm:w-auto group inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-slate-950 hover:bg-slate-900 active:bg-black rounded-2xl shadow-xl hover:shadow-sky-950/20 hover:ring-2 hover:ring-sky-500/50 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="Start Patient Assessment Wizard"
          >
            <Activity className="w-5 h-5 text-sky-400" />
            <span>Start Assessment</span>
            <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform duration-200" />
          </button>

          {/* Secondary CTA */}
          <button
            onClick={onScrollToExplore}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-semibold text-slate-700 hover:text-slate-950 bg-white/90 hover:bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <span>Explore How It Works</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Minimal Decorative ECG Line */}
        <div className="w-48 sm:w-64 h-6 mb-8 opacity-80" aria-hidden="true">
          <AnimatedEcgLine reducedMotion={reducedMotion} />
        </div>

        {/* Clinical Highlights Strip */}
        <div className="hero-highlights grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl w-full">
          <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/70 shadow-xs backdrop-blur-md flex items-center justify-center gap-2.5 text-xs text-slate-700">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="font-semibold">54 Canonical Features</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/70 shadow-xs backdrop-blur-md flex items-center justify-center gap-2.5 text-xs text-slate-700">
            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-semibold">LAD • LCX • RCA Localization</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/70 shadow-xs backdrop-blur-md flex items-center justify-center gap-2.5 text-xs text-slate-700">
            <Activity className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="font-semibold">Zero Silent Imputation</span>
          </div>
        </div>
      </div>

      {/* Subtle Scroll Cue */}
      <button
        onClick={onScrollToExplore}
        className="hero-scroll-cue pt-4 pb-2 text-[11px] font-mono uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 focus:outline-none"
        aria-label="Scroll down to explore methodology"
      >
        <span>Explore Methodology</span>
        <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
      </button>
    </section>
  );
};
