import React, { useState } from 'react';
import {
  Activity,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  ShieldAlert,
  Sliders,
  FileCheck2,
  Stethoscope,
  Clock,
  Layers,
} from 'lucide-react';
import type {
  PredictionResponse,
  TargetName,
  TargetPrediction,
  AssumedField,
  MeasuredField,
} from '../api/types.ts';
import {
  formatProbability,
  TARGET_METADATA,
  type FormattedProbability,
} from '../api/presentationUtils.ts';
import { CoronaryResultsCanvas } from './CoronaryResultsCanvas.tsx';

export { formatProbability, TARGET_METADATA, type FormattedProbability };

export interface PredictionResultsViewProps {
  predictionResponse: PredictionResponse | null;
  assumptionsUsed?: AssumedField[];
  measuredFieldsProvided?: MeasuredField[];
  timestamp?: string;
  sessionId?: string;
  onCopyResults?: () => void;
}

export const PredictionResultsView: React.FC<PredictionResultsViewProps> = ({
  predictionResponse,
  assumptionsUsed = [],
  measuredFieldsProvided = [],
  timestamp,
  sessionId,
  onCopyResults,
}) => {
  const [copied, setCopied] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const [provenanceTab, setProvenanceTab] = useState<'assumed' | 'measured'>('assumed');
  const [selectedTarget, setSelectedTarget] = useState<TargetName | null>(null);

  if (!predictionResponse || !predictionResponse.predictions) {
    return null;
  }

  const { predictions, disclaimer } = predictionResponse;
  const targets: TargetName[] = ['Cath', 'LAD', 'LCX', 'RCA'];

  const handleCopy = () => {
    if (onCopyResults) {
      onCopyResults();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    try {
      navigator.clipboard.writeText(JSON.stringify(predictionResponse, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
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
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between"
        >
          <div className="text-xs font-mono font-bold text-slate-500 uppercase">{target}</div>
          <div className="text-sm text-slate-400 italic py-4">No prediction returned for target.</div>
        </div>
      );
    }

    const prob = formatProbability(data.probability);
    const isPositive = data.predicted_class === 1;
    const isSelected = selectedTarget === target;

    return (
      <div
        key={target}
        role="button"
        tabIndex={0}
        onClick={() => setSelectedTarget(isSelected ? null : target)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedTarget(isSelected ? null : target);
          }
        }}
        className={`p-5 rounded-2xl bg-white border shadow-xs transition-all flex flex-col justify-between cursor-pointer ${
          isSelected
            ? 'border-cyan-400 ring-2 ring-cyan-400/80 shadow-md bg-cyan-50/20'
            : isPrimary
              ? isPositive
                ? 'border-rose-300 ring-1 ring-rose-200 hover:border-rose-400'
                : 'border-emerald-300 ring-1 ring-emerald-200 hover:border-emerald-400'
              : isPositive
                ? 'border-rose-200/90 hover:border-rose-300'
                : 'border-emerald-200/90 hover:border-emerald-300'
        }`}
      >
        <div>
          {/* Card Top: Target Label & Classification Badge */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-500">
                  Target: {target}
                </span>
                {isPrimary && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Primary Cath Outcome
                  </span>
                )}
                {isSelected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
                    Focused in 3D
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-slate-900 mt-0.5 tracking-tight">
                {meta.name}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1">{meta.perfusionTerritory}</p>
            </div>

            <span
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold shrink-0 border ${
                isPositive
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {data.predicted_label} (Class {data.predicted_class})
            </span>
          </div>

          {/* Model Statistical Probability Section */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-600">Model Posterior Likelihood:</span>
              <span className="text-xl font-extrabold font-mono text-slate-900 tracking-tight">
                {prob.formatted}
              </span>
            </div>

            {/* Accessible Progress Indicator */}
            <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-200/80 overflow-hidden">
              <div
                role="progressbar"
                aria-valuenow={prob.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${meta.name} model probability: ${prob.formatted}`}
                className={`h-full rounded-full transition-all duration-500 ${
                  isPositive ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${prob.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-0.5">
              <span>0% (Negative)</span>
              <span>Threshold: 50%</span>
              <span>100% (Positive)</span>
            </div>
          </div>
        </div>

        {/* Anatomical & Decision Footnote */}
        <div className="mt-4 pt-3 border-t border-slate-100/90 text-[11px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700">Criterion:</strong> {meta.clinicalCriterion}
        </div>
      </div>
    );
  };

  return (
    <section
      aria-labelledby="results-summary-heading"
      className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-sm text-slate-800 space-y-6 animate-in fade-in duration-300"
    >
      {/* Header & Session Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-800 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                id="results-summary-heading"
                className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight"
              >
                Cardiovascular Multi-Target Assessment Report
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100/70 text-cyan-800 border border-cyan-200">
                SCIKIT-LEARN INFERENCE
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Independent binary risk estimates evaluated across 4 target arterial structures
              (Tehran Heart Center Cohort N=303).
            </p>
          </div>
        </div>

        {/* Actions & Session Metadata */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {sessionId && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Layers className="w-3.5 h-3.5" />
              <span>{sessionId}</span>
            </span>
          )}

          {timestamp && (
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono text-slate-600 bg-white border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{timestamp}</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-mono font-medium text-slate-700 border border-slate-300 shadow-2xs transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Copy Prediction Results JSON to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied JSON!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Results JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full-Width 3D Anatomical Assessment Stage */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-600" />
            <span>Interactive 3D Cardiovascular Model</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 lowercase hidden sm:inline">
            drag to inspect • select preset views
          </span>
        </div>

        <CoronaryResultsCanvas
          predictionResponse={predictionResponse}
          selectedTarget={selectedTarget}
          onSelectTarget={setSelectedTarget}
        />
      </div>

      {/* Target 1: Primary Catheterization Outcome (Cath) */}
      <div>
        <div className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-2 font-mono uppercase tracking-wider">
          <Stethoscope className="w-4 h-4 text-cyan-600" />
          <span>Primary Diagnostic Target (Cath)</span>
        </div>
        {renderTargetCard('Cath', true)}
      </div>

      {/* Targets 2, 3, 4: Vessel Stenosis Localization (LAD, LCX, RCA) */}
      <div>
        <div className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-2 font-mono uppercase tracking-wider">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Vessel-Specific Stenosis Localization (≥50% Luminal Occlusion)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderTargetCard('LAD')}
          {renderTargetCard('LCX')}
          {renderTargetCard('RCA')}
        </div>
      </div>

      {/* Distinction Between Model Probability, Decision Label, and Clinical Diagnosis */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
          <Info className="w-4 h-4 text-cyan-600 shrink-0" />
          <span>Scientific Interpretation & Clinical Scope</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-slate-600">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="font-bold text-slate-900 block mb-1">1. Model Probability</span>
            Posterior statistical score [0.0 - 1.0] calculated from balanced Random Forest pipelines.
            Reflects relative proximity to CAD-positive instances in training space.
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="font-bold text-slate-900 block mb-1">2. Decision Label</span>
            Binary threshold assignment applying the standard 50.0% cutoff (&lt;50% Normal, ≥50%
            CAD/Stenotic). Does not incorporate cost-sensitive utility weights.
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="font-bold text-slate-900 block mb-1">3. Clinical Diagnosis</span>
            <span className="text-slate-900 font-semibold">NOT a diagnosis.</span> Definitive
            cardiac diagnosis requires invasive coronary catheterization, stress imaging, and
            licensed physician judgment.
          </div>
        </div>
      </div>

      {/* Clinical Provenance & Baseline Assumptions Accordion */}
      {(assumptionsUsed.length > 0 || measuredFieldsProvided.length > 0) && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowProvenance(!showProvenance)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            aria-expanded={showProvenance}
            aria-controls="provenance-disclosure-panel"
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-cyan-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Inspect Clinical Feature Provenance & Baseline Assumptions
                </span>
                <span className="text-[11px] text-slate-500">
                  {measuredFieldsProvided.length} patient parameters measured •{' '}
                  {assumptionsUsed.length} completed from cohort baseline medians/modes
                </span>
              </div>
            </div>
            {showProvenance ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showProvenance && (
            <div
              id="provenance-disclosure-panel"
              className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/50 space-y-4"
            >
              {/* Caution Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>Baseline Disclosure:</strong> Features completed from cohort medians/modes
                  represent statistical population figures from the Tehran Heart Center study
                  (N=303). They are operational assumptions for risk modeling and{' '}
                  <strong>MUST NOT</strong> be interpreted as clinical evidence that conditions are
                  absent in this individual patient.
                </p>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setProvenanceTab('assumed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors ${
                    provenanceTab === 'assumed'
                      ? 'bg-indigo-100 text-indigo-900 font-bold border border-indigo-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cohort Baseline Assumptions ({assumptionsUsed.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProvenanceTab('measured')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors ${
                    provenanceTab === 'measured'
                      ? 'bg-indigo-100 text-indigo-900 font-bold border border-indigo-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Patient Measured / Derived ({measuredFieldsProvided.length})
                </button>
              </div>

              {/* Tab 1: Cohort Assumptions Table */}
              {provenanceTab === 'assumed' && (
                <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-mono sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Canonical Feature</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Assumed Value</th>
                        <th className="py-2 px-3">Cohort Evidence (Source)</th>
                        <th className="py-2 px-3">Clinical Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {assumptionsUsed.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-bold text-slate-900">
                            {item.canonicalField}
                          </td>
                          <td className="py-1.5 px-3 text-slate-500">{item.category}</td>
                          <td className="py-1.5 px-3 font-bold text-indigo-700">
                            {String(item.assumedValue)}
                          </td>
                          <td className="py-1.5 px-3 text-slate-600">{item.source}</td>
                          <td className="py-1.5 px-3 text-slate-500 font-sans">{item.rationale}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Measured Features Table */}
              {provenanceTab === 'measured' && (
                <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-mono sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Canonical Feature</th>
                        <th className="py-2 px-3">Source Form Field</th>
                        <th className="py-2 px-3">Provided / Derived Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {measuredFieldsProvided.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-bold text-slate-900">
                            {item.canonicalField}
                          </td>
                          <td className="py-1.5 px-3 text-slate-500">{item.sourceFormField}</td>
                          <td className="py-1.5 px-3 font-bold text-emerald-700">
                            {String(item.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Official Prototype Disclaimer */}
      <div className="pt-4 border-t border-slate-200 flex items-start gap-2.5 text-xs text-slate-500 italic leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 not-italic" />
        <p>{disclaimer}</p>
      </div>
    </section>
  );
};
