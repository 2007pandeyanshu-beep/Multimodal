/**
 * frontend/src/components/wizard/wizardMetadata.ts
 * Auditable 54-feature clinical mapping table, step validators, and payload compiler.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import type { CanonicalPatientInput } from '../../api/types.ts';
import type { WizardFormData, WizardStepId } from './wizardTypes.ts';

export interface FeatureSpecification {
  canonicalField: keyof CanonicalPatientInput;
  label: string;
  step: 1 | 2 | 3 | 4;
  stepId: WizardStepId;
  key: keyof WizardFormData;
  inputType: 'number' | 'segmented' | 'derived';
  unit?: string;
  min?: number;
  max?: number;
  allowedValues?: (string | number)[];
  isDerived?: boolean;
  derivationRule?: string;
  description: string;
}

/**
 * Exhaustive 54-feature mapping matrix.
 * Every feature corresponds 1-to-1 with backend/schemas.py (PatientInput).
 */
export const FEATURE_SPECIFICATIONS: FeatureSpecification[] = [
  // ==========================================
  // STEP 1: Patient Profile & Biometrics (9 Features)
  // ==========================================
  {
    canonicalField: 'Age',
    label: 'Patient Age',
    step: 1,
    stepId: 'profile',
    key: 'age',
    inputType: 'number',
    unit: 'years',
    min: 18,
    max: 120,
    description: 'Patient chronological age in completed years.',
  },
  {
    canonicalField: 'Sex',
    label: 'Biological Sex',
    step: 1,
    stepId: 'profile',
    key: 'sex',
    inputType: 'segmented',
    allowedValues: ['Male', 'Female'],
    description: 'Biological sex at birth.',
  },
  {
    canonicalField: 'Length',
    label: 'Standing Height (Length)',
    step: 1,
    stepId: 'profile',
    key: 'length',
    inputType: 'number',
    unit: 'cm',
    min: 100.0,
    max: 250.0,
    description: 'Standing height measured in centimeters.',
  },
  {
    canonicalField: 'Weight',
    label: 'Body Weight',
    step: 1,
    stepId: 'profile',
    key: 'weight',
    inputType: 'number',
    unit: 'kg',
    min: 20.0,
    max: 300.0,
    description: 'Total patient body mass in kilograms.',
  },
  {
    canonicalField: 'BMI',
    label: 'Body Mass Index (BMI)',
    step: 1,
    stepId: 'profile',
    key: 'bmi',
    inputType: 'number',
    unit: 'kg/m²',
    min: 10.0,
    max: 80.0,
    isDerived: true,
    derivationRule: 'Weight (kg) / [Height (m)]²',
    description: 'Quetelet index calculated as weight in kg divided by height in meters squared.',
  },
  {
    canonicalField: 'Obesity',
    label: 'Dataset Obesity / Overweight (BMI ≥ 25.0 kg/m²)',
    step: 1,
    stepId: 'profile',
    key: 'obesity',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    isDerived: true,
    derivationRule: 'BMI ≥ 25.0 kg/m² ⇒ Y, otherwise N (Dataset binary threshold; WHO standard defines BMI 25–29.9 as Overweight, ≥30 as Obese)',
    description: 'Dataset-defined binary threshold (BMI >= 25.0 kg/m²). In Z-Alizadeh Sani benchmark, Y corresponds strictly to BMI >= 25.0 (0 discordances across N=303 cohort).',
  },
  {
    canonicalField: 'Current Smoker',
    label: 'Active Cigarette Smoker',
    step: 1,
    stepId: 'profile',
    key: 'currentSmoker',
    inputType: 'segmented',
    allowedValues: [0, 1],
    description: 'Actively smokes cigarettes at time of intake (0=No, 1=Yes).',
  },
  {
    canonicalField: 'EX-Smoker',
    label: 'Ex-Smoker History',
    step: 1,
    stepId: 'profile',
    key: 'exSmoker',
    inputType: 'segmented',
    allowedValues: [0, 1],
    description: 'Former smoker who ceased smoking prior to intake (0=No, 1=Yes).',
  },
  {
    canonicalField: 'FH',
    label: 'Family History of CAD',
    step: 1,
    stepId: 'profile',
    key: 'fh',
    inputType: 'segmented',
    allowedValues: [0, 1],
    description: 'Documented premature CAD in first-degree relatives (0=No, 1=Yes).',
  },

  // ==========================================
  // STEP 2: Medical History & Symptoms (14 Features)
  // ==========================================
  {
    canonicalField: 'HTN',
    label: 'Hypertension (HTN)',
    step: 2,
    stepId: 'history',
    key: 'htn',
    inputType: 'segmented',
    allowedValues: [0, 1],
    description: 'Clinically diagnosed hypertension or on antihypertensive therapy (0=No, 1=Yes).',
  },
  {
    canonicalField: 'DM',
    label: 'Diabetes Mellitus (DM)',
    step: 2,
    stepId: 'history',
    key: 'dm',
    inputType: 'segmented',
    allowedValues: [0, 1],
    description: 'Diagnosed diabetes mellitus or on glucose-lowering therapy (0=No, 1=Yes).',
  },
  {
    canonicalField: 'DLP',
    label: 'Dyslipidemia (DLP)',
    step: 2,
    stepId: 'history',
    key: 'dlp',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'History of hypercholesterolemia or on lipid-lowering medication (Y/N).',
  },
  {
    canonicalField: 'CHF',
    label: 'Congestive Heart Failure (CHF)',
    step: 2,
    stepId: 'history',
    key: 'chf',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Documented clinical history of congestive heart failure (Y/N).',
  },
  {
    canonicalField: 'CRF',
    label: 'Chronic Renal Failure (CRF)',
    step: 2,
    stepId: 'history',
    key: 'crf',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Documented chronic kidney disease or renal failure (Y/N).',
  },
  {
    canonicalField: 'CVA',
    label: 'Cerebrovascular Accident (CVA / Stroke)',
    step: 2,
    stepId: 'history',
    key: 'cva',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Prior ischemic stroke or transient ischemic attack (Y/N).',
  },
  {
    canonicalField: 'Airway disease',
    label: 'Chronic Airway Disease',
    step: 2,
    stepId: 'history',
    key: 'airwayDisease',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Chronic obstructive pulmonary disease or asthma (Y/N).',
  },
  {
    canonicalField: 'Thyroid Disease',
    label: 'Thyroid Dysfunction',
    step: 2,
    stepId: 'history',
    key: 'thyroidDisease',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'History of hypothyroidism, hyperthyroidism, or thyroxine therapy (Y/N).',
  },
  {
    canonicalField: 'Typical Chest Pain',
    label: 'Typical Anginal Chest Pain',
    step: 2,
    stepId: 'history',
    key: 'typicalChestPain',
    inputType: 'segmented',
    allowedValues: [0, 1],
    description: 'Substernal chest discomfort precipitated by exertion and relieved by rest or nitroglycerin (0=No, 1=Yes).',
  },
  {
    canonicalField: 'Atypical',
    label: 'Atypical Chest Pain',
    step: 2,
    stepId: 'history',
    key: 'atypical',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Discomfort meeting 2 of 3 classical angina criteria (Y/N).',
  },
  {
    canonicalField: 'Nonanginal',
    label: 'Non-Anginal Chest Pain',
    step: 2,
    stepId: 'history',
    key: 'nonanginal',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Chest discomfort meeting ≤1 classical angina criterion (Y/N).',
  },
  {
    canonicalField: 'LowTH Ang',
    label: 'Low Threshold Angina',
    step: 2,
    stepId: 'history',
    key: 'lowthAng',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Angina triggered at minimal exertion or at rest (Y/N).',
  },
  {
    canonicalField: 'Dyspnea',
    label: 'Exertional Dyspnea',
    step: 2,
    stepId: 'history',
    key: 'dyspnea',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Unexplained shortness of breath on routine physical exertion (Y/N).',
  },
  {
    canonicalField: 'Function Class',
    label: 'NYHA Functional Class',
    step: 2,
    stepId: 'history',
    key: 'functionClass',
    inputType: 'segmented',
    allowedValues: [0, 1, 2, 3],
    description: 'New York Heart Association functional classification (0=No limitation, 1=Mild, 2=Moderate, 3=Severe).',
  },

  // ==========================================
  // STEP 3: Vitals & Laboratory Results (16 Features)
  // ==========================================
  {
    canonicalField: 'BP',
    label: 'Systolic Blood Pressure',
    step: 3,
    stepId: 'vitals_lab',
    key: 'bp',
    inputType: 'number',
    unit: 'mmHg',
    min: 50.0,
    max: 250.0,
    description: 'Resting systolic arterial pressure.',
  },
  {
    canonicalField: 'PR',
    label: 'Resting Pulse Rate',
    step: 3,
    stepId: 'vitals_lab',
    key: 'pr',
    inputType: 'number',
    unit: 'bpm',
    min: 30.0,
    max: 220.0,
    description: 'Resting radial or apical heart rate in beats per minute.',
  },
  {
    canonicalField: 'FBS',
    label: 'Fasting Blood Sugar (FBS)',
    step: 3,
    stepId: 'vitals_lab',
    key: 'fbs',
    inputType: 'number',
    unit: 'mg/dL',
    min: 20.0,
    max: 800.0,
    description: 'Serum glucose concentration after ≥8 hours fasting.',
  },
  {
    canonicalField: 'TG',
    label: 'Serum Triglycerides (TG)',
    step: 3,
    stepId: 'vitals_lab',
    key: 'tg',
    inputType: 'number',
    unit: 'mg/dL',
    min: 10.0,
    max: 2000.0,
    description: 'Total circulating fasting triglyceride concentration.',
  },
  {
    canonicalField: 'LDL',
    label: 'LDL Cholesterol',
    step: 3,
    stepId: 'vitals_lab',
    key: 'ldl',
    inputType: 'number',
    unit: 'mg/dL',
    min: 5.0,
    max: 500.0,
    description: 'Low-density lipoprotein cholesterol fraction.',
  },
  {
    canonicalField: 'HDL',
    label: 'HDL Cholesterol',
    step: 3,
    stepId: 'vitals_lab',
    key: 'hdl',
    inputType: 'number',
    unit: 'mg/dL',
    min: 5.0,
    max: 200.0,
    description: 'High-density lipoprotein cholesterol fraction.',
  },
  {
    canonicalField: 'CR',
    label: 'Serum Creatinine (CR)',
    step: 3,
    stepId: 'vitals_lab',
    key: 'cr',
    inputType: 'number',
    unit: 'mg/dL',
    min: 0.1,
    max: 15.0,
    description: 'Serum creatinine concentration reflecting glomerular filtration.',
  },
  {
    canonicalField: 'BUN',
    label: 'Blood Urea Nitrogen (BUN)',
    step: 3,
    stepId: 'vitals_lab',
    key: 'bun',
    inputType: 'number',
    unit: 'mg/dL',
    min: 1.0,
    max: 150.0,
    description: 'Serum urea nitrogen marker of renal elimination.',
  },
  {
    canonicalField: 'HB',
    label: 'Hemoglobin (HB)',
    step: 3,
    stepId: 'vitals_lab',
    key: 'hb',
    inputType: 'number',
    unit: 'g/dL',
    min: 3.0,
    max: 25.0,
    description: 'Total blood hemoglobin concentration.',
  },
  {
    canonicalField: 'WBC',
    label: 'White Blood Cell Count (WBC)',
    step: 3,
    stepId: 'vitals_lab',
    key: 'wbc',
    inputType: 'number',
    unit: 'cells/mcL',
    min: 500.0,
    max: 50000.0,
    description: 'Total circulating leukocyte concentration.',
  },
  {
    canonicalField: 'Lymph',
    label: 'Lymphocyte Percentage',
    step: 3,
    stepId: 'vitals_lab',
    key: 'lymph',
    inputType: 'number',
    unit: '%',
    min: 0.0,
    max: 100.0,
    description: 'Differential lymphocyte fraction of total WBC.',
  },
  {
    canonicalField: 'Neut',
    label: 'Neutrophil Percentage',
    step: 3,
    stepId: 'vitals_lab',
    key: 'neut',
    inputType: 'number',
    unit: '%',
    min: 0.0,
    max: 100.0,
    description: 'Differential neutrophil fraction of total WBC.',
  },
  {
    canonicalField: 'PLT',
    label: 'Platelet Count (PLT)',
    step: 3,
    stepId: 'vitals_lab',
    key: 'plt',
    inputType: 'number',
    unit: '10³/mcL',
    min: 5.0,
    max: 1500.0,
    description: 'Circulating platelet count in thousands per microliter.',
  },
  {
    canonicalField: 'ESR',
    label: 'Erythrocyte Sedimentation Rate (ESR)',
    step: 3,
    stepId: 'vitals_lab',
    key: 'esr',
    inputType: 'number',
    unit: 'mm/hr',
    min: 0.0,
    max: 150.0,
    description: 'Inflammatory sedimentation rate at 1 hour.',
  },
  {
    canonicalField: 'K',
    label: 'Serum Potassium (K⁺)',
    step: 3,
    stepId: 'vitals_lab',
    key: 'k',
    inputType: 'number',
    unit: 'mEq/L',
    min: 1.0,
    max: 10.0,
    description: 'Serum potassium electrolyte concentration.',
  },
  {
    canonicalField: 'Na',
    label: 'Serum Sodium (Na⁺)',
    step: 3,
    stepId: 'vitals_lab',
    key: 'na',
    inputType: 'number',
    unit: 'mEq/L',
    min: 90.0,
    max: 180.0,
    description: 'Serum sodium electrolyte concentration.',
  },

  // ==========================================
  // STEP 4: ECG & Cardiac Examination (15 Features)
  // ==========================================
  {
    canonicalField: 'Q Wave',
    label: 'Pathological Q Wave',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'qWave',
    inputType: 'segmented',
    allowedValues: [0, 1],
    description: 'Pathological Q wave on 12-lead ECG suggesting prior transmural infarction (0=No, 1=Yes).',
  },
  {
    canonicalField: 'St Elevation',
    label: 'ST-Segment Elevation',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'stElevation',
    inputType: 'segmented',
    allowedValues: [0, 1],
    description: 'Acute or persistent ST elevation on resting ECG (0=No, 1=Yes).',
  },
  {
    canonicalField: 'St Depression',
    label: 'ST-Segment Depression',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'stDepression',
    inputType: 'segmented',
    allowedValues: [0, 1],
    description: 'Horizontal or downsloping ST depression ≥1.0 mm (0=No, 1=Yes).',
  },
  {
    canonicalField: 'Tinversion',
    label: 'T-Wave Inversion',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'tinversion',
    inputType: 'segmented',
    allowedValues: [0, 1],
    description: 'Pathological ischemic T-wave inversion (0=No, 1=Yes).',
  },
  {
    canonicalField: 'LVH',
    label: 'Left Ventricular Hypertrophy (LVH)',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'lvh',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Voltage criteria for left ventricular hypertrophy (Y/N).',
  },
  {
    canonicalField: 'Poor R Progression',
    label: 'Poor Precordial R-Wave Progression',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'poorRProgression',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Failure of R-wave amplitude to increase appropriately across V1-V4 (Y/N).',
  },
  {
    canonicalField: 'BBB',
    label: 'Bundle Branch Block (BBB)',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'bbb',
    inputType: 'segmented',
    allowedValues: ['N', 'LBBB', 'RBBB'],
    description: 'Conduction block pattern: None (N), Left (LBBB), or Right (RBBB).',
  },
  {
    canonicalField: 'Edema',
    label: 'Peripheral Pitting Edema',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'edema',
    inputType: 'segmented',
    allowedValues: [0, 1],
    description: 'Bilateral lower-extremity pitting edema on physical exam (0=No, 1=Yes).',
  },
  {
    canonicalField: 'Weak Peripheral Pulse',
    label: 'Weak Peripheral Pulse Deficit',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'weakPeripheralPulse',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Diminished dorsalis pedis or posterior tibial arterial pulses (Y/N).',
  },
  {
    canonicalField: 'Lung rales',
    label: 'Pulmonary Lung Rales',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'lungRales',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Inspiratory crackles or rales on chest auscultation (Y/N).',
  },
  {
    canonicalField: 'Systolic Murmur',
    label: 'Systolic Cardiac Murmur',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'systolicMurmur',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Auscultated systolic cardiac murmur (Y/N).',
  },
  {
    canonicalField: 'Diastolic Murmur',
    label: 'Diastolic Cardiac Murmur',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'diastolicMurmur',
    inputType: 'segmented',
    allowedValues: ['Y', 'N'],
    description: 'Auscultated diastolic cardiac murmur (Y/N).',
  },
  {
    canonicalField: 'EF-TTE',
    label: 'Transthoracic Ejection Fraction (EF-TTE)',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'efTte',
    inputType: 'number',
    unit: '%',
    min: 5.0,
    max: 90.0,
    description: 'Left ventricular ejection fraction measured via echocardiography.',
  },
  {
    canonicalField: 'Region RWMA',
    label: 'Regional Wall Motion Abnormality (RWMA)',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'regionRwma',
    inputType: 'segmented',
    allowedValues: [0, 1, 2, 3, 4],
    description: 'Echocardiographic segmental wall motion score (0=Normal, 1=Mild, 2=Moderate, 3=Severe, 4=Aneurysmal).',
  },
  {
    canonicalField: 'VHD',
    label: 'Valvular Heart Disease (VHD)',
    step: 4,
    stepId: 'ecg_cardiac',
    key: 'vhd',
    inputType: 'segmented',
    allowedValues: ['Normal', 'Mild', 'Moderate', 'Severe'],
    description: 'Echocardiographic grading of valvular heart disease.',
  },
];

/**
 * Validates a single wizard step.
 * Returns an error map of field keys to user-facing error messages.
 */
export function validateWizardStep(
  stepId: WizardStepId,
  data: WizardFormData
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (stepId === 'review') {
    // Review validates all steps
    return validateAllWizardSteps(data);
  }

  const stepSpecs = FEATURE_SPECIFICATIONS.filter((s) => s.stepId === stepId);

  for (const spec of stepSpecs) {
    const val = data[spec.key];

    if (spec.inputType === 'number') {
      if (val === '' || Number.isNaN(Number(val))) {
        errors[spec.key] = `${spec.label} is required`;
      } else {
        const num = Number(val);
        if (spec.min !== undefined && num < spec.min) {
          errors[spec.key] = `${spec.label} must be at least ${spec.min}${spec.unit ? ' ' + spec.unit : ''}`;
        } else if (spec.max !== undefined && num > spec.max) {
          errors[spec.key] = `${spec.label} must be at most ${spec.max}${spec.unit ? ' ' + spec.unit : ''}`;
        }
      }
    } else if (spec.inputType === 'segmented') {
      if (val === undefined || val === '') {
        errors[spec.key] = `${spec.label} selection is required`;
      } else if (spec.allowedValues && !spec.allowedValues.includes(val as never)) {
        errors[spec.key] = `Invalid value for ${spec.label}`;
      }
    }
  }

  return errors;
}

/**
 * Validates all 54 features across all wizard steps.
 */
export function validateAllWizardSteps(data: WizardFormData): Record<string, string> {
  const allErrors: Record<string, string> = {};
  const steps: WizardStepId[] = ['profile', 'history', 'vitals_lab', 'ecg_cardiac'];

  for (const step of steps) {
    const stepErrors = validateWizardStep(step, data);
    Object.assign(allErrors, stepErrors);
  }

  return allErrors;
}

/**
 * Adapts WizardFormData into the exact 54-key CanonicalPatientInput.
 * Strictly checks completeness before compilation; throws an error if any required field is missing.
 */
export function adaptWizardDataToCanonical(data: WizardFormData): CanonicalPatientInput {
  const errors = validateAllWizardSteps(data);
  const errorKeys = Object.keys(errors);
  if (errorKeys.length > 0) {
    throw new Error(
      `Cannot compile incomplete wizard form: ${errorKeys.length} required clinical parameters are missing or invalid: ${errorKeys.slice(0, 5).join(', ')}${errorKeys.length > 5 ? '...' : ''}`
    );
  }

  return {
    Age: Number(data.age),
    Weight: Number(data.weight),
    Length: Number(data.length),
    Sex: data.sex as 'Male' | 'Female',
    BMI: Number(data.bmi),
    DM: data.dm as 0 | 1,
    HTN: data.htn as 0 | 1,
    'Current Smoker': data.currentSmoker as 0 | 1,
    'EX-Smoker': data.exSmoker as 0 | 1,
    FH: data.fh as 0 | 1,
    Obesity: data.obesity as 'Y' | 'N',
    CRF: data.crf as 'Y' | 'N',
    CVA: data.cva as 'Y' | 'N',
    'Airway disease': data.airwayDisease as 'Y' | 'N',
    'Thyroid Disease': data.thyroidDisease as 'Y' | 'N',
    CHF: data.chf as 'Y' | 'N',
    DLP: data.dlp as 'Y' | 'N',
    BP: Number(data.bp),
    PR: Number(data.pr),
    Edema: data.edema as 0 | 1,
    'Weak Peripheral Pulse': data.weakPeripheralPulse as 'Y' | 'N',
    'Lung rales': data.lungRales as 'Y' | 'N',
    'Systolic Murmur': data.systolicMurmur as 'Y' | 'N',
    'Diastolic Murmur': data.diastolicMurmur as 'Y' | 'N',
    'Typical Chest Pain': data.typicalChestPain as 0 | 1,
    Dyspnea: data.dyspnea as 'Y' | 'N',
    'Function Class': data.functionClass as 0 | 1 | 2 | 3,
    Atypical: data.atypical as 'Y' | 'N',
    Nonanginal: data.nonanginal as 'Y' | 'N',
    'LowTH Ang': data.lowthAng as 'Y' | 'N',
    'Q Wave': data.qWave as 0 | 1,
    'St Elevation': data.stElevation as 0 | 1,
    'St Depression': data.stDepression as 0 | 1,
    Tinversion: data.tinversion as 0 | 1,
    LVH: data.lvh as 'Y' | 'N',
    'Poor R Progression': data.poorRProgression as 'Y' | 'N',
    BBB: data.bbb as 'N' | 'LBBB' | 'RBBB',
    FBS: Number(data.fbs),
    CR: Number(data.cr),
    TG: Number(data.tg),
    LDL: Number(data.ldl),
    HDL: Number(data.hdl),
    BUN: Number(data.bun),
    ESR: Number(data.esr),
    HB: Number(data.hb),
    K: Number(data.k),
    Na: Number(data.na),
    WBC: Number(data.wbc),
    Lymph: Number(data.lymph),
    Neut: Number(data.neut),
    PLT: Number(data.plt),
    'EF-TTE': Number(data.efTte),
    'Region RWMA': data.regionRwma as 0 | 1 | 2 | 3 | 4,
    VHD: data.vhd as 'Normal' | 'Mild' | 'Moderate' | 'Severe',
  };
}
