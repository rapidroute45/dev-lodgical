import {
  loginRequest,
  registerRequest,
  fetchMeRequest,
} from "@/modules/auth/infrastructure/api/auth.api.js";
import { tokenStorage } from "@/shared/utils/storage.js";

/** Application use-cases (framework-agnostic). */
export const authService = {
  async login({ email, password }) {
    const result = await loginRequest({ email, password });
    if (result.token) tokenStorage.set(result.token);
    return result;
  },

  async register({ email, password, fullName, phone }) {
    return registerRequest({ email, password, fullName, phone });
  },

  async fetchCurrentUser() {
    return fetchMeRequest();
  },

  logout() {
    tokenStorage.clear();
  },

  hasToken() {
    return !!tokenStorage.get();
  },
};
