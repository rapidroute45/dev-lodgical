import { useMemo, useState } from "react";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { MANAGER_ROLES } from "@/shared/utils/constants.js";
import { useTeamsQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { useAvailableDriversQuery } from "@/modules/manager-home/infrastructure/api/dashboard.queries.js";
import { formatDisplayDate, todayIsoDate } from "@/shared/utils/time.js";
import { DateNavigator } from "../components/DateNavigator.jsx";
import { SectionCard } from "../components/SectionCard.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";

export function AvailableDriversScreen() {
  const { user } = useAuth();
  const isManager = user?.role && MANAGER_ROLES.includes(user.role);
  const [date, setDate] = useState(todayIsoDate());

  const { data: teams = [], isLoading: teamsLoading } = useTeamsQuery(isManager);
  const {
    data: availableData,
    isLoading: driversLoading,
    isError: driversError,
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
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-dispatch-text">
            Available drivers
          </h1>
          <p className="text-sm text-dispatch-muted">
            Active drivers with no route assignment
          </p>
        </div>
        {!driversLoading && totalAvailable > 0 ? (
          <span className="rounded-full bg-dispatch-primary-soft px-3 py-1 text-xs font-bold text-dispatch-primary">
            {totalAvailable} available
          </span>
        ) : null}
      </div>
    </header>
  );

  if (!isManager) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-12 text-center">
            <p className="text-lg font-bold text-dispatch-text">Manager access required</p>
            <p className="mt-2 text-sm text-dispatch-muted">
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
        <DateNavigator date={date} onDateChange={setDate} />

        <p className="text-sm text-dispatch-muted">
          Active drivers with no route assignment on{" "}
          <span className="font-semibold text-dispatch-text">{formatDisplayDate(date)}</span>.
        </p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-dispatch-border/30" />
            ))}
          </div>
        ) : driversError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-dispatch-red">
            Could not load available drivers.
          </div>
        ) : teams.length === 0 && totalAvailable === 0 ? (
          <div className="rounded-2xl border border-dashed border-dispatch-border bg-dispatch-surface py-14 text-center">
            <p className="font-bold text-dispatch-text">No available drivers</p>
            <p className="mt-2 text-sm text-dispatch-muted">
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
                    <p className="py-4 text-center text-sm text-dispatch-muted">
                      No available drivers on this date.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {drivers.map((driver) => (
                        <li
                          key={driver.id}
                          className="flex items-center gap-3 rounded-xl border border-dispatch-border bg-[#FAFBFC] p-3"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dispatch-primary-soft text-dispatch-primary">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-dispatch-text">
                              {driver.displayName ?? driver.fullName ?? driver.email}
                            </p>
                            <p className="text-xs text-dispatch-muted">{driver.email}</p>
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
                      className="flex items-center gap-3 rounded-xl border border-dispatch-border bg-[#FAFBFC] p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-dispatch-text">
                          {driver.displayName ?? driver.fullName ?? driver.email}
                        </p>
                        <p className="text-xs text-dispatch-muted">{driver.email}</p>
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
