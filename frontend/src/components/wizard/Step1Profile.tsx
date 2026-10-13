/**
 * frontend/src/components/wizard/Step1Profile.tsx
 * Step 1: Patient Profile & Biometrics (9 canonical features)
 * Polished Spacing, Two-Column Layout, Typography Hierarchy, and Contrast.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { User, AlertCircle, Scale, Cigarette } from 'lucide-react';
import type { WizardFormData } from './wizardTypes.ts';
import { calculateBmiAndObesity } from './wizardMetadata.ts';

interface Step1ProfileProps {
  data: WizardFormData;
  errors: Record<string, string>;
  onChange: (fieldOrUpdates: keyof WizardFormData | Partial<WizardFormData>, value?: unknown) => void;
}

export const Step1Profile: React.FC<Step1ProfileProps> = ({ data, errors, onChange }) => {
  // Synchronize height, weight, BMI, and obesity status dynamically with atomic updates
  const handleHeightChange = (heightVal: number | '') => {
    const { bmi, obesity } = calculateBmiAndObesity(heightVal, data.weight);
    onChange({
      length: heightVal,
      bmi,
      obesity,
    });
  };

  const handleWeightChange = (weightVal: number | '') => {
    const { bmi, obesity } = calculateBmiAndObesity(data.length, weightVal);
    onChange({
      weight: weightVal,
      bmi,
      obesity,
    });
  };

  const handleSmokingChange = (type: 'never' | 'current' | 'ex') => {
    if (type === 'current') {
      onChange({ currentSmoker: 1, exSmoker: 0 });
    } else if (type === 'ex') {
      onChange({ currentSmoker: 0, exSmoker: 1 });
    } else if (type === 'never') {
      onChange({ currentSmoker: 0, exSmoker: 0 });
    }
  };

  const currentSmokingType =
    data.currentSmoker === 1
      ? 'current'
      : data.exSmoker === 1
      ? 'ex'
      : data.currentSmoker === 0 && data.exSmoker === 0
      ? 'never'
      : '';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              1. Patient Demographics & Anthropometrics
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Direct patient measurements, body composition, smoking history, and genetic predisposition.
            </p>
          </div>
        </div>
      </div>

      {/* Subsection A: Demographics & Biometrics (6 Features, 2-Column Responsive Grid) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 pb-1">
          <Scale className="w-4 h-4 text-teal-600" />
          <span>Baseline Demographics & Body Composition (6 Features)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Age */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Patient Age <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={18}
                max={120}
                value={data.age}
                onChange={(e) =>
                  onChange('age', e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
                placeholder="e.g. 54"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all font-mono ${
                  errors.age
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                years
              </span>
            </div>
            {errors.age ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.age}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Valid range: 18 – 120 years</span>
            )}
          </div>

          {/* Biological Sex */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Biological Sex <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5 h-12">
              {(['Male', 'Female'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange('sex', s)}
                  className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                    data.sex === s
                      ? 'bg-teal-50 border border-teal-400 text-teal-900 font-semibold shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {errors.sex ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.sex}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Biological sex at birth</span>
            )}
          </div>

          {/* Standing Height (Length) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Standing Height (Length) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={100}
                max={250}
                value={data.length}
                onChange={(e) =>
                  handleHeightChange(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="e.g. 172"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all font-mono ${
                  errors.length
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                cm
              </span>
            </div>
            {errors.length ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.length}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Valid range: 100.0 – 250.0 cm</span>
            )}
          </div>

          {/* Body Weight */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Body Weight <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={20}
                max={300}
                value={data.weight}
                onChange={(e) =>
                  handleWeightChange(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="e.g. 78"
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-white border text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all font-mono ${
                  errors.weight
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/10'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                kg
              </span>
            </div>
            {errors.weight ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.weight}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">Valid range: 20.0 – 300.0 kg</span>
            )}
          </div>

          {/* Body Mass Index (BMI) - Derived */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-800">
                Body Mass Index (BMI) <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-teal-800 font-mono flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                <Scale className="w-3 h-3" />
                <span>Derived</span>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min={10}
                max={80}
                readOnly
                value={data.bmi}
                placeholder={data.length && data.weight ? 'Auto-calculating...' : 'Calculated from height & weight'}
                className={`w-full h-12 pl-4 pr-16 rounded-xl bg-slate-50/70 border text-base text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-mono cursor-default ${
                  errors.bmi
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300'
                }`}
              />
              <span className="absolute right-4 top-3 text-sm text-slate-500 font-mono pointer-events-none">
                kg/m²
              </span>
            </div>
            {errors.bmi ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.bmi}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">
                Formula: Weight (kg) / [Height (m)]²
              </span>
            )}
          </div>

          {/* Dataset Obesity / Overweight Status - Derived */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-800 truncate">
                Dataset Obesity Status (BMI ≥ 25.0) <span className="text-rose-500">*</span>
              </label>
              <span
                className="text-xs text-slate-600 font-mono bg-slate-100/90 px-2.5 py-0.5 rounded-md border border-slate-200 shrink-0 select-none cursor-default"
                title="Clinical dataset definition (Z-Alizadeh Sani protocol): Obesity threshold is BMI ≥ 25.0 kg/m²"
              >
                Protocol Standard
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 h-12">
              <button
                type="button"
                onClick={() => onChange('obesity', 'Y')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.obesity === 'Y'
                    ? 'bg-rose-50 border border-rose-300 text-rose-900 font-semibold shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Yes (BMI ≥ 25.0)
              </button>
              <button
                type="button"
                onClick={() => onChange('obesity', 'N')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.obesity === 'N'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                No (BMI &lt; 25.0)
              </button>
            </div>
            {errors.obesity ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.obesity}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">
                Derived threshold per Z-Alizadeh Sani protocol
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Subsection B: Behavioral & Familial Risk Factors (3 Features, 2-Column Responsive Grid) */}
      <div className="pt-6 border-t border-slate-200/80 space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-700 pb-1">
          <Cigarette className="w-4 h-4 text-teal-600" />
          <span>Smoking History & Familial CAD (3 Features)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Smoking History (Current Smoker & Ex-Smoker) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Tobacco Smoking History <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 h-12">
              <button
                type="button"
                onClick={() => handleSmokingChange('never')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  currentSmokingType === 'never'
                    ? 'bg-emerald-50 border border-emerald-400 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Never
              </button>
              <button
                type="button"
                onClick={() => handleSmokingChange('ex')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  currentSmokingType === 'ex'
                    ? 'bg-amber-50 border border-amber-400 text-amber-900 font-semibold shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Ex-Smoker
              </button>
              <button
                type="button"
                onClick={() => handleSmokingChange('current')}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  currentSmokingType === 'current'
                    ? 'bg-rose-50 border border-rose-400 text-rose-900 font-semibold shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Current
              </button>
            </div>
            {errors.currentSmoker ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.currentSmoker}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">
                Maps to Current Smoker & Ex-Smoker parameters
              </span>
            )}
          </div>

          {/* Family History of CAD */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-800">
              Family History of CAD (FH) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5 h-12">
              <button
                type="button"
                onClick={() => onChange('fh', 0)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.fh === 0
                    ? 'bg-emerald-50 border border-emerald-400 text-emerald-900 font-semibold shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                No Family History (0)
              </button>
              <button
                type="button"
                onClick={() => onChange('fh', 1)}
                className={`flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  data.fh === 1
                    ? 'bg-rose-50 border border-rose-400 text-rose-900 font-semibold shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Positive FH (1)
              </button>
            </div>
            {errors.fh ? (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.fh}</span>
              </p>
            ) : (
              <span className="text-xs text-slate-500 block">
                First-degree relative with documented premature CAD
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
