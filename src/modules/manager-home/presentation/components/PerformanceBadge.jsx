/** @typedef {import('@/modules/manager-home/domain/types.js').PerformanceBadge} PerformanceBadge */

/**
 * @param {{ badge: PerformanceBadge, compact?: boolean }} props
 */
export function PerformanceBadge({ badge, compact = false }) {
  if (!badge) return null;

  if (badge === "top") {
    return (
      <span className="ops-perf-badge ops-perf-badge--top">
        {compact ? "⭐ Top" : "⭐ Top Performer"}
      </span>
    );
  }

  return (
    <span className="ops-perf-badge ops-perf-badge--warn">
      {compact ? "🚨 Flagged" : "🚨 Needs Improvement"}
    </span>
  );
}
