import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function OpsPinModal({ open, scope, onClose, onVerified }) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setError("");
      setSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, scope]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (pin.length < 4 || submitting) return;
      setSubmitting(true);
      setError("");
      try {
        await onVerified(scope, pin);
        onClose();
      } catch (err) {
        setError(err?.message ?? t("opsElevation.incorrectPin"));
        setPin("");
        inputRef.current?.focus();
      } finally {
        setSubmitting(false);
      }
    },
    [pin, submitting, onVerified, scope, onClose, t]
  );

  if (!open) return null;

  const title =
    scope === "payroll"
      ? t("opsElevation.payrollTitle")
      : t("opsElevation.dispatchTitle");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ops-pin-title"
    >
      <form
        onSubmit={handleSubmit}
        className="ops-card w-full max-w-sm rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ops-pin-title" className="text-lg font-bold" style={{ color: "var(--text)" }}>
          {title}
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          {t("opsElevation.enterPin")}
        </p>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={8}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="ops-input mt-4 w-full text-center text-2xl tracking-[0.4em]"
          aria-label={t("opsElevation.pinLabel")}
        />
        {error ? (
          <p className="mt-2 text-sm font-medium text-red-500" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="ops-btn flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="ops-btn ops-btn--accent flex-1"
            disabled={pin.length < 4 || submitting}
          >
            {submitting ? t("common.loading") : t("opsElevation.unlock")}
          </button>
        </div>
      </form>
    </div>
  );
}
