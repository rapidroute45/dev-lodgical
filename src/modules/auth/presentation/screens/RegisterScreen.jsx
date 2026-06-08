import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/modules/auth/presentation/components/AuthLayout.jsx";
import { TextField, PasswordField } from "@/modules/auth/presentation/components/TextField.jsx";
import { Button } from "@/modules/auth/presentation/components/Button.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";

export function RegisterScreen() {
  const { register } = useAuth();
  const navigate = useNavigate();

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
  }

  function validate() {
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

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);
    if (!validate()) return;
    try {
      setSubmitting(true);
      const result = await register({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      });
      setSuccess(
        result?.message ||
          "Registration successful. Your account is pending role assignment by an administrator."
      );
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (err) {
      setSubmitError(err.message || "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      side="right"
      title="Start your journey"
      description="Join our platform to streamline your workflow and boost productivity."
      footerNote="Enterprise account registration."
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-dispatch-text">Register</h2>
        <p className="mt-1 text-sm text-dispatch-muted">Create a new account</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label="Full name"
          autoComplete="name"
          placeholder="Jane Doe"
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          error={errors.fullName}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
          />
          <TextField
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
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
          />
          <PasswordField
            label="Confirm"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={form.confirm}
            onChange={(e) => update("confirm", e.target.value)}
            error={errors.confirm}
          />
        </div>

        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-dispatch-red">
            {submitError}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <Button type="submit" loading={submitting}>
          {submitting ? "Creating account..." : "Create Account"}
        </Button>

        <p className="pt-2 text-center text-sm text-dispatch-muted">
          Have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-dispatch-indigo transition hover:text-dispatch-indigo-pressed"
          >
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
