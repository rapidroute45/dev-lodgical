import { Link } from "react-router-dom";
import "@/modules/landing/presentation/landing.css";

/**
 * Split-panel auth layout.
 * theme="dark" matches the landing page Midnight Dispatch palette.
 */
export function AuthLayout({
  side = "left",
  theme = "light",
  badge = "Dispatch",
  title,
  description,
  footerNote,
  children,
}) {
  if (theme === "dark") {
    return <AuthLayoutDark side={side} badge={badge} title={title} description={description} footerNote={footerNote}>{children}</AuthLayoutDark>;
  }

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

function AuthLayoutDark({ side, badge, title, description, footerNote, children }) {
  const hero = (
    <div key="hero" className="auth-dark__hero min-h-[280px] md:min-h-full">
      {badge ? <span className="auth-dark__badge">{badge}</span> : null}

      <div className="mt-10 space-y-3 md:my-auto">
        <h1 className="auth-dark__title">{title}</h1>
        <p className="auth-dark__desc">{description}</p>
      </div>

      {footerNote && (
        <div className="auth-dark__note mt-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--accent)" }}
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>{footerNote}</span>
        </div>
      )}
    </div>
  );

  const form = (
    <div key="form" className="auth-dark__form">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );

  return (
    <div className="auth-dark">
      <div className="auth-dark__mesh" aria-hidden="true" />
      <Link to="/" className="auth-dark__brand auth-dark__brand--corner" aria-label="GBeyes home">
        <img src="/logo-dark.png" alt="GBeyes" className="auth-dark__brand-logo" />
      </Link>
      <div className="auth-dark__wrap landing__section">
        <div className="auth-dark__card grid md:grid-cols-2">
          {side === "left" ? [hero, form] : [form, hero]}
        </div>
      </div>
    </div>
  );
}
