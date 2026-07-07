import { PerformanceBadge } from "@/modules/manager-home/presentation/components/PerformanceBadge.jsx";
import { PerformanceMetricsRow } from "@/modules/manager-home/presentation/components/PerformanceMetricsRow.jsx";

/**
 * @param {{
 *   performance?: import('@/modules/manager-home/domain/types.js').PerformanceSummary | null;
 *   loading?: boolean;
 *   days?: number;
 * }} props
 */
export function DispatchMemberPerformanceCard({ performance, loading = false, days = 7 }) {
  return (
    <div className="ops-panel ops-fade p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
            Dispatch performance
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Based on routes assigned or verified · last {days} days
          </p>
        </div>
        <PerformanceBadge badge={performance?.badge ?? null} />
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="ops-skel h-8 rounded-lg" />
        ) : (
          <>
            <PerformanceMetricsRow performance={performance} />
            {performance?.completedRoutes ? (
              <p className="mt-3 text-xs" style={{ color: "var(--text-dim)" }}>
                {performance.completedRoutes} completed route
                {performance.completedRoutes === 1 ? "" : "s"} in window
              </p>
            ) : (
              <p className="mt-3 text-xs" style={{ color: "var(--text-dim)" }}>
                No completed routes assigned or verified in this window.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
