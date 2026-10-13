/**
 * frontend/src/components/wizard/Step2History.tsx
 * Step 2: Medical History & Symptoms (14 canonical features)
 * Polished Spacing, Two-Column Layout, Typography Hierarchy, and Contrast.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { FileText, Heart, Activity, AlertCircle, ShieldAlert, Stethoscope } from 'lucide-react';
import type { WizardFormData } from './wizardTypes.ts';

interface Step2HistoryProps {
  data: WizardFormData;
  errors: Record<string, string>;
  onChange: (fieldOrUpdates: keyof WizardFormData | Partial<WizardFormData>, value?: unknown) => void;
}

export const Step2History: React.FC<Step2HistoryProps> = ({ data, errors, onChange }) => {
  // Preset handler for classical angina categorization (preserving exact dataset distribution)
  const handleChestPainPreset = (preset: 'typical' | 'atypical' | 'nonanginal' | 'none') => {
    if (preset === 'typical') {
      onChange({ typicalChestPain: 1, atypical: 'N', nonanginal: 'N' });
    } else if (preset === 'atypical') {
      onChange({ typicalChestPain: 0, atypical: 'Y', nonanginal: 'N' });
    } else if (preset === 'nonanginal') {
      onChange({ typicalChestPain: 0, atypical: 'N', nonanginal: 'Y' });
    } else if (preset === 'none') {
      onChange({ typicalChestPain: 0, atypical: 'N', nonanginal: 'N' });
    }
  };

  const getChestPainPresetActive = (): 'typical' | 'atypical' | 'nonanginal' | 'none' | '' => {
    if (data.typicalChestPain === 1) return 'typical';
    if (data.atypical === 'Y') return 'atypical';
    if (data.nonanginal === 'Y') return 'nonanginal';
    if (data.typicalChestPain === 0 && data.atypical === 'N' && data.nonanginal === 'N') return 'none';
    return '';
  };

  const activeChestPain = getChestPainPresetActive();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              2. Medical History, Comorbidities & Symptoms
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Documented prior diagnoses, major organ comorbidities, anginal characteristics, and functional class.
            </p>
          </div>
        </div>
      </div>

      {/* Subsection A: Medical History & Comorbidities (8 Features, 2-Column Responsive Grid) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 pb-1">
          <Heart className="w-4 h-4 text-indigo-600" />
          <span>Cardiovascular Risk History & Major Comorbidities (8 Features)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
          {/* HTN */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.htn ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Hypertension (HTN) <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Prior Diagnosis</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('htn', 0)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.htn === 0
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (0)
              </button>
              <button
                type="button"
                onClick={() => onChange('htn', 1)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.htn === 1
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (1)
              </button>
            </div>
            {errors.htn && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.htn}</span>
              </p>
            )}
          </div>

          {/* DM */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.dm ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Diabetes Mellitus (DM) <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Glycemic Status</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('dm', 0)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.dm === 0
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (0)
              </button>
              <button
                type="button"
                onClick={() => onChange('dm', 1)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.dm === 1
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (1)
              </button>
            </div>
            {errors.dm && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.dm}</span>
              </p>
            )}
          </div>

          {/* DLP */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.dlp ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Dyslipidemia (DLP) <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Lipid History</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('dlp', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.dlp === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('dlp', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.dlp === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (Y)
              </button>
            </div>
            {errors.dlp && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.dlp}</span>
              </p>
            )}
          </div>

          {/* CHF */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.chf ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Congestive Heart Failure (CHF) <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Cardiac Function</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('chf', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.chf === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('chf', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.chf === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (Y)
              </button>
            </div>
            {errors.chf && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.chf}</span>
              </p>
            )}
          </div>

          {/* CRF */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.crf ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Chronic Renal Failure (CRF) <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Renal Health</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('crf', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.crf === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('crf', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.crf === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (Y)
              </button>
            </div>
            {errors.crf && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.crf}</span>
              </p>
            )}
          </div>

          {/* CVA */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.cva ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Cerebrovascular Accident (CVA) <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Stroke History</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('cva', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.cva === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('cva', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.cva === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (Y)
              </button>
            </div>
            {errors.cva && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.cva}</span>
              </p>
            )}
          </div>

          {/* Airway Disease */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.airwayDisease ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Chronic Airway Disease <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">COPD / Asthma</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('airwayDisease', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.airwayDisease === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('airwayDisease', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.airwayDisease === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (Y)
              </button>
            </div>
            {errors.airwayDisease && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.airwayDisease}</span>
              </p>
            )}
          </div>

          {/* Thyroid Disease */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.thyroidDisease ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Thyroid Disease <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Endocrine</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('thyroidDisease', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.thyroidDisease === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('thyroidDisease', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.thyroidDisease === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (Y)
              </button>
            </div>
            {errors.thyroidDisease && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.thyroidDisease}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subsection B: Anginal Symptoms & Functional Capacity (6 Features, 2-Column Responsive Grid) */}
      <div className="pt-6 border-t border-slate-200/80 space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 pb-1">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Anginal Symptoms & Functional Capacity (6 Features)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Chest Pain Presentation Preset Selection */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-800">
                Chest Pain Clinical Presentation <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-500 font-mono">Mutually Exclusive Classification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleChestPainPreset('typical')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  activeChestPain === 'typical'
                    ? 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-300 font-semibold shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-bold">Typical Angina</div>
                <div className="text-xs text-slate-600 mt-1 leading-snug">Substernal exertional discomfort relieved by rest/NTG</div>
              </button>

              <button
                type="button"
                onClick={() => handleChestPainPreset('atypical')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  activeChestPain === 'atypical'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-300 font-semibold shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-bold">Atypical Chest Pain</div>
                <div className="text-xs text-slate-600 mt-1 leading-snug">Meets 2 of 3 classical Diamond-Forrester criteria</div>
              </button>

              <button
                type="button"
                onClick={() => handleChestPainPreset('nonanginal')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  activeChestPain === 'nonanginal'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-300 font-semibold shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-bold">Non-Anginal Discomfort</div>
                <div className="text-xs text-slate-600 mt-1 leading-snug">Musculoskeletal or pleuritic chest discomfort</div>
              </button>

              <button
                type="button"
                onClick={() => handleChestPainPreset('none')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  activeChestPain === 'none'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-300 font-semibold shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-bold">Asymptomatic (None)</div>
                <div className="text-xs text-slate-600 mt-1 leading-snug">No active chest pain or anginal equivalent reported</div>
              </button>
            </div>
            {errors.typicalChestPain && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.typicalChestPain}</span>
              </p>
            )}
          </div>

          {/* Dyspnea */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Exertional Dyspnea (Shortness of Breath) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5 h-12">
              <button
                type="button"
                onClick={() => onChange('dyspnea', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.dyspnea === 'N'
                    ? 'bg-emerald-50 border border-emerald-400 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                No Dyspnea (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('dyspnea', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.dyspnea === 'Y'
                    ? 'bg-rose-50 border border-rose-400 text-rose-900 font-semibold shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Dyspnea Present (Y)
              </button>
            </div>
            {errors.dyspnea && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.dyspnea}</span>
              </p>
            )}
          </div>

          {/* NYHA Function Class */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              NYHA Functional Class (0 – 3) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2 h-12">
              {([0, 1, 2, 3] as const).map((fc) => (
                <button
                  key={fc}
                  type="button"
                  onClick={() => onChange('functionClass', fc)}
                  className={`flex flex-col items-center justify-center rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    data.functionClass === fc
                      ? 'bg-indigo-50 border border-indigo-400 text-indigo-950 font-bold shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Class {fc}</span>
                </button>
              ))}
            </div>
            {errors.functionClass ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.functionClass}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">
                0: None; 1: Mild; 2: Moderate; 3: Severe Limitation
              </span>
            )}
          </div>

          {/* LowTH Ang */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-slate-800">
              Low-Threshold Exertional Angina (LowTH Ang) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5 h-12 max-w-md">
              <button
                type="button"
                onClick={() => onChange('lowthAng', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.lowthAng === 'N'
                    ? 'bg-emerald-50 border border-emerald-400 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                No Low-Threshold Angina (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('lowthAng', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.lowthAng === 'Y'
                    ? 'bg-rose-50 border border-rose-400 text-rose-900 font-semibold shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Yes, Low-Threshold (Y)
              </button>
            </div>
            {errors.lowthAng && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.lowthAng}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
