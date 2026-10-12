/**
 * frontend/src/components/wizard/Step3VitalsLab.tsx
 * Step 3: Vitals & Laboratory Results (16 canonical features)
 * Polished Spacing, Grid Hierarchy, Typography, and Contrast.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { Activity, AlertCircle, Droplets, TestTube2, Dna } from 'lucide-react';
import type { WizardFormData } from './wizardTypes.ts';

interface Step3VitalsLabProps {
  data: WizardFormData;
  errors: Record<string, string>;
  onChange: (field: keyof WizardFormData, value: unknown) => void;
}

export const Step3VitalsLab: React.FC<Step3VitalsLabProps> = ({ data, errors, onChange }) => {
  const handleNumericInput = (field: keyof WizardFormData, rawVal: string, isFloat = false) => {
    if (rawVal === '') {
      onChange(field, '');
    } else {
      const parsed = isFloat ? parseFloat(rawVal) : parseInt(rawVal, 10);
      onChange(field, Number.isNaN(parsed) ? '' : parsed);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              3. Hemodynamics & Laboratory Biomarkers
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Quantitative clinical measurements across arterial hemodynamics, lipid fractions, renal clearance, electrolytes, and hematology.
            </p>
          </div>
        </div>
      </div>

      {/* Group 1: Hemodynamics & Fasting Glucose (3 Features) */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-100">
          <Activity className="w-4 h-4 text-teal-600" />
          <span>Hemodynamics & Fasting Glycemia (3 Features)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BP */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Systolic Blood Pressure (BP) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={50}
                max={250}
                value={data.bp}
                onChange={(e) => handleNumericInput('bp', e.target.value)}
                placeholder="125"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.bp
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                mmHg
              </span>
            </div>
            {errors.bp ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.bp}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 50 – 250 mmHg</span>
            )}
          </div>

          {/* PR */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Resting Pulse Rate (PR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={30}
                max={220}
                value={data.pr}
                onChange={(e) => handleNumericInput('pr', e.target.value)}
                placeholder="72"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.pr
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                bpm
              </span>
            </div>
            {errors.pr ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.pr}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 30 – 220 bpm</span>
            )}
          </div>

          {/* FBS */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Fasting Blood Sugar (FBS) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={20}
                max={800}
                value={data.fbs}
                onChange={(e) => handleNumericInput('fbs', e.target.value)}
                placeholder="95"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.fbs
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                mg/dL
              </span>
            </div>
            {errors.fbs ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.fbs}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 20 – 800 mg/dL</span>
            )}
          </div>
        </div>
      </div>

      {/* Group 2: Quantitative Lipid Fractions (3 Features in Canonical Model: TG, LDL, HDL) */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-100">
          <Droplets className="w-4 h-4 text-cyan-600" />
          <span>Quantitative Lipid Fractions (3 Features)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TG */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Serum Triglycerides (TG) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={10}
                max={2000}
                value={data.tg}
                onChange={(e) => handleNumericInput('tg', e.target.value)}
                placeholder="150"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.tg
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                mg/dL
              </span>
            </div>
            {errors.tg ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.tg}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 10 – 2,000 mg/dL</span>
            )}
          </div>

          {/* LDL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Low-Density Lipoprotein (LDL) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={10}
                max={600}
                value={data.ldl}
                onChange={(e) => handleNumericInput('ldl', e.target.value)}
                placeholder="110"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.ldl
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                mg/dL
              </span>
            </div>
            {errors.ldl ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.ldl}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 10 – 600 mg/dL</span>
            )}
          </div>

          {/* HDL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              High-Density Lipoprotein (HDL) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={5}
                max={200}
                value={data.hdl}
                onChange={(e) => handleNumericInput('hdl', e.target.value)}
                placeholder="45"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.hdl
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                mg/dL
              </span>
            </div>
            {errors.hdl ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.hdl}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 5 – 200 mg/dL</span>
            )}
          </div>
        </div>
      </div>

      {/* Group 3: Renal Panel & Serum Electrolytes (4 Features) */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-100">
          <TestTube2 className="w-4 h-4 text-indigo-600" />
          <span>Renal Clearance & Electrolytes (4 Features)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CR */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Serum Creatinine (CR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min={0.1}
                max={20.0}
                value={data.cr}
                onChange={(e) => handleNumericInput('cr', e.target.value, true)}
                placeholder="1.0"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.cr
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                mg/dL
              </span>
            </div>
            {errors.cr ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.cr}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 0.1 – 20.0 mg/dL</span>
            )}
          </div>

          {/* BUN */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Blood Urea Nitrogen (BUN) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={200}
                value={data.bun}
                onChange={(e) => handleNumericInput('bun', e.target.value)}
                placeholder="15"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.bun
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                mg/dL
              </span>
            </div>
            {errors.bun ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.bun}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 1 – 200 mg/dL</span>
            )}
          </div>

          {/* K */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Serum Potassium (K) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min={1.0}
                max={10.0}
                value={data.k}
                onChange={(e) => handleNumericInput('k', e.target.value, true)}
                placeholder="4.2"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.k
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                mEq/L
              </span>
            </div>
            {errors.k ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.k}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 1.0 – 10.0 mEq/L</span>
            )}
          </div>

          {/* Na */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Serum Sodium (Na) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={100}
                max={180}
                value={data.na}
                onChange={(e) => handleNumericInput('na', e.target.value)}
                placeholder="140"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.na
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                mEq/L
              </span>
            </div>
            {errors.na ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.na}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 100 – 180 mEq/L</span>
            )}
          </div>
        </div>
      </div>

      {/* Group 4: Complete Blood Count & Inflammatory Markers (6 Features, 2-Column Responsive Grid) */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-100">
          <Dna className="w-4 h-4 text-emerald-600" />
          <span>Hematology & Inflammatory Indices (6 Features)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* HB */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Hemoglobin (HB) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min={3.0}
                max={25.0}
                value={data.hb}
                onChange={(e) => handleNumericInput('hb', e.target.value, true)}
                placeholder="14.0"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.hb
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                g/dL
              </span>
            </div>
            {errors.hb ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.hb}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 3.0 – 25.0 g/dL</span>
            )}
          </div>

          {/* ESR */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Erythrocyte Sedimentation Rate (ESR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={150}
                value={data.esr}
                onChange={(e) => handleNumericInput('esr', e.target.value)}
                placeholder="15"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.esr
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                mm/hr
              </span>
            </div>
            {errors.esr ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.esr}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 1 – 150 mm/hr</span>
            )}
          </div>

          {/* WBC */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              White Blood Cell Count (WBC) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1000}
                max={50000}
                value={data.wbc}
                onChange={(e) => handleNumericInput('wbc', e.target.value)}
                placeholder="6800"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.wbc
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                /µL
              </span>
            </div>
            {errors.wbc ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.wbc}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 1,000 – 50,000 /µL</span>
            )}
          </div>

          {/* PLT */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Platelet Count (PLT) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={10}
                max={1000}
                value={data.plt}
                onChange={(e) => handleNumericInput('plt', e.target.value)}
                placeholder="220"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.plt
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                ×10³/µL
              </span>
            </div>
            {errors.plt ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.plt}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 10 – 1,000 ×10³/µL</span>
            )}
          </div>

          {/* Lymph */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Lymphocyte Fraction (Lymph) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={100}
                value={data.lymph}
                onChange={(e) => handleNumericInput('lymph', e.target.value)}
                placeholder="32"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.lymph
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                %
              </span>
            </div>
            {errors.lymph ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.lymph}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 1 – 100 %</span>
            )}
          </div>

          {/* Neut */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Neutrophil Fraction (Neut) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={100}
                value={data.neut}
                onChange={(e) => handleNumericInput('neut', e.target.value)}
                placeholder="62"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-4 transition-all ${
                  errors.neut
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                %
              </span>
            </div>
            {errors.neut ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.neut}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Accepted: 1 – 100 %</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
