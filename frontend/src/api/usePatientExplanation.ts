/**
 * frontend/src/api/usePatientExplanation.ts
 * In-memory lifecycle hook for patient-specific TreeSHAP explanations.
 * Binds explanations strictly to active assessment identity and canonical payload.
 * Prevents race conditions, stale asynchronous responses, and long-term storage leakage.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActiveAssessment } from './assessmentState.ts';
import type { ExplainResponse, TargetName, CanonicalPatientInput } from './types.ts';
import { explainPatient } from './client.ts';
import { adaptWizardDataToCanonical } from '../components/wizard/wizardMetadata.ts';
import type { WizardFormData } from '../components/wizard/wizardTypes.ts';

// In-memory cache keyed strictly by sessionId. NOT persisted to long-term storage (localStorage).
const explanationMemoryCache = new Map<string, ExplainResponse>();

export interface UsePatientExplanationReturn {
  explanation: ExplainResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Resolves the canonical 54-feature payload from an active assessment,
 * using the explicit canonicalPayload or gracefully deriving from measuredFields.
 */
export function resolveCanonicalPayload(assessment: ActiveAssessment | null): CanonicalPatientInput | null {
  if (!assessment) return null;
  if (assessment.canonicalPayload) return assessment.canonicalPayload;

  if (assessment.measuredFields && assessment.measuredFields.length > 0) {
    const rawMap: Record<string, unknown> = {};
    for (const f of assessment.measuredFields) {
      rawMap[f.sourceFormField || f.canonicalField] = f.value;
    }
    try {
      return adaptWizardDataToCanonical(rawMap as unknown as WizardFormData);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Manages fetching, caching, race condition prevention, and state lifecycle
 * for patient-specific TreeSHAP explanations.
 */
export function usePatientExplanation(
  activeAssessment: ActiveAssessment | null,
  requestedTargets: TargetName[] = ['Cath', 'LAD', 'LCX', 'RCA']
): UsePatientExplanationReturn {
  const [explanation, setExplanation] = useState<ExplainResponse | null>(() => {
    if (!activeAssessment || !activeAssessment.sessionId) return null;
    return explanationMemoryCache.get(activeAssessment.sessionId) || null;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Track the current active session ID to prevent out-of-order race conditions
  const currentSessionIdRef = useRef<string | null>(activeAssessment?.sessionId || null);
  currentSessionIdRef.current = activeAssessment?.sessionId || null;

  const fetchExplanation = useCallback(async () => {
    if (!activeAssessment || !activeAssessment.sessionId) {
      setExplanation(null);
      setLoading(false);
      setError(null);
      return;
    }

    const payload = resolveCanonicalPayload(activeAssessment);
    if (!payload) {
      setExplanation(null);
      setLoading(false);
      setError('Patient feature parameters are incomplete or unavailable for explanation generation.');
      return;
    }

    const sessId = activeAssessment.sessionId;

    // Check in-memory cache first
    const cached = explanationMemoryCache.get(sessId);
    if (cached) {
      setExplanation(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await explainPatient(payload, requestedTargets, 10000);

      // Guard against race conditions: only update if session has not changed
      if (currentSessionIdRef.current === sessId) {
        explanationMemoryCache.set(sessId, result);
        setExplanation(result);
        setError(null);
      }
    } catch (err: unknown) {
      if (currentSessionIdRef.current === sessId) {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to retrieve patient-specific TreeSHAP attributions.';
        setError(msg);
        setExplanation(null);
      }
    } finally {
      if (currentSessionIdRef.current === sessId) {
        setLoading(false);
      }
    }
  }, [activeAssessment, requestedTargets]);

  useEffect(() => {
    // Invalidate state immediately if no assessment exists
    if (!activeAssessment || !activeAssessment.sessionId) {
      setExplanation(null);
      setLoading(false);
      setError(null);
      return;
    }

    fetchExplanation();
  }, [activeAssessment?.sessionId, fetchExplanation]);

  return {
    explanation,
    loading,
    error,
    refetch: fetchExplanation,
  };
}

/**
 * Manually evict all cached explanations from memory (e.g., on assessment reset).
 */
export function clearExplanationMemoryCache(): void {
  explanationMemoryCache.clear();
}
