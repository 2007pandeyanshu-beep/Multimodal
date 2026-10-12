/**
 * frontend/src/components/workspace/ModelReviewView.tsx
 * Destination 4: Model Review & Explainability.
 * Dedicated population-level model benchmarking and methodology review hub,
 * presenting validated 5-fold cross-validation metrics on the Tehran Heart Center cohort (N=303),
 * mathematically audited from Phase 2 Ground Truth (reports/phase2_integrity_audit/verified_metrics.csv),
 * architecture transparency, and honest placeholders for Phase 4 SHAP explainability.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Activity,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Lock,
  Info,
  Scale,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type { ActiveAssessment, WorkspaceDestination } from '../../api/assessmentState.ts';
import type { TargetName, GlobalShapResponse } from '../../api/types.ts';
import { fetchGlobalShapSummary } from '../../api/client.ts';

export interface ModelReviewViewProps {
  activeAssessment: ActiveAssessment | null;
  onNavigate: (destination: WorkspaceDestination) => void;
}

export interface VerifiedMetricRow {
  target: 'Cath' | 'LAD' | 'LCX' | 'RCA';
  fullName: string;
  scope: string;
  model: string;
  trainSamples: number;
  prevalence: number;
  // 5-fold CV Fold-Mean (mean ± std, ddof=1) from verified_metrics.csv
  foldMeanRocAuc: number;
  foldStdRocAuc: number;
  foldMeanAccuracy: number;
  foldStdAccuracy: number;
  foldMeanSensitivity: number;
  foldStdSensitivity: number;
  foldMeanSpecificity: number;
  foldStdSpecificity: number;
  foldMeanPrecision: number;
  foldStdPrecision: number;
  foldMeanF1: number;
  foldStdF1: number;
  foldMeanBrier: number;
  // Pooled Out-of-Fold (N=303 holdout predictions) from verified_metrics.csv
  pooledOofRocAuc: number;
  pooledOofAccuracy: number;
  pooledOofSensitivity: number;
  pooledOofSpecificity: number;
  pooledOofPrecision: number;
  pooledOofF1: number;
  pooledOofBrier: number;
  // Historical preliminary placeholder for audit reconciliation note
  historicalPlaceholderRocAuc: number;
  historicalPlaceholderBalancedAcc: number;
}

// Single Source of Truth from Phase 2 Numerical Integrity Audit (reports/phase2_integrity_audit/verified_metrics.csv)
export const VERIFIED_TARGET_METRICS: VerifiedMetricRow[] = [
  {
    target: 'Cath',
    fullName: 'Global Coronary Artery Disease',
    scope: 'Any major coronary vessel ≥50% stenosed',
    model: 'RandomForestClassifier (class_weight="balanced")',
    trainSamples: 303,
    prevalence: 0.7129,
    foldMeanRocAuc: 0.9195,
    foldStdRocAuc: 0.0436,
    foldMeanAccuracy: 0.8547,
    foldStdAccuracy: 0.0556,
    foldMeanSensitivity: 0.8565,
    foldStdSensitivity: 0.0625,
    foldMeanSpecificity: 0.8510,
    foldStdSpecificity: 0.0881,
    foldMeanPrecision: 0.9349,
    foldStdPrecision: 0.0391,
    foldMeanF1: 0.8931,
    foldStdF1: 0.0423,
    foldMeanBrier: 0.1220,
    pooledOofRocAuc: 0.9144,
    pooledOofAccuracy: 0.8548,
    pooledOofSensitivity: 0.8565,
    pooledOofSpecificity: 0.8506,
    pooledOofPrecision: 0.9343,
    pooledOofF1: 0.8937,
    pooledOofBrier: 0.1220,
    historicalPlaceholderRocAuc: 0.902,
    historicalPlaceholderBalancedAcc: 0.819,
  },
  {
    target: 'LAD',
    fullName: 'Left Anterior Descending Artery',
    scope: 'Anterior interventricular wall & septum',
    model: 'RandomForestClassifier (class_weight="balanced")',
    trainSamples: 303,
    prevalence: 0.5842,
    foldMeanRocAuc: 0.8383,
    foldStdRocAuc: 0.0765,
    foldMeanAccuracy: 0.7858,
    foldStdAccuracy: 0.0602,
    foldMeanSensitivity: 0.8424,
    foldStdSensitivity: 0.0527,
    foldMeanSpecificity: 0.7058,
    foldStdSpecificity: 0.0936,
    foldMeanPrecision: 0.8027,
    foldStdPrecision: 0.0521,
    foldMeanF1: 0.8216,
    foldStdF1: 0.0475,
    foldMeanBrier: 0.1692,
    pooledOofRocAuc: 0.8352,
    pooledOofAccuracy: 0.7855,
    pooledOofSensitivity: 0.8418,
    pooledOofSpecificity: 0.7063,
    pooledOofPrecision: 0.8011,
    pooledOofF1: 0.8209,
    pooledOofBrier: 0.1692,
    historicalPlaceholderRocAuc: 0.852,
    historicalPlaceholderBalancedAcc: 0.768,
  },
  {
    target: 'LCX',
    fullName: 'Left Circumflex Artery',
    scope: 'Posterolateral left ventricle & obtuse margin',
    model: 'RandomForestClassifier (class_weight="balanced")',
    trainSamples: 303,
    prevalence: 0.3927,
    foldMeanRocAuc: 0.7199,
    foldStdRocAuc: 0.0841,
    foldMeanAccuracy: 0.6402,
    foldStdAccuracy: 0.0883,
    foldMeanSensitivity: 0.6138,
    foldStdSensitivity: 0.0724,
    foldMeanSpecificity: 0.6572,
    foldStdSpecificity: 0.1173,
    foldMeanPrecision: 0.5469,
    foldStdPrecision: 0.1143,
    foldMeanF1: 0.5757,
    foldStdF1: 0.0860,
    foldMeanBrier: 0.2157,
    pooledOofRocAuc: 0.7130,
    pooledOofAccuracy: 0.6403,
    pooledOofSensitivity: 0.6134,
    pooledOofSpecificity: 0.6576,
    pooledOofPrecision: 0.5368,
    pooledOofF1: 0.5725,
    pooledOofBrier: 0.2157,
    historicalPlaceholderRocAuc: 0.774,
    historicalPlaceholderBalancedAcc: 0.706,
  },
  {
    target: 'RCA',
    fullName: 'Right Coronary Artery',
    scope: 'Right ventricle & inferior ventricular wall',
    model: 'RandomForestClassifier (class_weight="balanced")',
    trainSamples: 303,
    prevalence: 0.3762,
    foldMeanRocAuc: 0.7340,
    foldStdRocAuc: 0.0589,
    foldMeanAccuracy: 0.6698,
    foldStdAccuracy: 0.0508,
    foldMeanSensitivity: 0.6308,
    foldStdSensitivity: 0.0837,
    foldMeanSpecificity: 0.6933,
    foldStdSpecificity: 0.0701,
    foldMeanPrecision: 0.5563,
    foldStdPrecision: 0.0690,
    foldMeanF1: 0.5893,
    foldStdF1: 0.0639,
    foldMeanBrier: 0.2087,
    pooledOofRocAuc: 0.7313,
    pooledOofAccuracy: 0.6700,
    pooledOofSensitivity: 0.6316,
    pooledOofSpecificity: 0.6931,
    pooledOofPrecision: 0.5538,
    pooledOofF1: 0.5902,
    pooledOofBrier: 0.2087,
    historicalPlaceholderRocAuc: 0.796,
    historicalPlaceholderBalancedAcc: 0.718,
  },
];

// Cross-Algorithm Benchmark Comparison from reports/model_comparison.csv
export interface AlgorithmComparisonRow {
  target: 'Cath' | 'LAD' | 'LCX' | 'RCA';
  model: string;
  meanRocAuc: number;
  meanAccuracy: number;
  meanPrecision: number;
  meanRecall: number;
  meanF1: number;
  meanBrier: number;
  isProduction: boolean;
}

export const CROSS_ALGORITHM_BENCHMARKS: AlgorithmComparisonRow[] = [
  // Cath
  { target: 'Cath', model: 'Random Forest (Production)', meanRocAuc: 0.9195, meanAccuracy: 0.8547, meanPrecision: 0.9349, meanRecall: 0.8564, meanF1: 0.8931, meanBrier: 0.1220, isProduction: true },
  { target: 'Cath', model: 'Logistic Regression', meanRocAuc: 0.9279, meanAccuracy: 0.8445, meanPrecision: 0.9225, meanRecall: 0.8562, meanF1: 0.8867, meanBrier: 0.1061, isProduction: false },
  { target: 'Cath', model: 'Gradient Boosting', meanRocAuc: 0.9070, meanAccuracy: 0.8415, meanPrecision: 0.8676, meanRecall: 0.9212, meanF1: 0.8925, meanBrier: 0.1155, isProduction: false },
  // LAD
  { target: 'LAD', model: 'Random Forest (Production)', meanRocAuc: 0.8383, meanAccuracy: 0.7858, meanPrecision: 0.8028, meanRecall: 0.8424, meanF1: 0.8216, meanBrier: 0.1692, isProduction: true },
  { target: 'LAD', model: 'Logistic Regression', meanRocAuc: 0.8163, meanAccuracy: 0.7327, meanPrecision: 0.7932, meanRecall: 0.7346, meanF1: 0.7612, meanBrier: 0.1866, isProduction: false },
  { target: 'LAD', model: 'Gradient Boosting', meanRocAuc: 0.8446, meanAccuracy: 0.7757, meanPrecision: 0.7941, meanRecall: 0.8365, meanF1: 0.8140, meanBrier: 0.1597, isProduction: false },
  // LCX
  { target: 'LCX', model: 'Random Forest (Production)', meanRocAuc: 0.7199, meanAccuracy: 0.6402, meanPrecision: 0.5469, meanRecall: 0.6138, meanF1: 0.5757, meanBrier: 0.2157, isProduction: true },
  { target: 'LCX', model: 'Logistic Regression', meanRocAuc: 0.6544, meanAccuracy: 0.6169, meanPrecision: 0.5187, meanRecall: 0.5880, meanF1: 0.5488, meanBrier: 0.2573, isProduction: false },
  { target: 'LCX', model: 'Gradient Boosting', meanRocAuc: 0.7154, meanAccuracy: 0.6732, meanPrecision: 0.6055, meanRecall: 0.5040, meanF1: 0.5488, meanBrier: 0.2127, isProduction: false },
  // RCA
  { target: 'RCA', model: 'Random Forest (Production)', meanRocAuc: 0.7340, meanAccuracy: 0.6698, meanPrecision: 0.5563, meanRecall: 0.6308, meanF1: 0.5893, meanBrier: 0.2087, isProduction: true },
  { target: 'RCA', model: 'Logistic Regression', meanRocAuc: 0.7059, meanAccuracy: 0.6503, meanPrecision: 0.5377, meanRecall: 0.6229, meanF1: 0.5694, meanBrier: 0.2376, isProduction: false },
  { target: 'RCA', model: 'Gradient Boosting', meanRocAuc: 0.6933, meanAccuracy: 0.6666, meanPrecision: 0.5944, meanRecall: 0.4292, meanF1: 0.4891, meanBrier: 0.2200, isProduction: false },
];

const SHAP_TARGET_BADGES: Record<TargetName, { bg: string; text: string; dot: string; border: string }> = {
  Cath: { bg: 'bg-cyan-50', text: 'text-cyan-800', dot: 'bg-cyan-600', border: 'border-cyan-200' },
  LAD: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-[#E94F70]', border: 'border-rose-200' },
  LCX: { bg: 'bg-purple-50', text: 'text-purple-800', dot: 'bg-[#8B5CF6]', border: 'border-purple-200' },
  RCA: { bg: 'bg-teal-50', text: 'text-teal-800', dot: 'bg-[#0891B2]', border: 'border-teal-200' },
};

const SHAP_TARGET_TITLES: Record<TargetName, string> = {
  Cath: 'Global Coronary Artery Disease (Cath)',
  LAD: 'Left Anterior Descending Artery (LAD)',
  LCX: 'Left Circumflex Artery (LCX)',
  RCA: 'Right Coronary Artery (RCA)',
};

export const ModelReviewView: React.FC<ModelReviewViewProps> = ({
  activeAssessment,
  onNavigate,
}) => {
  const [metricTab, setMetricTab] = useState<'fold-mean' | 'pooled-oof' | 'comparison'>('fold-mean');
  const [selectedShapTarget, setSelectedShapTarget] = useState<TargetName>('Cath');
  const [shapData, setShapData] = useState<GlobalShapResponse | null>(null);
  const [shapLoading, setShapLoading] = useState<boolean>(true);
  const [shapError, setShapError] = useState<string | null>(null);

  const loadShapData = async () => {
    setShapLoading(true);
    setShapError(null);
    try {
      const data = await fetchGlobalShapSummary(6000);
      setShapData(data);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to load population SHAP explainability data. Please check backend connection.';
      setShapError(errorMsg);
    } finally {
      setShapLoading(false);
    }
  };

  useEffect(() => {
    loadShapData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
      {/* 1. Header & Population Scope */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Model Review & Population Benchmarks
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              TEHRAN COHORT (N=303)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Population-level 5-fold cross-validation metrics mathematically verified from Phase 2 Ground Truth. Independent of individual patient assessments.
          </p>
        </div>

        {/* Active Assessment Context Badge if present */}
        {activeAssessment && (
          <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('overview')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>Back to Patient Predictions</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Assessment Context Notification */}
      {activeAssessment && (
        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between gap-3 text-xs text-teal-900">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>
              Session <strong>{activeAssessment.sessionId}</strong> was assessed using these four scikit-learn models.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="font-bold underline text-teal-800 hover:text-teal-950"
          >
            View Active Assessment Results →
          </button>
        </div>
      )}

      {/* 2. Audited Cross-Validation Benchmarks Matrix */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Target Performance Matrix (5-Fold Stratified Cross-Validation)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative values verified from <code>reports/phase2_integrity_audit/verified_metrics.csv</code> and <code>model_metadata.json</code>.
            </p>
          </div>

          {/* Metric Representation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium font-mono shrink-0">
            <button
              type="button"
              onClick={() => setMetricTab('fold-mean')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                metricTab === 'fold-mean'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fold-Mean (Mean ± Std)
            </button>
            <button
              type="button"
              onClick={() => setMetricTab('pooled-oof')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                metricTab === 'pooled-oof'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pooled OOF (N=303)
            </button>
            <button
              type="button"
              onClick={() => setMetricTab('comparison')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                metricTab === 'comparison'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Algorithm Comparison
            </button>
          </div>
        </div>

        {/* Tab 1: Fold-Mean Across 5 Folds */}
        {metricTab === 'fold-mean' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-mono border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Target</th>
                  <th className="py-3.5 px-4 font-bold">Anatomical Scope</th>
                  <th className="py-3.5 px-4 font-bold text-center">Prevalence</th>
                  <th className="py-3.5 px-4 font-bold text-center">ROC-AUC (Mean ± Std)</th>
                  <th className="py-3.5 px-4 font-bold text-center">Accuracy</th>
                  <th className="py-3.5 px-4 font-bold text-center">Sensitivity</th>
                  <th className="py-3.5 px-4 font-bold text-center">Specificity</th>
                  <th className="py-3.5 px-4 font-bold text-center">Precision</th>
                  <th className="py-3.5 px-4 font-bold text-center">F1-Score</th>
                  <th className="py-3.5 px-4 font-bold text-center">Brier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {VERIFIED_TARGET_METRICS.map((m) => (
                  <tr key={m.target} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          m.target === 'LAD'
                            ? 'bg-[#E94F70]'
                            : m.target === 'LCX'
                            ? 'bg-[#8B5CF6]'
                            : m.target === 'RCA'
                            ? 'bg-[#0891B2]'
                            : 'bg-cyan-600'
                        }`}
                      />
                      <span>{m.target}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-sans">{m.fullName}</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">{(m.prevalence * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-4 font-bold text-center text-indigo-700 bg-indigo-50/40">
                      {m.foldMeanRocAuc.toFixed(4)} <span className="text-[10px] text-slate-500 font-normal">±{m.foldStdRocAuc.toFixed(3)}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-center text-slate-800">
                      {m.foldMeanAccuracy.toFixed(4)} <span className="text-[10px] text-slate-400 font-normal">±{m.foldStdAccuracy.toFixed(3)}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-center text-slate-800">
                      {m.foldMeanSensitivity.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-center text-slate-800">
                      {m.foldMeanSpecificity.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-center text-slate-800">
                      {m.foldMeanPrecision.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-center text-slate-800">
                      {m.foldMeanF1.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {m.foldMeanBrier.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Pooled Out-of-Fold (N=303) */}
        {metricTab === 'pooled-oof' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-mono border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Target</th>
                  <th className="py-3.5 px-4 font-bold">Anatomical Scope</th>
                  <th className="py-3.5 px-4 font-bold text-center">Pooled N</th>
                  <th className="py-3.5 px-4 font-bold text-center">Pooled ROC-AUC</th>
                  <th className="py-3.5 px-4 font-bold text-center">Pooled Accuracy</th>
                  <th className="py-3.5 px-4 font-bold text-center">Pooled Sensitivity</th>
                  <th className="py-3.5 px-4 font-bold text-center">Pooled Specificity</th>
                  <th className="py-3.5 px-4 font-bold text-center">Pooled Precision</th>
                  <th className="py-3.5 px-4 font-bold text-center">Pooled F1</th>
                  <th className="py-3.5 px-4 font-bold text-center">Pooled Brier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {VERIFIED_TARGET_METRICS.map((m) => (
                  <tr key={m.target} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          m.target === 'LAD'
                            ? 'bg-[#E94F70]'
                            : m.target === 'LCX'
                            ? 'bg-[#8B5CF6]'
                            : m.target === 'RCA'
                            ? 'bg-[#0891B2]'
                            : 'bg-cyan-600'
                        }`}
                      />
                      <span>{m.target}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-sans">{m.fullName}</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">{m.trainSamples}</td>
                    <td className="py-3.5 px-4 font-bold text-center text-indigo-700 bg-indigo-50/40">
                      {m.pooledOofRocAuc.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-center text-slate-800">
                      {m.pooledOofAccuracy.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-center text-slate-800">
                      {m.pooledOofSensitivity.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-center text-slate-800">
                      {m.pooledOofSpecificity.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-center text-slate-800">
                      {m.pooledOofPrecision.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-center text-slate-800">
                      {m.pooledOofF1.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {m.pooledOofBrier.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Cross-Algorithm Comparison Baseline */}
        {metricTab === 'comparison' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-mono border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Target</th>
                  <th className="py-3.5 px-4 font-bold">Algorithm</th>
                  <th className="py-3.5 px-4 font-bold text-center">Mean ROC-AUC</th>
                  <th className="py-3.5 px-4 font-bold text-center">Mean Accuracy</th>
                  <th className="py-3.5 px-4 font-bold text-center">Mean Precision</th>
                  <th className="py-3.5 px-4 font-bold text-center">Mean Recall</th>
                  <th className="py-3.5 px-4 font-bold text-center">Mean F1</th>
                  <th className="py-3.5 px-4 font-bold text-center">Mean Brier</th>
                  <th className="py-3.5 px-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {CROSS_ALGORITHM_BENCHMARKS.map((b, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      b.isProduction ? 'bg-indigo-50/30 font-semibold' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">{b.target}</td>
                    <td className="py-3 px-4 font-sans text-slate-700">{b.model}</td>
                    <td className="py-3 px-4 text-center text-indigo-700 font-bold">
                      {b.meanRocAuc.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-800">{b.meanAccuracy.toFixed(4)}</td>
                    <td className="py-3 px-4 text-center text-slate-800">{b.meanPrecision.toFixed(4)}</td>
                    <td className="py-3 px-4 text-center text-slate-800">{b.meanRecall.toFixed(4)}</td>
                    <td className="py-3 px-4 text-center text-slate-800">{b.meanF1.toFixed(4)}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{b.meanBrier.toFixed(4)}</td>
                    <td className="py-3 px-4 text-center">
                      {b.isProduction ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Selected
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Alternative</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Accessible Methodology & Metric Reconciliation Note */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Metric Provenance & Mathematical Reconciliation Methodology</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-600">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <strong className="text-slate-900 block text-xs">
              1. Fold-Mean vs. Pooled Out-of-Fold (OOF) Distinction
            </strong>
            <p>
              <strong>Fold-Mean</strong> averages metric scores calculated within each of the 5 cross-validation validation folds, with standard deviations reflecting fold-to-fold stability. <strong>Pooled OOF</strong> concatenates all 303 validation predictions into a single vector before computing ranking metrics. Minor differences arise because Pooled OOF ranks all holdout predictions against a single global threshold, whereas Fold-Mean evaluates within-fold thresholds.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <strong className="text-slate-900 block text-xs">
              2. Accuracy vs. Balanced Accuracy & Class Weighting
            </strong>
            <p>
              In the Tehran Heart Center cohort (N=303), target prevalence varies substantially (Cath 71.3%, LAD 58.4%, LCX 39.3%, RCA 37.6%). To prevent majority-class collapse on LCX and RCA, production Random Forest estimators incorporate cost-sensitive class balancing (<code>class_weight='balanced'</code>). Reported accuracies reflect standard evaluation ratios.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 md:col-span-2">
            <strong className="text-slate-900 block text-xs">
              3. Audit Reconciliation of Historical Preliminary Placeholders
            </strong>
            <p>
              Early UI prototypes referenced preliminary estimates (Cath ROC-AUC 0.902, LAD 0.852, LCX 0.774, RCA 0.796). In Phase 3C.2.1, these values were audited against the authoritative Phase 2 Numerical Integrity Audit (<code>reports/phase2_integrity_audit/verified_metrics.csv</code>). The verified fold-mean ROC-AUC values are: <strong>Cath 0.9195 ± 0.044</strong>, <strong>LAD 0.8383 ± 0.076</strong>, <strong>LCX 0.7199 ± 0.084</strong>, and <strong>RCA 0.7340 ± 0.059</strong>. Preliminary placeholders are marked as unverified historical estimates.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Machine Learning Architecture & Leakage Protections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Lock className="w-4 h-4 text-teal-600" />
            <span>Strict Train/Test Isolation</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All feature scaling and imputation pipelines are fit strictly on training folds within each cross-validation split, preventing data leakage into validation splits.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>Multi-Target Independence</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cath, LAD, LCX, and RCA are trained as separate estimators. No target prediction is used as a feature for any other target.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Balanced Class Weighting</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Class imbalance across vessel-specific targets is handled through cost-sensitive weighting, stabilizing minority class recall without synthetic distortion.
          </p>
        </div>
      </div>

      {/* 5. Global Feature Attribution & Explainability Architecture (Phase 4.2) */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900">
              Global Feature Attribution & Model Explainability
            </h2>
            <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200">
              TreeSHAP (N=303 Cohort)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cohort-level mean absolute SHAP attribution across the Tehran Heart Center cohort. Quantifies average marginal probability impact across canonical clinical predictors.
          </p>
        </div>

        {/* Global SHAP Interactive Explorer Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Population-Level Mean Absolute SHAP (|SHAP|)
                </h3>
                <p className="text-xs text-slate-500">
                  {SHAP_TARGET_TITLES[selectedShapTarget]}
                </p>
              </div>
            </div>

            {/* Target Selector Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['Cath', 'LAD', 'LCX', 'RCA'] as TargetName[]).map((t) => {
                const isSelected = selectedShapTarget === t;
                const badge = SHAP_TARGET_BADGES[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedShapTarget(t)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          {shapLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs font-medium text-slate-500">
                Computing population SHAP feature attributions from backend service...
              </p>
            </div>
          )}

          {/* Error State */}
          {!shapLoading && shapError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Unable to load population SHAP explainability</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed font-sans">{shapError}</p>
              <button
                type="button"
                onClick={loadShapData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Fetch</span>
              </button>
            </div>
          )}

          {/* Success State: Top 10 Features */}
          {!shapLoading && !shapError && shapData && (
            <div className="space-y-4">
              {(() => {
                const targetObj = shapData.targets[selectedShapTarget];
                const features = targetObj?.top_features ?? [];
                if (features.length === 0) {
                  return (
                    <div className="py-8 text-center text-xs text-slate-400 font-mono">
                      No feature importance data available for {selectedShapTarget}.
                    </div>
                  );
                }
                const maxVal = Math.max(...features.map((f) => f.mean_absolute_shap), 0.001);
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 border-b border-slate-100 pb-1.5">
                      <span>Rank & Canonical Predictor</span>
                      <span>Mean |SHAP| Impact (% & Fraction)</span>
                    </div>

                    <div className="space-y-2.5">
                      {features.map((item) => {
                        const relativeWidthPct = Math.min(100, Math.max(2, (item.mean_absolute_shap / maxVal) * 100));
                        const pctStr = (item.mean_absolute_shap * 100).toFixed(2) + '%';
                        return (
                          <div
                            key={item.rank}
                            className="p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 transition-colors border border-slate-100 group space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 text-right font-mono text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                                  #{item.rank}
                                </span>
                                <span className="font-semibold text-slate-800 truncate" title={item.feature_name}>
                                  {item.feature_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 font-mono shrink-0 text-right">
                                <span className="font-bold text-slate-900 group-hover:text-indigo-900">
                                  {pctStr}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  ({item.mean_absolute_shap.toFixed(4)})
                                </span>
                              </div>
                            </div>
                            {/* Accessible Neutral Horizontal Bar */}
                            <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-700 group-hover:bg-indigo-600 transition-all duration-300 rounded-full"
                                style={{ width: `${relativeWidthPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Methodology & Boundary Notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Explainability Methodology & Clinical Boundary</span>
                </div>
                <p>
                  Mean absolute SHAP represents population-wide feature importance across all {shapData.sample_size} patients in the {shapData.cohort_name}. Features are ranked strictly in descending magnitude with deterministic alphabetical tie-breaking. Attributions characterize associative model reliance in probability space [0.0, 1.0]; they do not establish biological or clinical causality. Local patient attributions will vary based on individual risk factor interactions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Companion Module: Static ROC & PR Curves Explorer */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <span>ROC & Precision-Recall Curve Explorer</span>
            </span>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
              Phase 2 Verified Curves
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Static 5-fold cross-validation ROC and Precision-Recall charts were generated and verified during Phase 2. Interactive WebGL curve browsing will be enabled in subsequent iterations.
          </p>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400 font-mono">
            [Phase 2 Benchmark Curves Preserved in reports/phase2_charts/]
          </div>
        </div>
      </div>
    </div>
  );
};
