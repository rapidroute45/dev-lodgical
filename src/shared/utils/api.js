import axios from "axios";
import { INITIAL_API_CONFIG } from "./constants.js";
import {
  DISPATCH_DB_ENV_HEADER,
  getActiveApiEnvironmentConfig,
  getDispatchDbEnvHeaderValue,
  getStoredApiEnvironment,
  setStoredApiEnvironment,
} from "./apiEnvironment.js";
import { tokenStorage } from "./storage.js";
import {
  opsElevationStorage,
  pickElevationTokenForRequest,
} from "@/modules/auth/application/opsElevationStorage.js";
import { queryClient } from "@/app/queryClient.js";

export const api = axios.create({
  baseURL: INITIAL_API_CONFIG.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/** Switch test/prod database (same API host; backend reads X-Dispatch-Environment). */
export function applyApiEnvironment(environment, { clearSession = true } = {}) {
  const config = getActiveApiEnvironmentConfig(environment);
  setStoredApiEnvironment(environment);
  api.defaults.baseURL = config.apiBaseUrl;
  if (clearSession) {
    tokenStorage.clear();
    opsElevationStorage.clear();
    queryClient.clear();
  }
  return config;
}

applyApiEnvironment(getStoredApiEnvironment(), { clearSession: false });

api.interceptors.request.use((config) => {
  config.headers[DISPATCH_DB_ENV_HEADER] = getDispatchDbEnvHeaderValue();
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const elevToken = pickElevationTokenForRequest(config.method, config.url);
  if (elevToken) {
    config.headers["X-Ops-Elevation"] = elevToken;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      tokenStorage.clear();
      opsElevationStorage.clear();
    }

    const data = error?.response?.data;
    const apiMessage =
      (typeof data?.error === "string" && data.error.trim()) ||
      (typeof data?.message === "string" && data.message.trim()) ||
      null;

    if (apiMessage) {
      error.message = apiMessage;
    }

    if (import.meta.env.DEV) {
      const method = error?.config?.method?.toUpperCase() ?? "?";
      const url = error?.config?.url ?? "?";
      const status = error?.response?.status ?? "network";
      console.warn(`[API ${status}] ${method} ${url}`, apiMessage ?? error.message);
    }

    return Promise.reject(error);
  }
);

/** User-facing message from an axios or generic error. */
export function apiErrorMessage(err, fallback = "Request failed") {
  if (typeof err?.message === "string" && err.message.trim()) return err.message.trim();
  return fallback;
}
