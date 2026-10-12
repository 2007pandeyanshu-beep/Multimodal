/**
 * frontend/src/components/wizard/PatientProfileWizard.tsx
 * Apple Health Minimal - Master 5-Step Patient Profile Workspace Coordinator.
 * Polished Spacing, Typography Hierarchy, Readability, and Layout.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  SlidersHorizontal,
  FlaskConical,
  XCircle,
} from 'lucide-react';
import {
  WIZARD_STEPS,
  EMPTY_WIZARD_DATA,
  SYNTHETIC_DEMO_PRESETS,
  type WizardStepId,
  type WizardFormData,
  type WizardPreset,
} from './wizardTypes.ts';
import {
  validateWizardStep,
  validateAllWizardSteps,
  adaptWizardDataToCanonical,
} from './wizardMetadata.ts';
import { WorkspaceSidebar } from './WorkspaceSidebar.tsx';
import { WorkspaceHeader } from './WorkspaceHeader.tsx';
import { WorkspaceVascularDecor } from './WorkspaceVascularDecor.tsx';
import { Step1Profile } from './Step1Profile.tsx';
import { Step2History } from './Step2History.tsx';
import { Step3VitalsLab } from './Step3VitalsLab.tsx';
import { Step4ECGCardiac } from './Step4ECGCardiac.tsx';
import { Step5Review } from './Step5Review.tsx';
import { PredictionResultsView } from '../PredictionResultsView.tsx';
import { predictPatient } from '../../api/client.ts';
import type {
  PredictionResponse,
  ApiError,
  AssumedField,
  MeasuredField,
} from '../../api/types.ts';
import {
  saveActiveAssessment,
  clearActiveAssessment,
} from '../../api/assessmentState.ts';
import { clearExplanationMemoryCache } from '../../api/usePatientExplanation.ts';

const DRAFT_STORAGE_KEY = 'cardiovision_assessment_draft_v1';

/**
 * Computes assessment session metadata (session ID, synthetic demo flag, and preset name)
 * based on whether an untouched demo preset is currently active.
 */
export function computeAssessmentSessionMeta(
  activePreset: WizardPreset | null,
  providedSessId?: string
): {
  sessionId: string;
  isSyntheticDemo: boolean;
  demoPresetName?: string;
} {
  const sessId =
    providedSessId ||
    ((activePreset ? 'DEMO-' : 'ASMT-') +
      Math.random().toString(36).substring(2, 9).toUpperCase());

  return {
    sessionId: sessId,
    isSyntheticDemo: Boolean(activePreset),
    demoPresetName: activePreset?.name,
  };
}

/**
 * Pure transition function for editing any field in the wizard:
 * updates form data and unconditionally clears active demo preset designation,
 * guaranteeing edited presets are not mislabeled as synthetic benchmarks.
 */
export function applyWizardFieldChange(
  currentData: WizardFormData,
  field: keyof WizardFormData,
  value: unknown,
  activePreset: WizardPreset | null
): {
  nextData: WizardFormData;
  nextPreset: WizardPreset | null;
} {
  return {
    nextData: { ...currentData, [field]: value },
    nextPreset: null, // Any user edit clears active demo preset
  };
}

export interface PatientProfileWizardProps {
  onClose?: () => void;
}

export const PatientProfileWizard: React.FC<PatientProfileWizardProps> = ({ onClose }) => {
  const [currentStepId, setCurrentStepId] = useState<WizardStepId>('profile');
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStepId>>(new Set());

  // Fresh assessment starts strictly empty: NO misleading prefilled values
  const [formData, setFormData] = useState<WizardFormData>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            return { ...EMPTY_WIZARD_DATA, ...parsed };
          }
        }
      }
    } catch {
      // Fallback cleanly on error
    }
    return EMPTY_WIZARD_DATA;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);

  // Explicit tracking of synthetic demo preset (null when entering a real assessment or after edit)
  const [activeDemoPreset, setActiveDemoPreset] = useState<WizardPreset | null>(null);

  // Prediction Response State
  const [predictionResponse, setPredictionResponse] = useState<PredictionResponse | null>(null);
  const [assessmentSessionId, setAssessmentSessionId] = useState<string>('');
  const [assessmentTimestamp, setAssessmentTimestamp] = useState<string>('');

  // Draft Save Feedback & Timestamp
  const [lastSavedTime, setLastSavedTime] = useState<string>('Auto-saved');
  const [isDraftSavedFeedback, setIsDraftSavedFeedback] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const mainScrollContainerRef = useRef<HTMLDivElement>(null);
  const stepOrder: WizardStepId[] = ['profile', 'history', 'vitals_lab', 'ecg_cardiac', 'review'];
  const currentStepIndex = stepOrder.indexOf(currentStepId);

  // Compute number of filled features (out of 54)
  const filledFeaturesCount = useMemo(() => {
    return Object.values(formData).filter((v) => v !== '' && v !== null && v !== undefined).length;
  }, [formData]);

  // Persist draft to localStorage on change
  const persistDraft = (updated: WizardFormData) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSavedTime(`Saved at ${timeStr}`);
      }
    } catch {
      // Silently ignore storage quota or privacy restrictions
    }
  };

  // Field change handler preserving draft state and clearing active demo preset
  const handleFieldChange = (field: keyof WizardFormData, value: unknown) => {
    const { nextData, nextPreset } = applyWizardFieldChange(
      formData,
      field,
      value,
      activeDemoPreset
    );
    setFormData(nextData);
    persistDraft(nextData);
    if (activeDemoPreset !== nextPreset) {
      setActiveDemoPreset(nextPreset);
    }

    // Clear inline error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Manual save draft action with visual confirmation
  const handleSaveDraft = () => {
    persistDraft(formData);
    setIsDraftSavedFeedback(true);
    setTimeout(() => {
      setIsDraftSavedFeedback(false);
    }, 2200);
  };

  // Smooth scroll helper for step transitions
  const scrollToTop = () => {
    if (mainScrollContainerRef.current) {
      mainScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step advancement with strict validation
  const handleNext = () => {
    const stepErrors = validateWizardStep(currentStepId, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    setCompletedSteps((prev) => new Set([...prev, currentStepId]));

    if (currentStepIndex < stepOrder.length - 1) {
      setCurrentStepId(stepOrder[currentStepIndex + 1]);
      scrollToTop();
    }
  };

  // Step regression preserving draft
  const handleBack = () => {
    if (currentStepIndex > 0) {
      setErrors({});
      setCurrentStepId(stepOrder[currentStepIndex - 1]);
      scrollToTop();
    }
  };

  // Direct step selection via sidebar or pills
  const handleSelectStep = (stepId: WizardStepId) => {
    setErrors({});
    setCurrentStepId(stepId);
    scrollToTop();
  };

  // Explicit action required to load a synthetic demo preset
  const handleApplyPreset = (preset: WizardPreset) => {
    setFormData({ ...preset.data });
    persistDraft(preset.data);
    setActiveDemoPreset(preset);
    setErrors({});
    setPredictionResponse(null);
    setApiError(null);
    setCompletedSteps(new Set(['profile', 'history', 'vitals_lab', 'ecg_cardiac']));
  };

  // Reset handler: returns form to a genuinely blank state & clears storage
  const handleReset = () => {
    setFormData(EMPTY_WIZARD_DATA);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
    clearActiveAssessment();
    clearExplanationMemoryCache();
    setActiveDemoPreset(null);
    setErrors({});
    setCurrentStepId('profile');
    setCompletedSteps(new Set());
    setPredictionResponse(null);
    setApiError(null);
    setAssessmentSessionId('');
    setAssessmentTimestamp('');
    setLastSavedTime('Blank State');
    scrollToTop();
  };

  // Safe exit preserving draft
  const handleExit = () => {
    persistDraft(formData);
    if (onClose) {
      onClose();
    }
  };

  // Submit handler triggering live FastAPI inference
  const handleSubmitAssessment = async () => {
    const allErrors = validateAllWizardSteps(formData);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);

      // Jump to the first step containing an error to guide user
      for (const step of stepOrder) {
        const stepErrors = validateWizardStep(step, formData);
        if (Object.keys(stepErrors).length > 0) {
          setCurrentStepId(step);
          scrollToTop();
          break;
        }
      }
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    setPredictionResponse(null); // Prevent display of stale predictions

    try {
      const canonicalPayload = adaptWizardDataToCanonical(formData);
      const response = await predictPatient(canonicalPayload, 8000);
      const ts = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const sessionMeta = computeAssessmentSessionMeta(activeDemoPreset);
      const sessId = sessionMeta.sessionId;

      setPredictionResponse(response);
      setAssessmentTimestamp(ts);
      setAssessmentSessionId(sessId);
      setCompletedSteps(new Set(stepOrder));

      // Persist active assessment to sessionStorage for 4-destination navigation
      const measured = Object.keys(formData).map((k) => ({
        canonicalField: k,
        sourceFormField: k,
        value: formData[k as keyof WizardFormData],
      }));
      const assumptions = [
        {
          canonicalField: 'BMI',
          assumedValue: formData.bmi,
          category: 'Biometrics',
          source: 'Calculated: Weight (kg) / [Height (m)]²',
          rationale: 'Dynamically derived from patient anthropometrics.',
        },
        {
          canonicalField: 'Obesity',
          assumedValue: formData.obesity,
          category: 'Biometrics',
          source: 'Clinical Definition: BMI ≥ 25.0 kg/m²',
          rationale: 'Derived from anthropometrics per dataset standard.',
        },
      ];

      saveActiveAssessment({
        sessionId: sessId,
        timestamp: ts,
        isSyntheticDemo: sessionMeta.isSyntheticDemo,
        demoPresetName: sessionMeta.demoPresetName,
        predictionResponse: response,
        assumptions,
        measuredFields: measured,
        canonicalPayload,
      });

      // Switch to Destination 1: Prediction Overview
      window.location.hash = '#overview';
    } catch (err) {
      // Failed request preserves the draft and does not show stale results
      setApiError(err as ApiError);
      setPredictionResponse(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare provenance records for PredictionResultsView
  const measuredFieldsForResults: MeasuredField[] = Object.keys(formData).map((k) => ({
    canonicalField: k,
    sourceFormField: k,
    value: formData[k as keyof WizardFormData],
  }));

  const assumptionsForResults: AssumedField[] = [
    {
      canonicalField: 'BMI',
      assumedValue: formData.bmi,
      category: 'Biometrics',
      source: 'Calculated: Weight (kg) / [Height (m)]²',
      rationale: 'Dynamically derived from patient anthropometrics.',
    },
    {
      canonicalField: 'Obesity',
      assumedValue: formData.obesity,
      category: 'Biometrics',
      source: 'Clinical Definition: BMI ≥ 25.0 kg/m²',
      rationale: 'Derived from anthropometrics per dataset standard.',
    },
  ];

  return (
    <div className="w-full h-full min-h-screen bg-[#FBFBFD] flex flex-col md:flex-row overflow-hidden relative font-sans text-slate-900 selection:bg-teal-500/20 selection:text-teal-950">
      {/* 1. Desktop & Tablet Persistent Left Sidebar */}
      <div className="hidden md:block h-full">
        <WorkspaceSidebar
          currentStepId={currentStepId}
          completedSteps={completedSteps}
          filledFeaturesCount={filledFeaturesCount}
          totalFeaturesCount={54}
          lastSavedTime={lastSavedTime}
          isDraftSavedFeedback={isDraftSavedFeedback}
          onSelectStep={handleSelectStep}
          onSaveDraft={handleSaveDraft}
          onExit={handleExit}
        />
      </div>

      {/* 2. Mobile Navigation Drawer Modal */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-slate-950/60 backdrop-blur-xs flex animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Assessment Navigation Menu"
        >
          <div className="w-4/5 max-w-sm h-full bg-white shadow-2xl animate-in slide-in-from-left duration-250">
            <WorkspaceSidebar
              currentStepId={currentStepId}
              completedSteps={completedSteps}
              filledFeaturesCount={filledFeaturesCount}
              totalFeaturesCount={54}
              lastSavedTime={lastSavedTime}
              isDraftSavedFeedback={isDraftSavedFeedback}
              onSelectStep={handleSelectStep}
              onSaveDraft={handleSaveDraft}
              onExit={handleExit}
              isMobileDrawer
              onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
            />
          </div>
          <div
            className="flex-1 h-full"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* 3. Main Workspace Canvas */}
      <div
        ref={mainScrollContainerRef}
        className="flex-1 h-full min-w-0 flex flex-col overflow-y-auto relative custom-scrollbar bg-[#FBFBFD]"
      >
        {/* Subtle Background Vascular Watermark Motif (Section 6) */}
        <WorkspaceVascularDecor />

        {/* Apple Health Minimal Top Header */}
        <WorkspaceHeader
          currentStepId={currentStepId}
          activeDemoPreset={activeDemoPreset}
          lastSavedTime={lastSavedTime}
          isDraftSavedFeedback={isDraftSavedFeedback}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onSaveDraft={handleSaveDraft}
          onReset={handleReset}
          onExit={handleExit}
        />

        {/* Content Body Container with Generous Spacing */}
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-8 lg:px-10 py-8 space-y-8 flex-1 flex flex-col justify-between">
          <div className="space-y-8">
            {/* Synthetic Demo Presets (Clean Apple Health Cards with readable text hierarchy) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Synthetic Demonstration Cohorts (Optional Demo Load)
                    </h3>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Synthetic Benchmark Profiles • Not Real Patients
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {SYNTHETIC_DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-4 sm:p-5 rounded-2xl border text-left transition-all group flex flex-col justify-between gap-3 ${
                      activeDemoPreset?.id === preset.id
                        ? 'bg-teal-50/80 border-teal-300 ring-1 ring-teal-500/20 shadow-xs'
                        : 'border-slate-200/90 hover:border-teal-300 bg-slate-50/50 hover:bg-white'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-950">
                          {preset.name.replace('Synthetic Demo: ', '')}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                            preset.badgeColor === 'emerald'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : preset.badgeColor === 'amber'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {preset.badge.replace('Synthetic Demo: ', '')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{preset.subtitle}</p>
                    </div>
                    <span className="text-xs font-semibold text-teal-700 group-hover:text-teal-900 block pt-1">
                      Load Benchmark Profile →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prominent Active Synthetic Demo Banner */}
            {activeDemoPreset && (
              <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-start gap-3.5">
                  <FlaskConical className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span>SYNTHETIC DEMO PROFILE LOADED: {activeDemoPreset.name}</span>
                      <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-amber-200 text-amber-900 font-semibold">
                        Synthetic Demo Only
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      This assessment is populated with synthetic benchmark parameters for testing.
                      It does not represent an actual patient.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs sm:text-sm font-semibold transition-all shrink-0 self-start sm:self-center shadow-2xs"
                >
                  <XCircle className="w-4 h-4 text-amber-700" />
                  <span>Clear Demo / Start Blank Assessment</span>
                </button>
              </div>
            )}

            {/* Global API Inference Error Banner */}
            {apiError && (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>Backend Inference Error ({apiError.type.toUpperCase()})</span>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                    HTTP {apiError.status}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-rose-700 leading-relaxed">{apiError.message}</p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSubmitAssessment}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry Request</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApiError(null)}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-medium transition-all"
                  >
                    <span>Dismiss</span>
                  </button>
                  <span className="text-xs text-slate-600 ml-auto font-mono">
                    Your entered parameters are preserved.
                  </span>
                </div>
              </div>
            )}

            {/* Active Assessment Step Component (Inside Clean White Apple Card with 32px padding) */}
            <div className="p-6 sm:p-8 lg:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-8">
              {currentStepId === 'profile' && (
                <Step1Profile data={formData} errors={errors} onChange={handleFieldChange} />
              )}

              {currentStepId === 'history' && (
                <Step2History data={formData} errors={errors} onChange={handleFieldChange} />
              )}

              {currentStepId === 'vitals_lab' && (
                <Step3VitalsLab data={formData} errors={errors} onChange={handleFieldChange} />
              )}

              {currentStepId === 'ecg_cardiac' && (
                <Step4ECGCardiac data={formData} errors={errors} onChange={handleFieldChange} />
              )}

              {currentStepId === 'review' && (
                <Step5Review
                  data={formData}
                  validationErrors={errors}
                  isSubmitting={isSubmitting}
                  onNavigateToStep={handleSelectStep}
                  onSubmit={handleSubmitAssessment}
                />
              )}
            </div>

            {/* Prediction Results Report (Displayed when inference succeeds) */}
            {predictionResponse && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-mono font-bold uppercase text-slate-600 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>Assessment Results & Multi-Artery Inference</span>
                    {activeDemoPreset && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                        Synthetic Demo Profile
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStepId('review')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Adjust 54 Parameters in Wizard</span>
                  </button>
                </div>

                <PredictionResultsView
                  predictionResponse={predictionResponse}
                  assumptionsUsed={assumptionsForResults}
                  measuredFieldsProvided={measuredFieldsForResults}
                  timestamp={assessmentTimestamp}
                  sessionId={assessmentSessionId}
                />
              </div>
            )}
          </div>

          {/* Bottom Navigation Actions (Steps 1 to 4) */}
          {currentStepId !== 'review' && (
            <div className="pt-6 mt-6 border-t border-slate-200/90 flex items-center justify-between gap-4">
              <button
                type="button"
                disabled={currentStepIndex === 0}
                onClick={handleBack}
                className="inline-flex items-center gap-2.5 h-11 px-5 sm:px-6 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="hidden sm:inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-medium transition-all"
                >
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                  <span>Reset to Blank</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2.5 h-11 px-6 sm:px-8 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white text-sm font-bold shadow-sm shadow-teal-900/10 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <span>Continue to Step {currentStepIndex + 2}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
