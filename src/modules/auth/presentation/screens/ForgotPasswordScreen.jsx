import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthLayout } from "@/modules/auth/presentation/components/AuthLayout.jsx";
import { TextField, PasswordField } from "@/modules/auth/presentation/components/TextField.jsx";
import { Button } from "@/modules/auth/presentation/components/Button.jsx";
import { ApiEnvironmentSelect } from "@/modules/auth/presentation/components/ApiEnvironmentSelect.jsx";
import {
  requestForgotPasswordOtpRequest,
  verifyForgotPasswordOtpRequest,
} from "@/modules/auth/infrastructure/api/auth.api.js";
import { apiErrorMessage } from "@/shared/utils/api.js";
import { getStoredApiEnvironment } from "@/shared/utils/apiEnvironment.js";
import { showErrorToast, showSuccessToast } from "@/shared/utils/appToast.js";

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [apiEnvironment, setApiEnvironment] = useState(getStoredApiEnvironment);
  const [step, setStep] = useState("email");
  const [pendingEmail, setPendingEmail] = useState("");
  const [form, setForm] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
    if (submitError) setSubmitError(null);
  }

  function validateEmailStep() {
    const next = {};
    if (!form.email) next.email = t("auth.emailRequired");
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t("auth.emailInvalid");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateResetStep() {
    const next = {};
    if (!form.code.trim()) next.code = t("auth.otpRequired");
    else if (!/^\d{6}$/.test(form.code.trim())) next.code = t("auth.otpInvalid");
    if (!form.newPassword) next.newPassword = t("auth.passwordRequired");
    else if (form.newPassword.length < 8) next.newPassword = t("auth.passwordMinLength");
    if (form.confirmPassword !== form.newPassword) {
      next.confirmPassword = t("auth.passwordsDoNotMatch");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onRequestOtp(e) {
    e.preventDefault();
    setSubmitError(null);
    if (!validateEmailStep()) return;
    try {
      setSubmitting(true);
      const email = form.email.trim().toLowerCase();
      const result = await requestForgotPasswordOtpRequest({ email });
      setPendingEmail(result.email ?? email);
      setStep("reset");
      setForm((prev) => ({ ...prev, code: "", newPassword: "", confirmPassword: "" }));
      showSuccessToast(
        result.message || t("auth.forgotPasswordOtpSent"),
        t("auth.checkYourEmail")
      );
    } catch (err) {
      const message = apiErrorMessage(err, t("auth.forgotPasswordOtpFailed"));
      setSubmitError(message);
      showErrorToast(message, t("auth.forgotPasswordTitle"));
    } finally {
      setSubmitting(false);
    }
  }

  async function onResetPassword(e) {
    e.preventDefault();
    setSubmitError(null);
    if (!validateResetStep()) return;
    try {
      setSubmitting(true);
      const result = await verifyForgotPasswordOtpRequest({
        email: pendingEmail,
        code: form.code.trim(),
        newPassword: form.newPassword,
      });
      showSuccessToast(
        result.message || t("auth.passwordUpdated"),
        t("auth.forgotPasswordTitle")
      );
      navigate("/login", { replace: true, state: { email: pendingEmail } });
    } catch (err) {
      const message = apiErrorMessage(err, t("auth.forgotPasswordResetFailed"));
      setSubmitError(message);
      showErrorToast(message, t("auth.forgotPasswordTitle"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      theme="dark"
      side="left"
      badge={null}
      title={t("auth.forgotPasswordHeroTitle")}
      description={t("auth.forgotPasswordHeroDescription")}
      footerNote={t("auth.forgotPasswordFooter")}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#e8eef7]">
          {step === "email" ? t("auth.forgotPasswordTitle") : t("auth.verifyAndReset")}
        </h2>
        <p className="mt-1 text-sm text-[#94a3b8]">
          {step === "email"
            ? t("auth.forgotPasswordSubtitle")
            : t("auth.forgotPasswordResetSubtitle", { email: pendingEmail })}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={onRequestOtp} className="space-y-4" noValidate>
          <ApiEnvironmentSelect
            value={apiEnvironment}
            onChange={setApiEnvironment}
            tone="dark"
          />

          <TextField
            tone="dark"
            label={t("auth.email")}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
          />

          {submitError && <div className="auth-dark__error">{submitError}</div>}

          <Button type="submit" tone="dark" loading={submitting}>
            {submitting ? t("auth.sendingCode") : t("auth.sendVerificationCode")}
          </Button>

          <p className="pt-2 text-center text-sm text-[#94a3b8]">
            {t("auth.rememberedPassword")}{" "}
            <Link to="/login" className="auth-dark__link">
              {t("auth.signIn")}
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={onResetPassword} className="space-y-4" noValidate>
          <TextField
            tone="dark"
            label={t("auth.verificationCode")}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            maxLength={6}
            value={form.code}
            onChange={(e) => update("code", e.target.value.replace(/\D/g, ""))}
            error={errors.code}
          />

          <PasswordField
            tone="dark"
            label={t("auth.newPassword")}
            autoComplete="new-password"
            placeholder={t("auth.passwordMinPlaceholder")}
            value={form.newPassword}
            onChange={(e) => update("newPassword", e.target.value)}
            error={errors.newPassword}
          />

          <PasswordField
            tone="dark"
            label={t("auth.confirmPassword")}
            autoComplete="new-password"
            placeholder={t("auth.confirmPasswordPlaceholder")}
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
          />

          {submitError && <div className="auth-dark__error">{submitError}</div>}

          <Button type="submit" tone="dark" loading={submitting}>
            {submitting ? t("auth.resettingPassword") : t("auth.resetPassword")}
          </Button>

          <p className="pt-2 text-center text-sm text-[#94a3b8]">
            <button
              type="button"
              className="auth-dark__link"
              onClick={() => {
                setStep("email");
                setSubmitError(null);
                setForm((prev) => ({ ...prev, code: "", newPassword: "", confirmPassword: "" }));
              }}
            >
              {t("auth.useDifferentEmail")}
            </button>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
