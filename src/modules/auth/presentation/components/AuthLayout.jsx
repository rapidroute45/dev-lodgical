/**
 * Split-panel auth layout — colors match mobile AuthGradientLayout + AuthWelcomeHero.
 */
export function AuthLayout({
  side = "left",
  badge = "Dispatch",
  title,
  description,
  footerNote,
  children,
}) {
  const gradient = (
    <div
      key="gradient"
      className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-dispatch-border bg-gradient-to-b from-auth-gradient-start via-auth-gradient-mid to-white p-8 sm:p-10 md:rounded-none"
    >
      <span className="inline-flex w-fit items-center rounded-full border border-auth-badge-border bg-auth-badge-bg px-3 py-1 text-xs font-semibold tracking-wide text-auth-badge-text">
        {badge}
      </span>

      <div className="mt-10 space-y-3 md:mt-0">
        <h1 className="text-3xl font-bold leading-tight text-dispatch-text sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-sm text-sm text-dispatch-muted sm:text-base">
          {description}
        </p>
      </div>

      {footerNote && (
        <div className="mt-10 flex w-full items-center gap-2 rounded-xl border border-dispatch-border bg-dispatch-surface px-4 py-3 text-sm text-dispatch-muted shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 text-dispatch-blue"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{footerNote}</span>
        </div>
      )}
    </div>
  );

  const form = (
    <div
      key="form"
      className="flex items-center justify-center bg-dispatch-surface p-8 sm:p-12"
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  );

  return (
    <div className="flex min-h-svh items-center justify-center bg-dispatch-bg p-4 sm:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-dispatch-surface shadow-xl ring-1 ring-dispatch-border md:grid-cols-2">
        {side === "left" ? [gradient, form] : [form, gradient]}
      </div>
    </div>
  );
}
