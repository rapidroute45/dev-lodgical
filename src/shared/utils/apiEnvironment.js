import { AppStorage } from "./storage.js";

export const API_ENV_STORAGE_KEY = "dispatch_api_environment";
export const DISPATCH_DB_ENV_HEADER = "X-Dispatch-Environment";

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN?.trim() ||
  "https://dev-co-production.up.railway.app";

const SHARED_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? "/api/v1" : `${API_ORIGIN}/api/v1`);

const SHARED_SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.trim() ||
  (import.meta.env.DEV ? "" : API_ORIGIN);

const SHARED_UPLOADS_BASE_URL =
  import.meta.env.VITE_UPLOADS_BASE_URL?.trim() ||
  import.meta.env.VITE_S3_PUBLIC_BASE_URL?.trim() ||
  (import.meta.env.DEV ? "" : API_ORIGIN);

/** Same API host for both — backend picks test vs prod DB from X-Dispatch-Environment. */
export const API_ENVIRONMENTS = {
  test: {
    key: "test",
    label: "Test",
    hint: "Test database",
    apiBaseUrl: SHARED_API_BASE_URL,
    socketUrl: SHARED_SOCKET_URL,
    uploadsBaseUrl: SHARED_UPLOADS_BASE_URL,
  },
  prod: {
    key: "prod",
    label: "Production",
    hint: "Production database",
    apiBaseUrl: SHARED_API_BASE_URL,
    socketUrl: SHARED_SOCKET_URL,
    uploadsBaseUrl: SHARED_UPLOADS_BASE_URL,
  },
};

/**
 * Locked to production DB for now.
 * To restore the Test/Prod picker: reinstate storage-backed selection below and
 * re-enable <ApiEnvironmentSelect /> on auth screens.
 */
const FORCED_API_ENVIRONMENT = "prod";

export function getDefaultApiEnvironment() {
  // return import.meta.env.PROD ? "prod" : "test";
  return FORCED_API_ENVIRONMENT;
}

export function getStoredApiEnvironment() {
  // Previous behavior (restore when re-enabling the picker):
  // const stored = AppStorage.getItem(API_ENV_STORAGE_KEY);
  // if (stored === "prod" || stored === "test") return stored;
  // return getDefaultApiEnvironment();
  return FORCED_API_ENVIRONMENT;
}

export function setStoredApiEnvironment(environment) {
  // Locked to prod — ignore picker changes until the dropdown is restored.
  // if (environment !== "prod" && environment !== "test") return;
  // AppStorage.setItem(API_ENV_STORAGE_KEY, environment);
  void environment;
  AppStorage.setItem(API_ENV_STORAGE_KEY, FORCED_API_ENVIRONMENT);
}

export function getActiveApiEnvironmentConfig(environment = getStoredApiEnvironment()) {
  return API_ENVIRONMENTS[environment] ?? API_ENVIRONMENTS.prod;
}

export function listApiEnvironments() {
  return [API_ENVIRONMENTS.test, API_ENVIRONMENTS.prod];
}

export function getDispatchDbEnvHeaderValue(_environment = getStoredApiEnvironment()) {
  // return environment === "prod" ? "prod" : "test";
  return FORCED_API_ENVIRONMENT;
}
