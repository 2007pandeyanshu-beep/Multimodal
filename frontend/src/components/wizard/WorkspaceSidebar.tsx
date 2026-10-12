/**
 * frontend/src/components/wizard/WorkspaceSidebar.tsx
 * Persistent Left Sidebar for the Apple Health Minimal Clinical Assessment Workspace.
 * Polished Spacing, Typography, and Contrast Hierarchy.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import {
  Heart,
  User,
  FileText,
  Activity,
  HeartPulse,
  ShieldCheck,
  Check,
  BookmarkCheck,
  ArrowLeft,
  X,
} from 'lucide-react';
import { WIZARD_STEPS, type WizardStepId } from './wizardTypes.ts';

interface WorkspaceSidebarProps {
  currentStepId: WizardStepId;
  completedSteps: Set<WizardStepId>;
  filledFeaturesCount: number;
  totalFeaturesCount?: number;
  lastSavedTime?: string;
  isDraftSavedFeedback?: boolean;
  onSelectStep: (stepId: WizardStepId) => void;
  onSaveDraft: () => void;
  onExit: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  currentStepId,
  completedSteps,
  filledFeaturesCount,
  totalFeaturesCount = 54,
  lastSavedTime,
  isDraftSavedFeedback = false,
  onSelectStep,
  onSaveDraft,
  onExit,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStepId);
  const progressRatio = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 flex flex-col justify-between select-none ${
        isMobileDrawer
          ? 'w-full h-full p-6 sm:p-8'
          : 'w-72 lg:w-84 shrink-0 h-full p-6 lg:p-7 shadow-[2px_0_16px_rgba(0,0,0,0.02)]'
      }`}
      aria-label="Patient Assessment Navigation"
    >
      {/* 1. Brand Identity & Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-600 flex items-center justify-center shadow-xs shrink-0">
              <Heart className="w-5 h-5 fill-teal-600/20 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                  CardioVision AI
                </h1>
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Clinical Workspace
              </p>
            </div>
          </div>

          {isMobileDrawer && onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Clinical Protocol Badge */}
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">Patient Assessment</span>
          <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80">
            54 Features
          </span>
        </div>

        {/* 2. Five Step Guided Navigation with generous spacing */}
        <nav className="space-y-2.5" aria-label="Assessment Steps">
          {WIZARD_STEPS.map((step, idx) => {
            const isCurrent = step.id === currentStepId;
            const isCompleted = completedSteps.has(step.id);
            const isAccessible = isCompleted || idx <= currentStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  onSelectStep(step.id);
                  if (isMobileDrawer && onCloseMobileDrawer) {
                    onCloseMobileDrawer();
                  }
                }}
                className={`w-full p-3.5 rounded-2xl text-left transition-all duration-200 flex items-center gap-3.5 border ${
                  isCurrent
                    ? 'bg-teal-50/90 border-teal-200/90 text-teal-950 shadow-xs ring-1 ring-teal-500/20'
                    : isCompleted
                    ? 'bg-white border-transparent hover:bg-slate-50/90 text-slate-800'
                    : isAccessible
                    ? 'bg-white border-transparent hover:bg-slate-50/80 text-slate-700'
                    : 'bg-white border-transparent text-slate-400 opacity-60'
                }`}
              >
                {/* Step indicator circle / checkmark */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-mono font-bold transition-all ${
                    isCurrent
                      ? 'bg-teal-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.8]" />
                  ) : (
                    step.stepNumber
                  )}
                </div>

                {/* Step labels */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`text-sm truncate block ${
                        isCurrent
                          ? 'font-bold text-teal-950'
                          : isCompleted
                          ? 'font-semibold text-slate-900'
                          : 'font-medium text-slate-700'
                      }`}
                    >
                      {step.shortTitle}
                    </span>
                    <span className="text-xs font-mono text-slate-500 shrink-0">
                      {step.featureCount} feats
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {step.title.replace(`${step.stepNumber}. `, '')}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Bottom Telemetry, Save Draft & Exit */}
      <div className="space-y-5 pt-6 border-t border-slate-200/80 mt-6">
        {/* Progress Telemetry */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span>Step {currentStepIndex + 1} of 5</span>
            </span>
            <span className="font-mono text-slate-900 font-bold">
              {Math.round(progressRatio)}% Complete
            </span>
          </div>

          {/* Clean Apple Health Progress Bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressRatio}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progressRatio)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Filled feature tally */}
          <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
            <span>Inputs recorded</span>
            <span className="text-slate-900 font-bold">
              {filledFeaturesCount} / {totalFeaturesCount}
            </span>
          </div>
        </div>

        {/* Discreet Save Draft Action */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onSaveDraft}
            className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ${
              isDraftSavedFeedback
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <BookmarkCheck
                className={`w-4 h-4 ${
                  isDraftSavedFeedback ? 'text-emerald-600' : 'text-slate-500'
                }`}
              />
              <span>{isDraftSavedFeedback ? 'Draft Saved!' : 'Save Draft'}</span>
            </span>
            <span className="text-xs font-mono text-slate-500">
              {lastSavedTime ? lastSavedTime : 'Auto-saved'}
            </span>
          </button>
        </div>

        {/* Back to Overview / Exit Assessment */}
        <button
          type="button"
          onClick={onExit}
          className="w-full h-11 px-3.5 rounded-xl hover:bg-slate-50/90 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-medium transition-colors flex items-center gap-2.5 group border border-transparent hover:border-slate-200/60"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-transform group-hover:-translate-x-0.5 shrink-0" />
          <div className="text-left min-w-0">
            <span className="block leading-none font-semibold truncate">Back to Overview</span>
            <span className="text-xs text-slate-500 font-normal truncate block mt-0.5">
              Preserves entered draft
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
};
