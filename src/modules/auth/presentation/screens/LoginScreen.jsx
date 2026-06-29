import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthLayout } from "@/modules/auth/presentation/components/AuthLayout.jsx";
import { TextField, PasswordField } from "@/modules/auth/presentation/components/TextField.jsx";
import { Button } from "@/modules/auth/presentation/components/Button.jsx";
import { ApiEnvironmentSelect } from "@/modules/auth/presentation/components/ApiEnvironmentSelect.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { postLoginPath } from "@/shared/utils/postLoginPath.js";
import { getStoredApiEnvironment } from "@/shared/utils/apiEnvironment.js";

export function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiEnvironment, setApiEnvironment] = useState(getStoredApiEnvironment);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }

  function validate() {
    const next = {};
    if (!form.email) next.email = t("auth.emailRequired");
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      next.email = t("auth.emailInvalid");
    if (!form.password) next.password = t("auth.passwordRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    try {
      setSubmitting(true);
      const loggedIn = await login({ email: form.email.trim(), password: form.password });
      navigate(redirectTo || postLoginPath(loggedIn?.role), { replace: true });
    } catch (err) {
      setSubmitError(err.message || t("auth.signInFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      theme="dark"
      side="left"
      badge="Dispatch.co"
      title={t("auth.welcomeBack")}
      description={t("auth.loginDescription")}
      footerNote={t("auth.secureLogin")}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#e8eef7]">{t("auth.login")}</h2>
        <p className="mt-1 text-sm text-[#94a3b8]">{t("auth.accessAccount")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <ApiEnvironmentSelect value={apiEnvironment} onChange={setApiEnvironment} tone="dark" />

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

        <PasswordField
          tone="dark"
          label={t("auth.password")}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          error={errors.password}
        />

        {submitError && (
          <div className="auth-dark__error">{submitError}</div>
        )}

        <Button type="submit" tone="dark" loading={submitting}>
          {submitting ? t("auth.signingIn") : t("auth.signIn")}
        </Button>

        <p className="pt-2 text-center text-sm text-[#94a3b8]">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="auth-dark__link">
            {t("auth.register")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
