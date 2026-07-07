import { PerformanceBadge } from "./PerformanceBadge.jsx";
import { PerformanceMetricsRow } from "./PerformanceMetricsRow.jsx";

/**
 * @param {{
 *   driver: { id: string; displayName?: string; fullName?: string; email: string; teamName?: string | null };
 *   performance?: import('@/modules/manager-home/domain/types.js').PerformanceSummary | null;
 *   performanceLoading?: boolean;
 *   showTeam?: boolean;
 *   variant?: 'panel' | 'list';
 * }} props
 */
export function AvailableDriverRow({
  driver,
  performance = null,
  performanceLoading = false,
  showTeam = false,
  variant = "list",
}) {
  const name = driver.displayName ?? driver.fullName ?? driver.email;
  const initial = (name || "?").charAt(0).toUpperCase();

  if (variant === "panel") {
    return (
      <li className="ops-row flex flex-wrap items-center gap-3 px-6 py-3">
        <span className="ops-avatar h-10 w-10 shrink-0 text-sm">{initial}</span>
        <div className="min-w-0 flex-1 basis-[140px]">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
            {name}
          </p>
          <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
            {driver.email}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
          <PerformanceMetricsRow performance={performance} compact loading={performanceLoading} />
          <PerformanceBadge badge={performance?.badge ?? null} compact />
        </div>
        {showTeam ? (
          <span className="ops-teamtag shrink-0">{driver.teamName || "No team"}</span>
        ) : null}
      </li>
    );
  }

  return (
    <li className="ops-listcard ops-perf-driver-row grid gap-3 p-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="ops-avatar flex h-10 w-10 shrink-0 items-center justify-center">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>
            {name}
          </p>
          <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
            {driver.email}
          </p>
        </div>
      </div>
      <PerformanceMetricsRow performance={performance} loading={performanceLoading} />
      <div className="flex justify-start sm:justify-end">
        <PerformanceBadge badge={performance?.badge ?? null} />
      </div>
    </li>
  );
}
