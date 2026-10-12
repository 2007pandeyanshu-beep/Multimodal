/**
 * frontend/src/api/__tests__/client.test.ts
 * Integration tests for API client with live FastAPI backend on port 8000.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getApiBaseUrl,
  predictPatient,
  checkBackendHealth,
  fetchMetadata,
} from '../client.ts';
import { adaptPatientFormData } from '../featureAdapter.ts';
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

describe('API Client Live Integration Suite', () => {
  test('1. Resolves default API base URL', () => {
    const url = getApiBaseUrl();
    assert.ok(url.startsWith('http'), 'Base URL must start with http');
    assert.strictEqual(url, 'http://localhost:8000');
  });

  test('2. Live /health endpoint check', async () => {
    const health = await checkBackendHealth();
    assert.strictEqual(health.status, 'healthy');
    assert.strictEqual(health.all_models_ready, true);
    assert.strictEqual(health.models_loaded.Cath, true);
    assert.strictEqual(health.models_loaded.LAD, true);
    assert.strictEqual(health.models_loaded.LCX, true);
    assert.strictEqual(health.models_loaded.RCA, true);
  });

  test('3. Live /metadata endpoint check', async () => {
    const meta = await fetchMetadata();
    assert.strictEqual(meta.total_input_features, 54);
    assert.ok('Cath' in meta.targets);
    assert.ok('LAD' in meta.targets);
    assert.ok('LCX' in meta.targets);
    assert.ok('RCA' in meta.targets);
  });

  test('4. Live /predict endpoint with adapted 54-feature payload', async () => {
    const adapted = adaptPatientFormData(samplePatientData, { allowCohortDefaults: true });
    assert.strictEqual(adapted.success, true);
    assert.ok(adapted.payload !== null);

    const prediction = await predictPatient(adapted.payload!);
    assert.ok(prediction.predictions);
    assert.ok(prediction.disclaimer);

    // Validate Cath prediction
    const cath = prediction.predictions.Cath;
    assert.strictEqual(cath.target, 'Cath');
    assert.ok([0, 1].includes(cath.predicted_class));
    assert.ok(['CAD', 'Normal'].includes(cath.predicted_label));
    assert.ok(cath.probability >= 0.0 && cath.probability <= 1.0);

    // Validate LAD prediction
    const lad = prediction.predictions.LAD;
    assert.strictEqual(lad.target, 'LAD');
    assert.ok([0, 1].includes(lad.predicted_class));
    assert.ok(['Stenotic', 'Normal'].includes(lad.predicted_label));
    assert.ok(lad.probability >= 0.0 && lad.probability <= 1.0);

    // Validate LCX prediction
    const lcx = prediction.predictions.LCX;
    assert.strictEqual(lcx.target, 'LCX');
    assert.ok([0, 1].includes(lcx.predicted_class));
    assert.ok(['Stenotic', 'Normal'].includes(lcx.predicted_label));
    assert.ok(lcx.probability >= 0.0 && lcx.probability <= 1.0);

    // Validate RCA prediction
    const rca = prediction.predictions.RCA;
    assert.strictEqual(rca.target, 'RCA');
    assert.ok([0, 1].includes(rca.predicted_class));
    assert.ok(['Stenotic', 'Normal'].includes(rca.predicted_label));
    assert.ok(rca.probability >= 0.0 && rca.probability <= 1.0);
  });

  test('5. Rejects malformed payload with HTTP 422 validation error', async () => {
    const malformedPayload = { Age: 54 } as any; // Missing 53 required features
    try {
      await predictPatient(malformedPayload);
      assert.fail('Expected prediction to throw a validation error');
    } catch (err: any) {
      assert.strictEqual(err.status, 422);
      assert.strictEqual(err.type, 'validation');
    }
  });
});
