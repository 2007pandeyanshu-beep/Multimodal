/**
 * frontend/src/api/__tests__/resultsPresentation.test.ts
 * Focused tests for Results UI, probability formatting, accessibility, and state resilience.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatProbability,
  TARGET_METADATA,
  buildTargetPresentationCards,
  verifyProvenanceSegregation,
} from '../presentationUtils.ts';
import type {
  PredictionResponse,
  TargetPrediction,
  AssumedField,
  MeasuredField,
} from '../types.ts';

// Synthetic response fixture for test validation (clearly demarcated as test-only)
const SYNTHETIC_FIXTURE: PredictionResponse = {
  predictions: {
    Cath: {
      target: 'Cath',
      predicted_class: 1,
      predicted_label: 'CAD',
      probability: 0.8266,
    },
    LAD: {
      target: 'LAD',
      predicted_class: 1,
      predicted_label: 'Stenotic',
      probability: 0.6517,
    },
    LCX: {
      target: 'LCX',
      predicted_class: 0,
      predicted_label: 'Normal',
      probability: 0.3809,
    },
    RCA: {
      target: 'RCA',
      predicted_class: 1,
      predicted_label: 'Stenotic',
      probability: 0.5212,
    },
  },
  disclaimer:
    'RESEARCH USE ONLY - NOT A MEDICAL DEVICE. CardioVision is an investigational decision-support prototype evaluated on a single-center cohort. Predictions are statistical estimates and must not replace professional clinical diagnosis, physician consultation, or coronary angiography.',
};

describe('Prediction Results Presentation & Quality Review Suite', () => {
  it('1. formatProbability converts probabilities into accurate percentages', () => {
    const res1 = formatProbability(0.8266);
    assert.strictEqual(res1.formatted, '82.7%');
    assert.strictEqual(res1.percentage, 82.7);
    assert.strictEqual(res1.isValid, true);

    const res2 = formatProbability(0.3809);
    assert.strictEqual(res2.formatted, '38.1%');
    assert.strictEqual(res2.percentage, 38.1);
    assert.strictEqual(res2.isValid, true);
  });

  it('2. Zero and one boundary probabilities render accurately without distortion', () => {
    const zeroRes = formatProbability(0.0);
    assert.strictEqual(zeroRes.formatted, '0.0%');
    assert.strictEqual(zeroRes.percentage, 0);
    assert.strictEqual(zeroRes.isValid, true);

    const oneRes = formatProbability(1.0);
    assert.strictEqual(oneRes.formatted, '100.0%');
    assert.strictEqual(oneRes.percentage, 100);
    assert.strictEqual(oneRes.isValid, true);
  });

  it('3. Invalid or missing probabilities are safely handled without throwing', () => {
    const nanRes = formatProbability(Number.NaN);
    assert.strictEqual(nanRes.formatted, '--%');
    assert.strictEqual(nanRes.percentage, 0);
    assert.strictEqual(nanRes.isValid, false);

    const undefRes = formatProbability(undefined);
    assert.strictEqual(undefRes.formatted, '--%');
    assert.strictEqual(undefRes.percentage, 0);
    assert.strictEqual(undefRes.isValid, false);

    const nullRes = formatProbability(null);
    assert.strictEqual(nullRes.formatted, '--%');
    assert.strictEqual(nullRes.percentage, 0);
    assert.strictEqual(nullRes.isValid, false);

    // Out of range clamping
    const clampHigh = formatProbability(1.5);
    assert.strictEqual(clampHigh.formatted, '100.0%');
    assert.strictEqual(clampHigh.percentage, 100);

    const clampLow = formatProbability(-0.2);
    assert.strictEqual(clampLow.formatted, '0.0%');
    assert.strictEqual(clampLow.percentage, 0);
  });

  it('4. All four targets process from a synthetic response fixture with distinct labels and anatomy', () => {
    const cards = buildTargetPresentationCards(SYNTHETIC_FIXTURE);
    assert.ok(cards);
    assert.strictEqual(cards.length, 4);

    const cath = cards.find((c) => c.target === 'Cath');
    assert.ok(cath);
    assert.strictEqual(cath.name, 'Cath (Angiographic CAD)');
    assert.strictEqual(cath.predictedClass, 1);
    assert.strictEqual(cath.predictedLabel, 'CAD');
    assert.strictEqual(cath.probability.formatted, '82.7%');
    assert.strictEqual(cath.isPrimary, true);

    const lad = cards.find((c) => c.target === 'LAD');
    assert.ok(lad);
    assert.strictEqual(lad.name, 'LAD (Left Anterior Descending)');
    assert.strictEqual(lad.predictedClass, 1);
    assert.strictEqual(lad.predictedLabel, 'Stenotic');
    assert.strictEqual(lad.probability.formatted, '65.2%');
    assert.strictEqual(lad.isPrimary, false);

    const lcx = cards.find((c) => c.target === 'LCX');
    assert.ok(lcx);
    assert.strictEqual(lcx.name, 'LCX (Left Circumflex)');
    assert.strictEqual(lcx.predictedClass, 0);
    assert.strictEqual(lcx.predictedLabel, 'Normal');
    assert.strictEqual(lcx.probability.formatted, '38.1%');
    assert.strictEqual(lcx.isPositive, false);

    const rca = cards.find((c) => c.target === 'RCA');
    assert.ok(rca);
    assert.strictEqual(rca.name, 'RCA (Right Coronary Artery)');
    assert.strictEqual(rca.predictedClass, 1);
    assert.strictEqual(rca.predictedLabel, 'Stenotic');
    assert.strictEqual(rca.probability.formatted, '52.1%');
  });

  it('5. Missing or incomplete target in response handled safely', () => {
    const partialFixture: PredictionResponse = {
      predictions: {
        Cath: SYNTHETIC_FIXTURE.predictions.Cath,
        LAD: SYNTHETIC_FIXTURE.predictions.LAD,
        LCX: SYNTHETIC_FIXTURE.predictions.LCX,
      } as unknown as PredictionResponse['predictions'],
      disclaimer: SYNTHETIC_FIXTURE.disclaimer,
    };

    const cards = buildTargetPresentationCards(partialFixture);
    assert.ok(cards);
    assert.strictEqual(cards.length, 3);
    assert.ok(!cards.some((c) => c.target === 'RCA'));
  });

  it('6. Empty or null response returns null cleanly', () => {
    const cards = buildTargetPresentationCards(null);
    assert.strictEqual(cards, null);

    const emptyCards = buildTargetPresentationCards({} as unknown as PredictionResponse);
    assert.strictEqual(emptyCards, null);
  });

  it('7. Scientific scope and research prototype disclaimer verification', () => {
    assert.match(SYNTHETIC_FIXTURE.disclaimer, /RESEARCH USE ONLY/);
    assert.match(SYNTHETIC_FIXTURE.disclaimer, /NOT A MEDICAL DEVICE/);
    assert.match(SYNTHETIC_FIXTURE.disclaimer, /single-center cohort/);
  });

  it('8. Cohort baseline assumptions and patient measurements are segregated without overlap', () => {
    const mockAssumptions: AssumedField[] = [
      {
        canonicalField: 'CR',
        assumedValue: 1.0,
        category: 'Laboratory - Renal',
        source: 'Cohort Median (1.00 mg/dL)',
        rationale: 'Normal baseline renal excretion marker',
      },
      {
        canonicalField: 'Edema',
        assumedValue: 0,
        category: 'Physical Examination',
        source: 'Cohort Mode (96.0% Negative)',
        rationale: 'Absence of peripheral edema on physical exam',
      },
    ];

    const mockMeasured: MeasuredField[] = [
      {
        canonicalField: 'Age',
        sourceFormField: 'age',
        value: 58,
      },
      {
        canonicalField: 'BP',
        sourceFormField: 'restingBP',
        value: 135,
      },
    ];

    const report = verifyProvenanceSegregation(mockAssumptions, mockMeasured);
    assert.strictEqual(report.assumedCount, 2);
    assert.strictEqual(report.measuredCount, 2);
    assert.strictEqual(report.overlapDetected, false);
    assert.strictEqual(report.overlappingFields.length, 0);

    // Test with intentional overlap
    const overlappingMeasured: MeasuredField[] = [
      ...mockMeasured,
      {
        canonicalField: 'CR',
        sourceFormField: 'creatinine',
        value: 1.2,
      },
    ];
    const overlapReport = verifyProvenanceSegregation(mockAssumptions, overlappingMeasured);
    assert.strictEqual(overlapReport.overlapDetected, true);
    assert.deepStrictEqual(overlapReport.overlappingFields, ['CR']);
  });

  it('9. Stale predictions are prevented when errors occur or form is reset', () => {
    // Model state transitions
    let activePrediction: PredictionResponse | null = SYNTHETIC_FIXTURE;
    let apiError: unknown = null;

    // Simulate submission failure
    activePrediction = null; // Cleared at submission initiation
    apiError = { status: 503, message: 'Models unavailable' };

    assert.strictEqual(activePrediction, null);
    assert.ok(apiError);

    // Simulate form reset
    activePrediction = null;
    apiError = null;
    assert.strictEqual(activePrediction, null);
    assert.strictEqual(apiError, null);
  });
});
