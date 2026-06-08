export function SectionCard({ title, subtitle, icon, action, children, className = "" }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-dispatch-border/80 bg-dispatch-surface shadow-sm shadow-dispatch-border/40 ${className}`}
    >
      {(title || subtitle) && (
        <div className="flex items-start justify-between gap-3 border-b border-dispatch-border/60 bg-gradient-to-r from-dispatch-primary-soft/40 to-transparent px-5 py-4">
          <div className="flex items-start gap-3">
            {icon ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dispatch-primary text-white shadow-md shadow-dispatch-primary/20">
                {icon}
              </span>
            ) : null}
            <div>
              {title ? (
                <h2 className="text-base font-bold text-dispatch-text">{title}</h2>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 text-sm text-dispatch-muted">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
