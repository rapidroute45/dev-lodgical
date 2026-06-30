import { useMemo } from "react";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { MANAGER_ROLES } from "@/shared/utils/constants.js";
import { useTeamsQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { useAvailableDriversQuery } from "@/modules/manager-home/infrastructure/api/dashboard.queries.js";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
import { formatDisplayDate } from "@/shared/utils/time.js";
import { DateNavigator } from "../components/DateNavigator.jsx";
import { SectionCard } from "../components/SectionCard.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

export function AvailableDriversScreen() {
  const { user } = useAuth();
  const isManager = user?.role && MANAGER_ROLES.includes(user.role);
  const { date, setDate } = useOpsDateScope();

  const { data: teams = [], isLoading: teamsLoading } = useTeamsQuery(isManager);
  const {
    data: availableData,
    isLoading: driversLoading,
    isError: driversError,
    refetch,
    isFetching,
  } = useAvailableDriversQuery(date, isManager);

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
    <OpsTopBar onRefresh={refetch} refreshing={isFetching} />
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

        <DateNavigator date={date} onDateChange={setDate} />

        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Active drivers with no route assignment on{" "}
          <span className="font-semibold" style={{ color: "var(--text)" }}>{formatDisplayDate(date)}</span>.
        </p>

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
                    <ul className="space-y-2">
                      {drivers.map((driver) => (
                        <li
                          key={driver.id}
                          className="ops-listcard flex items-center gap-3 p-3"
                        >
                          <span className="ops-avatar flex h-10 w-10 shrink-0 items-center justify-center">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                              {driver.displayName ?? driver.fullName ?? driver.email}
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{driver.email}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              );
            })}

            {(driversByTeam.get("unassigned") ?? []).length > 0 ? (
              <SectionCard title="No team" subtitle="Drivers without a team assignment">
                <ul className="space-y-2">
                  {driversByTeam.get("unassigned").map((driver) => (
                    <li
                      key={driver.id}
                      className="ops-listcard flex items-center gap-3 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                          {driver.displayName ?? driver.fullName ?? driver.email}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{driver.email}</p>
                      </div>
                    </li>
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
