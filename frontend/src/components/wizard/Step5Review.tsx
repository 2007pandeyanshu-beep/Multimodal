/**
 * frontend/src/components/wizard/Step5Review.tsx
 * Step 5: Clinical Review & Multi-Artery Inference (54-feature verification & execution)
 * Polished Spacing, Card Structure, Typography Hierarchy, and Contrast.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Activity,
  Heart,
  Droplets,
  HeartPulse,
} from 'lucide-react';
import type { WizardFormData, WizardStepId } from './wizardTypes.ts';
import { FEATURE_SPECIFICATIONS } from './wizardMetadata.ts';

interface Step5ReviewProps {
  data: WizardFormData;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
  onNavigateToStep: (stepId: WizardStepId) => void;
  onSubmit: () => void;
}

export const Step5Review: React.FC<Step5ReviewProps> = ({
  data,
  validationErrors,
  isSubmitting,
  onNavigateToStep,
  onSubmit,
}) => {
  const [copiedPayload, setCopiedPayload] = React.useState(false);
  const errorCount = Object.keys(validationErrors).length;
  const isComplete = errorCount === 0;

  // Group features by step
  const step1Specs = FEATURE_SPECIFICATIONS.filter((s) => s.step === 1);
  const step2Specs = FEATURE_SPECIFICATIONS.filter((s) => s.step === 2);
  const step3Specs = FEATURE_SPECIFICATIONS.filter((s) => s.step === 3);
  const step4Specs = FEATURE_SPECIFICATIONS.filter((s) => s.step === 4);

  const copyPayloadJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch {
      setCopiedPayload(false);
    }
  };

  const renderValueCell = (specKey: keyof WizardFormData, unit?: string, isDerived?: boolean) => {
    const val = data[specKey];
    const isUnset = val === '' || val === undefined || val === null;

    return (
      <div
        key={specKey}
        className={`p-3 rounded-xl border transition-all ${
          isUnset
            ? 'bg-rose-50/70 border-rose-300 text-rose-900'
            : 'bg-slate-50/80 border-slate-200/90 text-slate-900'
        }`}
      >
        <span className="text-xs text-slate-600 block truncate font-medium">
          {FEATURE_SPECIFICATIONS.find((s) => s.key === specKey)?.label || specKey}
        </span>
        {isUnset ? (
          <span className="font-mono font-bold text-rose-600 text-xs block mt-1">
            Unset (Required)
          </span>
        ) : (
          <span className="font-mono font-bold text-slate-900 text-sm block mt-1 truncate">
            {String(val)} {unit ? unit : ''}
          </span>
        )}
        {isDerived && (
          <span className="text-xs text-teal-800 font-medium block mt-0.5">Derived</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              5. Clinical Parameter Review & Assessment Validation
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Verify all 54 canonical clinical parameters before executing multi-artery model inference.
            </p>
          </div>
        </div>
      </div>

      {/* Target Arteries Overview Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Target Arterial Predictions (4 Independent Models)</span>
          </div>
          <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            Trained on Tehran Heart Center Cohort
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-mono font-bold text-cyan-700 block">TARGET 1</span>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">Cath (Angiographic CAD)</span>
            <span className="text-xs text-slate-600 block mt-1">Global coronary circulation</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-mono font-bold text-indigo-700 block">TARGET 2</span>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">LAD (Left Anterior Descending)</span>
            <span className="text-xs text-slate-600 block mt-1">Anterior wall & septum</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-mono font-bold text-amber-700 block">TARGET 3</span>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">LCX (Left Circumflex)</span>
            <span className="text-xs text-slate-600 block mt-1">Lateral & posterior LV</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-mono font-bold text-rose-700 block">TARGET 4</span>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">RCA (Right Coronary Artery)</span>
            <span className="text-xs text-slate-600 block mt-1">Inferior wall & conduction</span>
          </div>
        </div>
      </div>

      {/* Completeness & Provenance Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isComplete
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-rose-50/80 border-rose-300 text-rose-950'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
          )}
          <div>
            <div className="text-sm font-bold">
              {isComplete
                ? 'All 54 Canonical Features Complete & Validated'
                : `${errorCount} Required Clinical Parameter${errorCount > 1 ? 's' : ''} Incomplete`}
            </div>
            <div className="text-xs text-slate-700 mt-1 leading-relaxed">
              {isComplete
                ? '52 patient-specific measurements + 2 deterministic derivations (BMI, Obesity). Ready for inference.'
                : 'All unset parameters must be provided before model inference can be executed.'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={copyPayloadJson}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white hover:bg-slate-50 text-xs sm:text-sm font-mono font-medium text-slate-800 border border-slate-300 shadow-2xs transition-all shrink-0 self-start sm:self-center"
        >
          {copiedPayload ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              <span className="text-emerald-700">Payload Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Copy JSON Vector</span>
            </>
          )}
        </button>
      </div>

      {/* 54-Feature Matrix Grouped by Wizard Step */}
      <div className="space-y-6">
        {/* Step 1 Group */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <h4 className="text-sm font-bold text-slate-900">
                1. Patient Profile & Biometrics (9 Features)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToStep('profile')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Step 1</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {step1Specs.map((s) => renderValueCell(s.key, s.unit, s.isDerived))}
          </div>
        </div>

        {/* Step 2 Group */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <h4 className="text-sm font-bold text-slate-900">
                2. Medical History & Symptoms (14 Features)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToStep('history')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Step 2</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {step2Specs.map((s) => renderValueCell(s.key, s.unit, s.isDerived))}
          </div>
        </div>

        {/* Step 3 Group */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <h4 className="text-sm font-bold text-slate-900">
                3. Hemodynamics & Laboratory Results (16 Features)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToStep('vitals_lab')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Step 3</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {step3Specs.map((s) => renderValueCell(s.key, s.unit, s.isDerived))}
          </div>
        </div>

        {/* Step 4 Group */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <h4 className="text-sm font-bold text-slate-900">
                4. ECG & Cardiac Examination (15 Features)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToStep('ecg_cardiac')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Step 4</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {step4Specs.map((s) => renderValueCell(s.key, s.unit, s.isDerived))}
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigateToStep('ecg_cardiac')}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold transition-all shadow-2xs w-full sm:w-auto justify-center"
        >
          <span>← Back to Step 4</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            disabled={!isComplete || isSubmitting}
            onClick={onSubmit}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 h-12 px-8 rounded-xl font-bold text-sm sm:text-base transition-all focus:outline-none focus:ring-4 shadow-sm ${
              isComplete && !isSubmitting
                ? 'bg-gradient-to-r from-teal-600 via-indigo-600 to-teal-600 hover:from-teal-500 hover:to-indigo-500 text-white shadow-teal-900/20 focus:ring-teal-500/20 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Running Multi-Artery Inference...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Execute Multi-Artery Inference (54 Features)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
