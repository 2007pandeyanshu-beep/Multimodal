/**
 * frontend/src/components/workspace/CardiovascularExplorerView.tsx
 * Destination 2: 3D Cardiovascular Explorer.
 * Dedicated anatomical stage hosting the authentic BodyParts3D Release 4.0 heart,
 * distinct three-artery color system (Coral LAD, Violet LCX, Teal RCA),
 * camera presets, interactive raycast selection, and hover prediction cards.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useState } from 'react';
import {
  HeartPulse,
  Activity,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Info,
  ShieldAlert,
  Compass,
  Eye,
} from 'lucide-react';
import type { ActiveAssessment, WorkspaceDestination } from '../../api/assessmentState.ts';
import type { TargetName } from '../../api/types.ts';
import { CoronaryResultsCanvas } from '../CoronaryResultsCanvas.tsx';
import { TARGET_METADATA, formatProbability } from '../../api/presentationUtils.ts';

export interface CardiovascularExplorerViewProps {
  activeAssessment: ActiveAssessment | null;
  onNavigate: (destination: WorkspaceDestination) => void;
}

export const CardiovascularExplorerView: React.FC<CardiovascularExplorerViewProps> = ({
  activeAssessment,
  onNavigate,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<TargetName | null>(null);

  const predictionResponse = activeAssessment?.predictionResponse || null;
  const hasPredictions = Boolean(predictionResponse && predictionResponse.predictions);

  const targets: TargetName[] = ['Cath', 'LAD', 'LCX', 'RCA'];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Stage Controls Bar */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <HeartPulse className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              3D Cardiovascular Explorer
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
              BODYPARTS3D 4.0
            </span>
            {activeAssessment?.sessionId && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {activeAssessment.sessionId}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Authentic polygonal heart and coronary branches mapped with distinct clinical palettes. Drag to rotate, click vessels to inspect risk.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Prediction Overview</span>
          </button>

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

      {/* Informative Banner when no active assessment exists */}
      {!hasPredictions && (
        <div className="p-4 rounded-2xl bg-sky-50/90 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5 text-xs text-sky-900">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>Baseline Anatomical Display:</strong> No active patient assessment is currently loaded.
              Vessel risk probabilities and prediction cards will populate when an assessment is submitted.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('assessment')}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shrink-0 self-start sm:self-auto"
          >
            Start Assessment →
          </button>
        </div>
      )}

      {/* 2. Full-Width 3D Anatomical Stage */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/3 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-rose-600" />
            <span>Interactive Coronary Tree & Myocardial Surface</span>
          </div>
          <span className="text-[11px] text-slate-400 lowercase hidden sm:inline">
            3D mouse rotation • scroll zoom • touch pan
          </span>
        </div>

        {/* 3D Canvas Stage */}
        <CoronaryResultsCanvas
          predictionResponse={predictionResponse}
          selectedTarget={selectedTarget}
          onSelectTarget={setSelectedTarget}
        />
      </div>

      {/* 3. Interactive Artery Selection & Risk Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-teal-600" />
            <span>Select Artery to Focus 3D Camera & Highlight Sulcus</span>
          </div>
          {selectedTarget && (
            <button
              type="button"
              onClick={() => setSelectedTarget(null)}
              className="text-xs font-mono text-slate-500 hover:text-slate-800 underline"
            >
              Reset 3D Selection
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {targets.map((tgt) => {
            const isSelected = selectedTarget === tgt;
            const pred = predictionResponse?.predictions?.[tgt];
            const meta = TARGET_METADATA[tgt];
            const prob = pred ? formatProbability(pred.probability) : null;
            const isPositive = pred?.predicted_class === 1;

            return (
              <button
                key={tgt}
                type="button"
                onClick={() => setSelectedTarget(isSelected ? null : tgt)}
                className={`p-4 rounded-2xl text-left border transition-all duration-200 shadow-2xs flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-sky-50/90 border-sky-400 ring-2 ring-sky-500/20 text-slate-950 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                        tgt === 'LAD'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : tgt === 'LCX'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : tgt === 'RCA'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                      }`}
                    >
                      {tgt}
                    </span>
                    <span className="text-xs font-bold">{meta.anatomy}</span>
                  </div>

                  {prob && (
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isPositive
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isPositive ? 'CAD' : 'Normal'}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-500">Risk Score</span>
                    <span className="text-lg font-black font-mono">
                      {prob ? prob.formatted : '—'}
                    </span>
                  </div>

                  {prob && (
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isPositive ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${prob.percentage}%` }}
                      />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-snug truncate">
                  {meta.perfusionTerritory}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Anatomical Course Notes */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 text-xs text-slate-600 space-y-2">
        <span className="font-bold text-slate-900 block font-mono uppercase tracking-wider text-[11px]">
          Anatomical Sulci & Coronary Perfusion Territories
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 leading-relaxed">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <strong className="text-rose-700 font-mono block mb-0.5">LAD (Anterior Interventricular)</strong>
            Supplies anterior left ventricle, anterior two-thirds of interventricular septum, and apex.
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <strong className="text-purple-700 font-mono block mb-0.5">LCX (Left Atrioventricular)</strong>
            Courses along the coronary sulcus to supply the posterolateral left ventricle and lateral margin.
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <strong className="text-teal-700 font-mono block mb-0.5">RCA (Right Coronary Sulcus)</strong>
            Supplies right atrium, right ventricle, inferior left ventricular wall, and AV conduction nodes.
          </div>
        </div>
      </div>
    </div>
  );
};
