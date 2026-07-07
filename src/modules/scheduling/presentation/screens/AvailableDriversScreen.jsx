import { useMemo } from "react";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { MANAGER_ROLES } from "@/shared/utils/constants.js";
import { useTeamsQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import {
  useAvailableDriversQuery,
  useDriverPerformanceQuery,
} from "@/modules/manager-home/infrastructure/api/dashboard.queries.js";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
import { formatDisplayDate } from "@/shared/utils/time.js";
import { DateNavigator } from "../components/DateNavigator.jsx";
import { useScheduleDateBounds } from "../hooks/useScheduleDateBounds.js";
import { SectionCard } from "../components/SectionCard.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { PerformanceSummaryStrip } from "@/modules/manager-home/presentation/components/PerformanceSummaryStrip.jsx";
import { AvailableDriverRow } from "@/modules/manager-home/presentation/components/AvailableDriverRow.jsx";

export function AvailableDriversScreen() {
  const { user } = useAuth();
  const isManager = user?.role && MANAGER_ROLES.includes(user.role);
  const { date, setDate } = useOpsDateScope();
  const { maxDate } = useScheduleDateBounds();

  const { data: teams = [], isLoading: teamsLoading } = useTeamsQuery(isManager);
  const {
    data: availableData,
    isLoading: driversLoading,
    isError: driversError,
    refetch,
    isFetching,
  } = useAvailableDriversQuery(date, isManager);

  const {
    data: performanceData,
    isLoading: performanceLoading,
    isFetching: performanceFetching,
  } = useDriverPerformanceQuery(7, isManager);

  const performanceByDriverId = useMemo(() => {
    const map = new Map();
    for (const entry of performanceData?.drivers ?? []) {
      map.set(entry.userId, entry);
    }
    return map;
  }, [performanceData?.drivers]);

  const driversByTeam = useMemo(() => {
    const map = new Map();
    for (const driver of availableData?.drivers ?? []) {
      const key = driver.teamId ?? "unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(driver);
    }
    return map;
  }, [availableData?.drivers]);

  const totalAvailable = availableData?.count ?? 0;

  const topBar = (
    <OpsTopBar
      onRefresh={() => {
        void refetch();
      }}
      refreshing={isFetching || performanceFetching}
      maxDate={maxDate}
    />
  );

  const titleRow = (
    <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
          Available drivers
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Active drivers with no route assignment
        </p>
      </div>
      {!driversLoading && totalAvailable > 0 ? (
        <span className="ops-badge ops-badge--active">{totalAvailable} available</span>
      ) : null}
    </div>
  );

  if (!isManager) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          {titleRow}
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>Manager access required</p>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
              Only dispatch managers and admins can view available drivers.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const loading = teamsLoading || driversLoading;

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {titleRow}

        <DateNavigator date={date} onDateChange={setDate} maxDate={maxDate} />

        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Active drivers with no route assignment on{" "}
          <span className="font-semibold" style={{ color: "var(--text)" }}>{formatDisplayDate(date)}</span>.
        </p>

        <PerformanceSummaryStrip
          window={performanceData?.window}
          topPerformers={performanceData?.topPerformers}
          needsImprovement={performanceData?.needsImprovement}
          loading={performanceLoading}
        />

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-32 rounded-2xl" />
            ))}
          </div>
        ) : driversError ? (
          <div className="ops-banner ops-banner--error">
            Could not load available drivers.
          </div>
        ) : teams.length === 0 && totalAvailable === 0 ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>No available drivers</p>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
              All active drivers are assigned or have pending offers on this date.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => {
              const drivers = driversByTeam.get(team.id) ?? [];
              return (
                <SectionCard
                  key={team.id}
                  title={team.name}
                  subtitle={
                    team.code
                      ? `Code ${team.code} · ${drivers.length} available`
                      : `${drivers.length} available`
                  }
                >
                  {drivers.length === 0 ? (
                    <p className="py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                      No available drivers on this date.
                    </p>
                  ) : (
                    <>
                      <div
                        className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wide sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_auto] sm:gap-3"
                        style={{ color: "var(--text-dim)" }}
                      >
                        <span>Driver</span>
                        <span>Performance (7 days)</span>
                        <span className="text-right">Badge</span>
                      </div>
                      <ul className="space-y-2">
                        {drivers.map((driver) => (
                          <AvailableDriverRow
                            key={driver.id}
                            driver={driver}
                            performance={performanceByDriverId.get(driver.id) ?? null}
                            performanceLoading={performanceLoading}
                          />
                        ))}
                      </ul>
                    </>
                  )}
                </SectionCard>
              );
            })}

            {(driversByTeam.get("unassigned") ?? []).length > 0 ? (
              <SectionCard title="No team" subtitle="Drivers without a team assignment">
                <ul className="space-y-2">
                  {driversByTeam.get("unassigned").map((driver) => (
                    <AvailableDriverRow
                      key={driver.id}
                      driver={driver}
                      performance={performanceByDriverId.get(driver.id) ?? null}
                      performanceLoading={performanceLoading}
                    />
                  ))}
                </ul>
              </SectionCard>
            ) : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
