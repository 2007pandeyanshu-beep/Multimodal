/**
 * frontend/src/api/client.ts
 * Robust, typed HTTP client for CardioVision FastAPI Inference Service.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import type {
  CanonicalPatientInput,
  PredictionResponse,
  HealthResponse,
  MetadataResponse,
  GlobalShapResponse,
  ExplainResponse,
  TargetName,
  ApiError,
} from './types.ts';

/**
 * Resolves the backend base URL dynamically from Vite environment variables.
 * Falls back to localhost:8000 for standard local development.
 */
export function getApiBaseUrl(): string {
  // Support Vite environment variable VITE_API_BASE_URL
  const envUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_API_BASE_URL
      : undefined;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    // Strip trailing slashes
    return envUrl.trim().replace(/\/+$/, '');
  }

  return 'http://localhost:8000';
}

/**
 * Normalizes HTTP or network exceptions into structured, actionable ApiError objects.
 */
function normalizeError(err: unknown, status = 0, defaultMsg = 'An unexpected error occurred'): ApiError {
  if (err && typeof err === 'object' && 'type' in err && 'message' in err) {
    return err as ApiError;
  }

  if (err instanceof DOMException && err.name === 'AbortError') {
    return {
      status: 408,
      message: 'Request timed out while communicating with the machine learning service.',
      type: 'timeout',
    };
  }

  if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
    return {
      status: 0,
      message:
        'Network error: Failed to connect to the backend service. Ensure Uvicorn is running on port 8000.',
      type: 'network',
    };
  }

  return {
    status,
    message: err instanceof Error ? err.message : defaultMsg,
    type: status === 422 ? 'validation' : status === 503 ? 'unavailable' : status === 404 ? 'not_found' : 'unknown',
  };
}

/**
 * Submits a canonical 54-feature patient payload to POST /predict.
 */
export async function predictPatient(
  payload: CanonicalPatientInput,
  timeoutMs = 8000
): Promise<PredictionResponse> {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/predict`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      if (response.status === 422) {
        const errorDetail =
          errorBody && typeof errorBody === 'object' && 'errors' in errorBody
            ? (errorBody as { errors: unknown }).errors
            : errorBody;

        throw {
          status: 422,
          message: 'The model rejected the patient feature vector due to validation constraints.',
          detail: errorDetail,
          type: 'validation',
        } as ApiError;
      }

      if (response.status === 503) {
        throw {
          status: 503,
          message: 'Machine learning inference models are currently uninitialized or degraded.',
          detail: errorBody,
          type: 'unavailable',
        } as ApiError;
      }

      if (response.status === 404) {
        throw {
          status: 404,
          message: `Endpoint ${endpoint} was not found on the backend server.`,
          detail: errorBody,
          type: 'not_found',
        } as ApiError;
      }

      throw {
        status: response.status,
        message: `Backend returned error code ${response.status}.`,
        detail: errorBody,
        type: 'server',
      } as ApiError;
    }

    const data = (await response.json()) as PredictionResponse;

    // Validate that response contains expected prediction keys
    if (!data.predictions || !data.predictions.Cath || !data.predictions.LAD) {
      throw {
        status: 200,
        message: 'Backend returned an unexpected or malformed prediction structure.',
        detail: data,
        type: 'server',
      } as ApiError;
    }

    return data;
  } catch (err) {
    clearTimeout(timer);
    throw normalizeError(err);
  }
}

/**
 * Checks backend health status via GET /health.
 */
export async function checkBackendHealth(timeoutMs = 3000): Promise<HealthResponse> {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/health`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw {
        status: response.status,
        message: `Health check failed with status ${response.status}.`,
        type: 'server',
      } as ApiError;
    }

    return (await response.json()) as HealthResponse;
  } catch (err) {
    clearTimeout(timer);
    throw normalizeError(err);
  }
}

/**
 * Fetches clinical metadata schema specifications via GET /metadata.
 */
export async function fetchMetadata(timeoutMs = 3000): Promise<MetadataResponse> {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/metadata`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw {
        status: response.status,
        message: `Metadata request failed with status ${response.status}.`,
        type: 'server',
      } as ApiError;
    }

    return (await response.json()) as MetadataResponse;
  } catch (err) {
    clearTimeout(timer);
    throw normalizeError(err);
  }
}

/**
 * Fetches cohort-level global SHAP feature importance summary via GET /explain/global.
 */
export async function fetchGlobalShapSummary(timeoutMs = 5000): Promise<GlobalShapResponse> {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/explain/global`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw {
        status: response.status,
        message: `Global SHAP explainability request failed with status ${response.status}.`,
        type: 'server',
      } as ApiError;
    }

    return (await response.json()) as GlobalShapResponse;
  } catch (err) {
    clearTimeout(timer);
    throw normalizeError(err);
  }
}

/**
 * Requests patient-specific TreeSHAP explanations via POST /predict/explain.
 */
export async function explainPatient(
  payload: CanonicalPatientInput,
  targets?: TargetName[],
  timeoutMs = 10000
): Promise<ExplainResponse> {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/predict/explain`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestBody: { patient: CanonicalPatientInput; targets?: TargetName[] } = {
      patient: payload,
    };
    if (targets && targets.length > 0) {
      requestBody.targets = targets;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      if (response.status === 422) {
        throw {
          status: 422,
          message: 'The patient record contains invalid values or missing parameters.',
          detail: errorBody,
          type: 'validation',
        } as ApiError;
      }

      if (response.status === 503) {
        throw {
          status: 503,
          message: 'Machine learning explainers are not initialized or still warming up.',
          type: 'unavailable',
        } as ApiError;
      }

      throw {
        status: response.status,
        message: `Explanation service request failed with HTTP ${response.status}.`,
        detail: errorBody,
        type: 'server',
      } as ApiError;
    }

    return (await response.json()) as ExplainResponse;
  } catch (err) {
    clearTimeout(timer);
    throw normalizeError(err);
  }
}
