import { Link } from "react-router-dom";

const STAT_ICONS = {
  drivers:
    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  routes:
    "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3",
  active:
    "M13 10V3L4 14h7v7l9-11h-7z",
  payroll:
    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  schedule:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  check:
    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  clock:
    "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
};

function StatIcon({ name }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={STAT_ICONS[name] ?? STAT_ICONS.routes} />
    </svg>
  );
}

export function OpsStatCard({
  icon = "routes",
  label,
  value,
  sublabel,
  percent = 0,
  barColor = "var(--accent)",
  loading = false,
  to,
  delay = 0,
}) {
  const inner = (
    <div
      className="ops-card ops-card--hover ops-fade flex h-full flex-col gap-4 p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <span className="ops-stat__icon">
          <StatIcon name={icon} />
        </span>
        {sublabel ? (
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
            {sublabel}
          </span>
        ) : null}
      </div>

      <div>
        {loading ? (
          <div className="ops-skel h-8 w-20" />
        ) : (
          <p className="ops-stat__value">{value}</p>
        )}
        <p className="mt-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
      </div>

      {percent > 0 && !loading ? (
        <div className="ops-stat__bar mt-auto">
          <span style={{ width: `${Math.min(100, percent)}%`, background: barColor }} />
        </div>
      ) : null}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {inner}
      </Link>
    );
  }
  return inner;
}

const STAGE_ARROW = (
  <svg className="ops-stage__arrow h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export function OpsLifecycleStrip({ stages, activeKey, onSelect, loading }) {
  return (
    <div className="flex flex-wrap items-stretch gap-3">
      {stages.map((stage, i) => (
        <div key={stage.key} className="flex flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => onSelect?.(activeKey === stage.key ? null : stage.key)}
            className={`ops-stage w-full ${activeKey === stage.key ? "ops-stage--active" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span className="ops-stage__dot" style={{ background: stage.color }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                {stage.label}
              </span>
            </div>
            {loading ? (
              <div className="ops-skel mt-3 h-6 w-10" />
            ) : (
              <p className="ops-stage__count mt-3" style={{ color: stage.color }}>
                {stage.value}
              </p>
            )}
          </button>
          {i < stages.length - 1 ? <span className="hidden lg:block">{STAGE_ARROW}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function OpsPanel({ title, subtitle, action, children }) {
  return (
    <section className="ops-panel ops-fade flex flex-col">
      <div className="ops-panel__head flex items-center justify-between gap-3 px-6 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
            {title}
          </h2>
          {subtitle ? (
            <p className="truncate text-sm" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="max-h-[380px] overflow-auto">{children}</div>
    </section>
  );
}

export function OpsEmpty({ children }) {
  return (
    <p className="px-6 py-10 text-center text-sm" style={{ color: "var(--text-dim)" }}>
      {children}
    </p>
  );
}

const STATUS_TO_BADGE = {
  completed: "done",
  not_verified: "rose",
  in_progress: "active",
  active: "active",
  pending: "pending",
  assigned: "pending",
  cancelled: "muted",
};

export function OpsStatusBadge({ status, label }) {
  const variant = STATUS_TO_BADGE[status] ?? "muted";
  return <span className={`ops-badge ops-badge--${variant}`}>{label}</span>;
}
