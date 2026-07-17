import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/modules/auth/presentation/components/AuthLayout.jsx";
import { TextField, PasswordField } from "@/modules/auth/presentation/components/TextField.jsx";
import { Button } from "@/modules/auth/presentation/components/Button.jsx";
import { ApiEnvironmentSelect } from "@/modules/auth/presentation/components/ApiEnvironmentSelect.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { apiErrorMessage } from "@/shared/utils/api.js";
import { getStoredApiEnvironment } from "@/shared/utils/apiEnvironment.js";
import { showErrorToast, showSuccessToast } from "@/shared/utils/appToast.js";

export function RegisterScreen() {
  const { requestRegisterOtp, verifyRegisterOtp } = useAuth();
  const navigate = useNavigate();

  const [apiEnvironment, setApiEnvironment] = useState(getStoredApiEnvironment);
  const [step, setStep] = useState("details");
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
    if (submitError) setSubmitError(null);
  }

  function validateDetails() {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Name is required.";
    if (!form.email) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      next.email = "Enter a valid email.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    else if (form.phone.trim().length < 7)
      next.phone = "Enter a valid phone number.";
    if (!form.password) next.password = "Password is required.";
    else if (form.password.length < 8)
      next.password = "Use at least 8 characters.";
    if (form.confirm !== form.password)
      next.confirm = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateOtp() {
    const next = {};
    if (!code.trim()) next.code = "Enter the verification code.";
    else if (!/^\d{6}$/.test(code.trim()))
      next.code = "Enter the 6-digit code from your email.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onRequestOtp(e) {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);
    if (!validateDetails()) return;
    try {
      setSubmitting(true);
      const email = form.email.trim().toLowerCase();
      const result = await requestRegisterOtp({
        email,
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      });
      setPendingEmail(result.email ?? email);
      setCode("");
      setStep("otp");
      showSuccessToast(
        result.message || "We sent a 6-digit verification code.",
        "Check your email"
      );
    } catch (err) {
      const message = apiErrorMessage(err, "Unable to send verification code.");
      setSubmitError(message);
      showErrorToast(message, "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerifyOtp(e) {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);
    if (!validateOtp()) return;
    try {
      setSubmitting(true);
      const result = await verifyRegisterOtp({
        email: pendingEmail,
        code: code.trim(),
      });
      setSuccess(
        result?.message ||
          "Registration successful. Your account is pending role assignment by an administrator."
      );
      showSuccessToast(
        result?.message ||
          "Your account is pending role assignment by an administrator.",
        "Account created"
      );
      setTimeout(() => navigate("/login", { replace: true, state: { email: pendingEmail } }), 1800);
    } catch (err) {
      const message = apiErrorMessage(err, "Unable to verify code.");
      setSubmitError(message);
      showErrorToast(message, "Verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResendOtp() {
    setSubmitError(null);
    try {
      setSubmitting(true);
      const result = await requestRegisterOtp({
        email: pendingEmail || form.email.trim().toLowerCase(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      });
      showSuccessToast(
        result.message || "We sent a new verification code.",
        "Check your email"
      );
    } catch (err) {
      const message = apiErrorMessage(err, "Unable to resend verification code.");
      setSubmitError(message);
      showErrorToast(message, "Resend failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      theme="dark"
      side="right"
      badge={null}
      title="Start your journey"
      description="Join our platform to streamline your workflow and boost productivity."
      footerNote="Enterprise account registration."
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#e8eef7]">
          {step === "details" ? "Register" : "Verify email"}
        </h2>
        <p className="mt-1 text-sm text-[#94a3b8]">
          {step === "details"
            ? "Create a new account"
            : `Enter the code sent to ${pendingEmail}`}
        </p>
      </div>

      {step === "details" ? (
        <form onSubmit={onRequestOtp} className="space-y-4" noValidate>
          <ApiEnvironmentSelect
            value={apiEnvironment}
            onChange={setApiEnvironment}
            tone="dark"
          />

          <TextField
            tone="dark"
            label="Full name"
            autoComplete="name"
            placeholder="Jane Doe"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            error={errors.fullName}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              tone="dark"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              error={errors.email}
            />
            <TextField
              tone="dark"
              label="Phone number"
              type="tel"
              autoComplete="tel"
              placeholder="+1 555 000 0000"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              error={errors.phone}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PasswordField
              tone="dark"
              label="Password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              error={errors.password}
            />
            <PasswordField
              tone="dark"
              label="Confirm"
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={form.confirm}
              onChange={(e) => update("confirm", e.target.value)}
              error={errors.confirm}
            />
          </div>

          {submitError && (
            <div className="auth-dark__error">{submitError}</div>
          )}

          <Button type="submit" tone="dark" loading={submitting}>
            {submitting ? "Sending code…" : "Send verification code"}
          </Button>

          <p className="pt-2 text-center text-sm text-[#94a3b8]">
            Have an account?{" "}
            <Link to="/login" className="auth-dark__link">
              Log in
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={onVerifyOtp} className="space-y-4" noValidate>
          <TextField
            tone="dark"
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              if (errors.code) setErrors((prev) => ({ ...prev, code: null }));
              if (submitError) setSubmitError(null);
            }}
            error={errors.code}
          />

          {submitError && (
            <div className="auth-dark__error">{submitError}</div>
          )}
          {success && (
            <div className="auth-dark__success">{success}</div>
          )}

          <Button type="submit" tone="dark" loading={submitting}>
            {submitting ? "Verifying…" : "Verify and create account"}
          </Button>

          <p className="pt-2 text-center text-sm text-[#94a3b8]">
            <button
              type="button"
              className="auth-dark__link"
              disabled={submitting}
              onClick={() => void onResendOtp()}
            >
              Resend code
            </button>
            {" · "}
            <button
              type="button"
              className="auth-dark__link"
              onClick={() => {
                setStep("details");
                setCode("");
                setSubmitError(null);
                setSuccess(null);
              }}
            >
              Back to details
            </button>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
