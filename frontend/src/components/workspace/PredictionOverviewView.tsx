/**
 * frontend/src/components/workspace/PredictionOverviewView.tsx
 * Destination 1: Prediction Overview (Clinical Decision Hub).
 * Serves as the primary landing page for assessment results,
 * providing high-contrast multi-target cards, scientific scope distinctions,
 * and quick launch cards to the other three destinations.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useState } from 'react';
import {
  Activity,
  HeartPulse,
  FileText,
  BarChart3,
  Stethoscope,
  Info,
  ShieldAlert,
  ArrowRight,
  SlidersHorizontal,
  Check,
  Copy,
  Clock,
  Layers,
  FlaskConical,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type { ActiveAssessment, WorkspaceDestination } from '../../api/assessmentState.ts';
import type { TargetName, TargetPrediction } from '../../api/types.ts';
import { usePatientExplanation } from '../../api/usePatientExplanation.ts';
import {
  formatProbability,
  TARGET_METADATA,
} from '../../api/presentationUtils.ts';

export interface PredictionOverviewViewProps {
  activeAssessment: ActiveAssessment | null;
  onNavigate: (destination: WorkspaceDestination) => void;
}

export const PredictionOverviewView: React.FC<PredictionOverviewViewProps> = ({
  activeAssessment,
  onNavigate,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedTargets, setExpandedTargets] = useState<Record<TargetName, boolean>>({
    Cath: false,
    LAD: false,
    LCX: false,
    RCA: false,
  });

  const {
    explanation: shapExplanation,
    loading: shapLoading,
    error: shapError,
    refetch: refetchShap,
  } = usePatientExplanation(activeAssessment);

  const toggleTargetExpanded = (target: TargetName) => {
    setExpandedTargets((prev) => ({
      ...prev,
      [target]: !prev[target],
    }));
  };

  // Fallback state when no assessment has been conducted yet
  if (!activeAssessment || !activeAssessment.predictionResponse) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-8 animate-in fade-in duration-200">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 text-slate-500 mx-auto flex items-center justify-center">
            <Activity className="w-8 h-8 text-slate-400" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              No Active Patient Assessment Found
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              To view multi-target cardiovascular risk predictions and anatomical localization,
              complete the 5-step clinical assessment wizard or load an optional synthetic demonstration cohort.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('assessment')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Start Clinical Assessment</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('model-review')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <span>Inspect Model Review & Population Metrics</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 font-mono">
            Scientific Integrity: Zero synthetic probabilities are fabricated when patient inputs are missing.
          </div>
        </div>
      </div>
    );
  }

  const { predictionResponse, sessionId, timestamp, isSyntheticDemo, demoPresetName } = activeAssessment;
  const { predictions, disclaimer } = predictionResponse;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(predictionResponse, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const renderTargetCard = (target: TargetName, isPrimary = false) => {
    const data: TargetPrediction | undefined = predictions[target];
    const meta = TARGET_METADATA[target];

    if (!data) {
      return (
        <div
          key={target}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between"
        >
          <div className="text-xs font-mono font-bold text-slate-500 uppercase">{target}</div>
          <div className="text-sm text-slate-400 italic py-4">No prediction returned for target.</div>
        </div>
      );
    }

    const prob = formatProbability(data.probability);
    const isPositive = data.predicted_class === 1;

    const isExpanded = !!expandedTargets[target];
    const targetExpl = shapExplanation?.explanations?.[target];

    const attributions = targetExpl?.attributions || [];
    const topPositive = attributions
      .filter((a) => a.contribution > 0)
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);
    const topNegative = attributions
      .filter((a) => a.contribution < 0)
      .sort((a, b) => a.contribution - b.contribution)
      .slice(0, 3);

    return (
      <div
        key={target}
        className={`p-5 sm:p-6 rounded-2xl bg-white border transition-all duration-200 shadow-2xs flex flex-col justify-between gap-4 ${
          isPrimary
            ? 'border-cyan-300/80 bg-gradient-to-br from-white to-cyan-50/20'
            : isPositive
            ? 'border-rose-200 hover:border-rose-300'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wider ${
                  target === 'LAD'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : target === 'LCX'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : target === 'RCA'
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                }`}
              >
                {target}
              </span>
              <span className="text-xs font-bold text-slate-800">{meta.anatomy}</span>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-tight ${
                isPositive
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {isPositive ? 'CAD (Class 1)' : 'Negative (Class 0)'}
            </span>
          </div>

          {/* Probability Stat */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-500">Model Posterior Probability</span>
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {prob.formatted}
              </span>
            </div>

            {/* Accessible Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isPositive ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, prob.percentage))}%` }}
                role="progressbar"
                aria-valuenow={prob.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>0%</span>
              <span className="font-semibold text-slate-600">Decision Cutoff: 50.0%</span>
              <span>100%</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5">
            {meta.clinicalCriterion}
          </p>
        </div>

        {/* Anatomical Territory Tag */}
        <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
          <span>Territory:</span>
          <span className="font-semibold text-slate-700">{meta.perfusionTerritory}</span>
        </div>

        {/* Expandable SHAP Attribution Section: "Why did this model make this prediction?" */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={() => toggleTargetExpanded(target)}
            className="w-full flex items-center justify-between py-1.5 px-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-1 focus:ring-teal-500"
            aria-expanded={isExpanded}
          >
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Why did this model make this prediction?</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {isExpanded && (
            <div className="pt-1 pb-1 space-y-2.5 animate-in fade-in duration-200">
              {/* Loading State */}
              {shapLoading && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-mono">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Computing TreeSHAP feature attributions...</span>
                </div>
              )}

              {/* Error State */}
              {!shapLoading && shapError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Attribution service unavailable</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed font-sans">{shapError}</p>
                  <button
                    type="button"
                    onClick={refetchShap}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Attribution</span>
                  </button>
                </div>
              )}

              {/* Success Attribution State */}
              {!shapLoading && !shapError && targetExpl && (
                <div className="space-y-3">
                  {/* Baseline Prior Badge */}
                  <div className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                    <span>Model Baseline Prior:</span>
                    <span className="font-bold text-slate-800">
                      {(targetExpl.base_value * 100).toFixed(1)}%{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({targetExpl.base_value.toFixed(4)})
                      </span>
                    </span>
                  </div>

                  {/* Positive SHAP Contributors (Up to 3) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-rose-700 px-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>Pushes Probability UP (+)</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-400 font-mono">Impact (pp)</span>
                    </div>
                    {topPositive.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic px-2 py-1 bg-slate-50 rounded-lg">
                        No features increased model risk for this target.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {topPositive.map((f) => {
                          const ppStr = `+${(f.contribution * 100).toFixed(2)} pp`;
                          return (
                            <div
                              key={f.feature_name}
                              className="p-2 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-semibold text-slate-900 truncate">
                                  {f.feature_name}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Value: <strong>{String(f.submitted_value ?? 'N/A')}</strong>
                                </div>
                              </div>
                              <div className="text-right font-mono shrink-0">
                                <span className="text-xs font-bold text-rose-700">{ppStr}</span>
                                <div className="text-[9px] text-slate-400 font-mono">
                                  ({f.contribution >= 0 ? '+' : ''}{f.contribution.toFixed(4)})
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Negative SHAP Contributors (Up to 3) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 px-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Pushes Probability DOWN (−)</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-400 font-mono">Impact (pp)</span>
                    </div>
                    {topNegative.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic px-2 py-1 bg-slate-50 rounded-lg">
                        No features decreased model risk for this target.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {topNegative.map((f) => {
                          const ppStr = `${(f.contribution * 100).toFixed(2)} pp`;
                          return (
                            <div
                              key={f.feature_name}
                              className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-semibold text-slate-900 truncate">
                                  {f.feature_name}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Value: <strong>{String(f.submitted_value ?? 'N/A')}</strong>
                                </div>
                              </div>
                              <div className="text-right font-mono shrink-0">
                                <span className="text-xs font-bold text-emerald-700">{ppStr}</span>
                                <div className="text-[9px] text-slate-400 font-mono">
                                  ({f.contribution.toFixed(4)})
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Scientific boundary disclosure */}
                  <p className="text-[10px] text-slate-400 leading-tight border-t border-slate-100 pt-1.5">
                    *Contributions indicate directional model shifts in percentage-point units (pp) relative to baseline prior. They reflect correlational tree attributions, NOT causal biological risk or protective medical factors.
                  </p>

                  {/* Link to full report */}
                  <button
                    type="button"
                    onClick={() => onNavigate('report')}
                    className="w-full py-1.5 text-center text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                  >
                    Inspect Full 54-Feature Waterfall in Assessment Report →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
      {/* 1. Executive Telemetry & Action Header */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Multi-Target Prediction Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
              BALANCED RANDOM FOREST
            </span>
            {isSyntheticDemo && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                DEMO: {demoPresetName}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Four independent binary risk estimates evaluated from 54 clinical parameters (Tehran Heart Center cohort standard).
          </p>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-mono font-medium text-slate-700 border border-slate-200 shadow-2xs transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied JSON!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy JSON</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('assessment')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjust 54 Inputs</span>
          </button>
        </div>
      </div>

      {/* 2. Destination Gateway Launch Cards (Guiding user through the 4-destination suite) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gateway Card 1: 3D Explorer */}
        <div
          onClick={() => onNavigate('explorer')}
          className="p-5 rounded-2xl bg-gradient-to-br from-white to-rose-50/30 border border-rose-200/80 hover:border-rose-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between gap-3"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <HeartPulse className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Destination 2
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
              3D Cardiovascular Explorer
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Inspect the authentic 3D heart with Coral LAD, Violet LCX, and Teal RCA. Click arteries to align camera presets and inspect predictions.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 group-hover:translate-x-0.5 transition-transform">
            <span>Launch 3D Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Gateway Card 2: Individual Assessment Report */}
        <div
          onClick={() => onNavigate('report')}
          className="p-5 rounded-2xl bg-gradient-to-br from-white to-teal-50/30 border border-teal-200/80 hover:border-teal-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between gap-3"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                <FileText className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Destination 3
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
              Individual Assessment Report
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review full 54-feature clinical provenance, baseline assumptions, laboratory values, and the formal clinical patient dossier.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 group-hover:translate-x-0.5 transition-transform">
            <span>View Full Patient Dossier</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Gateway Card 3: Model Review */}
        <div
          onClick={() => onNavigate('model-review')}
          className="p-5 rounded-2xl bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-200/80 hover:border-indigo-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between gap-3"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                <BarChart3 className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Destination 4
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
              Model Review & Benchmarks
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore population-level 5-fold cross-validation metrics, ROC/PR curves, and Scikit-Learn pipeline architecture.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 group-hover:translate-x-0.5 transition-transform">
            <span>Inspect Model Benchmarks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. Primary Diagnostic Target: Cath */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
          <Stethoscope className="w-4 h-4 text-cyan-600" />
          <span>Primary Diagnostic Target (Global Coronary Disease)</span>
        </div>
        {renderTargetCard('Cath', true)}
      </div>

      {/* 4. Vessel-Specific Stenosis Localization: LAD, LCX, RCA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-600" />
            <span>Vessel-Specific Stenosis Localization (≥50% Luminal Occlusion)</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explorer')}
            className="text-teal-700 hover:text-teal-900 font-semibold lowercase hidden sm:inline-flex items-center gap-1"
          >
            <span>view in 3D explorer</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderTargetCard('LAD')}
          {renderTargetCard('LCX')}
          {renderTargetCard('RCA')}
        </div>
      </div>

      {/* 5. Scientific Interpretation & Clinical Scope Callouts */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Scientific Interpretation & Clinical Boundaries</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-600">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <span className="font-bold text-slate-900 block text-sm">1. Model Probability</span>
            <p>
              Posterior statistical score [0.0 - 1.0] derived from balanced Random Forest pipelines trained on the Tehran Heart Center cohort.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <span className="font-bold text-slate-900 block text-sm">2. Decision Label</span>
            <p>
              Binary threshold assignment applying the standard 50.0% cutoff (&lt;50% Normal, ≥50% CAD/Stenotic). Does not incorporate cost-sensitive utility weights.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <span className="font-bold text-slate-900 block text-sm">3. Clinical Diagnosis</span>
            <p>
              <strong className="text-slate-900">NOT a definitive diagnosis.</strong> Definitive cardiac diagnosis requires invasive catheterization, clinical imaging, and licensed physician judgment.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Official Disclaimer */}
      {disclaimer && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed font-mono">
            {disclaimer}
          </p>
        </div>
      )}
    </div>
  );
};
