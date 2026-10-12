import React from 'react';
import { ArrowRight, Activity, Sparkles, Layers } from 'lucide-react';

interface FinalCtaSectionProps {
  onOpenGetStarted: () => void;
  onOpenFeatures: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  onOpenGetStarted,
  onOpenFeatures,
}) => {
  return (
    <section
      className="relative z-10 w-full px-4 sm:px-8 lg:px-12 py-16 lg:py-24 max-w-7xl mx-auto"
      aria-label="Patient Assessment Call to Action"
    >
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-white/95 via-sky-50/50 to-indigo-50/50 border border-slate-200/90 shadow-xl backdrop-blur-2xl">
        {/* Ambient Aurora Floaters */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 rounded-full bg-rose-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md mb-6">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-slate-800">
              INTERACTIVE ASSESSMENT READY
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-6">
            Ready to Evaluate a Patient Case?
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal mb-8">
            Begin with a fresh, unpolluted 54-feature clinical assessment or load one of
            three synthetic demo profiles to explore multi-artery risk classification.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={onOpenGetStarted}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-slate-950 hover:bg-slate-900 active:bg-black rounded-2xl shadow-xl hover:shadow-sky-950/20 hover:ring-2 hover:ring-sky-500/50 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Launch Patient Profile Wizard"
            >
              <Activity className="w-5 h-5 text-sky-400" />
              <span>Launch Patient Profile Wizard</span>
              <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenFeatures}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>View System Architecture</span>
            </button>
          </div>

          <div className="mt-8 text-xs font-mono text-slate-500">
            • 54 canonical inputs • Zero silent defaults • LAD / LCX / RCA multi-vessel outputs
          </div>
        </div>
      </div>
    </section>
  );
};
