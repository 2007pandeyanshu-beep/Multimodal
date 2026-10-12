import React from 'react';
import { AlertTriangle, ShieldCheck, Database, Info, FileText } from 'lucide-react';

interface DisclaimerSectionProps {
  onOpenModelNotice: () => void;
  onOpenFeatures: () => void;
}

export const DisclaimerSection: React.FC<DisclaimerSectionProps> = ({
  onOpenModelNotice,
  onOpenFeatures,
}) => {
  return (
    <section
      id="research-notice"
      className="relative z-10 w-full px-4 sm:px-8 lg:px-12 py-16 max-w-7xl mx-auto"
      aria-label="Clinical Research Disclaimer"
    >
      <div className="rounded-3xl bg-white/90 border border-slate-200/90 shadow-md p-6 sm:p-10 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Left Icon Badge */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>

          {/* Right Content */}
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
              INVESTIGATIONAL RESEARCH PROTOCOL
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Clinical Research Prototype & Dataset Governance Disclaimer
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              <p>
                <strong className="text-slate-900 font-bold">Investigational Use Only: </strong>
                CardioVision AI is an exploratory research demonstration developed for hackathon
                and cardiovascular ML research evaluation. It is <strong>not</strong> cleared by the
                U.S. Food and Drug Administration (FDA), European Medicines Agency (EMA), or any
                regulatory agency as a clinical diagnostic instrument or clinical decision support device.
              </p>

              <p>
                <strong className="text-slate-900 font-bold">Cohort Provenance & Generalizability: </strong>
                Machine learning models are trained on the standardized Z-Alizadeh Sani benchmark
                dataset (N=303 patients, single-center cohort from the Tehran Heart Center). Predictive
                distributions reflect the demographic, hemodynamic, and laboratory characteristics of this
                specific cohort and require prospective multi-center validation before any clinical application.
              </p>

              <p>
                <strong className="text-slate-900 font-bold">Non-Diagnostic Guarantee: </strong>
                Under no circumstances should outputs from this prototype be used to diagnose,
                triage, or dictate therapeutic pathways for actual patients. Always consult licensed
                medical practitioners and standard clinical guidelines.
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenModelNotice}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-sky-600" />
                <span>3D Model & Pulse Methodology</span>
              </button>

              <button
                onClick={onOpenFeatures}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>Feature Pipeline Architecture</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
