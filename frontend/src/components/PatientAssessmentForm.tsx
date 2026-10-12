/**
 * frontend/src/components/PatientAssessmentForm.tsx
 * Entry point for patient assessment, hosting the Apple Health Minimal 5-Step Patient Profile Workspace.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import { CardioVisionWorkspace } from './workspace/CardioVisionWorkspace.tsx';
import { PatientProfileWizard } from './wizard/PatientProfileWizard.tsx';

// Retained for backward-compatibility with featureAdapter.ts and tests
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

export const DEFAULT_FORM_DATA: PatientFormData = {
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

interface PatientAssessmentFormProps {
  onClose?: () => void;
}

export const PatientAssessmentForm: React.FC<PatientAssessmentFormProps> = ({ onClose }) => {
  return <CardioVisionWorkspace onClose={onClose || (() => {})} />;
};
