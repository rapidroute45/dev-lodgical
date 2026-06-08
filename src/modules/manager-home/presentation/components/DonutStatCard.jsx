const SIZE = 128;
const R = 46;
const STROKE = 11;
const CIRCUMFERENCE = 2 * Math.PI * R;
const CX = SIZE / 2;
const CY = SIZE / 2;

function ringOffset(percent) {
  const p = Math.min(100, Math.max(0, percent));
  return CIRCUMFERENCE * (1 - p / 100);
}

export function DonutStatCard({
  label,
  value,
  percent = 0,
  color = "#4F6BED",
  trackColor = "#E2E8F0",
  sublabel,
  loading,
  comingSoon,
}) {
  return (
    <div
      className={`relative flex flex-col items-center rounded-2xl border border-dispatch-border/80 bg-dispatch-surface px-4 py-6 shadow-sm shadow-dispatch-border/50 ${
        comingSoon ? "opacity-90" : ""
      }`}
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={trackColor}
            strokeWidth={STROKE}
          />
          {!loading && !comingSoon ? (
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={ringOffset(percent)}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          ) : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {loading ? (
            <div className="h-8 w-12 animate-pulse rounded-lg bg-dispatch-bg" />
          ) : (
            <>
              <span
                className={`text-2xl font-extrabold tabular-nums tracking-tight ${
                  comingSoon ? "text-dispatch-light" : "text-dispatch-text"
                }`}
              >
                {value}
              </span>
              {!comingSoon && sublabel ? (
                <span className="mt-0.5 text-[11px] font-semibold text-dispatch-muted">
                  {sublabel}
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>
      <p
        className={`mt-4 text-center text-sm font-semibold ${
          comingSoon ? "text-dispatch-light" : "text-dispatch-muted"
        }`}
      >
        {label}
      </p>
      {!comingSoon && !loading && percent > 0 ? (
        <p className="mt-0.5 text-xs font-medium text-dispatch-light">{Math.round(percent)}%</p>
      ) : null}
      {comingSoon ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-dispatch-surface/80 backdrop-blur-[1px]">
          <span className="rounded-lg border border-dispatch-border bg-dispatch-surface px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-dispatch-primary">
            Coming soon
          </span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Multi-segment donut for route status mix (today's routes).
 */
export function RouteMixDonutCard({
  label,
  segments,
  total,
  loading,
}) {
  const sum = Math.max(
    total,
    segments.reduce((s, x) => s + x.value, 0)
  ) || 1;
  let offset = 0;

  const arcs = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const slice = (seg.value / sum) * CIRCUMFERENCE;
      const dashArray = `${slice} ${CIRCUMFERENCE - slice}`;
      const dashOffset = -offset;
      offset += slice;
      return { ...seg, dashArray, dashOffset };
    });

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dispatch-border/80 bg-dispatch-surface px-4 py-6 shadow-sm shadow-dispatch-border/50">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={STROKE}
          />
          {!loading
            ? arcs.map((arc) => (
                <circle
                  key={arc.key}
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={STROKE}
                  strokeDasharray={arc.dashArray}
                  strokeDashoffset={arc.dashOffset}
                  className="transition-all duration-700 ease-out"
                />
              ))
            : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {loading ? (
            <div className="h-8 w-12 animate-pulse rounded-lg bg-dispatch-bg" />
          ) : (
            <>
              <span className="text-2xl font-extrabold tabular-nums text-dispatch-text">
                {total}
              </span>
              <span className="text-[11px] font-semibold text-dispatch-muted">routes</span>
            </>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-sm font-semibold text-dispatch-muted">{label}</p>
      {!loading && segments.length > 0 ? (
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <span key={s.key} className="flex items-center gap-1 text-[10px] text-dispatch-muted">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.legend}
              </span>
            ))}
        </div>
      ) : null}
    </div>
  );
}
