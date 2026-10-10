import React, { useState } from 'react';
import {
  User,
  Stethoscope,
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Zap,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export interface PatientFormData {
  // Section 1: Patient Demographics & Baseline
  age: number | '';
  sex: 'Male' | 'Female';
  bmi: number | '';
  smoking: 'never' | 'ex' | 'current';
  familyHistory: 'yes' | 'no';
  hypertension: 'yes' | 'no';
  diabetes: 'yes' | 'no';

  // Section 2: Clinical Measurements
  chestPainType: 'typical' | 'atypical' | 'nonanginal' | 'asymptomatic';
  restingBP: number | '';
  restingHR: number | '';
  cholesterol: number | '';
  ldl: number | '';
  hdl: number | '';
  triglycerides: number | '';
  fastingBS: number | '';

  // Section 3: Exercise & ECG
  maxHR: number | '';
  exerciseAngina: 'yes' | 'no';
  restingECG: 'normal' | 'st_t_wave' | 'lvh';
  stDepression: number | '';
  stSlope: 'upsloping' | 'flat' | 'downsloping';
  stElevation: 'yes' | 'no';
  ejectionFraction: number | '';
}

const DEFAULT_FORM_DATA: PatientFormData = {
  age: 54,
  sex: 'Male',
  bmi: 26.8,
  smoking: 'never',
  familyHistory: 'no',
  hypertension: 'no',
  diabetes: 'no',
  chestPainType: 'asymptomatic',
  restingBP: 125,
  restingHR: 72,
  cholesterol: 215,
  ldl: 130,
  hdl: 45,
  triglycerides: 155,
  fastingBS: 95,
  maxHR: 148,
  exerciseAngina: 'no',
  restingECG: 'normal',
  stDepression: 0.8,
  stSlope: 'flat',
  stElevation: 'no',
  ejectionFraction: 55,
};

// Preset clinical cohorts based on benchmark datasets (Cleveland & Z-Alizadeh Sani)
const PRESET_PATIENTS: { name: string; tag: string; data: PatientFormData }[] = [
  {
    name: 'Patient 01: Low Risk (Healthy Normative)',
    tag: 'Normal ECG • Low Lipids',
    data: {
      age: 41,
      sex: 'Female',
      bmi: 22.4,
      smoking: 'never',
      familyHistory: 'no',
      hypertension: 'no',
      diabetes: 'no',
      chestPainType: 'nonanginal',
      restingBP: 115,
      restingHR: 66,
      cholesterol: 172,
      ldl: 92,
      hdl: 60,
      triglycerides: 110,
      fastingBS: 86,
      maxHR: 168,
      exerciseAngina: 'no',
      restingECG: 'normal',
      stDepression: 0.0,
      stSlope: 'upsloping',
      stElevation: 'no',
      ejectionFraction: 62,
    },
  },
  {
    name: 'Patient 02: Moderate Risk (Suspected Ischemia)',
    tag: 'Exertional CP • ST-T Flat',
    data: {
      age: 58,
      sex: 'Male',
      bmi: 28.1,
      smoking: 'ex',
      familyHistory: 'yes',
      hypertension: 'yes',
      diabetes: 'no',
      chestPainType: 'atypical',
      restingBP: 138,
      restingHR: 76,
      cholesterol: 236,
      ldl: 152,
      hdl: 41,
      triglycerides: 190,
      fastingBS: 114,
      maxHR: 134,
      exerciseAngina: 'yes',
      restingECG: 'st_t_wave',
      stDepression: 1.5,
      stSlope: 'flat',
      stElevation: 'no',
      ejectionFraction: 50,
    },
  },
  {
    name: 'Patient 03: High Risk (Z-Alizadeh Sani Cohort #1)',
    tag: 'Multi-Vessel Risk • LVH • Low EF',
    data: {
      age: 67,
      sex: 'Male',
      bmi: 30.5,
      smoking: 'current',
      familyHistory: 'yes',
      hypertension: 'yes',
      diabetes: 'yes',
      chestPainType: 'typical',
      restingBP: 155,
      restingHR: 84,
      cholesterol: 288,
      ldl: 185,
      hdl: 31,
      triglycerides: 265,
      fastingBS: 148,
      maxHR: 116,
      exerciseAngina: 'yes',
      restingECG: 'lvh',
      stDepression: 2.8,
      stSlope: 'downsloping',
      stElevation: 'yes',
      ejectionFraction: 36,
    },
  },
];

type FormErrors = Partial<Record<keyof PatientFormData, string>>;

export const PatientAssessmentForm: React.FC = () => {
  const [formData, setFormData] = useState<PatientFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    status: 'standalone' | 'connected';
    timestamp: string;
    payload: Record<string, unknown>;
  } | null>(null);

  // Field change handler
  const handleInputChange = (field: keyof PatientFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear inline error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Comprehensive clinical parameter validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Patient Details
    if (formData.age === '' || formData.age < 18 || formData.age > 105) {
      newErrors.age = 'Age must be between 18 and 105 years';
    }
    if (formData.bmi === '' || formData.bmi < 12 || formData.bmi > 60) {
      newErrors.bmi = 'BMI must be between 12.0 and 60.0 kg/m²';
    }

    // Clinical Measurements
    if (formData.restingBP === '' || formData.restingBP < 70 || formData.restingBP > 240) {
      newErrors.restingBP = 'Resting BP must be between 70 and 240 mmHg';
    }
    if (formData.restingHR === '' || formData.restingHR < 40 || formData.restingHR > 200) {
      newErrors.restingHR = 'Resting Heart Rate must be between 40 and 200 bpm';
    }
    if (formData.cholesterol === '' || formData.cholesterol < 80 || formData.cholesterol > 550) {
      newErrors.cholesterol = 'Serum Cholesterol must be between 80 and 550 mg/dL';
    }
    if (formData.ldl === '' || formData.ldl < 30 || formData.ldl > 350) {
      newErrors.ldl = 'LDL must be between 30 and 350 mg/dL';
    }
    if (formData.hdl === '' || formData.hdl < 15 || formData.hdl > 130) {
      newErrors.hdl = 'HDL must be between 15 and 130 mg/dL';
    }
    if (formData.triglycerides === '' || formData.triglycerides < 30 || formData.triglycerides > 800) {
      newErrors.triglycerides = 'Triglycerides must be between 30 and 800 mg/dL';
    }
    if (formData.fastingBS === '' || formData.fastingBS < 40 || formData.fastingBS > 450) {
      newErrors.fastingBS = 'Fasting Blood Sugar must be between 40 and 450 mg/dL';
    }

    // Exercise & ECG
    if (formData.maxHR === '' || formData.maxHR < 60 || formData.maxHR > 230) {
      newErrors.maxHR = 'Max Heart Rate must be between 60 and 230 bpm';
    }
    if (formData.stDepression === '' || formData.stDepression < 0 || formData.stDepression > 6.5) {
      newErrors.stDepression = 'ST Depression must be between 0.0 and 6.5 mm';
    }
    if (
      formData.ejectionFraction === '' ||
      formData.ejectionFraction < 15 ||
      formData.ejectionFraction > 80
    ) {
      newErrors.ejectionFraction = 'Ejection Fraction must be between 15% and 80%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyPreset = (preset: (typeof PRESET_PATIENTS)[0]) => {
    setFormData(preset.data);
    setErrors({});
    setSubmissionResult(null);
  };

  const handleReset = () => {
    setFormData(DEFAULT_FORM_DATA);
    setErrors({});
    setSubmissionResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to the first error
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    // Prepare standardized clinical payload matching ML feature schema
    const mlPayload = {
      // Demographic & History
      Age: Number(formData.age),
      Sex: formData.sex === 'Male' ? 1 : 0,
      BMI: Number(formData.bmi),
      Current_Smoker: formData.smoking === 'current' ? 1 : 0,
      EX_Smoker: formData.smoking === 'ex' ? 1 : 0,
      FH: formData.familyHistory === 'yes' ? 1 : 0,
      HTN: formData.hypertension === 'yes' ? 1 : 0,
      DM: formData.diabetes === 'yes' ? 1 : 0,

      // Hemodynamics & Lipids
      BP: Number(formData.restingBP),
      PR: Number(formData.restingHR),
      Cholesterol: Number(formData.cholesterol),
      LDL: Number(formData.ldl),
      HDL: Number(formData.hdl),
      TG: Number(formData.triglycerides),
      FBS: Number(formData.fastingBS),
      FBS_over_120: Number(formData.fastingBS) > 120 ? 1 : 0,

      // Symptomatology
      Chest_Pain_Type: {
        typical: 1,
        atypical: 2,
        nonanginal: 3,
        asymptomatic: 4,
      }[formData.chestPainType],
      Typical_Chest_Pain: formData.chestPainType === 'typical' ? 1 : 0,
      Atypical_Chest_Pain: formData.chestPainType === 'atypical' ? 1 : 0,
      Nonanginal_Chest_Pain: formData.chestPainType === 'nonanginal' ? 1 : 0,
      Exertional_CP: formData.exerciseAngina === 'yes' ? 1 : 0,

      // Electrocardiography & Exercise
      Max_HR: Number(formData.maxHR),
      Exercise_Induced_Angina: formData.exerciseAngina === 'yes' ? 1 : 0,
      Resting_ECG: {
        normal: 0,
        st_t_wave: 1,
        lvh: 2,
      }[formData.restingECG],
      LVH: formData.restingECG === 'lvh' ? 1 : 0,
      St_Depression: Number(formData.stDepression),
      St_Slope: {
        upsloping: 1,
        flat: 2,
        downsloping: 3,
      }[formData.stSlope],
      St_Elevation: formData.stElevation === 'yes' ? 1 : 0,
      EF_TTE: Number(formData.ejectionFraction),
    };

    // Simulate connection to API endpoint with timeout guard
    try {
      // Check if backend service is available on localhost:8000
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mlPayload),
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        setSubmissionResult({
          status: 'connected',
          timestamp: new Date().toLocaleTimeString(),
          payload: mlPayload,
        });
      } else {
        // Honest clinical research standalone state
        setSubmissionResult({
          status: 'standalone',
          timestamp: new Date().toLocaleTimeString(),
          payload: mlPayload,
        });
      }
    } catch {
      setSubmissionResult({
        status: 'standalone',
        timestamp: new Date().toLocaleTimeString(),
        payload: mlPayload,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPayloadToClipboard = () => {
    if (!submissionResult) return;
    navigator.clipboard.writeText(JSON.stringify(submissionResult.payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="w-full text-slate-100">
      {/* Quick Preset Selector for Hackathon Demo */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-cyan-400 uppercase font-semibold">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Fast-Load Benchmark Case Studies</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Derived from Cleveland & Z-Alizadeh Sani cohorts
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {PRESET_PATIENTS.map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="flex flex-col text-left p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                {preset.name}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                {preset.tag}
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* ======================================================== */}
        {/* SECTION 1: Patient Demographics & Baseline Medical History */}
        {/* ======================================================== */}
        <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                1. Patient Details & Medical History
              </h3>
              <p className="text-xs text-slate-400">
                Baseline demographic characteristics and pre-existing cardiovascular risk factors
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Age */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Patient Age <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={18}
                  max={105}
                  value={formData.age}
                  onChange={(e) =>
                    handleInputChange(
                      'age',
                      e.target.value === '' ? '' : parseInt(e.target.value, 10)
                    )
                  }
                  placeholder="e.g. 54"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.age
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                  years
                </span>
              </div>
              {errors.age && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.age}</span>
                </p>
              )}
            </div>

            {/* Sex */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Biological Sex <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 h-[42px]">
                {(['Male', 'Female'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleInputChange('sex', s)}
                    className={`flex items-center justify-center rounded-xl text-xs font-medium transition-all ${
                      formData.sex === s
                        ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-semibold shadow-sm'
                        : 'bg-slate-950/80 border border-slate-700/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* BMI */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Body Mass Index (BMI) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min={12}
                  max={60}
                  value={formData.bmi}
                  onChange={(e) =>
                    handleInputChange(
                      'bmi',
                      e.target.value === '' ? '' : parseFloat(e.target.value)
                    )
                  }
                  placeholder="e.g. 26.8"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.bmi
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                  kg/m²
                </span>
              </div>
              {errors.bmi && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.bmi}</span>
                </p>
              )}
            </div>

            {/* Smoking Status */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Smoking History
              </label>
              <select
                value={formData.smoking}
                onChange={(e) =>
                  handleInputChange('smoking', e.target.value as PatientFormData['smoking'])
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              >
                <option value="never">Never Smoked (Non-Smoker)</option>
                <option value="ex">Ex-Smoker (Past History)</option>
                <option value="current">Current Active Smoker</option>
              </select>
            </div>

            {/* Family History of CAD */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Family History of CAD (FH)
              </label>
              <div className="grid grid-cols-2 gap-2 h-[42px]">
                {(['no', 'yes'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleInputChange('familyHistory', opt)}
                    className={`flex items-center justify-center rounded-xl text-xs font-medium transition-all ${
                      formData.familyHistory === opt
                        ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-semibold shadow-sm'
                        : 'bg-slate-950/80 border border-slate-700/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt === 'yes' ? 'Yes (Present)' : 'No (Absent)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Chronic Conditions (HTN / DM) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Hypertension & Diabetes
              </label>
              <div className="grid grid-cols-2 gap-2 h-[42px]">
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange('hypertension', formData.hypertension === 'yes' ? 'no' : 'yes')
                  }
                  className={`flex items-center justify-center rounded-xl text-xs font-medium transition-all ${
                    formData.hypertension === 'yes'
                      ? 'bg-amber-500/20 border border-amber-400 text-amber-300 font-semibold'
                      : 'bg-slate-950/80 border border-slate-700/80 text-slate-400'
                  }`}
                >
                  HTN: {formData.hypertension === 'yes' ? 'Yes' : 'No'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange('diabetes', formData.diabetes === 'yes' ? 'no' : 'yes')
                  }
                  className={`flex items-center justify-center rounded-xl text-xs font-medium transition-all ${
                    formData.diabetes === 'yes'
                      ? 'bg-amber-500/20 border border-amber-400 text-amber-300 font-semibold'
                      : 'bg-slate-950/80 border border-slate-700/80 text-slate-400'
                  }`}
                >
                  DM: {formData.diabetes === 'yes' ? 'Yes' : 'No'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: Clinical Measurements & Hemodynamics */}
        {/* ======================================================== */}
        <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                2. Clinical Measurements & Hemodynamics
              </h3>
              <p className="text-xs text-slate-400">
                Blood pressure, lipid panel, fasting glucose, and symptomatology
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Chest Pain Type */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Chest Pain Presentation <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.chestPainType}
                onChange={(e) =>
                  handleInputChange(
                    'chestPainType',
                    e.target.value as PatientFormData['chestPainType']
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              >
                <option value="typical">Typical Angina (Substernal, exertional, relief with rest)</option>
                <option value="atypical">Atypical Angina (Variable trigger/location)</option>
                <option value="nonanginal">Non-Anginal Chest Pain (Musculoskeletal/Pleuritic)</option>
                <option value="asymptomatic">Asymptomatic (No chest discomfort reported)</option>
              </select>
            </div>

            {/* Resting Blood Pressure */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Resting Blood Pressure <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={70}
                  max={240}
                  value={formData.restingBP}
                  onChange={(e) =>
                    handleInputChange(
                      'restingBP',
                      e.target.value === '' ? '' : parseInt(e.target.value, 10)
                    )
                  }
                  placeholder="e.g. 125"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.restingBP
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                  mmHg
                </span>
              </div>
              {errors.restingBP && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.restingBP}</span>
                </p>
              )}
            </div>

            {/* Resting Pulse Rate */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Resting Heart Rate (PR) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={40}
                  max={200}
                  value={formData.restingHR}
                  onChange={(e) =>
                    handleInputChange(
                      'restingHR',
                      e.target.value === '' ? '' : parseInt(e.target.value, 10)
                    )
                  }
                  placeholder="e.g. 72"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.restingHR
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                  bpm
                </span>
              </div>
              {errors.restingHR && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.restingHR}</span>
                </p>
              )}
            </div>

            {/* Total Serum Cholesterol */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Serum Cholesterol <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={80}
                  max={550}
                  value={formData.cholesterol}
                  onChange={(e) =>
                    handleInputChange(
                      'cholesterol',
                      e.target.value === '' ? '' : parseInt(e.target.value, 10)
                    )
                  }
                  placeholder="e.g. 215"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.cholesterol
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                  mg/dL
                </span>
              </div>
              {errors.cholesterol && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.cholesterol}</span>
                </p>
              )}
            </div>

            {/* LDL Cholesterol */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                LDL Cholesterol <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={30}
                  max={350}
                  value={formData.ldl}
                  onChange={(e) =>
                    handleInputChange(
                      'ldl',
                      e.target.value === '' ? '' : parseInt(e.target.value, 10)
                    )
                  }
                  placeholder="e.g. 130"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.ldl
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                  mg/dL
                </span>
              </div>
              {errors.ldl && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.ldl}</span>
                </p>
              )}
            </div>

            {/* HDL Cholesterol */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                HDL Cholesterol <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={15}
                  max={130}
                  value={formData.hdl}
                  onChange={(e) =>
                    handleInputChange(
                      'hdl',
                      e.target.value === '' ? '' : parseInt(e.target.value, 10)
                    )
                  }
                  placeholder="e.g. 45"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.hdl
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                  mg/dL
                </span>
              </div>
              {errors.hdl && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.hdl}</span>
                </p>
              )}
            </div>

            {/* Fasting Blood Sugar */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Fasting Blood Sugar (FBS) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={40}
                  max={450}
                  value={formData.fastingBS}
                  onChange={(e) =>
                    handleInputChange(
                      'fastingBS',
                      e.target.value === '' ? '' : parseInt(e.target.value, 10)
                    )
                  }
                  placeholder="e.g. 95"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.fastingBS
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                  mg/dL
                </span>
              </div>
              {Number(formData.fastingBS) > 120 && (
                <div className="mt-1 text-[11px] text-amber-400 font-mono">
                  &gt; 120 mg/dL (Elevated fast blood sugar flag)
                </div>
              )}
              {errors.fastingBS && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.fastingBS}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 3: Exercise Stress & Electrocardiogram (ECG) */}
        {/* ======================================================== */}
        <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                3. Exercise Stress Test & Electrocardiography (ECG)
              </h3>
              <p className="text-xs text-slate-400">
                Peak exertion performance, ST segment dynamics, and ventricular metrics
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Maximum Heart Rate */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Maximum Heart Rate Achieved <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={60}
                  max={230}
                  value={formData.maxHR}
                  onChange={(e) =>
                    handleInputChange(
                      'maxHR',
                      e.target.value === '' ? '' : parseInt(e.target.value, 10)
                    )
                  }
                  placeholder="e.g. 148"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.maxHR
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                  bpm
                </span>
              </div>
              {errors.maxHR && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.maxHR}</span>
                </p>
              )}
            </div>

            {/* Exercise-Induced Angina */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Exercise-Induced Angina <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 h-[42px]">
                {(['no', 'yes'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleInputChange('exerciseAngina', opt)}
                    className={`flex items-center justify-center rounded-xl text-xs font-medium transition-all ${
                      formData.exerciseAngina === opt
                        ? opt === 'yes'
                          ? 'bg-rose-500/20 border border-rose-400 text-rose-300 font-semibold shadow-sm'
                          : 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-semibold shadow-sm'
                        : 'bg-slate-950/80 border border-slate-700/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt === 'yes' ? 'Yes (Induced)' : 'No (None)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Resting ECG Results */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Resting Electrocardiogram (ECG)
              </label>
              <select
                value={formData.restingECG}
                onChange={(e) =>
                  handleInputChange(
                    'restingECG',
                    e.target.value as PatientFormData['restingECG']
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              >
                <option value="normal">0: Normal Sinus Rhythm</option>
                <option value="st_t_wave">1: ST-T Wave Abnormality (T-inversion/ST shift)</option>
                <option value="lvh">2: Left Ventricular Hypertrophy (Estes criteria)</option>
              </select>
            </div>

            {/* ST Depression (oldpeak) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                ST Depression (Oldpeak) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={6.5}
                  value={formData.stDepression}
                  onChange={(e) =>
                    handleInputChange(
                      'stDepression',
                      e.target.value === '' ? '' : parseFloat(e.target.value)
                    )
                  }
                  placeholder="e.g. 0.8"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.stDepression
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                  mm
                </span>
              </div>
              {errors.stDepression && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.stDepression}</span>
                </p>
              )}
            </div>

            {/* Slope of Peak Exercise ST Segment */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Peak Exercise ST Slope
              </label>
              <select
                value={formData.stSlope}
                onChange={(e) =>
                  handleInputChange('stSlope', e.target.value as PatientFormData['stSlope'])
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              >
                <option value="upsloping">1: Upsloping (Benign response)</option>
                <option value="flat">2: Flat (Horizontal ischemic shift)</option>
                <option value="downsloping">3: Downsloping (High ischemia likelihood)</option>
              </select>
            </div>

            {/* Ejection Fraction (EF-TTE) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Ejection Fraction (EF-TTE) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={15}
                  max={80}
                  value={formData.ejectionFraction}
                  onChange={(e) =>
                    handleInputChange(
                      'ejectionFraction',
                      e.target.value === '' ? '' : parseInt(e.target.value, 10)
                    )
                  }
                  placeholder="e.g. 55"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.ejectionFraction
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                  %
                </span>
              </div>
              {errors.ejectionFraction && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.ejectionFraction}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SUBMISSION STATUS & BACKEND CONNECTION STATE */}
        {/* ======================================================== */}
        {submissionResult && (
          <div
            className={`p-6 rounded-2xl border shadow-xl transition-all animate-in fade-in duration-300 ${
              submissionResult.status === 'connected'
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-slate-950/90 border-cyan-500/30'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                {submissionResult.status === 'connected' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>
                      {submissionResult.status === 'connected'
                        ? 'Backend Inference API Connected'
                        : 'Standalone Frontend Mode (Clinical Safety Protocol)'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {submissionResult.timestamp}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {submissionResult.status === 'connected'
                      ? 'ML model returned successful inference predictions.'
                      : 'Live ML backend (http://localhost:8000/api/predict) is not currently connected. As a clinical research application, CardioVision AI intentionally does NOT invent fake or fabricated prediction percentages.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={copyPayloadToClipboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700 transition-all shrink-0"
              >
                {copiedPayload ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy JSON Payload</span>
                  </>
                )}
              </button>
            </div>

            {/* Formatted Feature Vector Output */}
            <div className="mt-4 rounded-xl bg-black/60 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
              <div className="flex items-center justify-between text-[11px] text-cyan-400 pb-2 mb-2 border-b border-slate-800/80">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>STANDARDIZED CLINICAL FEATURE VECTOR READY FOR INFERENCE</span>
                </span>
                <span className="text-slate-500">
                  {Object.keys(submissionResult.payload).length} Parameters Formatted
                </span>
              </div>
              <pre className="text-[11px] leading-relaxed text-slate-300">
                {JSON.stringify(submissionResult.payload, null, 2)}
              </pre>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>Ready to connect Python API: `uvicorn app:main --port 8000`</span>
              <span className="text-cyan-400">Endpoint: POST /api/predict</span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* FORM ACTIONS (SUBMIT / RESET) */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>All fields with asterisk (*) are required clinical parameters.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Reset Form</span>
            </button>

            {/* Prominent Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-cyan-950/40 hover:shadow-cyan-500/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Packaging Clinical Vector...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-cyan-200" />
                  <span>Analyze Cardiovascular Risk</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
