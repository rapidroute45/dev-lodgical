import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import { UserRole, UserStatus } from "@/shared/utils/constants.js";
import { getUserAssignedCities } from "@/shared/utils/assignedCities.js";
import { useAllUsersQuery } from "@/modules/users/infrastructure/api/users.queries.js";
import { useDispatchPerformanceQuery } from "@/modules/manager-home/infrastructure/api/dashboard.queries.js";
import { PerformanceSummaryStrip } from "@/modules/manager-home/presentation/components/PerformanceSummaryStrip.jsx";
import { PerformanceMetricsRow } from "@/modules/manager-home/presentation/components/PerformanceMetricsRow.jsx";
import { PerformanceBadge } from "@/modules/manager-home/presentation/components/PerformanceBadge.jsx";

export function DispatchTeamListScreen() {
  const { data: users = [], isLoading, isError, refetch, isFetching } =
    useAllUsersQuery(
      { role: UserRole.DISPATCH_TEAM, status: UserStatus.ACTIVE },
      true
    );

  const {
    data: performanceData,
    isLoading: performanceLoading,
    isFetching: performanceFetching,
  } = useDispatchPerformanceQuery(7, true);

  const performanceByUserId = useMemo(() => {
    const map = new Map();
    for (const entry of performanceData?.members ?? []) {
      map.set(entry.userId, entry);
    }
    return map;
  }, [performanceData?.members]);

  const topBar = (
    <OpsTopBar
      showDate={false}
      onRefresh={() => {
        void refetch();
      }}
      refreshing={isFetching || performanceFetching}
    />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Dispatch team
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              View each member&apos;s schedules and routes by city
            </p>
          </div>
        </div>

        <PerformanceSummaryStrip
          window={performanceData?.window}
          topPerformers={performanceData?.topPerformers}
          needsImprovement={performanceData?.needsImprovement}
          loading={performanceLoading}
        />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-20 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="ops-banner ops-banner--error">Could not load dispatch team</div>
        ) : users.length === 0 ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <div className="ops-stat__icon mx-auto mb-4 flex h-14 w-14 items-center justify-center">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>No dispatch team members</p>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
              Create accounts with the dispatch team role and assign a city.
            </p>
            <Link
              to="/users/new"
              className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold"
            >
              Create account
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((member) => {
              const displayName =
                member.displayName ?? resolveDisplayName(member.fullName, member.email);
              const cities = getUserAssignedCities(member);
              const performance = performanceByUserId.get(member.id) ?? null;

              return (
                <Link
                  key={member.id}
                  to={`/dispatch-team/${member.id}`}
                  className="ops-card ops-card--hover ops-fade flex flex-wrap items-center gap-4 p-4"
                >
                  <span className="ops-avatar flex h-12 w-12 shrink-0 items-center justify-center text-lg">
                    {displayName.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1 basis-[180px]">
                    <p className="truncate font-bold" style={{ color: "var(--text)" }}>{displayName}</p>
                    <p className="truncate text-sm" style={{ color: "var(--text-muted)" }}>{member.email}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {cities.length ? (
                        cities.map((city) => (
                          <span key={city} className="ops-citychip">
                            {city}
                          </span>
                        ))
                      ) : (
                        <span className="ops-badge ops-badge--pending">No city assigned</span>
                      )}
                      <span className="text-xs capitalize" style={{ color: "var(--text-dim)" }}>
                        {member.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
                    <PerformanceMetricsRow
                      performance={performance}
                      loading={performanceLoading}
                      compact
                    />
                    <PerformanceBadge badge={performance?.badge ?? null} compact />
                  </div>
                  <svg className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
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
