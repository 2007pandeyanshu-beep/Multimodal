import React from 'react';
import { AlertTriangle, Info, Database } from 'lucide-react';

interface TransparencySectionProps {
  onOpenModelNotice: () => void;
  onOpenFeatures: () => void;
}

export const TransparencySection: React.FC<TransparencySectionProps> = ({
  onOpenModelNotice,
  onOpenFeatures,
}) => {
  return (
    <section
      id="transparency"
      className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-16 max-w-6xl mx-auto"
      aria-label="Clinical Transparency and Scientific Limitations"
    >
      <div className="rounded-3xl bg-white/95 border border-slate-200/90 shadow-sm p-7 sm:p-10 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Warning Icon Badge */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>

          {/* Details */}
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
              ETHICS & SCIENTIFIC GOVERNANCE
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Clinical Research Prototype & Cohort Limitations
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              <p>
                <strong className="text-slate-900 font-bold">Investigational Prototype: </strong>
                CardioVision AI is an educational demonstration prototype developed for academic
                evaluation and hackathon research. It is <strong>not</strong> cleared by the U.S. FDA,
                EMA, or equivalent regulatory bodies as a clinical diagnostic or decision support device.
              </p>

              <p>
                <strong className="text-slate-900 font-bold">Single-Center Training Cohort: </strong>
                Model pipelines were trained and evaluated on the Z-Alizadeh Sani benchmark
                dataset (N=303 patients, collected at the Tehran Heart Center, 2013). Statistical
                distributions, prevalence rates, and feature thresholds (including the cohort BMI ≥ 25.0 kg/m²
                overweight/obesity cutoff) reflect this single-center sample and require multi-ethnic external
                validation before any generalized application.
              </p>

              <p>
                <strong className="text-slate-900 font-bold">No Diagnostic Substitute: </strong>
                Inference outputs must never replace direct physical examination, physician judgment,
                standard clinical decision rules, or diagnostic coronary angiography.
              </p>
            </div>

            {/* Links */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenModelNotice}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-sky-600" />
                <span>3D Asset & Cardiac Pulse Disclosure</span>
              </button>

              <button
                onClick={onOpenFeatures}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>Feature Schema Specifications</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
