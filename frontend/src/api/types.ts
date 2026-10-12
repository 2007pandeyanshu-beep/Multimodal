/**
 * frontend/src/api/types.ts
 * Strict TypeScript types for the 54-feature canonical patient schema,
 * FastAPI request/response contracts, and adapter validation results.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

// Canonical 54-feature patient schema matching backend/schemas.py (PatientInput)
export interface CanonicalPatientInput {
  // 1. Demographics & Physical Measurements (5 features)
  Age: number; // 18 - 120
  Weight: number; // 20.0 - 300.0 kg
  Length: number; // 100.0 - 250.0 cm (Height)
  Sex: 'Female' | 'Male';
  BMI: number; // 10.0 - 80.0 kg/m^2

  // 2. Medical History & Lifestyle (12 features)
  DM: 0 | 1; // Diabetes Mellitus
  HTN: 0 | 1; // Hypertension
  'Current Smoker': 0 | 1;
  'EX-Smoker': 0 | 1;
  FH: 0 | 1; // Family History of CAD
  Obesity: 'Y' | 'N';
  CRF: 'Y' | 'N'; // Chronic Renal Failure
  CVA: 'Y' | 'N'; // Cerebrovascular Accident
  'Airway disease': 'Y' | 'N';
  'Thyroid Disease': 'Y' | 'N';
  CHF: 'Y' | 'N'; // Congestive Heart Failure
  DLP: 'Y' | 'N'; // Dyslipidemia

  // 3. Vital Signs & Physical Examination (7 features)
  BP: number; // Systolic Blood Pressure (50.0 - 250.0 mmHg)
  PR: number; // Pulse Rate (30.0 - 220.0 bpm)
  Edema: 0 | 1;
  'Weak Peripheral Pulse': 'Y' | 'N';
  'Lung rales': 'Y' | 'N';
  'Systolic Murmur': 'Y' | 'N';
  'Diastolic Murmur': 'Y' | 'N';

  // 4. Symptoms & Clinical Status (6 features)
  'Typical Chest Pain': 0 | 1;
  Dyspnea: 'Y' | 'N';
  'Function Class': 0 | 1 | 2 | 3; // NYHA class
  Atypical: 'Y' | 'N';
  Nonanginal: 'Y' | 'N';
  'LowTH Ang': 'Y' | 'N'; // Low threshold angina

  // 5. Electrocardiography (7 features)
  'Q Wave': 0 | 1;
  'St Elevation': 0 | 1;
  'St Depression': 0 | 1;
  Tinversion: 0 | 1;
  LVH: 'Y' | 'N'; // Left Ventricular Hypertrophy
  'Poor R Progression': 'Y' | 'N';
  BBB: 'N' | 'LBBB' | 'RBBB';

  // 6. Laboratory Blood Panels (14 features)
  FBS: number; // Fasting Blood Sugar (20.0 - 800.0 mg/dL)
  CR: number; // Serum Creatinine (0.1 - 15.0 mg/dL)
  TG: number; // Triglycerides (10.0 - 2000.0 mg/dL)
  LDL: number; // LDL Cholesterol (5.0 - 500.0 mg/dL)
  HDL: number; // HDL Cholesterol (5.0 - 200.0 mg/dL)
  BUN: number; // Blood Urea Nitrogen (1.0 - 150.0 mg/dL)
  ESR: number; // Erythrocyte Sedimentation Rate (0.0 - 150.0 mm/hr)
  HB: number; // Hemoglobin (3.0 - 25.0 g/dL)
  K: number; // Potassium (1.0 - 10.0 mEq/L)
  Na: number; // Sodium (90.0 - 180.0 mEq/L)
  WBC: number; // White Blood Cells (500.0 - 50000.0 cells/mcL)
  Lymph: number; // Lymphocyte percentage (0.0 - 100.0 %)
  Neut: number; // Neutrophil percentage (0.0 - 100.0 %)
  PLT: number; // Platelets (5.0 - 1500.0 10^3/mcL)

  // 7. Echocardiography (3 features)
  'EF-TTE': number; // Ejection Fraction (5.0 - 90.0 %)
  'Region RWMA': 0 | 1 | 2 | 3 | 4; // Regional Wall Motion Abnormality
  VHD: 'Normal' | 'Mild' | 'Moderate' | 'Severe'; // Valvular Heart Disease
}

export type TargetName = 'Cath' | 'LAD' | 'LCX' | 'RCA';

export interface TargetPrediction {
  target: TargetName;
  predicted_class: 0 | 1;
  predicted_label: string; // 'CAD' | 'Normal' | 'Stenotic'
  probability: number; // Calibrated positive-class probability in [0.0, 1.0]
}

export interface PredictionResponse {
  predictions: Record<TargetName, TargetPrediction>;
  disclaimer: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  models_loaded: Record<TargetName, boolean>;
  all_models_ready: boolean;
  version: string;
}

export interface MetadataResponse {
  project: string;
  version: string;
  prototype_disclaimer: string;
  targets: Record<
    TargetName,
    {
      description: string;
      positive_label: string;
      negative_label: string;
    }
  >;
  total_input_features: number;
  numerical_features: string[];
  categorical_features: string[];
  forbidden_features: string[];
  model_type: string;
  validation_methodology: string;
}

// Global SHAP Explainability Interfaces (Phase 4.2)
export interface GlobalFeatureImportance {
  rank: number;
  feature_name: string;
  mean_absolute_shap: number; // Fraction in probability space [0.0, 1.0]
}

export interface TargetGlobalShap {
  target: TargetName;
  cohort_name: string;
  sample_size: number;
  calculation_method: string;
  output_space: string;
  top_features: GlobalFeatureImportance[];
}

export interface GlobalShapResponse {
  targets: Record<TargetName, TargetGlobalShap>;
  cohort_name: string;
  sample_size: number;
  calculation_method: string;
  disclaimer: string;
}

// Patient-Specific Local SHAP Interfaces (Phase 4.3)
export interface FeatureAttribution {
  feature_name: string;
  submitted_value: unknown;
  contribution: number; // Signed SHAP contribution in probability units (fraction [-1.0, 1.0])
}

export interface TargetExplanation {
  target: TargetName;
  predicted_probability: number;
  predicted_class: number;
  predicted_label: string;
  base_value: number; // Model-specific SHAP baseline in probability units [0.0, 1.0]
  attributions: FeatureAttribution[];
  sum_attributions: number;
  reconstructed_probability: number;
  additivity_discrepancy: number;
  output_space: string;
  disclaimer: string;
}

export interface ExplainResponse {
  explanations: Record<TargetName, TargetExplanation>;
  disclaimer: string;
}

export interface ExplainRequest {
  patient: CanonicalPatientInput;
  targets?: TargetName[];
}

export interface ApiError {
  status: number;
  message: string;
  detail?: unknown;
  type:
    | 'validation' // 422 Unprocessable Entity
    | 'server' // 500 Internal Server Error
    | 'unavailable' // 503 Models not loaded
    | 'not_found' // 404 Route not found
    | 'timeout' // Request aborted by timeout
    | 'network' // Network error / connection refused
    | 'unknown';
}

export interface UnresolvedField {
  canonicalField: string;
  category: string;
  description: string;
  whyCannotInfer: string;
}

export interface AssumedField {
  canonicalField: string;
  assumedValue: unknown;
  category: string;
  source: string;
  rationale: string;
}

export interface MeasuredField {
  canonicalField: string;
  sourceFormField: string;
  value: unknown;
}

export interface AdaptationResult {
  success: boolean;
  payload: CanonicalPatientInput | null;
  errors: Record<string, string>;
  missingFields: UnresolvedField[];
  assumedDefaultsUsed?: AssumedField[];
  measuredFieldsProvided: MeasuredField[];
}
