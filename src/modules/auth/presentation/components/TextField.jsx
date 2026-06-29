import { useId, useState } from "react";

export function TextField({
  label,
  type = "text",
  error,
  tone = "light",
  className = "",
  id,
  ...props
}) {
  const autoId = useId();
  const inputId = id || autoId;
  const isDark = tone === "dark";

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className={`mb-1.5 block text-sm font-medium ${isDark ? "text-[#e8eef7]" : "text-dispatch-text"}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition ${
          isDark
            ? `bg-white/5 text-[#e8eef7] placeholder-[#64748b] focus:border-[#22d3ee] focus:ring-2 focus:ring-[#22d3ee]/20 ${
                error ? "border-red-400/60 focus:ring-red-400/20" : "border-[rgba(148,163,184,0.25)]"
              }`
            : `bg-[#F8FAFC] text-dispatch-text placeholder-dispatch-light focus:border-dispatch-primary focus:bg-dispatch-surface focus:ring-2 focus:ring-brand-200 ${
                error ? "border-dispatch-red focus:ring-red-200" : "border-dispatch-border"
              }`
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-dispatch-red">{error}</p>}
    </div>
  );
}

export function PasswordField({ label, error, tone = "light", className = "", id, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  const [visible, setVisible] = useState(false);
  const isDark = tone === "dark";

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className={`mb-1.5 block text-sm font-medium ${isDark ? "text-[#e8eef7]" : "text-dispatch-text"}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm outline-none transition ${
            isDark
              ? `bg-white/5 text-[#e8eef7] placeholder-[#64748b] focus:border-[#22d3ee] focus:ring-2 focus:ring-[#22d3ee]/20 ${
                  error ? "border-red-400/60 focus:ring-red-400/20" : "border-[rgba(148,163,184,0.25)]"
                }`
              : `bg-[#F8FAFC] text-dispatch-text placeholder-dispatch-light focus:border-dispatch-primary focus:bg-dispatch-surface focus:ring-2 focus:ring-brand-200 ${
                  error ? "border-dispatch-red focus:ring-red-200" : "border-dispatch-border"
                }`
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={`absolute inset-y-0 right-0 flex w-10 items-center justify-center transition ${
            isDark ? "text-[#64748b] hover:text-[#94a3b8]" : "text-dispatch-light hover:text-dispatch-muted"
          }`}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-dispatch-red">{error}</p>}
    </div>
  );
}

export function SelectField({
  label,
  error,
  className = "",
  id,
  children,
  ...props
}) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-dispatch-text"
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`w-full appearance-none rounded-lg border bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-dispatch-text outline-none transition focus:border-dispatch-primary focus:bg-dispatch-surface focus:ring-2 focus:ring-brand-200 ${
          error ? "border-dispatch-red focus:ring-red-200" : "border-dispatch-border"
        }`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-dispatch-red">{error}</p>}
    </div>
  );
}

function Eye() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.77 19.77 0 0 1 4.22-5.34" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.86 19.86 0 0 1-3.17 4.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
