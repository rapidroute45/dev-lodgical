import { PerformanceBadge } from "./PerformanceBadge.jsx";

/**
 * @param {{
 *   window?: { days: number } | null;
 *   topPerformers?: Array<{ userId: string; displayName: string }>;
 *   needsImprovement?: Array<{ userId: string; displayName: string }>;
 *   loading?: boolean;
 * }} props
 */
export function PerformanceSummaryStrip({
  window,
  topPerformers = [],
  needsImprovement = [],
  loading = false,
}) {
  if (loading) {
    return <div className="ops-perf-strip ops-skel h-16 rounded-xl" />;
  }

  const days = window?.days ?? 7;
  const hasTop = topPerformers.length > 0;
  const hasFlagged = needsImprovement.length > 0;

  if (!hasTop && !hasFlagged) {
    return (
      <div className="ops-perf-strip">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Performance metrics · last {days} days — not enough completed routes yet for badges.
        </p>
      </div>
    );
  }

  return (
    <div className="ops-perf-strip">
      <p className="ops-perf-strip__title">Performance · last {days} days</p>
      <div className="ops-perf-strip__groups">
        {hasTop ? (
          <div className="ops-perf-strip__group">
            <span className="ops-perf-strip__label">Top performers</span>
            <div className="ops-perf-strip__chips">
              {topPerformers.slice(0, 5).map((person) => (
                <span key={person.userId} className="ops-perf-strip__chip">
                  <PerformanceBadge badge="top" compact />
                  <span>{person.displayName}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {hasFlagged ? (
          <div className="ops-perf-strip__group">
            <span className="ops-perf-strip__label">Needs attention</span>
            <div className="ops-perf-strip__chips">
              {needsImprovement.slice(0, 5).map((person) => (
                <span key={person.userId} className="ops-perf-strip__chip">
                  <PerformanceBadge badge="needs_improvement" compact />
                  <span>{person.displayName}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
