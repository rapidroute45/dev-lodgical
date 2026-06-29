import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RETURN_REASON_OPTIONS } from "@/modules/scheduling/constants/returnReasons.js";
import { useOpsTheme } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";

export function ReturnReasonModal({ open, stopName, busy, onCancel, onConfirm }) {
  const { theme } = useOpsTheme();
  const [reason, setReason] = useState("wrong_address");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason("wrong_address");
    setCustomReason("");
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape" && !busy) onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm({
      reason,
      customReason: reason === "custom" ? customReason.trim() : undefined,
    });
  };

  function handleBackdropClick() {
    if (!busy) onCancel();
  }

  return createPortal(
    <div
      className={`ops-shell ops-picker-backdrop fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center${
        theme === "light" ? " ops-shell--light" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-reason-title"
      onClick={handleBackdropClick}
    >
      <div
        className="ops-picker return-reason-modal w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ops-picker__head">
          <div className="min-w-0">
            <h2 id="return-reason-title" className="ops-picker__title">
              Failure reason
            </h2>
            {stopName ? (
              <p className="ops-picker__sub truncate">{stopName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleBackdropClick}
            className="ops-picker__close"
            aria-label="Close"
            disabled={busy}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="return-reason-modal__body max-h-[min(50vh,420px)] space-y-1 overflow-y-auto px-3 py-3">
          {RETURN_REASON_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className={`return-reason-modal__option${reason === opt.id ? " return-reason-modal__option--selected" : ""}`}
            >
              <input
                type="radio"
                name="return-reason"
                value={opt.id}
                checked={reason === opt.id}
                onChange={() => setReason(opt.id)}
                className="h-4 w-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {opt.label}
              </span>
            </label>
          ))}

          {reason === "custom" ? (
            <textarea
              className="ops-input mt-2 min-h-[88px] w-full resize-y"
              placeholder="Describe reason"
              value={customReason}
              onChange={(event) => setCustomReason(event.target.value)}
            />
          ) : null}
        </div>

        <div
          className="flex items-center justify-end gap-2 border-t px-5 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            type="button"
            className="ops-btn px-4 py-2 text-sm font-semibold"
            onClick={handleBackdropClick}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ops-btn px-4 py-2 text-sm font-semibold"
            style={{
              background: "color-mix(in srgb, var(--rose) 18%, transparent)",
              borderColor: "color-mix(in srgb, var(--rose) 40%, transparent)",
              color: "var(--rose)",
            }}
            onClick={handleConfirm}
            disabled={busy || (reason === "custom" && !customReason.trim())}
          >
            {busy ? "Saving…" : "Confirm failure"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
