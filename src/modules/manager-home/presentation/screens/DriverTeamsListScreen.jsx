import { useMemo } from "react";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { useTeamPerformanceQuery } from "@/modules/manager-home/infrastructure/api/dashboard.queries.js";
import { PerformanceSummaryStrip } from "@/modules/manager-home/presentation/components/PerformanceSummaryStrip.jsx";
import { PerformanceMetricsRow } from "@/modules/manager-home/presentation/components/PerformanceMetricsRow.jsx";
import { PerformanceBadge } from "@/modules/manager-home/presentation/components/PerformanceBadge.jsx";

function mapTeamPerformers(teams) {
  return (teams ?? []).map((team) => ({
    userId: team.teamId,
    displayName: team.teamName,
  }));
}

export function DriverTeamsListScreen() {
  const {
    data: performanceData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useTeamPerformanceQuery(7, true);

  const teams = performanceData?.teams ?? [];

  const topBar = (
    <OpsTopBar
      showDate={false}
      onRefresh={() => {
        void refetch();
      }}
      refreshing={isFetching}
    />
  );

  const summaryTop = useMemo(
    () => mapTeamPerformers(performanceData?.topPerformers),
    [performanceData?.topPerformers]
  );
  const summaryFlagged = useMemo(
    () => mapTeamPerformers(performanceData?.needsImprovement),
    [performanceData?.needsImprovement]
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Driver teams
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              All driver teams and their route performance
            </p>
          </div>
        </div>

        <PerformanceSummaryStrip
          window={performanceData?.window}
          topPerformers={summaryTop}
          needsImprovement={summaryFlagged}
          loading={isLoading}
        />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-20 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="ops-banner ops-banner--error">Could not load driver teams</div>
        ) : teams.length === 0 ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <div className="ops-stat__icon mx-auto mb-4 flex h-14 w-14 items-center justify-center">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>No driver teams</p>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
              Create teams and assign drivers to see performance here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => {
              const hasRoutes = team.completedRoutes > 0;
              const initial = (team.teamName || team.teamCode || "?").charAt(0).toUpperCase();

              return (
                <div
                  key={team.teamId}
                  className="ops-card ops-fade flex flex-wrap items-center gap-4 p-4"
                >
                  <span className="ops-avatar flex h-12 w-12 shrink-0 items-center justify-center text-lg">
                    {initial}
                  </span>
                  <div className="min-w-0 flex-1 basis-[180px]">
                    <p className="truncate font-bold" style={{ color: "var(--text)" }}>
                      {team.teamName}
                    </p>
                    <p className="truncate text-sm" style={{ color: "var(--text-muted)" }}>
                      {team.teamCode}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {team.teamLeadName ? (
                        <span className="ops-badge ops-badge--pending">Lead: {team.teamLeadName}</span>
                      ) : (
                        <span className="ops-badge ops-badge--pending">No team lead</span>
                      )}
                      <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                        {team.driverCount} driver{team.driverCount === 1 ? "" : "s"} · {team.memberCount} member
                        {team.memberCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
                    {hasRoutes ? (
                      <>
                        <PerformanceMetricsRow performance={team} loading={false} compact />
                        <PerformanceBadge badge={team.badge ?? null} compact />
                      </>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                        No recent routes
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {isFetching && !isLoading ? (
              <p className="text-center text-xs" style={{ color: "var(--text-dim)" }}>Refreshing…</p>
            ) : null}
          </div>
        )}

        <button
          type="button"
          onClick={() => refetch()}
          className="ops-btn px-4 py-2 text-sm font-semibold"
        >
          Refresh list
        </button>
      </div>
    </DashboardLayout>
  );
}
