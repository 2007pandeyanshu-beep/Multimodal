/**
 * frontend/src/components/wizard/wizardTypes.ts
 * Type definitions, blank initialization model, and synthetic demo presets for the 5-Step Patient Profile Wizard.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import type { CanonicalPatientInput } from '../../api/types.ts';

export type WizardStepId = 'profile' | 'history' | 'vitals_lab' | 'ecg_cardiac' | 'review';

export interface WizardStepMeta {
  id: WizardStepId;
  stepNumber: number;
  title: string;
  shortTitle: string;
  description: string;
  featureCount: number;
  iconName: string;
}

export const WIZARD_STEPS: WizardStepMeta[] = [
  {
    id: 'profile',
    stepNumber: 1,
    title: 'Patient Profile & Biometrics',
    shortTitle: 'Profile',
    description: 'Demographics, standing height, body mass index, smoking, and family history.',
    featureCount: 9,
    iconName: 'User',
  },
  {
    id: 'history',
    stepNumber: 2,
    title: 'Medical History & Symptoms',
    shortTitle: 'History',
    description: 'Comorbidities, cardiovascular history, chest pain presentation, and functional class.',
    featureCount: 14,
    iconName: 'FileText',
  },
  {
    id: 'vitals_lab',
    stepNumber: 3,
    title: 'Vitals & Laboratory Biomarkers',
    shortTitle: 'Vitals & Labs',
    description: 'Hemodynamics, lipid profile, renal panel, hematology, and electrolytes.',
    featureCount: 16,
    iconName: 'Activity',
  },
  {
    id: 'ecg_cardiac',
    stepNumber: 4,
    title: 'ECG & Cardiac Examination',
    shortTitle: 'ECG & Cardiac',
    description: 'Electrocardiography signs, physical exam findings, and echocardiography.',
    featureCount: 15,
    iconName: 'HeartPulse',
  },
  {
    id: 'review',
    stepNumber: 5,
    title: 'Clinical Review & Multi-Artery Inference',
    shortTitle: 'Review',
    description: 'Comprehensive 54-feature verification, provenance inspection, and prediction.',
    featureCount: 54,
    iconName: 'ShieldCheck',
  },
];

/**
 * 54-Feature Wizard Form Data Model
 * Every single canonical feature from backend/schemas.py is directly represented.
 * For fresh assessments, every field can be '' (unset) until entered or derived.
 */
export interface WizardFormData {
  // ==========================================
  // STEP 1: Patient Profile (9 Features)
  // ==========================================
  age: number | ''; // [18, 120] years
  sex: 'Male' | 'Female' | '';
  length: number | ''; // [100.0, 250.0] cm (Standing Height)
  weight: number | ''; // [20.0, 300.0] kg (Body Weight)
  bmi: number | ''; // [10.0, 80.0] kg/m^2 (Body Mass Index) - Derived: weight / (length/100)^2
  obesity: 'Y' | 'N' | ''; // Derived: BMI >= 25.0
  currentSmoker: 0 | 1 | ''; // Current smoker (0=No, 1=Yes)
  exSmoker: 0 | 1 | ''; // Ex-smoker (0=No, 1=Yes)
  fh: 0 | 1 | ''; // Family History of CAD (0=No, 1=Yes)

  // ==========================================
  // STEP 2: Medical History & Symptoms (14 Features)
  // ==========================================
  htn: 0 | 1 | ''; // Hypertension (0=No, 1=Yes)
  dm: 0 | 1 | ''; // Diabetes Mellitus (0=No, 1=Yes)
  dlp: 'Y' | 'N' | ''; // Dyslipidemia ('Y'/'N')
  chf: 'Y' | 'N' | ''; // Congestive Heart Failure ('Y'/'N')
  crf: 'Y' | 'N' | ''; // Chronic Renal Failure ('Y'/'N')
  cva: 'Y' | 'N' | ''; // Cerebrovascular Accident / Stroke ('Y'/'N')
  airwayDisease: 'Y' | 'N' | ''; // Chronic Airway Disease ('Y'/'N')
  thyroidDisease: 'Y' | 'N' | ''; // Thyroid Disease ('Y'/'N')
  typicalChestPain: 0 | 1 | ''; // Typical Anginal Chest Pain (0=No, 1=Yes)
  atypical: 'Y' | 'N' | ''; // Atypical Chest Pain ('Y'/'N')
  nonanginal: 'Y' | 'N' | ''; // Non-Anginal Chest Pain ('Y'/'N')
  lowthAng: 'Y' | 'N' | ''; // Low Threshold Angina ('Y'/'N')
  dyspnea: 'Y' | 'N' | ''; // Dyspnea ('Y'/'N')
  functionClass: 0 | 1 | 2 | 3 | ''; // NYHA Functional Class (0-3)

  // ==========================================
  // STEP 3: Vitals & Laboratory Results (16 Features)
  // ==========================================
  bp: number | ''; // [50.0, 250.0] mmHg (Systolic Blood Pressure)
  pr: number | ''; // [30.0, 220.0] bpm (Pulse Rate)
  fbs: number | ''; // [20.0, 800.0] mg/dL (Fasting Blood Sugar)
  tg: number | ''; // [10.0, 2000.0] mg/dL (Serum Triglycerides)
  ldl: number | ''; // [5.0, 500.0] mg/dL (LDL Cholesterol)
  hdl: number | ''; // [5.0, 200.0] mg/dL (HDL Cholesterol)
  cr: number | ''; // [0.1, 15.0] mg/dL (Serum Creatinine)
  bun: number | ''; // [1.0, 150.0] mg/dL (Blood Urea Nitrogen)
  hb: number | ''; // [3.0, 25.0] g/dL (Hemoglobin)
  wbc: number | ''; // [500.0, 50000.0] cells/mcL (White Blood Cell Count)
  lymph: number | ''; // [0.0, 100.0] % (Lymphocyte Differential)
  neut: number | ''; // [0.0, 100.0] % (Neutrophil Differential)
  plt: number | ''; // [5.0, 1500.0] 10^3/mcL (Platelet Count)
  esr: number | ''; // [0.0, 150.0] mm/hr (Erythrocyte Sedimentation Rate)
  k: number | ''; // [1.0, 10.0] mEq/L (Serum Potassium)
  na: number | ''; // [90.0, 180.0] mEq/L (Serum Sodium)

  // ==========================================
  // STEP 4: ECG & Cardiac Examination (15 Features)
  // ==========================================
  qWave: 0 | 1 | ''; // Pathological Q Wave (0=No, 1=Yes)
  stElevation: 0 | 1 | ''; // ST-Segment Elevation (0=No, 1=Yes)
  stDepression: 0 | 1 | ''; // ST-Segment Depression (0=No, 1=Yes)
  tinversion: 0 | 1 | ''; // T-Wave Inversion (0=No, 1=Yes)
  lvh: 'Y' | 'N' | ''; // Left Ventricular Hypertrophy ('Y'/'N')
  poorRProgression: 'Y' | 'N' | ''; // Poor Precordial R-Wave Progression ('Y'/'N')
  bbb: 'N' | 'LBBB' | 'RBBB' | ''; // Bundle Branch Block ('N'/'LBBB'/'RBBB')
  edema: 0 | 1 | ''; // Peripheral Edema (0=No, 1=Yes)
  weakPeripheralPulse: 'Y' | 'N' | ''; // Weak Peripheral Pulse ('Y'/'N')
  lungRales: 'Y' | 'N' | ''; // Pulmonary Lung Rales ('Y'/'N')
  systolicMurmur: 'Y' | 'N' | ''; // Systolic Cardiac Murmur ('Y'/'N')
  diastolicMurmur: 'Y' | 'N' | ''; // Diastolic Cardiac Murmur ('Y'/'N')
  efTte: number | ''; // [5.0, 90.0] % (Transthoracic Ejection Fraction)
  regionRwma: 0 | 1 | 2 | 3 | 4 | ''; // Regional Wall Motion Abnormality (0-4)
  vhd: 'Normal' | 'Mild' | 'Moderate' | 'Severe' | ''; // Valvular Heart Disease
}

/**
 * Genuinely empty initial state for a fresh patient assessment.
 * Zero misleading prefilled values. Required values remain unset until entered or derived.
 */
export const EMPTY_WIZARD_DATA: WizardFormData = {
  // Step 1: Profile & Biometrics (9)
  age: '',
  sex: '',
  length: '',
  weight: '',
  bmi: '',
  obesity: '',
  currentSmoker: '',
  exSmoker: '',
  fh: '',

  // Step 2: Medical History & Symptoms (14)
  htn: '',
  dm: '',
  dlp: '',
  chf: '',
  crf: '',
  cva: '',
  airwayDisease: '',
  thyroidDisease: '',
  typicalChestPain: '',
  atypical: '',
  nonanginal: '',
  lowthAng: '',
  dyspnea: '',
  functionClass: '',

  // Step 3: Vitals & Laboratory Biomarkers (16)
  bp: '',
  pr: '',
  fbs: '',
  tg: '',
  ldl: '',
  hdl: '',
  cr: '',
  bun: '',
  hb: '',
  wbc: '',
  lymph: '',
  neut: '',
  plt: '',
  esr: '',
  k: '',
  na: '',

  // Step 4: ECG & Cardiac Examination (15)
  qWave: '',
  stElevation: '',
  stDepression: '',
  tinversion: '',
  lvh: '',
  poorRProgression: '',
  bbb: '',
  edema: '',
  weakPeripheralPulse: '',
  lungRales: '',
  systolicMurmur: '',
  diastolicMurmur: '',
  efTte: '',
  regionRwma: '',
  vhd: '',
};

// Aliased so all fresh instantiations begin strictly blank
export const DEFAULT_WIZARD_DATA: WizardFormData = EMPTY_WIZARD_DATA;

export interface WizardPreset {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  badgeColor: 'emerald' | 'amber' | 'rose';
  isSyntheticDemo: true;
  data: WizardFormData;
}

/**
 * Explicitly labeled synthetic demonstration cohorts.
 * Used exclusively for rapid system verification, testing, and UI preview.
 * These are NOT real patients and require explicit clinician selection.
 */
export const SYNTHETIC_DEMO_PRESETS: WizardPreset[] = [
  {
    id: 'demo-low-risk',
    name: 'Synthetic Demo: Normative Benchmark',
    subtitle: 'Synthetic research cohort: Normative biometrics and hemodynamics (Not a real patient)',
    badge: 'Synthetic Demo: Low Risk',
    badgeColor: 'emerald',
    isSyntheticDemo: true,
    data: {
      age: 41,
      sex: 'Female',
      length: 164,
      weight: 58,
      bmi: 21.6,
      obesity: 'N',
      currentSmoker: 0,
      exSmoker: 0,
      fh: 0,
      htn: 0,
      dm: 0,
      dlp: 'N',
      chf: 'N',
      crf: 'N',
      cva: 'N',
      airwayDisease: 'N',
      thyroidDisease: 'N',
      typicalChestPain: 0,
      atypical: 'N',
      nonanginal: 'N',
      lowthAng: 'N',
      dyspnea: 'N',
      functionClass: 0,
      bp: 115,
      pr: 66,
      fbs: 86,
      tg: 110,
      ldl: 92,
      hdl: 60,
      cr: 0.85,
      bun: 14,
      hb: 13.5,
      wbc: 6200,
      lymph: 34,
      neut: 58,
      plt: 230,
      esr: 10,
      k: 4.3,
      na: 142,
      qWave: 0,
      stElevation: 0,
      stDepression: 0,
      tinversion: 0,
      lvh: 'N',
      poorRProgression: 'N',
      bbb: 'N',
      edema: 0,
      weakPeripheralPulse: 'N',
      lungRales: 'N',
      systolicMurmur: 'N',
      diastolicMurmur: 'N',
      efTte: 62,
      regionRwma: 0,
      vhd: 'Normal',
    },
  },
  {
    id: 'demo-moderate-risk',
    name: 'Synthetic Demo: Suspected Ischemia Benchmark',
    subtitle: 'Synthetic research cohort: Dyslipidemia, ST depression & atypical angina (Not a real patient)',
    badge: 'Synthetic Demo: Moderate Risk',
    badgeColor: 'amber',
    isSyntheticDemo: true,
    data: {
      age: 58,
      sex: 'Male',
      length: 174,
      weight: 84,
      bmi: 27.7,
      obesity: 'Y',
      currentSmoker: 0,
      exSmoker: 1,
      fh: 1,
      htn: 1,
      dm: 0,
      dlp: 'Y',
      chf: 'N',
      crf: 'N',
      cva: 'N',
      airwayDisease: 'N',
      thyroidDisease: 'N',
      typicalChestPain: 0,
      atypical: 'Y',
      nonanginal: 'N',
      lowthAng: 'N',
      dyspnea: 'Y',
      functionClass: 1,
      bp: 138,
      pr: 76,
      fbs: 114,
      tg: 190,
      ldl: 152,
      hdl: 41,
      cr: 1.1,
      bun: 18,
      hb: 14.1,
      wbc: 7400,
      lymph: 28,
      neut: 64,
      plt: 215,
      esr: 16,
      k: 4.1,
      na: 140,
      qWave: 0,
      stElevation: 0,
      stDepression: 1,
      tinversion: 1,
      lvh: 'N',
      poorRProgression: 'N',
      bbb: 'N',
      edema: 0,
      weakPeripheralPulse: 'N',
      lungRales: 'N',
      systolicMurmur: 'N',
      diastolicMurmur: 'N',
      efTte: 50,
      regionRwma: 1,
      vhd: 'Mild',
    },
  },
  {
    id: 'demo-high-risk',
    name: 'Synthetic Demo: Multi-Vessel Stenosis Benchmark',
    subtitle: 'Synthetic research cohort: Typical angina, diabetes, Q wave & low EF (Not a real patient)',
    badge: 'Synthetic Demo: High Risk',
    badgeColor: 'rose',
    isSyntheticDemo: true,
    data: {
      age: 67,
      sex: 'Male',
      length: 168,
      weight: 82,
      bmi: 29.1,
      obesity: 'Y',
      currentSmoker: 1,
      exSmoker: 0,
      fh: 1,
      htn: 1,
      dm: 1,
      dlp: 'Y',
      chf: 'N',
      crf: 'N',
      cva: 'N',
      airwayDisease: 'N',
      thyroidDisease: 'N',
      typicalChestPain: 1,
      atypical: 'N',
      nonanginal: 'N',
      lowthAng: 'Y',
      dyspnea: 'Y',
      functionClass: 2,
      bp: 155,
      pr: 84,
      fbs: 168,
      tg: 265,
      ldl: 178,
      hdl: 34,
      cr: 1.4,
      bun: 24,
      hb: 12.8,
      wbc: 9200,
      lymph: 22,
      neut: 72,
      plt: 260,
      esr: 28,
      k: 4.6,
      na: 138,
      qWave: 1,
      stElevation: 0,
      stDepression: 1,
      tinversion: 1,
      lvh: 'Y',
      poorRProgression: 'Y',
      bbb: 'LBBB',
      edema: 1,
      weakPeripheralPulse: 'Y',
      lungRales: 'Y',
      systolicMurmur: 'Y',
      diastolicMurmur: 'N',
      efTte: 38,
      regionRwma: 2,
      vhd: 'Moderate',
    },
  },
];

// Backwards compatibility alias
export const WIZARD_PRESETS = SYNTHETIC_DEMO_PRESETS;
