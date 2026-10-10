import React from 'react';
import { ArrowRight, ChevronRight, Layers, ShieldCheck } from 'lucide-react';

interface HeroLeftProps {
  isRevealed: boolean;
  progress: number;
  onOpenGetStarted: () => void;
  onOpenFeatures: () => void;
}

export const HeroLeft: React.FC<HeroLeftProps> = ({
  isRevealed,
  progress,
  onOpenGetStarted,
  onOpenFeatures,
}) => {
  return (
    <div className="relative z-20 flex flex-col justify-center min-h-screen px-6 sm:px-12 lg:px-20 pt-24 pb-16 max-w-2xl lg:max-w-3xl">
      {/* Eyebrow text badge */}
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 text-slate-800 shadow-sm backdrop-blur-sm">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600"></span>
          </span>
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-slate-900">
            AI + MEDICAL IMAGING
          </span>
        </div>
        <span className="text-xs font-mono text-slate-600 hidden sm:inline-block">
          CLINICAL RESEARCH PLATFORM
        </span>
      </div>

      {/* Intro Telemetry (Visible only during the first 4.5 seconds before reveal) */}
      {!isRevealed && (
        <div
          role="status"
          aria-live="polite"
          className="mb-8 p-4 rounded-xl bg-white/70 border border-slate-200/80 shadow-sm backdrop-blur-sm transition-opacity duration-500"
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-600 mb-2">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              SYNCHRONIZING CARDIAC GEOMETRY...
            </span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-75 ease-linear"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="text-[11px] font-mono text-slate-600 mt-2">
            Rendering 3D anatomical model (CC-BY 4.0) at resting ~72 BPM
          </div>
        </div>
      )}

      {/* Main Headline, Supporting Text, and CTA (Smoothly reveals at 4.5s) */}
      <div
        className={`transition-all duration-1000 ease-out transform ${
          isRevealed
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.08] mb-6">
          Early insights.
          <span className="block text-slate-900">
            Better outcomes.
          </span>
        </h1>

        {/* Supporting text */}
        <p className="text-lg sm:text-xl text-slate-700 leading-relaxed font-normal mb-10 max-w-xl">
          Visualize cardiovascular risk with precision, clarity and confidence.
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-12">
          {/* Main CTA Button */}
          <button
            onClick={onOpenGetStarted}
            className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-white bg-slate-950 hover:bg-slate-900 active:bg-black rounded-xl shadow-lg hover:shadow-cyan-950/20 hover:ring-2 hover:ring-cyan-500/50 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <span>Start Patient Assessment</span>
            <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform duration-200" />
          </button>

          {/* Secondary Action / Explore Architecture */}
          <button
            onClick={onOpenFeatures}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-medium text-slate-800 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-sm hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Explore Architecture</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Clinical Rigor Highlights */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200/90 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
            <span>Multi-vessel risk localization (LAD, LCX, RCA)</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
            <span>Strict data leakage guard & explainable attribution</span>
          </div>
        </div>

        {/* Regulatory & Safety Notice */}
        <div className="mt-6 text-[11px] leading-normal text-slate-600 font-mono">
          Research demonstration. Not an FDA-cleared diagnostic device.
        </div>
      </div>
    </div>
  );
};
