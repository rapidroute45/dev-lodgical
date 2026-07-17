import {
  loginRequest,
  registerRequest,
  requestRegisterOtpRequest,
  verifyRegisterOtpRequest,
  fetchMeRequest,
} from "@/modules/auth/infrastructure/api/auth.api.js";
import { tokenStorage } from "@/shared/utils/storage.js";
import { opsElevationStorage } from "@/modules/auth/application/opsElevationStorage.js";
import {
  getAccountBlockedMessage,
  isAccountLoginAllowed,
} from "@/modules/auth/utils/accountAccess.js";
import { AuthError } from "@/modules/auth/domain/errors.js";

/** Application use-cases (framework-agnostic). */
export const authService = {
  async login({ email, password }) {
    const result = await loginRequest({ email, password });
    if (!isAccountLoginAllowed(result.user)) {
      tokenStorage.clear();
      throw new AuthError(getAccountBlockedMessage(result.user), { status: 403 });
    }
    if (result.token) tokenStorage.set(result.token);
    return result;
  },

  async register({ email, password, fullName, phone }) {
    return registerRequest({ email, password, fullName, phone });
  },

  async requestRegisterOtp({ email, password, fullName, phone }) {
    return requestRegisterOtpRequest({ email, password, fullName, phone });
  },

  async verifyRegisterOtp({ email, code }) {
    return verifyRegisterOtpRequest({ email, code });
  },

  async fetchCurrentUser() {
    return fetchMeRequest();
  },

  logout() {
    tokenStorage.clear();
    opsElevationStorage.clear();
  },

  hasToken() {
    return !!tokenStorage.get();
  },
};
