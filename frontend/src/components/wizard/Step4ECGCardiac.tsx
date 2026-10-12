/**
 * frontend/src/components/wizard/Step4ECGCardiac.tsx
 * Step 4: ECG & Cardiac Examination (15 canonical features)
 * Polished Spacing, Two-Column Layout, Typography Hierarchy, and Contrast.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { HeartPulse, Stethoscope, Waves, AlertCircle } from 'lucide-react';
import type { WizardFormData } from './wizardTypes.ts';

interface Step4ECGCardiacProps {
  data: WizardFormData;
  errors: Record<string, string>;
  onChange: (field: keyof WizardFormData, value: unknown) => void;
}

export const Step4ECGCardiac: React.FC<Step4ECGCardiacProps> = ({ data, errors, onChange }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 flex items-center justify-center shrink-0">
            <HeartPulse className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              4. Electrocardiogram & Cardiac Examination
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              12-lead electrocardiography repolarization signs, bedside physical exam findings, and transthoracic echocardiography.
            </p>
          </div>
        </div>
      </div>

      {/* Subsection A: 12-Lead Electrocardiography Signs (7 Features, 2-Column Responsive Grid) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 pb-1">
          <Waves className="w-4 h-4 text-indigo-600" />
          <span>12-Lead Electrocardiography Signs (7 Features)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
          {/* Q Wave */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.qWave ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Pathological Q Wave <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Infarction Sign</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('qWave', 0)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.qWave === 0
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (0)
              </button>
              <button
                type="button"
                onClick={() => onChange('qWave', 1)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.qWave === 1
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (1)
              </button>
            </div>
            {errors.qWave && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.qWave}</span>
              </p>
            )}
          </div>

          {/* ST Elevation */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.stElevation ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">ST-Segment Elevation <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Acute Injury</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('stElevation', 0)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.stElevation === 0
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (0)
              </button>
              <button
                type="button"
                onClick={() => onChange('stElevation', 1)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.stElevation === 1
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (1)
              </button>
            </div>
            {errors.stElevation && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.stElevation}</span>
              </p>
            )}
          </div>

          {/* ST Depression */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.stDepression ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">ST-Segment Depression <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Subendocardial</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('stDepression', 0)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.stDepression === 0
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (0)
              </button>
              <button
                type="button"
                onClick={() => onChange('stDepression', 1)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.stDepression === 1
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (1)
              </button>
            </div>
            {errors.stDepression && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.stDepression}</span>
              </p>
            )}
          </div>

          {/* T Inversion */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.tinversion ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">T-Wave Inversion <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Ischemia Sign</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('tinversion', 0)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.tinversion === 0
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (0)
              </button>
              <button
                type="button"
                onClick={() => onChange('tinversion', 1)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.tinversion === 1
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (1)
              </button>
            </div>
            {errors.tinversion && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.tinversion}</span>
              </p>
            )}
          </div>

          {/* LVH */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.lvh ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Left Ventricular Hypertrophy (LVH) <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Voltage Sign</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('lvh', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.lvh === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('lvh', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.lvh === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (Y)
              </button>
            </div>
            {errors.lvh && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.lvh}</span>
              </p>
            )}
          </div>

          {/* Poor R Progression */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.poorRProgression ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Poor R-Wave Progression <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Precordial</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('poorRProgression', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.poorRProgression === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('poorRProgression', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.poorRProgression === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Yes (Y)
              </button>
            </div>
            {errors.poorRProgression && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.poorRProgression}</span>
              </p>
            )}
          </div>

          {/* BBB */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all sm:col-span-2 ${errors.bbb ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Bundle Branch Block (BBB) <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Conduction Block</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 h-11 max-w-xl">
              {(['N', 'LBBB', 'RBBB'] as const).map((blockType) => (
                <button
                  key={blockType}
                  type="button"
                  onClick={() => onChange('bbb', blockType)}
                  className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                    data.bbb === blockType
                      ? blockType === 'N'
                        ? 'bg-emerald-50 border border-emerald-400 text-emerald-900 font-bold shadow-xs'
                        : 'bg-rose-50 border border-rose-400 text-rose-900 font-bold shadow-xs'
                      : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {blockType === 'N' ? 'None (N)' : blockType}
                </button>
              ))}
            </div>
            {errors.bbb && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.bbb}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subsection B: Bedside Physical Examination (5 Features, 2-Column Responsive Grid) */}
      <div className="pt-6 border-t border-slate-200/80 space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 pb-1">
          <Stethoscope className="w-4 h-4 text-emerald-600" />
          <span>Bedside Physical Examination (5 Features)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
          {/* Edema */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.edema ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Peripheral Edema (Edema) <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Fluid Overload</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('edema', 0)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.edema === 0
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No Edema (0)
              </button>
              <button
                type="button"
                onClick={() => onChange('edema', 1)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.edema === 1
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Edema Present (1)
              </button>
            </div>
            {errors.edema && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.edema}</span>
              </p>
            )}
          </div>

          {/* Weak Peripheral Pulse */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.weakPeripheralPulse ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Weak Peripheral Pulse <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Perfusion</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('weakPeripheralPulse', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.weakPeripheralPulse === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Normal Pulse (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('weakPeripheralPulse', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.weakPeripheralPulse === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Weak / Diminished (Y)
              </button>
            </div>
            {errors.weakPeripheralPulse && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.weakPeripheralPulse}</span>
              </p>
            )}
          </div>

          {/* Lung Rales */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.lungRales ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Pulmonary Crackles (Lung Rales) <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Congestion</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('lungRales', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.lungRales === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Clear Lungs (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('lungRales', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.lungRales === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Rales Present (Y)
              </button>
            </div>
            {errors.lungRales && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.lungRales}</span>
              </p>
            )}
          </div>

          {/* Systolic Murmur */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all ${errors.systolicMurmur ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Systolic Murmur <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Auscultation</span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-11">
              <button
                type="button"
                onClick={() => onChange('systolicMurmur', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.systolicMurmur === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No Murmur (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('systolicMurmur', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.systolicMurmur === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Murmur Present (Y)
              </button>
            </div>
            {errors.systolicMurmur && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.systolicMurmur}</span>
              </p>
            )}
          </div>

          {/* Diastolic Murmur */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white border space-y-3 transition-all sm:col-span-2 ${errors.diastolicMurmur ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200/90 shadow-2xs'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Diastolic Murmur <span className="text-rose-500">*</span></span>
              <span className="text-xs text-slate-500 font-mono">Valvular Sign</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 h-11 max-w-md">
              <button
                type="button"
                onClick={() => onChange('diastolicMurmur', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.diastolicMurmur === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                No Diastolic Murmur (N)
              </button>
              <button
                type="button"
                onClick={() => onChange('diastolicMurmur', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.diastolicMurmur === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Diastolic Murmur (Y)
              </button>
            </div>
            {errors.diastolicMurmur && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.diastolicMurmur}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subsection C: Transthoracic Echocardiography (3 Features, 3-Column Responsive Grid) */}
      <div className="pt-6 border-t border-slate-200/80 space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 pb-1">
          <HeartPulse className="w-4 h-4 text-rose-600" />
          <span>Transthoracic Echocardiography Findings (3 Features)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* EF-TTE */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Ejection Fraction (EF-TTE) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={10}
                max={90}
                value={data.efTte}
                onChange={(e) =>
                  onChange('efTte', e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
                placeholder="55"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.efTte
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                %
              </span>
            </div>
            {errors.efTte ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.efTte}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 10 – 90 %</span>
            )}
          </div>

          {/* Region RWMA */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Regional Wall Motion (RWMA) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5 h-12">
              {([0, 1, 2, 3, 4] as const).map((segCount) => (
                <button
                  key={segCount}
                  type="button"
                  onClick={() => onChange('regionRwma', segCount)}
                  className={`flex flex-col items-center justify-center rounded-xl text-xs font-mono font-bold transition-all ${
                    data.regionRwma === segCount
                      ? segCount === 0
                        ? 'bg-emerald-50 border border-emerald-400 text-emerald-950 shadow-xs'
                        : 'bg-rose-50 border border-rose-400 text-rose-950 shadow-xs'
                      : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{segCount}</span>
                </button>
              ))}
            </div>
            {errors.regionRwma ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.regionRwma}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">0 = None; 1–4 = Regions affected</span>
            )}
          </div>

          {/* VHD */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Valvular Heart Disease (VHD) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 h-12">
              {(['Normal', 'Mild', 'Moderate', 'Severe'] as const).map((vhdGrade) => (
                <button
                  key={vhdGrade}
                  type="button"
                  onClick={() => onChange('vhd', vhdGrade)}
                  className={`flex items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                    data.vhd === vhdGrade
                      ? vhdGrade === 'Normal'
                        ? 'bg-emerald-50 border border-emerald-400 text-emerald-950 shadow-xs'
                        : 'bg-rose-50 border border-rose-400 text-rose-950 shadow-xs'
                      : 'bg-slate-50/70 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{vhdGrade}</span>
                </button>
              ))}
            </div>
            {errors.vhd && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.vhd}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
