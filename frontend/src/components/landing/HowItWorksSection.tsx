import React from 'react';
import {
  FileText,
  ShieldCheck,
  Cpu,
  Activity,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface HowItWorksSectionProps {
  onOpenGetStarted: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  onOpenGetStarted,
}) => {
  const steps = [
    {
      number: '01',
      title: 'Guided 5-Step Clinical Intake',
      icon: FileText,
      color: 'sky',
      badge: 'Step 1 — 4',
      description:
        'Clinicians enter standard cardiovascular markers partitioned across 5 guided wizard steps: Demographics, Medical History, Vitals & Blood Chemistry, and ECG & Echocardiography findings.',
      features: [
        'Organized chronological progression',
        'Built-in range sanity validations',
        'Optional synthetic demonstration profiles',
      ],
    },
    {
      number: '02',
      title: 'Strict Data Provenance Guard',
      icon: ShieldCheck,
      color: 'indigo',
      badge: 'Zero Imputation',
      description:
        'Unlike black-box calculators that silently impute missing data with medians, CardioVision AI initializes every field blank. Incomplete patient records block compilation to protect clinical integrity.',
      features: [
        '50 directly entered clinician parameters',
        'Zero silent median/mode substitutions',
        'Unambiguous input verification state',
      ],
    },
    {
      number: '03',
      title: 'Deterministic Clinical Derivations',
      icon: Cpu,
      color: 'violet',
      badge: 'Audited Logic',
      description:
        'Four specific features are computed deterministically before model ingestion: exact BMI, the dataset-calibrated Obesity cutoff (BMI ≥ 25.0 kg/m²), and the mutually exclusive 4-way Diamond-Forrester chest pain partition.',
      features: [
        'Mathematically audited BMI formula',
        'Documented WHO vs. cohort obesity criteria',
        'Diamond-Forrester angina classification',
      ],
    },
    {
      number: '04',
      title: 'Localized Multi-Artery Inference',
      icon: Activity,
      color: 'rose',
      badge: 'Live Inference',
      description:
        'The compiled 54-feature canonical payload is dispatched to the trained scikit-learn FastAPI backend, predicting global CAD presence alongside territory-specific LAD, LCX, and RCA vessel stenosis risks.',
      features: [
        'FastAPI JSON schema validation',
        'Calibrated probability outputs',
        'Interactive 3D anatomical contextualization',
      ],
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative z-10 w-full px-4 sm:px-8 lg:px-12 py-20 lg:py-28 max-w-7xl mx-auto"
      aria-label="How CardioVision Assessment Works"
    >
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md mb-4">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-sky-700">
            TRANSPARENT INFERENCE PROTOCOL
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight mb-5">
          Engineered for Structured Clinical Rigor
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          A transparent, deterministic path from clinical data entry to multi-artery
          localization. Every parameter is verified, validated, and explained.
        </p>
      </div>

      {/* 4-Step Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="group relative flex flex-col justify-between p-6 rounded-3xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-sky-300 shadow-xs hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 backdrop-blur-xl"
            >
              <div>
                {/* Step Top Bar */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-mono font-black text-slate-300 group-hover:text-sky-500 transition-colors">
                    {step.number}
                  </span>
                  <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-sky-50 text-slate-700 group-hover:text-sky-600 transition-colors border border-slate-100">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider mb-3">
                  {step.badge}
                </div>

                <h3 className="text-lg font-bold text-slate-950 tracking-tight mb-3">
                  {step.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-6 font-normal">
                  {step.description}
                </p>
              </div>

              {/* Bullet Features */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                {step.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-[11px] text-slate-600 font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Action Prompt */}
      <div className="text-center">
        <button
          onClick={onOpenGetStarted}
          className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-900 group"
        >
          <span>Launch the 5-step patient profile wizard</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};
