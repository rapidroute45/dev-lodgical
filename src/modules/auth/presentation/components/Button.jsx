/** Mirrors mobile AuthPrimaryButton — solid dispatch indigo. */
export function Button({
  type = "button",
  loading = false,
  disabled = false,
  children,
  className = "",
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-dispatch-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-dispatch-primary/25 transition hover:bg-dispatch-indigo-pressed focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      <span>{children}</span>
    </button>
  );
}
