/**
 * frontend/src/components/wizard/WizardProgress.tsx
 * Clean, Apple Health-inspired multi-step progress bar and navigation tabs.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { User, FileText, Activity, HeartPulse, ShieldCheck, Check } from 'lucide-react';
import { WIZARD_STEPS, type WizardStepId } from './wizardTypes.ts';

interface WizardProgressProps {
  currentStepId: WizardStepId;
  completedSteps: Set<WizardStepId>;
  onSelectStep: (stepId: WizardStepId) => void;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStepId,
  completedSteps,
  onSelectStep,
}) => {
  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStepId);
  const progressRatio = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  const getStepIcon = (iconName: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />;
    }
    switch (iconName) {
      case 'User':
        return <User className="w-4 h-4" />;
      case 'FileText':
        return <FileText className="w-4 h-4" />;
      case 'Activity':
        return <Activity className="w-4 h-4" />;
      case 'HeartPulse':
        return <HeartPulse className="w-4 h-4" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <nav aria-label="Assessment Wizard Progress" className="w-full space-y-4">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 pb-1">
        <span className="flex items-center gap-2 font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span>STEP {currentStepIndex + 1} OF 5: {WIZARD_STEPS[currentStepIndex].title.toUpperCase()}</span>
        </span>
        <span className="font-bold text-slate-900">{Math.round(progressRatio)}% COMPLETE</span>
      </div>

      {/* Thin Clinical Progress Line */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressRatio}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progressRatio)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Step Pills / Tabs */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 pt-1">
        {WIZARD_STEPS.map((step, idx) => {
          const isCurrent = step.id === currentStepId;
          const isCompleted = completedSteps.has(step.id);
          const isAccessible = isCompleted || idx <= currentStepIndex;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isAccessible}
              onClick={() => onSelectStep(step.id)}
              className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isCurrent
                  ? 'bg-white border-cyan-400 ring-2 ring-cyan-400/20 shadow-sm'
                  : isCompleted
                  ? 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/80 text-slate-700'
                  : 'bg-slate-50/40 border-slate-200/50 text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-xl text-xs font-mono font-bold ${
                    isCurrent
                      ? 'bg-cyan-500 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.stepNumber}
                </span>

                <div className="hidden sm:block text-slate-400">
                  {getStepIcon(step.iconName, isCompleted)}
                </div>
              </div>

              <div>
                <span
                  className={`text-[11px] sm:text-xs font-bold block truncate tracking-tight ${
                    isCurrent ? 'text-slate-900' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {step.shortTitle}
                </span>
                <span className="hidden md:block text-[10px] text-slate-500 truncate font-mono">
                  {step.featureCount} features
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
