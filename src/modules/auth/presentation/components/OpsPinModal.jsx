import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import "@/modules/manager-home/presentation/ops.css";
import { useOpsTheme } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";

const PIN_SLOTS = 4;

function LockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

export function OpsPinModal({ open, scope, onClose, onVerified }) {
  const { t } = useTranslation();
  const { theme } = useOpsTheme();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inputReady, setInputReady] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setError("");
      setSubmitting(false);
      setInputReady(false);
    }
  }, [open, scope]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape" && !submitting) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, submitting, onClose]);

  const enableInput = useCallback(() => {
    setInputReady(true);
    setPin("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (pin.length < PIN_SLOTS || submitting) return;
      setSubmitting(true);
      setError("");
      try {
        await onVerified(scope, pin);
        onClose();
      } catch (err) {
        setError(err?.message ?? t("opsElevation.incorrectPin"));
        setPin("");
        setInputReady(true);
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

  return createPortal(
    <div
      className={`ops-shell ops-picker-backdrop fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center${
        theme === "light" ? " ops-shell--light" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ops-pin-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="ops-pin-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ops-pin-modal__hero">
          <div className="ops-pin-modal__icon" aria-hidden="true">
            <LockIcon />
          </div>
          <h2 id="ops-pin-title" className="ops-pin-modal__title">
            {title}
          </h2>
          <p className="ops-pin-modal__sub">{t("opsElevation.enterPin")}</p>
        </div>

        <div className="ops-pin-modal__body">
          <label htmlFor="ops-pin-input" className="ops-pin-modal__label">
            {t("opsElevation.pinLabel")}
          </label>

          {/* Decoy field — browsers autofill this instead of the real PIN input */}
          <input
            type="password"
            name="prevent_autofill"
            autoComplete="new-password"
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            defaultValue=""
          />

          <input
            id="ops-pin-input"
            ref={inputRef}
            type="text"
            name={`ops-elevation-${scope}-pin`}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            readOnly={!inputReady}
            maxLength={8}
            value={pin}
            placeholder={inputReady ? undefined : t("opsElevation.tapToEnterPin")}
            onPointerDown={enableInput}
            onFocus={enableInput}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className={`ops-pin-modal__input${error ? " ops-pin-modal__input--error" : ""}`}
            style={pin.length > 0 ? { WebkitTextSecurity: "disc" } : undefined}
            aria-label={t("opsElevation.pinLabel")}
            aria-invalid={!!error}
          />

          <div className="ops-pin-modal__dots" aria-hidden="true">
            {Array.from({ length: PIN_SLOTS }, (_, index) => (
              <span
                key={index}
                className={`ops-pin-modal__dot${index < pin.length ? " ops-pin-modal__dot--filled" : ""}`}
              />
            ))}
          </div>

          {error ? (
            <p className="ops-pin-modal__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="ops-pin-modal__actions">
            <button
              type="button"
              className="ops-pin-modal__btn"
              onClick={onClose}
              disabled={submitting}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="ops-pin-modal__btn ops-pin-modal__btn--primary"
              disabled={pin.length < PIN_SLOTS || submitting}
            >
              {submitting ? t("common.loading") : t("opsElevation.unlock")}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body
  );
}
