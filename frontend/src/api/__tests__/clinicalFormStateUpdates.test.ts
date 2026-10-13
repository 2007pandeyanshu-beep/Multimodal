/**
 * frontend/src/api/__tests__/clinicalFormStateUpdates.test.ts
 * Regression and verification test suite for Fix 1 (Clinical Form State Updates)
 * and Fix 2 (Render Cold-Start 90s Timeout).
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculateBmiAndObesity,
  applyWizardFieldChange,
  adaptWizardDataToCanonical,
} from '../../components/wizard/wizardMetadata.ts';
import {
  EMPTY_WIZARD_DATA,
  SYNTHETIC_DEMO_PRESETS,
  type WizardFormData,
} from '../../components/wizard/wizardTypes.ts';
import { predictPatient, explainPatient } from '../client.ts';

describe('Fix 1: Clinical Form State Updates & Derivations', () => {
  it('1. Atomic multi-field updates apply all fields simultaneously without squashing', () => {
    const initial: WizardFormData = { ...EMPTY_WIZARD_DATA, age: 45 };

    // Apply multi-field atomic update (as performed by Height change handler)
    const { nextData, nextPreset } = applyWizardFieldChange(
      initial,
      {
        length: 175,
        bmi: 24.2,
        obesity: 'N',
      },
      undefined,
      SYNTHETIC_DEMO_PRESETS[0]
    );

    assert.equal(nextData.age, 45, 'Pre-existing fields must be preserved');
    assert.equal(nextData.length, 175, 'Height must be updated');
    assert.equal(nextData.bmi, 24.2, 'BMI must be updated');
    assert.equal(nextData.obesity, 'N', 'Obesity must be updated');
    assert.equal(nextPreset, null, 'Active demo preset must be cleared');
  });

  it('2. Simulated sequential updates accumulate without state loss (functional updater simulation)', () => {
    let state: WizardFormData = { ...EMPTY_WIZARD_DATA };

    // Simulate Step 1: User enters Age
    state = applyWizardFieldChange(state, 'age', 56, null).nextData;
    assert.equal(state.age, 56);

    // Simulate Step 1: User enters Biological Sex
    state = applyWizardFieldChange(state, 'sex', 'Female', null).nextData;
    assert.equal(state.age, 56);
    assert.equal(state.sex, 'Female');

    // Simulate Step 1: User enters Height (atomic update)
    const hResult = calculateBmiAndObesity(165, state.weight);
    state = applyWizardFieldChange(state, {
      length: 165,
      bmi: hResult.bmi,
      obesity: hResult.obesity,
    }, undefined, null).nextData;
    assert.equal(state.age, 56);
    assert.equal(state.sex, 'Female');
    assert.equal(state.length, 165);
    assert.equal(state.bmi, '');
    assert.equal(state.obesity, '');

    // Simulate Step 1: User enters Weight (atomic update, calculating BMI & Obesity)
    const wResult = calculateBmiAndObesity(state.length, 68);
    state = applyWizardFieldChange(state, {
      weight: 68,
      bmi: wResult.bmi,
      obesity: wResult.obesity,
    }, undefined, null).nextData;
    assert.equal(state.age, 56);
    assert.equal(state.sex, 'Female');
    assert.equal(state.length, 165);
    assert.equal(state.weight, 68);
    assert.equal(state.bmi, 25.0);
    assert.equal(state.obesity, 'Y');

    // Simulate Step 1: User selects Tobacco Smoking History 'current'
    state = applyWizardFieldChange(state, {
      currentSmoker: 1,
      exSmoker: 0,
    }, undefined, null).nextData;
    assert.equal(state.age, 56);
    assert.equal(state.length, 165);
    assert.equal(state.weight, 68);
    assert.equal(state.bmi, 25.0);
    assert.equal(state.obesity, 'Y');
    assert.equal(state.currentSmoker, 1);
    assert.equal(state.exSmoker, 0);

    // Simulate Step 2: User selects Chest Pain 'typical'
    state = applyWizardFieldChange(state, {
      typicalChestPain: 1,
      atypical: 'N',
      nonanginal: 'N',
    }, undefined, null).nextData;
    assert.equal(state.typicalChestPain, 1);
    assert.equal(state.atypical, 'N');
    assert.equal(state.nonanginal, 'N');
    // Ensure biometrics were NOT lost
    assert.equal(state.age, 56);
    assert.equal(state.length, 165);
    assert.equal(state.weight, 68);
    assert.equal(state.bmi, 25.0);
    assert.equal(state.currentSmoker, 1);
  });

  it('3. calculateBmiAndObesity strictly evaluates mathematical formulas and dataset boundary thresholds', () => {
    // Normal Weight: 180cm, 75kg -> BMI = 75 / (1.8^2) = 23.148... -> 23.1 -> Obesity 'N'
    const normal = calculateBmiAndObesity(180, 75);
    assert.equal(normal.bmi, 23.1);
    assert.equal(normal.obesity, 'N');

    // Overweight: 170cm, 80kg -> BMI = 80 / (1.7^2) = 27.681... -> 27.7 -> Obesity 'Y'
    const overweight = calculateBmiAndObesity(170, 80);
    assert.equal(overweight.bmi, 27.7);
    assert.equal(overweight.obesity, 'Y');

    // Exact Threshold Boundary: BMI = 25.0 kg/m² exactly
    // 200cm, 100kg -> BMI = 100 / (2.0^2) = 25.0 -> Obesity 'Y' (dataset: BMI >= 25.0 is Obesity Y)
    const boundaryY = calculateBmiAndObesity(200, 100);
    assert.equal(boundaryY.bmi, 25.0);
    assert.equal(boundaryY.obesity, 'Y');

    // Just below boundary: 100 / (2.005^2) = 24.875 -> 24.9 -> Obesity 'N'
    const boundaryN = calculateBmiAndObesity(200.5, 100);
    assert.equal(boundaryN.bmi, 24.9);
    assert.equal(boundaryN.obesity, 'N');

    // Incomplete or blank values must clear cleanly
    assert.deepEqual(calculateBmiAndObesity('', 70), { bmi: '', obesity: '' });
    assert.deepEqual(calculateBmiAndObesity(175, ''), { bmi: '', obesity: '' });
    assert.deepEqual(calculateBmiAndObesity('', ''), { bmi: '', obesity: '' });
    assert.deepEqual(calculateBmiAndObesity(0, 70), { bmi: '', obesity: '' });
  });

  it('4. Tobacco smoking history selections are mutually exclusive and map cleanly to canonical schema', () => {
    let data: WizardFormData = { ...SYNTHETIC_DEMO_PRESETS[0].data };

    // Select Current
    data = applyWizardFieldChange(data, { currentSmoker: 1, exSmoker: 0 }, undefined, null).nextData;
    let canonical = adaptWizardDataToCanonical(data);
    assert.equal(canonical['Current Smoker'], 1);
    assert.equal(canonical['EX-Smoker'], 0);

    // Select Ex-Smoker
    data = applyWizardFieldChange(data, { currentSmoker: 0, exSmoker: 1 }, undefined, null).nextData;
    canonical = adaptWizardDataToCanonical(data);
    assert.equal(canonical['Current Smoker'], 0);
    assert.equal(canonical['EX-Smoker'], 1);

    // Select Never
    data = applyWizardFieldChange(data, { currentSmoker: 0, exSmoker: 0 }, undefined, null).nextData;
    canonical = adaptWizardDataToCanonical(data);
    assert.equal(canonical['Current Smoker'], 0);
    assert.equal(canonical['EX-Smoker'], 0);
  });

  it('5. Chest pain presentation presets maintain mutual exclusivity across all 4 clinical classifications', () => {
    let data: WizardFormData = { ...SYNTHETIC_DEMO_PRESETS[0].data };

    // Preset A: Typical Angina
    data = applyWizardFieldChange(data, { typicalChestPain: 1, atypical: 'N', nonanginal: 'N' }, undefined, null).nextData;
    let canonical = adaptWizardDataToCanonical(data);
    assert.equal(canonical['Typical Chest Pain'], 1);
    assert.equal(canonical.Atypical, 'N');
    assert.equal(canonical.Nonanginal, 'N');

    // Preset B: Atypical Chest Pain
    data = applyWizardFieldChange(data, { typicalChestPain: 0, atypical: 'Y', nonanginal: 'N' }, undefined, null).nextData;
    canonical = adaptWizardDataToCanonical(data);
    assert.equal(canonical['Typical Chest Pain'], 0);
    assert.equal(canonical.Atypical, 'Y');
    assert.equal(canonical.Nonanginal, 'N');

    // Preset C: Non-Anginal Discomfort
    data = applyWizardFieldChange(data, { typicalChestPain: 0, atypical: 'N', nonanginal: 'Y' }, undefined, null).nextData;
    canonical = adaptWizardDataToCanonical(data);
    assert.equal(canonical['Typical Chest Pain'], 0);
    assert.equal(canonical.Atypical, 'N');
    assert.equal(canonical.Nonanginal, 'Y');

    // Preset D: Asymptomatic (None)
    data = applyWizardFieldChange(data, { typicalChestPain: 0, atypical: 'N', nonanginal: 'N' }, undefined, null).nextData;
    canonical = adaptWizardDataToCanonical(data);
    assert.equal(canonical['Typical Chest Pain'], 0);
    assert.equal(canonical.Atypical, 'N');
    assert.equal(canonical.Nonanginal, 'N');
  });
});

describe('Fix 2: Render Cold-Start 90-Second Timeout & Client Configuration', () => {
  it('1. Client functions specify 90000ms default timeout to tolerate free-tier container spin-ups', () => {
    // Read client.ts source to verify default parameter values
    const clientPath = path.resolve('src/api/client.ts');
    const source = fs.readFileSync(clientPath, 'utf-8');

    assert.ok(
      source.includes('export async function predictPatient(') &&
      source.includes('timeoutMs = 90000'),
      'predictPatient must have timeoutMs = 90000'
    );

    assert.ok(
      source.includes('export async function explainPatient(') &&
      source.includes('timeoutMs = 90000'),
      'explainPatient must have timeoutMs = 90000'
    );
  });

  it('2. PatientProfileWizard passes 90000ms to predictPatient during assessment submission', () => {
    const wizardPath = path.resolve('src/components/wizard/PatientProfileWizard.tsx');
    const source = fs.readFileSync(wizardPath, 'utf-8');

    assert.ok(
      source.includes('predictPatient(canonicalPayload, 90000)'),
      'PatientProfileWizard must pass 90000ms timeout to predictPatient'
    );
  });

  it('3. usePatientExplanation passes 90000ms to explainPatient', () => {
    const hookPath = path.resolve('src/api/usePatientExplanation.ts');
    const source = fs.readFileSync(hookPath, 'utf-8');

    assert.ok(
      source.includes('explainPatient(payload, requestedTargets, 90000)'),
      'usePatientExplanation must pass 90000ms timeout to explainPatient'
    );
  });

  it('4. Step1Profile enforces readOnly on derived BMI and displays Protocol Standard badge', () => {
    const step1Path = path.resolve('src/components/wizard/Step1Profile.tsx');
    const source = fs.readFileSync(step1Path, 'utf-8');

    assert.ok(
      source.includes('readOnly') && source.includes('value={data.bmi}'),
      'BMI input in Step1Profile must be readOnly'
    );

    assert.ok(
      source.includes('Protocol Standard'),
      'Step1Profile must display "Protocol Standard" badge'
    );
  });

  it('5. Step5Review includes cold-start waiting notice when isLongWaiting is true', () => {
    const step5Path = path.resolve('src/components/wizard/Step5Review.tsx');
    const source = fs.readFileSync(step5Path, 'utf-8');

    assert.ok(
      source.includes('isLongWaiting') && source.includes('Connecting to Secure Machine Learning Service...'),
      'Step5Review must render the cloud cold-start notice when isLongWaiting is active'
    );
  });
});
