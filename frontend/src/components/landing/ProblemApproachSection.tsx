import React from 'react';
import { AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, Database, Cpu } from 'lucide-react';

export const ProblemApproachSection: React.FC<{ onOpenGetStarted: () => void }> = ({
  onOpenGetStarted,
}) => {
  return (
    <section
      id="problem-approach"
      className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-28 max-w-6xl mx-auto"
      aria-label="Clinical Problem and Scientific Approach"
    >
      {/* Section Eyebrow & Title */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md mb-4">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-sky-700">
            THE CLINICAL CHALLENGE
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-4">
          From Generic Risk Scores to Vessel-Specific Localization
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          Conventional cardiovascular calculators estimate broad 10-year statistical probabilities.
          CardioVision AI uses structured clinical parameters to evaluate specific coronary territories.
        </p>
      </div>

      {/* Comparison: The Limitation vs The CardioVision Approach */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Conventional Approach */}
        <div className="p-8 rounded-3xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-4">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              <span>Conventional Population Scores</span>
            </div>

            <h3 className="text-xl font-bold text-slate-950 tracking-tight mb-3">
              Single-Index 10-Year Estimates
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
              Standard clinical tools like Framingham or ASCVD condense diverse patient physiology into a single aggregate percentage. They offer no anatomical insight into which coronary arteries may harbor significant obstruction.
            </p>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">•</span>
                <span>Lacks vascular territory specificity (cannot distinguish LAD from LCX or RCA)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">•</span>
                <span>Often imputes missing laboratory values using population medians without notice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">•</span>
                <span>Excludes detailed 12-lead ECG voltage indicators and echocardiographic regional wall motion</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] font-mono text-slate-600">
            Broad statistical risk • No anatomical localization
          </div>
        </div>

        {/* CardioVision Approach */}
        <div className="p-8 rounded-3xl bg-white/95 border border-sky-200/80 shadow-md shadow-sky-500/5 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2.5 text-xs font-mono font-bold uppercase tracking-wider text-sky-700 mb-4">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>CardioVision AI Protocol</span>
            </div>

            <h3 className="text-xl font-bold text-slate-950 tracking-tight mb-3">
              54-Feature Localized Vascular Risk
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
              CardioVision AI structures 54 clinical parameters across patient history, hemodynamics, blood chemistry, and ECG/echo findings into trained scikit-learn models to evaluate disease status in three individual epicardial arteries.
            </p>

            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                <span>Dedicated, independent models for LAD, LCX, and RCA vessel stenosis</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                <span>Strict data integrity: unmeasured fields are required before payload compilation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                <span>Deterministic derivation of BMI, cohort obesity thresholds, and 4-way chest pain partitions</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-mono text-sky-700 font-semibold">
              Multi-vessel localization • Transparent feature schema
            </span>
            <button
              onClick={onOpenGetStarted}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-sky-700 transition-colors"
            >
              <span>Try Wizard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
