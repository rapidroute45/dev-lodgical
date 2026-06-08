import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthLayout } from "@/modules/auth/presentation/components/AuthLayout.jsx";
import { TextField, PasswordField } from "@/modules/auth/presentation/components/TextField.jsx";
import { Button } from "@/modules/auth/presentation/components/Button.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { postLoginPath } from "@/shared/utils/postLoginPath.js";

export function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }

  function validate() {
    const next = {};
    if (!form.email) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      next.email = "Enter a valid email.";
    if (!form.password) next.password = "Password is required.";
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
      setSubmitError(err.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      side="left"
      title="Welcome back"
      description="Sign in to access your account and manage your workspace securely."
      footerNote="Standard secure login."
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-dispatch-text">Login</h2>
        <p className="mt-1 text-sm text-dispatch-muted">Access your account</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors.email}
        />

        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          error={errors.password}
        />

        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-dispatch-red">
            {submitError}
          </div>
        )}

        <Button type="submit" loading={submitting}>
          {submitting ? "Signing in..." : "Sign In"}
        </Button>

        <p className="pt-2 text-center text-sm text-dispatch-muted">
          New here?{" "}
          <Link
            to="/register"
            className="font-medium text-dispatch-indigo transition hover:text-dispatch-indigo-pressed"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
