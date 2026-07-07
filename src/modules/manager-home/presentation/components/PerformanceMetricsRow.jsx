/** @typedef {import('@/modules/manager-home/domain/types.js').PerformanceSummary} PerformanceSummary */

function formatPct(value) {
  return value == null ? "—" : `${value}%`;
}

/**
 * @param {{ performance?: PerformanceSummary | null, compact?: boolean, loading?: boolean }} props
 */
export function PerformanceMetricsRow({ performance, compact = false, loading = false }) {
  if (loading) {
    return <span className="ops-perf-metrics ops-perf-metrics--loading text-xs">Loading…</span>;
  }

  if (!performance || performance.completedRoutes === 0) {
    return (
      <span className="ops-perf-metrics text-xs" style={{ color: "var(--text-dim)" }}>
        No recent routes
      </span>
    );
  }

  const items = compact
    ? [
        { label: "POD", value: formatPct(performance.podRate), tone: "accent" },
        { label: "On-time", value: formatPct(performance.onTimePct), tone: "green" },
      ]
    : [
        { label: "POD", value: formatPct(performance.podRate), tone: "accent" },
        { label: "On-time", value: formatPct(performance.onTimePct), tone: "green" },
        { label: "Returns", value: formatPct(performance.returnRate), tone: "amber" },
        { label: "Late", value: String(performance.lateCompletions), tone: "rose" },
      ];

  return (
    <div className={`ops-perf-metrics${compact ? " ops-perf-metrics--compact" : ""}`}>
      {items.map((item) => (
        <span key={item.label} className={`ops-perf-metric ops-perf-metric--${item.tone}`}>
          <span className="ops-perf-metric__label">{item.label}</span>
          <span className="ops-perf-metric__value">{item.value}</span>
        </span>
      ))}
    </div>
  );
}
