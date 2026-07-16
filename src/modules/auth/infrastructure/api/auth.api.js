import { api } from "@/shared/utils/api.js";
import { User } from "@/modules/auth/domain/entities/user.entity.js";
import {
  AuthError,
  InvalidCredentialsError,
  ValidationError,
} from "@/modules/auth/domain/errors.js";

function toDomainError(err) {
  const status = err?.response?.status;
  const message =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Something went wrong.";

  if (status === 401) return new InvalidCredentialsError(message);
  if (status === 403) return new AuthError(message, { status });
  if (status === 400) return new ValidationError(message);
  return new AuthError(message, { status });
}

export async function loginRequest({ email, password }) {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    return {
      token: data.token,
      user: User.fromApi(data.user),
      message: data.message,
    };
  } catch (err) {
    throw toDomainError(err);
  }
}

export async function registerRequest({ email, password, fullName, phone }) {
  try {
    const payload = { email, password, phone };
    if (fullName) payload.fullName = fullName;
    const { data } = await api.post("/auth/register", payload);
    if (data?.success === false) {
      throw new ValidationError(data.error || data.message || "Unable to create account.");
    }
    return {
      user: User.fromApi(data.data),
      message: data.message,
    };
  } catch (err) {
    throw toDomainError(err);
  }
}

export async function fetchMeRequest() {
  try {
    const { data } = await api.get("/auth/me");
    return User.fromApi(data.data);
  } catch (err) {
    throw toDomainError(err);
  }
}

export async function updateProfileRequest(body) {
  try {
    const { data } = await api.patch("/auth/me", body);
    return User.fromApi(data.data);
  } catch (err) {
    throw toDomainError(err);
  }
}

export async function changePasswordRequest(body) {
  try {
    const { data } = await api.patch("/auth/me/password", body);
    return data.message ?? "Password updated.";
  } catch (err) {
    throw toDomainError(err);
  }
}

export async function verifyOpsElevationRequest({ scope, pin }) {
  try {
    const { data } = await api.post("/auth/ops-elevation/verify", { scope, pin });
    return { token: data.data.token, scope: data.data.scope };
  } catch (err) {
    throw toDomainError(err);
  }
}

export async function requestRegisterOtpRequest({ email, password, fullName, phone }) {
  try {
    const payload = { email, password, phone };
    if (fullName) payload.fullName = fullName;
    const { data } = await api.post("/auth/register/request-otp", payload);
    return {
      message: data.message,
      email: data.data?.email ?? email,
    };
  } catch (err) {
    throw toDomainError(err);
  }
}

export async function verifyRegisterOtpRequest({ email, code }) {
  try {
    const { data } = await api.post("/auth/register/verify-otp", { email, code });
    return {
      user: data.data ? User.fromApi(data.data) : null,
      message: data.message,
    };
  } catch (err) {
    throw toDomainError(err);
  }
}

export async function requestForgotPasswordOtpRequest({ email }) {
  try {
    const { data } = await api.post("/auth/forgot-password/request-otp", { email });
    return {
      message: data.message,
      email: data.data?.email ?? email,
    };
  } catch (err) {
    throw toDomainError(err);
  }
}

export async function verifyForgotPasswordOtpRequest({ email, code, newPassword }) {
  try {
    const { data } = await api.post("/auth/forgot-password/verify-otp", {
      email,
      code,
      newPassword,
    });
    return { message: data.message ?? "Password updated." };
  } catch (err) {
    throw toDomainError(err);
  }
}
