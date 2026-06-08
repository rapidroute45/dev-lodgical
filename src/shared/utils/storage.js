import { CONFIG } from "./constants.js";

/**
 * Browser session storage (mirrors mobile AppStorage / expo-secure-store pattern).
 */
export const AppStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const tokenStorage = {
  get() {
    return AppStorage.getItem(CONFIG.TOKEN_STORAGE_KEY);
  },
  set(token) {
    AppStorage.setItem(CONFIG.TOKEN_STORAGE_KEY, token);
  },
  clear() {
    AppStorage.removeItem(CONFIG.TOKEN_STORAGE_KEY);
  },
};
