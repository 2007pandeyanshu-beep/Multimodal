/**
 * frontend/src/api/assessmentState.ts
 * Assessment State Management & Hash Navigation Architecture for CardioVision AI Workspace.
 * Manages active assessment session persistence (sessionStorage) and 4-destination navigation.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  PredictionResponse,
  AssumedField,
  MeasuredField,
  TargetName,
  CanonicalPatientInput,
} from './types.ts';

/**
 * The four distinct workspace destinations plus the assessment input wizard.
 */
export type WorkspaceDestination =
  | 'overview'          // 1. Prediction Overview (Primary landing)
  | 'explorer'          // 2. 3D Cardiovascular Explorer
  | 'report'            // 3. Individual Assessment Report
  | 'model-review'      // 4. Model Review & Explainability
  | 'feature-explorer'  // 5. Feature Explorer / Clinical Learning Hub
  | 'assessment';       // 5-Step Patient Profile Wizard

/**
 * Data structure representing an active clinical assessment session.
 * Stored in sessionStorage to prevent accidental loss on navigation or reload,
 * while automatically expiring when the browser tab closes.
 */
export interface ActiveAssessment {
  sessionId: string;
  timestamp: string;
  isSyntheticDemo: boolean;
  demoPresetName?: string;
  predictionResponse: PredictionResponse;
  assumptions: AssumedField[];
  measuredFields: MeasuredField[];
  canonicalPayload?: CanonicalPatientInput;
}

export const ACTIVE_ASSESSMENT_KEY = 'cardiovision_active_assessment_v1';
export const ASSESSMENT_CHANGED_EVENT = 'cardiovision:assessment_changed';

/**
 * Safely parse the URL hash into a recognized workspace destination.
 * Returns null if hash is empty or points to the main landing page.
 */
export function parseHashDestination(hashString: string): WorkspaceDestination | null {
  const clean = hashString.replace(/^#\/?/, '').trim().toLowerCase();
  
  if (!clean || clean === 'landing' || clean === 'home') {
    return null;
  }
  if (clean === 'overview' || clean === 'predictions' || clean === 'workspace') {
    return 'overview';
  }
  if (clean === 'explorer' || clean === '3d-explorer' || clean === '3d' || clean === 'heart') {
    return 'explorer';
  }
  if (clean === 'report' || clean === 'assessment-report' || clean === 'dossier') {
    return 'report';
  }
  if (clean === 'model-review' || clean === 'evaluation' || clean === 'review' || clean === 'benchmarks') {
    return 'model-review';
  }
  if (
    clean === 'feature-explorer' ||
    clean === 'features' ||
    clean === 'clinical-features' ||
    clean === 'feature-hub' ||
    clean === 'feature-catalogue' ||
    clean === 'learning-hub'
  ) {
    return 'feature-explorer';
  }
  if (clean === 'assessment' || clean === 'wizard' || clean === 'start' || clean === 'inputs') {
    return 'assessment';
  }

  return null;
}

/**
 * Format a destination into a standard hash string.
 */
export function formatDestinationHash(destination: WorkspaceDestination | null): string {
  if (!destination) return '';
  switch (destination) {
    case 'overview':
      return '#overview';
    case 'explorer':
      return '#explorer';
    case 'report':
      return '#report';
    case 'model-review':
      return '#model-review';
    case 'feature-explorer':
      return '#feature-explorer';
    case 'assessment':
      return '#assessment';
  }
}

/**
 * Load the active assessment from sessionStorage.
 * Returns null if missing, invalid, or expired.
 */
export function getActiveAssessment(): ActiveAssessment | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_ASSESSMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.sessionId &&
      parsed.predictionResponse &&
      parsed.predictionResponse.predictions
    ) {
      return parsed as ActiveAssessment;
    }
  } catch {
    // Graceful fallback on parse error
  }
  return null;
}

/**
 * Persist an active assessment into sessionStorage and notify subscribers.
 */
export function saveActiveAssessment(assessment: ActiveAssessment): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(ACTIVE_ASSESSMENT_KEY, JSON.stringify(assessment));
    window.dispatchEvent(new CustomEvent(ASSESSMENT_CHANGED_EVENT, { detail: assessment }));
  } catch {
    // Handle storage quota or private-mode restrictions gracefully
  }
}

/**
 * Clear the active assessment from sessionStorage and notify subscribers.
 */
export function clearActiveAssessment(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(ACTIVE_ASSESSMENT_KEY);
    window.dispatchEvent(new CustomEvent(ASSESSMENT_CHANGED_EVENT, { detail: null }));
  } catch {
    // Handle gracefully
  }
}

/**
 * React hook to observe and update active assessment state.
 */
export function useActiveAssessment() {
  const [activeAssessment, setActiveAssessmentState] = useState<ActiveAssessment | null>(() => {
    return getActiveAssessment();
  });

  useEffect(() => {
    const handleAssessmentChange = () => {
      setActiveAssessmentState(getActiveAssessment());
    };

    window.addEventListener(ASSESSMENT_CHANGED_EVENT, handleAssessmentChange);
    window.addEventListener('storage', handleAssessmentChange);

    return () => {
      window.removeEventListener(ASSESSMENT_CHANGED_EVENT, handleAssessmentChange);
      window.removeEventListener('storage', handleAssessmentChange);
    };
  }, []);

  const setAssessment = useCallback((assessment: ActiveAssessment) => {
    saveActiveAssessment(assessment);
    setActiveAssessmentState(assessment);
  }, []);

  const clearAssessment = useCallback(() => {
    clearActiveAssessment();
    setActiveAssessmentState(null);
  }, []);

  return { activeAssessment, setAssessment, clearAssessment };
}

/**
 * React hook to synchronize state with URL hash navigation.
 */
export function useWorkspaceNavigation() {
  const [destination, setDestination] = useState<WorkspaceDestination | null>(() => {
    return typeof window !== 'undefined' ? parseHashDestination(window.location.hash) : null;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const next = parseHashDestination(window.location.hash);
      setDestination(next);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = useCallback((nextDestination: WorkspaceDestination | null) => {
    if (typeof window === 'undefined') return;
    const nextHash = formatDestinationHash(nextDestination);
    if (window.location.hash !== nextHash) {
      if (!nextHash) {
        // Return cleanly to landing page
        window.history.pushState(null, '', window.location.pathname + window.location.search);
        setDestination(null);
      } else {
        window.location.hash = nextHash;
      }
    }
  }, []);

  return { destination, navigateTo };
}
