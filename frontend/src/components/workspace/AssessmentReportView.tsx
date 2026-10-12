/**
 * frontend/src/components/workspace/AssessmentReportView.tsx
 * Destination 3: Individual Assessment Report & Working A4 PDF Export.
 * Comprehensive single-patient clinical dossier containing multi-target predictions,
 * 54-parameter feature provenance audit (measured vs baseline assumptions),
 * source methodology disclosures, BodyParts3D attribution, and browser-native PDF export.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useState } from 'react';
import {
  FileText,
  Activity,
  Sliders,
  Check,
  Copy,
  Printer,
  AlertTriangle,
  Clock,
  Layers,
  FlaskConical,
  ShieldAlert,
  SlidersHorizontal,
  Table,
  Info,
  CheckCircle2,
  Stethoscope,
  TrendingUp,
  RefreshCw,
  Loader2,
  Scale,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ActiveAssessment, WorkspaceDestination } from '../../api/assessmentState.ts';
import type { TargetName, TargetPrediction } from '../../api/types.ts';
import { usePatientExplanation } from '../../api/usePatientExplanation.ts';
import { TARGET_METADATA, formatProbability } from '../../api/presentationUtils.ts';

export interface AssessmentReportViewProps {
  activeAssessment: ActiveAssessment | null;
  onNavigate: (destination: WorkspaceDestination) => void;
}

export const AssessmentReportView: React.FC<AssessmentReportViewProps> = ({
  activeAssessment,
  onNavigate,
}) => {
  const [provenanceTab, setProvenanceTab] = useState<'assumed' | 'measured'>('assumed');
  const [includeProvenanceInPrint, setIncludeProvenanceInPrint] = useState(false);
  const [printLayoutMode, setPrintLayoutMode] = useState<'full' | 'compact'>('full');
  const [copied, setCopied] = useState(false);
  const [selectedAttributionTarget, setSelectedAttributionTarget] = useState<TargetName>('Cath');
  const [showFullAttributionList, setShowFullAttributionList] = useState(false);

  const {
    explanation: shapExplanation,
    loading: shapLoading,
    error: shapError,
    refetch: refetchShap,
  } = usePatientExplanation(activeAssessment);

  // Fallback when no active assessment exists
  if (!activeAssessment || !activeAssessment.predictionResponse) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-8 animate-in fade-in duration-200">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 text-slate-500 mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              No Assessment Dossier Available
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              An individual clinical report requires an active assessment. Complete the 5-step clinical wizard
              or load a synthetic demo cohort to generate patient risk estimates and feature provenance.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('assessment')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Start Patient Assessment</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 font-mono">
            Scientific Integrity: Zero synthetic values are fabricated when patient inputs are missing.
          </div>
        </div>
      </div>
    );
  }

  const {
    predictionResponse,
    sessionId,
    timestamp,
    isSyntheticDemo,
    demoPresetName,
    assumptions = [],
    measuredFields = [],
  } = activeAssessment;

  const { predictions, disclaimer } = predictionResponse;
  const targets: TargetName[] = ['Cath', 'LAD', 'LCX', 'RCA'];

  // Copy raw inference JSON to clipboard
  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(predictionResponse, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  // Browser-native A4 PDF generation via system print dialog
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 print:space-y-1.5 print:py-0 print:px-0 animate-in fade-in duration-200 print-report-container">
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 0. Print-Only Document Masthead (Hidden on screen, renders on paper)    */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-2 mb-2 space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-950 tracking-tight uppercase">
              CardioVision AI
            </h1>
            <p className="text-[10.5px] font-bold text-slate-700 tracking-wide uppercase">
              Cardiovascular Multi-Target Assessment Clinical Dossier
            </p>
          </div>
          <div className="text-right font-mono text-[8.5pt] text-slate-600">
            <div>CONFIDENTIAL MEDICAL AI RESEARCH DOSSIER</div>
            <div>EVALUATION STANDARD: TEHRAN COHORT (N=303)</div>
          </div>
        </div>
        <div className="flex items-center justify-between text-[8pt] font-mono text-slate-700 pt-1 border-t border-slate-300">
          <span>Session: <strong>{sessionId || 'UNAVAILABLE'}</strong></span>
          <span>Date/Time: <strong>{timestamp || 'UNAVAILABLE'}</strong></span>
          <span>
            Mode:{' '}
            <strong>
              {isSyntheticDemo
                ? `Synthetic Demo Cohort (${demoPresetName || 'Standard'})`
                : 'Live Patient Clinical Assessment'}
            </strong>
          </span>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 1. Screen Header & Actions Toolbar (Hidden during print)                */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="no-print p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        {/* Row 1: Report Title, Clinical Badges, and Description (Full Width) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 shrink-0">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Individual Patient Assessment Report
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
              CLINICAL DOSSIER
            </span>
            {isSyntheticDemo ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <FlaskConical className="w-3 h-3 text-amber-700" />
                <span>DEMO: {demoPresetName}</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>LIVE CLINICAL SESSION</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-4xl">
            Comprehensive single-patient prediction results, risk classifications, and 54-parameter feature provenance audit.
          </p>
        </div>

        {/* Row 2: Logical Action Toolbar (Separated by border, responsive wrapping) */}
        <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Action Group: Export, View Modes, and Appendix Option */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-mono font-medium text-slate-700 border border-slate-200 shadow-2xs transition-colors shrink-0"
              title="Copy raw inference response JSON to clipboard"
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

            {/* Segmented Print Mode Toggle */}
            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-mono shrink-0">
              <button
                type="button"
                onClick={() => setPrintLayoutMode('full')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  printLayoutMode === 'full'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Full 2-Page Executive Clinical Dossier (Page 1: Multi-target decision table + complete Section 3.5 TreeSHAP grid + interpretation callout; Page 2: Methodology disclosures and statutory disclaimers)"
              >
                Full (2-Page)
              </button>
              <button
                type="button"
                onClick={() => setPrintLayoutMode('compact')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  printLayoutMode === 'compact'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Compact 1-Page Summary (Condenses telemetry and methodology disclosures to fit cleanly on exactly 1 A4 sheet without page breaks)"
              >
                Compact (1-Page)
              </button>
            </div>

            {/* Working Browser-Native Print / Save as PDF Action */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
              title={
                includeProvenanceInPrint
                  ? "Opens system print dialog to print or save the complete dossier with 54-parameter appendix (Phase 3C.2 Export Feature)"
                  : printLayoutMode === 'compact'
                  ? "Opens system print dialog to print or save a clean, compact 1-page A4 summary (Phase 3C.2 Export Feature)"
                  : "Opens system print dialog to print or save the full 2-page executive clinical dossier (Phase 3C.2 Export Feature)"
              }
            >
              <Printer className="w-3.5 h-3.5 text-teal-300" />
              <span>
                {includeProvenanceInPrint
                  ? 'Print / Save as PDF (Full Dossier + Appendix)'
                  : printLayoutMode === 'compact'
                  ? 'Print / Save as PDF (1-Page Summary)'
                  : 'Print / Save as PDF (2-Page Dossier)'}
              </span>
            </button>

            {/* Appendix Checkbox */}
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={includeProvenanceInPrint}
                onChange={(e) => setIncludeProvenanceInPrint(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
              />
              <span className="text-[11px] text-slate-500 font-medium">Include 54-param appendix</span>
            </label>
          </div>

          {/* Navigation Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('assessment')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adjust Inputs</span>
            </button>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2. Patient Session Telemetry Card                                       */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className={`p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 print-break-inside-avoid print:border-slate-300 print:p-2.5 print:space-y-1.5 print:rounded-xl ${
        printLayoutMode === 'compact' ? 'print:hidden' : ''
      }`}>
        <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 print:text-slate-700 print:text-[7.5pt]">
          Assessment Telemetry & Evaluation Protocol
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono print:gap-1.5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 print:bg-white print:border-slate-300 print:p-1.5 print:rounded-lg">
            <span className="text-slate-400 block mb-0.5 print:text-slate-600 print:text-[7pt]">Session ID</span>
            <span className="font-bold text-slate-900 print:text-[8pt]">{sessionId || 'UNAVAILABLE'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 print:bg-white print:border-slate-300 print:p-1.5 print:rounded-lg">
            <span className="text-slate-400 block mb-0.5 print:text-slate-600 print:text-[7pt]">Timestamp</span>
            <span className="font-bold text-slate-900 print:text-[8pt]">{timestamp || 'UNAVAILABLE'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 print:bg-white print:border-slate-300 print:p-1.5 print:rounded-lg">
            <span className="text-slate-400 block mb-0.5 print:text-slate-600 print:text-[7pt]">Assessment Mode</span>
            <span className={`font-bold print:text-[8pt] ${isSyntheticDemo ? 'text-amber-700' : 'text-emerald-700'}`}>
              {isSyntheticDemo ? `Demo: ${demoPresetName || 'Synthetic'}` : 'Live Clinical Session'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 print:bg-white print:border-slate-300 print:p-1.5 print:rounded-lg">
            <span className="text-slate-400 block mb-0.5 print:text-slate-600 print:text-[7pt]">Reference Cohort</span>
            <span className="font-bold text-slate-900 print:text-[8pt]">Tehran Heart Center (N=303)</span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 3. Executive Multi-Target Prediction Summary Table                      */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden print-break-inside-avoid print:border-slate-300">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between print:p-2.5 print:border-slate-300">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-teal-600 no-print" />
            <h2 className="text-sm font-bold text-slate-900 print:text-xs">
              Executive Multi-Target Decision Summary
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono print:text-[8pt]">Standard Decision Threshold: 50.0%</span>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-xs text-left border-collapse print:text-[8pt] print:table-fixed">
            <thead className="bg-slate-50 text-slate-700 font-mono border-b border-slate-200 print:bg-slate-100 print:border-slate-300">
              <tr>
                <th className="py-3 px-4 font-bold print:py-1.5 print:px-2 print:w-[22%]">Target Vessel</th>
                <th className="py-3 px-4 font-bold print:py-1.5 print:px-2 print:w-[24%]">Anatomical Course</th>
                <th className="py-3 px-4 font-bold text-right print:py-1.5 print:px-2 print:w-[14%]">Posterior Prob</th>
                <th className="py-3 px-4 font-bold text-center print:py-1.5 print:px-2 print:w-[10%]">Threshold</th>
                <th className="py-3 px-4 font-bold text-center print:py-1.5 print:px-2 print:w-[14%]">Decision</th>
                <th className="py-3 px-4 font-bold print:py-1.5 print:px-2 print:w-[16%]">Criterion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono print:divide-slate-200">
              {targets.map((tgt) => {
                const pred: TargetPrediction | undefined = predictions?.[tgt];
                const meta = TARGET_METADATA[tgt];
                const prob = pred ? formatProbability(pred.probability) : null;
                const isPositive = pred?.predicted_class === 1;

                return (
                  <tr key={tgt} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2 print:py-1.5 print:px-2">
                      <span
                        className={`w-2 h-2 rounded-full no-print ${
                          tgt === 'LAD'
                            ? 'bg-[#E94F70]'
                            : tgt === 'LCX'
                            ? 'bg-[#8B5CF6]'
                            : tgt === 'RCA'
                            ? 'bg-[#0891B2]'
                            : 'bg-cyan-600'
                        }`}
                      />
                      <span>{tgt} ({meta ? meta.anatomy : 'Anatomy Unavailable'})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans print:py-1.5 print:px-2 print:text-[7.5pt]">
                      {meta ? meta.perfusionTerritory : 'Territory Unavailable'}
                    </td>
                    <td className="py-3 px-4 font-bold text-right text-slate-900 text-sm print:py-1.5 print:px-2 print:text-[8pt]">
                      {prob ? prob.formatted : 'Unavailable'}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 print:py-1.5 print:px-2 print:text-[7.5pt]">50.0%</td>
                    <td className="py-3 px-4 text-center print:py-1.5 print:px-2">
                      {pred ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold print:text-[7pt] print:px-1.5 ${
                            isPositive
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isPositive ? 'CAD (Stenotic)' : 'Negative (Normal)'}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unavailable</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-sans print:py-1.5 print:px-2 print:text-[7pt]">
                      {meta ? meta.clinicalCriterion : 'Criterion Unavailable'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 3.5. Patient-Specific Model Attribution (TreeSHAP)                      */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden space-y-4 p-5 sm:p-6 print-break-inside-avoid print:border-slate-300 print:p-2.5 print:space-y-1.5 print:rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 print:pb-1 print:border-slate-300">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-indigo-600 no-print" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 print:text-[8.5pt]">
                  Patient-Specific Model Attribution (TreeSHAP)
                </h2>
                <span className="no-print text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  Tree-Path-Dependent • Probability Output Space [0.0, 1.0]
                </span>
              </div>
              <p className="text-xs text-slate-500 print:text-[6.5pt] print:text-slate-600">
                Exact single-patient additive feature attribution decomposing the trained Random Forest output relative to baseline prior.
              </p>
            </div>
          </div>

          {/* Interactive Screen Target Selector */}
          <div className="no-print flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
            {targets.map((tgt) => {
              const isSelected = selectedAttributionTarget === tgt;
              return (
                <button
                  key={tgt}
                  type="button"
                  onClick={() => setSelectedAttributionTarget(tgt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tgt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {shapLoading && (
          <div className="p-8 flex flex-col items-center justify-center gap-2 text-xs text-slate-500 font-mono no-print">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Calculating patient-specific TreeSHAP attributions from ML backend...</span>
          </div>
        )}

        {/* Error State */}
        {!shapLoading && shapError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2 no-print">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Attribution Service Unavailable</span>
            </div>
            <p className="text-[11px] text-rose-700 font-sans">{shapError}</p>
            <button
              type="button"
              onClick={refetchShap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Attribution</span>
            </button>
          </div>
        )}

        {/* ── Screen Display for Selected Target ── */}
        {!shapLoading && !shapError && shapExplanation && (
          <div className="space-y-4 no-print">
            {(() => {
              const tgt = selectedAttributionTarget;
              const expl = shapExplanation.explanations[tgt];
              if (!expl) {
                return (
                  <div className="text-xs text-slate-400 italic py-4">
                    No explanation returned for target {tgt}.
                  </div>
                );
              }

              const posContribs = expl.attributions
                .filter((a) => a.contribution > 0)
                .sort((a, b) => b.contribution - a.contribution);
              const negContribs = expl.attributions
                .filter((a) => a.contribution < 0)
                .sort((a, b) => a.contribution - b.contribution);

              const topPos = posContribs.slice(0, 5);
              const topNeg = negContribs.slice(0, 5);
              const topPosSum = topPos.reduce((acc, a) => acc + a.contribution, 0);
              const topNegSum = topNeg.reduce((acc, a) => acc + a.contribution, 0);
              const topDisplayedSum = topPosSum + topNegSum;
              const remainingSum = expl.sum_attributions - topDisplayedSum;

              const maxAbs = Math.max(
                ...expl.attributions.map((a) => Math.abs(a.contribution)),
                0.001
              );
              const isAdditivityValid = expl.additivity_discrepancy < 0.0001;

              return (
                <div className="space-y-4">
                  {/* Telemetry Strip: Baseline, Probability, Net Sum, Additivity Verification */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 uppercase block mb-0.5">
                        Model Baseline Prior
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {(expl.base_value * 100).toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        ({expl.base_value.toFixed(4)})
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 uppercase block mb-0.5">
                        Positive-Class Prediction
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {(expl.predicted_probability * 100).toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        ({expl.predicted_probability.toFixed(4)})
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 uppercase block mb-0.5">
                        Net Attribution Sum
                      </span>
                      <span
                        className={`font-bold text-sm ${
                          expl.sum_attributions >= 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {expl.sum_attributions >= 0 ? '+' : ''}
                        {(expl.sum_attributions * 100).toFixed(2)} pp
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        ({expl.sum_attributions >= 0 ? '+' : ''}
                        {expl.sum_attributions.toFixed(4)})
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 uppercase block mb-0.5">
                        Additivity Reconstruction
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isAdditivityValid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-emerald-700">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="text-xs font-bold text-amber-700">Discrepancy</span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Δ = {expl.additivity_discrepancy.toExponential(2)}
                      </span>
                    </div>
                  </div>

                  {/* Strongest Contributors: Positive & Negative Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top Positive Drivers */}
                    <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-800 border-b border-rose-200/60 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>Strongest Probability Increases (+)</span>
                        </span>
                        <span className="text-[10px] font-mono font-normal text-slate-400">
                          {topPos.length} features
                        </span>
                      </div>

                      {topPos.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          No features contributed positively to this prediction.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {topPos.map((item) => {
                            const barPct = Math.min(100, (Math.abs(item.contribution) / maxAbs) * 100);
                            return (
                              <div key={item.feature_name} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="min-w-0 pr-2">
                                    <span className="font-semibold text-slate-900 truncate block">
                                      {item.feature_name}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      Entered: <strong>{String(item.submitted_value ?? 'N/A')}</strong>
                                    </span>
                                  </div>
                                  <div className="text-right font-mono shrink-0">
                                    <span className="font-bold text-rose-700">
                                      +{(item.contribution * 100).toFixed(2)} pp
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                      (+{item.contribution.toFixed(4)})
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full h-1.5 bg-rose-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-rose-500 rounded-full"
                                    style={{ width: `${barPct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Top Negative Drivers */}
                    <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800 border-b border-emerald-200/60 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Strongest Probability Decreases (−)</span>
                        </span>
                        <span className="text-[10px] font-mono font-normal text-slate-400">
                          {topNeg.length} features
                        </span>
                      </div>

                      {topNeg.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          No features contributed negatively to this prediction.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {topNeg.map((item) => {
                            const barPct = Math.min(100, (Math.abs(item.contribution) / maxAbs) * 100);
                            return (
                              <div key={item.feature_name} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="min-w-0 pr-2">
                                    <span className="font-semibold text-slate-900 truncate block">
                                      {item.feature_name}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      Entered: <strong>{String(item.submitted_value ?? 'N/A')}</strong>
                                    </span>
                                  </div>
                                  <div className="text-right font-mono shrink-0">
                                    <span className="font-bold text-emerald-700">
                                      {(item.contribution * 100).toFixed(2)} pp
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                      ({item.contribution.toFixed(4)})
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${barPct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mathematical Reconciliation Box (Distinguishing Top vs Full Sum) */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 font-mono">
                    <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
                      <span>Attribution Sum Reconciliation:</span>
                      <span>Formula: Baseline + Total Net Sum = Probability</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200">
                      <div>
                        Top Displayed Features Sum:{' '}
                        <strong className="text-slate-900">
                          {topDisplayedSum >= 0 ? '+' : ''}
                          {(topDisplayedSum * 100).toFixed(2)} pp
                        </strong>
                      </div>
                      <div>
                        Remaining Features Sum:{' '}
                        <strong className="text-slate-900">
                          {remainingSum >= 0 ? '+' : ''}
                          {(remainingSum * 100).toFixed(2)} pp
                        </strong>
                      </div>
                      <div>
                        Total Net Sum (All 54 Features):{' '}
                        <strong className="text-indigo-700">
                          {expl.sum_attributions >= 0 ? '+' : ''}
                          {(expl.sum_attributions * 100).toFixed(2)} pp
                        </strong>
                      </div>
                    </div>
                    <p className="text-[10.5px] text-slate-400 font-sans leading-tight pt-1">
                      Important: The displayed top features illustrate the most impactful individual drivers, but do not reconstruct the output alone. All 54 canonical clinical features are summed to achieve the exact reconstructed probability.
                    </p>
                  </div>

                  {/* Expand/Collapse Full 54 Feature Table Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowFullAttributionList((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-colors"
                    >
                      {showFullAttributionList ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide complete 54-feature attribution table</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Inspect all 54 canonical feature attributions for {tgt}</span>
                        </>
                      )}
                    </button>

                    {showFullAttributionList && (
                      <div className="mt-3 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-[11px] text-left border-collapse font-mono">
                          <thead className="bg-slate-50 text-slate-700 sticky top-0 border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3 font-bold">Canonical Feature</th>
                              <th className="py-2 px-3 font-bold">Submitted Value</th>
                              <th className="py-2 px-3 font-bold text-right">Contribution (pp)</th>
                              <th className="py-2 px-3 font-bold text-right">Raw Fraction</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {expl.attributions.map((a) => (
                              <tr key={a.feature_name} className="hover:bg-slate-50">
                                <td className="py-1.5 px-3 font-semibold text-slate-800">
                                  {a.feature_name}
                                </td>
                                <td className="py-1.5 px-3 text-slate-500">
                                  {String(a.submitted_value ?? 'N/A')}
                                </td>
                                <td
                                  className={`py-1.5 px-3 font-bold text-right ${
                                    a.contribution > 0
                                      ? 'text-rose-700'
                                      : a.contribution < 0
                                      ? 'text-emerald-700'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {a.contribution > 0 ? '+' : ''}
                                  {(a.contribution * 100).toFixed(2)} pp
                                </td>
                                <td className="py-1.5 px-3 text-right text-slate-400">
                                  {a.contribution > 0 ? '+' : ''}
                                  {a.contribution.toFixed(4)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Print-Only Multi-Target Attribution Summary Grid ── */}
        <div className="hidden print:block print:space-y-1.5">
          <div className="text-[7pt] font-mono text-slate-500 uppercase flex items-center justify-between pb-0.5 border-b border-slate-200">
            <span>Algorithm: TreeSHAP (tree-path-dependent, probability output space [0.0, 1.0])</span>
            <span>Mathematical Tolerance: Δ &lt; 1e-4</span>
          </div>

          <div className="grid grid-cols-2 gap-2 print:grid-cols-2">
            {targets.map((tgt) => {
              const expl = shapExplanation?.explanations?.[tgt];
              if (!expl) {
                return (
                  <div
                    key={tgt}
                    className="p-1.5 rounded-lg border border-slate-200 text-[6.5pt] font-mono text-slate-400 italic"
                  >
                    {tgt}: Explanations unavailable
                  </div>
                );
              }

              const posTop = expl.attributions
                .filter((a) => a.contribution > 0)
                .sort((a, b) => b.contribution - a.contribution)
                .slice(0, 2);
              const negTop = expl.attributions
                .filter((a) => a.contribution < 0)
                .sort((a, b) => a.contribution - b.contribution)
                .slice(0, 2);

              return (
                <div
                  key={tgt}
                  className="p-2 rounded-lg border border-slate-300 bg-white space-y-1 text-[7pt] font-mono"
                >
                  <div className="flex items-center justify-between font-bold border-b border-slate-200 pb-0.5">
                    <span className="text-slate-900">{tgt} ({TARGET_METADATA[tgt].anatomy})</span>
                    <span className="text-indigo-800">
                      P={(expl.predicted_probability * 100).toFixed(1)}% | Prior={(expl.base_value * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[6.5pt] text-slate-600">
                    <span>
                      Net Sum:{' '}
                      <strong className={expl.sum_attributions >= 0 ? 'text-rose-700' : 'text-emerald-700'}>
                        {expl.sum_attributions >= 0 ? '+' : ''}
                        {(expl.sum_attributions * 100).toFixed(1)} pp
                      </strong>
                    </span>
                    <span className="text-emerald-700 font-bold">
                      Additivity: Valid (Δ &lt; 1e-4)
                    </span>
                  </div>

                  {/* Top 2 Positive */}
                  <div className="space-y-0.5 pt-0.5 border-t border-slate-100">
                    <div className="text-[6pt] font-bold text-rose-700 uppercase">Top Risk Increases (+):</div>
                    {posTop.map((p) => (
                      <div key={p.feature_name} className="flex justify-between text-[6.5pt] text-slate-700">
                        <span className="truncate pr-1">{p.feature_name} ({String(p.submitted_value)})</span>
                        <span className="font-bold text-rose-700 shrink-0">
                          +{(p.contribution * 100).toFixed(1)} pp
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Top 2 Negative */}
                  <div className="space-y-0.5 pt-0.5 border-t border-slate-100">
                    <div className="text-[6pt] font-bold text-emerald-700 uppercase">Top Risk Decreases (−):</div>
                    {negTop.map((n) => (
                      <div key={n.feature_name} className="flex justify-between text-[6.5pt] text-slate-700">
                        <span className="truncate pr-1">{n.feature_name} ({String(n.submitted_value)})</span>
                        <span className="font-bold text-emerald-700 shrink-0">
                          {(n.contribution * 100).toFixed(1)} pp
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[6pt] text-slate-500 font-mono pt-0.5">
            *Attributions reflect statistical model reliance in percentage-point shifts relative to training baseline. They do NOT imply medical causality.
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 4. Scientific Interpretation Boundaries & Limitations Callout           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className={`p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4 print-break-inside-avoid print:border-slate-300 print:p-3 print:space-y-2 ${
        printLayoutMode === 'compact' ? 'print:hidden' : ''
      }`}>
        <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
          <Info className="w-4 h-4 text-teal-600 shrink-0 no-print" />
          <span>Scientific Scope & Diagnostic Boundaries</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-600 print:grid-cols-3 print:gap-2">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1 print:bg-white print:border-slate-300 print:p-2">
            <span className="font-bold text-slate-900 block text-xs print:text-[8pt]">1. Model Probability</span>
            <p className="text-[11px] print:text-[7.5pt]">
              Posterior statistical likelihood [0.0 - 1.0] calculated from balanced Random Forest pipelines trained on the Tehran Heart Center cohort.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1 print:bg-white print:border-slate-300 print:p-2">
            <span className="font-bold text-slate-900 block text-xs print:text-[8pt]">2. Decision Label</span>
            <p className="text-[11px] print:text-[7.5pt]">
              Binary classification applying the standard 50.0% cutoff (&lt;50% Normal, ≥50% CAD/Stenotic). Does not reflect patient-specific clinical utility weights.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1 print:bg-white print:border-slate-300 print:p-2">
            <span className="font-bold text-slate-900 block text-xs print:text-[8pt]">3. Clinical Diagnosis</span>
            <p className="text-[11px] print:text-[7.5pt]">
              <strong className="text-slate-900">NOT a clinical diagnosis.</strong> Statistical estimates cannot substitute for invasive catheterization, clinical imaging, or licensed physician judgment.
            </p>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 5. Full 54-Feature Clinical Provenance & Baseline Assumptions Audit     */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div
        className={`rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden space-y-4 p-5 sm:p-6 print:border-slate-300 print:p-4 ${
          includeProvenanceInPrint
            ? 'print-break-before print:block'
            : 'no-print print:hidden'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 print:border-slate-300">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-teal-600 no-print" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                54-Parameter Feature Provenance & Clinical Baseline Audit
              </h2>
              <p className="text-xs text-slate-500">
                Transparent separation of patient measured values versus statistical cohort baseline assumptions.
              </p>
            </div>
          </div>

          {/* Interactive Tab Controls (Screen only - both sections print in sequence) */}
          <div className="no-print flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setProvenanceTab('assumed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                provenanceTab === 'assumed'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Baseline Assumptions ({assumptions.length})
            </button>
            <button
              type="button"
              onClick={() => setProvenanceTab('measured')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                provenanceTab === 'measured'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Measured Features ({measuredFields.length})
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 print:bg-white print:border-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 no-print" />
          <p className="text-xs text-amber-900 leading-relaxed font-sans">
            <strong>Baseline Disclosure:</strong> Features completed from cohort medians/modes
            represent operational assumptions derived from the Tehran Heart Center study (N=303).
            They <strong>MUST NOT</strong> be interpreted as clinical evidence that conditions are absent in this individual patient.
          </p>
        </div>

        {/* Section A: Cohort Baseline Assumptions (Screen toggle or always printed) */}
        <div className={`${provenanceTab === 'assumed' ? 'block' : 'hidden'} print:block space-y-2`}>
          <div className="text-xs font-bold font-mono text-slate-700 uppercase flex items-center justify-between">
            <span>Cohort Baseline Assumptions ({assumptions.length} fields)</span>
            <span className="text-[11px] text-slate-400 font-normal">Derived from cohort central tendencies</span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto print:max-h-none print:overflow-visible rounded-xl border border-slate-200 bg-white print:border-slate-300">
            <table className="w-full text-[11px] text-left border-collapse print:text-[9pt]">
              <thead className="bg-slate-50 text-slate-700 font-mono sticky top-0 border-b border-slate-200 print:static print:bg-slate-100">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Canonical Feature</th>
                  <th className="py-2.5 px-3 font-bold">Category</th>
                  <th className="py-2.5 px-3 font-bold">Assumed Value</th>
                  <th className="py-2.5 px-3 font-bold">Evidence Source</th>
                  <th className="py-2.5 px-3 font-bold">Clinical Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700 print:divide-slate-200">
                {assumptions.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900">{item.canonicalField}</td>
                    <td className="py-2 px-3 text-slate-500">{item.category}</td>
                    <td className="py-2 px-3 font-bold text-teal-700">{String(item.assumedValue)}</td>
                    <td className="py-2 px-3 text-slate-600">{item.source}</td>
                    <td className="py-2 px-3 text-slate-500 font-sans">{item.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section B: Patient Measured Parameters (Screen toggle or always printed) */}
        <div className={`${provenanceTab === 'measured' ? 'block' : 'hidden'} print:block print:mt-4 space-y-2`}>
          <div className="text-xs font-bold font-mono text-slate-700 uppercase flex items-center justify-between">
            <span>Patient Measured & Entered Parameters ({measuredFields.length} fields)</span>
            <span className="text-[11px] text-slate-400 font-normal">Directly provided in wizard assessment</span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto print:max-h-none print:overflow-visible rounded-xl border border-slate-200 bg-white print:border-slate-300">
            <table className="w-full text-[11px] text-left border-collapse print:text-[9pt]">
              <thead className="bg-slate-50 text-slate-700 font-mono sticky top-0 border-b border-slate-200 print:static print:bg-slate-100">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Canonical Feature</th>
                  <th className="py-2.5 px-3 font-bold">Source Form Field</th>
                  <th className="py-2.5 px-3 font-bold">Entered / Derived Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700 print:divide-slate-200">
                {measuredFields.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900">{item.canonicalField}</td>
                    <td className="py-2 px-3 text-slate-500">{item.sourceFormField}</td>
                    <td className="py-2 px-3 font-bold text-slate-800">{String(item.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 6. Scientific Disclosures & BodyParts3D Licensing Attribution           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 print-break-inside-avoid print:bg-white print:border-slate-300 print:rounded-xl ${
        printLayoutMode === 'compact' ? 'print:p-1.5 print:space-y-0.5' : 'print:p-2.5 print:space-y-1'
      }`}>
        <span className={`font-bold text-slate-900 font-mono uppercase tracking-wider block text-[11px] ${
          printLayoutMode === 'compact' ? 'print:text-[7pt]' : 'print:text-[7.5pt]'
        }`}>
          Methodology & Anatomical Model Attribution Disclosures
        </span>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed print:gap-2 ${
          printLayoutMode === 'compact' ? 'print:text-[6.5pt] print:leading-tight' : 'print:text-[7pt]'
        }`}>
          <div>
            <strong className="text-slate-800 block mb-0.5">Machine Learning Architecture:</strong>
            Evaluated using scikit-learn Balanced Random Forest estimators with 5-fold stratified cross-validation on the Tehran Heart Center cohort (N=303). Strict train/test split isolation guarantees zero feature leakage.
          </div>
          <div>
            <strong className="text-slate-800 block mb-0.5">BodyParts3D Anatomical Attribution:</strong>
            Coronary arterial and myocardial 3D models derived from BodyParts3D (The Database Center for Life Science / National Bioscience Database Center, Japan), licensed under Creative Commons Attribution-ShareAlike 2.1 Japan (CC BY-SA 2.1 JP).
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 7. Medical Prototype Disclaimer                                         */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {disclaimer && (
        <div className={`p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 print-break-inside-avoid print:bg-white print:border-amber-300 print:rounded-xl ${
          printLayoutMode === 'compact' ? 'print:p-1.5' : 'print:p-2'
        }`}>
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 no-print" />
          <p className={`text-xs text-amber-900 leading-relaxed font-mono print:text-slate-700 ${
            printLayoutMode === 'compact' ? 'print:text-[6.5pt] print:leading-tight' : 'print:text-[7pt]'
          }`}>
            <strong>Clinical Notice:</strong> {disclaimer}
          </p>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 8. Print-Only Document Footer                                           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="hidden print:flex items-center justify-between pt-1.5 border-t border-slate-300 text-[7.5pt] font-mono text-slate-500">
        <span>CardioVision AI • Clinical Decision Support Research Prototype</span>
        <span>Not FDA-Cleared or CE-Marked • Strictly for Clinical Research</span>
        <span>Generated: {timestamp || 'N/A'}</span>
      </div>
    </div>
  );
};
