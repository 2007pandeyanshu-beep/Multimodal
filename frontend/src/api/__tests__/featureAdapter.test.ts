/**
 * frontend/src/api/__tests__/featureAdapter.test.ts
 * Unit tests for verified feature adapter and clinical mapping logic.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptPatientFormData,
  CANONICAL_FEATURE_LIST,
  FORBIDDEN_FEATURES,
  COHORT_BASELINE_DEFAULTS,
} from '../featureAdapter.ts';
import type { PatientFormData } from '../../components/PatientAssessmentForm.tsx';

const samplePatientData: PatientFormData = {
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

describe('Clinical Feature Adapter Test Suite', () => {
  test('1. Exact 54 canonical feature count verification', () => {
    assert.strictEqual(
      CANONICAL_FEATURE_LIST.length,
      54,
      'Canonical list must contain exactly 54 features'
    );
  });

  test('2. No target columns or forbidden features in canonical list', () => {
    for (const forbidden of FORBIDDEN_FEATURES) {
      assert.strictEqual(
        (CANONICAL_FEATURE_LIST as readonly string[]).includes(forbidden),
        false,
        `Forbidden feature ${forbidden} must not be in canonical input list`
      );
    }
  });

  test('3. Strict mode detects and lists all unmeasured fields without guessing', () => {
    const result = adaptPatientFormData(samplePatientData, { allowCohortDefaults: false });
    assert.strictEqual(result.success, false, 'Strict mode must fail when unmeasured fields exist');
    assert.strictEqual(result.payload, null, 'Payload must be null on failure');
    assert.ok(result.missingFields.length > 0, 'Missing fields list must be populated');
    // Confirms missing physical, laboratory, and echocardiography fields
    const missingKeys = result.missingFields.map((f) => f.canonicalField);
    assert.ok(missingKeys.includes('Length'), 'Length should be reported missing');
    assert.ok(missingKeys.includes('CR'), 'Serum Creatinine should be reported missing');
    assert.ok(missingKeys.includes('WBC'), 'WBC count should be reported missing');
    assert.ok(missingKeys.includes('Region RWMA'), 'Region RWMA should be reported missing');
  });

  test('4. Cohort baseline mode generates valid 54-feature payload', () => {
    const result = adaptPatientFormData(samplePatientData, { allowCohortDefaults: true });
    assert.strictEqual(result.success, true, 'Adapter should succeed in cohort baseline mode');
    assert.ok(result.payload !== null, 'Payload must not be null');

    const keys = Object.keys(result.payload!);
    assert.strictEqual(keys.length, 54, 'Outgoing payload must contain exactly 54 keys');

    // Confirm all 54 canonical features are present
    for (const canonical of CANONICAL_FEATURE_LIST) {
      assert.ok(canonical in result.payload!, `Feature ${canonical} must be present in payload`);
    }

    // Confirm no forbidden keys are in payload
    for (const forbidden of FORBIDDEN_FEATURES) {
      assert.strictEqual(
        forbidden in (result.payload! as unknown as Record<string, unknown>),
        false,
        `Forbidden feature ${forbidden} must not be in payload`
      );
    }
  });

  test('5. Correct categorical and numerical conversions', () => {
    const patientHighRisk: PatientFormData = {
      ...samplePatientData,
      sex: 'Female',
      bmi: 31.5,
      smoking: 'current',
      diabetes: 'yes',
      hypertension: 'yes',
      familyHistory: 'yes',
      chestPainType: 'typical',
      stElevation: 'yes',
      stDepression: 1.8, // >= 1.0 mm -> binary 1
      restingECG: 'lvh',
    };

    const result = adaptPatientFormData(patientHighRisk, { allowCohortDefaults: true });
    assert.strictEqual(result.success, true);
    const p = result.payload!;

    assert.strictEqual(p.Sex, 'Female');
    assert.strictEqual(p.BMI, 31.5);
    assert.strictEqual(p.Obesity, 'Y', 'BMI >= 25.0 must map to Obesity Y');
    assert.strictEqual(p['Current Smoker'], 1);
    assert.strictEqual(p['EX-Smoker'], 0);
    assert.strictEqual(p.DM, 1);
    assert.strictEqual(p.HTN, 1);
    assert.strictEqual(p.FH, 1);
    assert.strictEqual(p['Typical Chest Pain'], 1);
    assert.strictEqual(p.Atypical, 'N');
    assert.strictEqual(p.Nonanginal, 'N');
    assert.strictEqual(p['St Elevation'], 1);
    assert.strictEqual(p['St Depression'], 1, 'ST depression >= 1.0mm must map to binary flag 1');
    assert.strictEqual(p.LVH, 'Y');
  });

  test('6. Rejects out-of-range clinical inputs', () => {
    const invalidPatient: PatientFormData = {
      ...samplePatientData,
      age: 150, // Invalid age > 120
      restingBP: 300, // Invalid BP > 250
    };

    const result = adaptPatientFormData(invalidPatient);
    assert.strictEqual(result.success, false);
    assert.ok('Age' in result.errors, 'Should flag invalid age');
    assert.ok('BP' in result.errors, 'Should flag invalid BP');
  });
});
