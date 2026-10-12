/**
 * frontend/src/api/presentationUtils.ts
 * Clinical Presentation Utilities and Target Metadata
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import type {
  TargetName,
  TargetPrediction,
  PredictionResponse,
  AssumedField,
  MeasuredField,
} from './types.ts';

export interface FormattedProbability {
  percentage: number;
  formatted: string;
  isValid: boolean;
}

/**
 * Accurately formats a raw statistical probability into a display percentage.
 * Clamps strictly within [0.0, 1.0] and handles null/NaN/undefined defensively.
 */
export function formatProbability(prob: number | undefined | null): FormattedProbability {
  if (typeof prob !== 'number' || Number.isNaN(prob) || !Number.isFinite(prob)) {
    return {
      percentage: 0,
      formatted: '--%',
      isValid: false,
    };
  }
  const clamped = Math.min(1.0, Math.max(0.0, prob));
  const pct = Math.round(clamped * 1000) / 10;
  return {
    percentage: pct,
    formatted: `${pct.toFixed(1)}%`,
    isValid: true,
  };
}

export interface TargetMetadataItem {
  name: string;
  anatomy: string;
  perfusionTerritory: string;
  clinicalCriterion: string;
  positiveLabel: string;
  negativeLabel: string;
}

export const TARGET_METADATA: Record<TargetName, TargetMetadataItem> = {
  Cath: {
    name: 'Cath (Angiographic CAD)',
    anatomy: 'Coronary Arterial Tree',
    perfusionTerritory: 'Global coronary vascular circulation',
    clinicalCriterion: 'Angiographically confirmed CAD (≥50% diameter reduction in ≥1 vessel)',
    positiveLabel: 'CAD',
    negativeLabel: 'Normal',
  },
  LAD: {
    name: 'LAD (Left Anterior Descending)',
    anatomy: 'Anterior Interventricular Artery',
    perfusionTerritory: 'Anterior left ventricular wall & anterior 2/3 of interventricular septum',
    clinicalCriterion: 'Significant luminal stenosis (≥50% diameter reduction)',
    positiveLabel: 'Stenotic',
    negativeLabel: 'Normal',
  },
  LCX: {
    name: 'LCX (Left Circumflex)',
    anatomy: 'Circumflex Branch of Left Coronary Artery',
    perfusionTerritory: 'Lateral & posterolateral left ventricular free wall',
    clinicalCriterion: 'Significant luminal stenosis (≥50% diameter reduction)',
    positiveLabel: 'Stenotic',
    negativeLabel: 'Normal',
  },
  RCA: {
    name: 'RCA (Right Coronary Artery)',
    anatomy: 'Right Main Coronary Artery',
    perfusionTerritory: 'Right ventricle, inferior wall & posterior 1/3 of interventricular septum',
    clinicalCriterion: 'Significant luminal stenosis (≥50% diameter reduction)',
    positiveLabel: 'Stenotic',
    negativeLabel: 'Normal',
  },
};

export interface ProcessedTargetCard {
  target: TargetName;
  name: string;
  perfusionTerritory: string;
  clinicalCriterion: string;
  predictedClass: 0 | 1;
  predictedLabel: string;
  probability: FormattedProbability;
  isPositive: boolean;
  isPrimary: boolean;
}

/**
 * Validates and transforms a PredictionResponse into structured presentation cards.
 * Returns null if the response is missing or malformed.
 */
export function buildTargetPresentationCards(
  response: PredictionResponse | null
): ProcessedTargetCard[] | null {
  if (!response || !response.predictions) {
    return null;
  }

  const targets: TargetName[] = ['Cath', 'LAD', 'LCX', 'RCA'];
  const cards: ProcessedTargetCard[] = [];

  for (const target of targets) {
    const raw = response.predictions[target];
    const meta = TARGET_METADATA[target];
    if (!raw) {
      continue;
    }

    const prob = formatProbability(raw.probability);
    cards.push({
      target,
      name: meta.name,
      perfusionTerritory: meta.perfusionTerritory,
      clinicalCriterion: meta.clinicalCriterion,
      predictedClass: raw.predicted_class,
      predictedLabel: raw.predicted_label,
      probability: prob,
      isPositive: raw.predicted_class === 1,
      isPrimary: target === 'Cath',
    });
  }

  return cards;
}

/**
 * Verifies that clinical provenance segregation properly partitions
 * measured patient inputs from assumed cohort baseline defaults.
 */
export function verifyProvenanceSegregation(
  assumedDefaults: AssumedField[],
  measuredFields: MeasuredField[]
): {
  assumedCount: number;
  measuredCount: number;
  overlapDetected: boolean;
  overlappingFields: string[];
} {
  const assumedSet = new Set(assumedDefaults.map((a) => a.canonicalField));
  const overlapping: string[] = [];

  for (const m of measuredFields) {
    if (assumedSet.has(m.canonicalField)) {
      overlapping.push(m.canonicalField);
    }
  }

  return {
    assumedCount: assumedDefaults.length,
    measuredCount: measuredFields.length,
    overlapDetected: overlapping.length > 0,
    overlappingFields: overlapping,
  };
}
