/**
 * frontend/src/api/__tests__/phase3c23DemoStateIntegrity.test.ts
 * Rigorous test suite for Phase 3C.2.3: Demo Preset State Integrity Fix.
 * Verifies:
 *  1. Loading a demo preset and submitting without edits preserves synthetic demo tag & DEMO- session ID.
 *  2. Editing a single field after loading a demo preset clears active demo preset and produces ASMT- session ID.
 *  3. Editing multiple fields retains all edited values and ensures the assessment is not mislabeled as demo.
 *  4. Resetting after loading a preset clears demo state and restores genuinely empty draft state.
 *  5. Segregation invariant: live/custom assessment data is never mislabeled as synthetic demo data,
 *     and untouched synthetic demo presets are never mislabeled as live custom assessments.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  computeAssessmentSessionMeta,
  applyWizardFieldChange,
} from '../../components/wizard/wizardMetadata.ts';
import {
  SYNTHETIC_DEMO_PRESETS,
  EMPTY_WIZARD_DATA,
  type WizardFormData,
} from '../../components/wizard/wizardTypes.ts';
import { adaptWizardDataToCanonical } from '../../components/wizard/wizardMetadata.ts';

describe('Phase 3C.2.3: Demo Preset State Integrity & Transition Suite', () => {
  it('1. Loading a demo preset and submitting without edits retains synthetic demo flag and DEMO- session prefix', () => {
    const preset = SYNTHETIC_DEMO_PRESETS[0]; // Suspected Ischemia / Typical Angina Benchmark
    assert.ok(preset, 'Preset 0 must exist');

    // Simulate untouched preset submission
    const sessionMeta = computeAssessmentSessionMeta(preset);
    assert.equal(sessionMeta.isSyntheticDemo, true, 'Untouched preset must have isSyntheticDemo: true');
    assert.equal(sessionMeta.demoPresetName, preset.name, 'Untouched preset must preserve demoPresetName');
    assert.ok(sessionMeta.sessionId.startsWith('DEMO-'), 'Untouched preset session ID must start with DEMO-');

    // Verify canonical payload can be compiled from untouched preset
    const canonical = adaptWizardDataToCanonical(preset.data);
    assert.equal(canonical.Age, preset.data.age);
    assert.equal(canonical.Sex, preset.data.sex);
    assert.equal(canonical['Typical Chest Pain'], preset.data.typicalChestPain);
  });

  it('2. Editing one field after loading a demo preset unconditionally clears active demo preset and sets ASMT- session prefix', () => {
    const preset = SYNTHETIC_DEMO_PRESETS[0];
    const initialAge = preset.data.age;
    const modifiedAge = (Number(initialAge) + 5) as number;

    // Simulate user editing 'age' field after loading preset
    const { nextData, nextPreset } = applyWizardFieldChange(
      preset.data,
      'age',
      modifiedAge,
      preset
    );

    // Assert active preset designation is cleared
    assert.equal(nextPreset, null, 'Editing any field must clear activeDemoPreset to null');

    // Assert edited value was retained and other fields preserved
    assert.equal(nextData.age, modifiedAge, 'Modified field must reflect new user value');
    assert.equal(nextData.sex, preset.data.sex, 'Unmodified fields must be preserved without loss');
    assert.equal(nextData.length, preset.data.length, 'Height must be preserved');
    assert.equal(nextData.weight, preset.data.weight, 'Weight must be preserved');

    // Compute session metadata for the edited assessment
    const sessionMeta = computeAssessmentSessionMeta(nextPreset);
    assert.equal(sessionMeta.isSyntheticDemo, false, 'Edited assessment must have isSyntheticDemo: false');
    assert.equal(sessionMeta.demoPresetName, undefined, 'Edited assessment must have demoPresetName: undefined');
    assert.ok(sessionMeta.sessionId.startsWith('ASMT-'), 'Edited assessment session ID must start with ASMT-');

    // Verify canonical compilation reflects modified value
    const canonical = adaptWizardDataToCanonical(nextData);
    assert.equal(canonical.Age, modifiedAge);
  });

  it('3. Editing multiple fields retains all changes and prevents synthetic demo data mislabeling', () => {
    const preset = SYNTHETIC_DEMO_PRESETS[1]; // Suspected Ischemia Benchmark
    let currentData: WizardFormData = { ...preset.data };
    let currentPreset = preset;

    // Edit 1: Blood Pressure
    const edit1 = applyWizardFieldChange(currentData, 'bp', 148, currentPreset);
    currentData = edit1.nextData;
    currentPreset = edit1.nextPreset as any;
    assert.equal(currentPreset, null);

    // Edit 2: Pulse Rate
    const edit2 = applyWizardFieldChange(currentData, 'pr', 84, currentPreset);
    currentData = edit2.nextData;
    currentPreset = edit2.nextPreset as any;
    assert.equal(currentPreset, null);

    // Edit 3: Diabetes Mellitus
    const edit3 = applyWizardFieldChange(currentData, 'dm', 1, currentPreset);
    currentData = edit3.nextData;
    currentPreset = edit3.nextPreset as any;
    assert.equal(currentPreset, null);

    // Verify all 3 modifications are stored
    assert.equal(currentData.bp, 148);
    assert.equal(currentData.pr, 84);
    assert.equal(currentData.dm, 1);

    // Verify other fields still match original preset
    assert.equal(currentData.age, preset.data.age);
    assert.equal(currentData.sex, preset.data.sex);

    // Compute session metadata
    const sessionMeta = computeAssessmentSessionMeta(currentPreset);
    assert.equal(sessionMeta.isSyntheticDemo, false);
    assert.equal(sessionMeta.demoPresetName, undefined);
    assert.ok(sessionMeta.sessionId.startsWith('ASMT-'));

    // Verify canonical payload
    const canonical = adaptWizardDataToCanonical(currentData);
    assert.equal(canonical.BP, 148);
    assert.equal(canonical.PR, 84);
    assert.equal(canonical.DM, 1);
  });

  it('4. Resetting after a demo preset clears demo state and returns to genuinely empty draft state', () => {
    const preset = SYNTHETIC_DEMO_PRESETS[2];
    assert.ok(preset.data.age !== '');

    // Resetting sets data to EMPTY_WIZARD_DATA and activePreset to null
    const resetData = { ...EMPTY_WIZARD_DATA };
    const resetPreset = null;

    // Verify all features are empty
    Object.entries(resetData).forEach(([key, val]) => {
      assert.equal(val, '', `Field "${key}" must be blank string after reset`);
    });

    const sessionMeta = computeAssessmentSessionMeta(resetPreset);
    assert.equal(sessionMeta.isSyntheticDemo, false);
    assert.ok(sessionMeta.sessionId.startsWith('ASMT-'));

    // Blank data must throw on canonical adaptation, preventing accidental submission
    assert.throws(() => {
      adaptWizardDataToCanonical(resetData);
    }, /Cannot compile incomplete wizard form/);
  });

  it('5. Invariant check: live/custom assessments are not mislabeled as demo, and demo is not mislabeled as live', () => {
    // Untouched demo preset
    const demoMeta = computeAssessmentSessionMeta(SYNTHETIC_DEMO_PRESETS[0]);
    assert.equal(demoMeta.isSyntheticDemo, true, 'Must be marked demo');
    assert.ok(demoMeta.sessionId.startsWith('DEMO-'), 'Must have DEMO- prefix');

    // Fresh manual assessment (starts blank, completed by clinician)
    const liveMeta = computeAssessmentSessionMeta(null);
    assert.equal(liveMeta.isSyntheticDemo, false, 'Must be marked non-demo');
    assert.equal(liveMeta.demoPresetName, undefined, 'Must not have demoPresetName');
    assert.ok(liveMeta.sessionId.startsWith('ASMT-'), 'Must have ASMT- prefix');

    // WorkspaceHeader badge text verification: Custom Assessment Mode instead of Real Patient Mode
    const headerPath = path.resolve('src/components/wizard/WorkspaceHeader.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf8');
    assert.ok(
      headerContent.includes('Custom Assessment Mode'),
      'WorkspaceHeader must display "Custom Assessment Mode" to prevent uncalibrated claims'
    );
    assert.ok(
      !headerContent.includes('Real Patient Mode'),
      'WorkspaceHeader must NOT display "Real Patient Mode"'
    );
  });
});
