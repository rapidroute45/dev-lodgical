export function SectionCard({ title, subtitle, icon, action, children, className = "" }) {
  return (
    <section className={`ops-panel ops-fade overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="ops-panel__head flex items-start justify-between gap-3 px-5 py-4">
          <div className="flex items-start gap-3">
            {icon ? (
              <span className="ops-stat__icon flex h-10 w-10 shrink-0 items-center justify-center">
                {icon}
              </span>
            ) : null}
            <div>
              {title ? (
                <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
                  {title}
                </h2>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  {subtitle}
                </p>
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
