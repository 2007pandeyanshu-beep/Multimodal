/**
 * frontend/src/components/wizard/WorkspaceHeader.tsx
 * Clean, Apple Health Minimal top header for the assessment workspace canvas.
 * Polished Typography, Spacing, and Button Alignment.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import {
  Menu,
  X,
  RefreshCw,
  BookmarkCheck,
  FlaskConical,
} from 'lucide-react';
import { WIZARD_STEPS, type WizardStepId, type WizardPreset } from './wizardTypes.ts';

interface WorkspaceHeaderProps {
  currentStepId: WizardStepId;
  activeDemoPreset: WizardPreset | null;
  lastSavedTime?: string;
  isDraftSavedFeedback?: boolean;
  onOpenMobileDrawer: () => void;
  onSaveDraft: () => void;
  onReset: () => void;
  onExit: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  currentStepId,
  activeDemoPreset,
  lastSavedTime,
  isDraftSavedFeedback = false,
  onOpenMobileDrawer,
  onSaveDraft,
  onReset,
  onExit,
}) => {
  const currentStep = WIZARD_STEPS.find((s) => s.id === currentStepId) || WIZARD_STEPS[0];

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 lg:px-10 py-4 flex items-center justify-between gap-4">
      {/* Left: Mobile Drawer Toggle & Step Breadcrumbs */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open assessment navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/80 shrink-0">
              Step {currentStep.stepNumber} of 5
            </span>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight truncate">
              {currentStep.title}
            </h2>
          </div>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-600 truncate mt-1">
            {currentStep.description}
          </p>
        </div>
      </div>

      {/* Right: Mode Badge & Quick Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Assessment Mode Badge */}
        {activeDemoPreset ? (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium font-mono">
            <FlaskConical className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="truncate max-w-[180px]">Demo: {activeDemoPreset.name}</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Custom Assessment Mode</span>
          </div>
        )}

        {/* Quick Save Draft Button */}
        <button
          type="button"
          onClick={onSaveDraft}
          className={`hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
            isDraftSavedFeedback
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
          }`}
          title="Preserve current assessment inputs"
        >
          <BookmarkCheck
            className={`w-4 h-4 ${
              isDraftSavedFeedback ? 'text-emerald-600' : 'text-slate-500'
            }`}
          />
          <span>{isDraftSavedFeedback ? 'Saved' : 'Save Draft'}</span>
        </button>

        {/* Quick Reset Button */}
        <button
          type="button"
          onClick={onReset}
          className="hidden md:inline-flex items-center gap-2 h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-medium transition-colors"
          title="Clear all fields back to blank"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Reset</span>
        </button>

        {/* Exit Workspace / Close */}
        <button
          type="button"
          onClick={onExit}
          className="h-10 px-3 sm:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2 text-xs sm:text-sm font-semibold"
          aria-label="Exit assessment workspace"
          title="Exit to overview (draft preserved)"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </header>
  );
};
