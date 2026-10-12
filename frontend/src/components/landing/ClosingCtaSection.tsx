import React from 'react';
import { Activity, ArrowRight, ShieldCheck, Layers } from 'lucide-react';

interface ClosingCtaSectionProps {
  onOpenGetStarted: () => void;
  onOpenFeatures: () => void;
}

export const ClosingCtaSection: React.FC<ClosingCtaSectionProps> = ({
  onOpenGetStarted,
  onOpenFeatures,
}) => {
  return (
    <section
      id="closing-cta"
      className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-28 max-w-5xl mx-auto text-center"
      aria-label="Closing Patient Assessment Call to Action"
    >
      <div className="relative rounded-3xl p-8 sm:p-14 lg:p-16 bg-gradient-to-b from-white/95 to-slate-50/95 border border-slate-200/90 shadow-xl backdrop-blur-2xl overflow-hidden">
        {/* Soft Ambient Aurora Floaters */}
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-indigo-400/12 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-slate-800">
              EVALUATE CARDIAC RISK
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            Ready to Begin Structured Assessment?
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Launch the 5-step Patient Profile Wizard to enter real clinical parameters or
            test pre-configured synthetic demo profiles.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onOpenGetStarted}
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-slate-950 hover:bg-slate-900 active:bg-black rounded-2xl shadow-xl hover:shadow-sky-950/20 hover:ring-2 hover:ring-sky-500/50 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Start Patient Assessment Wizard"
            >
              <Activity className="w-5 h-5 text-sky-400" />
              <span>Start Assessment</span>
              <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenFeatures}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>View System Architecture</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-mono">
            <span>• 54 Canonical Features</span>
            <span>• LAD / LCX / RCA Multi-Vessel</span>
            <span>• Zero Silent Defaults</span>
          </div>
        </div>
      </div>
    </section>
  );
};
