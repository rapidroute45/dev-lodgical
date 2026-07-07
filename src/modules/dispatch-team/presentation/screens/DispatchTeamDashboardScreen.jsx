import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { useAssignedCityScope } from "@/modules/scheduling/presentation/hooks/useAssignedCityScope.js";
import {
  useRoutesQuery,
  useSchedulesQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { useDashboardStatsQuery } from "@/modules/manager-home/infrastructure/api/dashboard.queries.js";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { maxScheduleBrowseDate } from "@/modules/scheduling/utils/scheduleDateBounds.js";
import {
  OpsStatCard,
  OpsLifecycleStrip,
  OpsPanel,
  OpsEmpty,
  OpsStatusBadge,
} from "@/modules/manager-home/presentation/components/OpsWidgets.jsx";
import {
  summarizeRoutes,
  formatStatusLabel,
} from "@/modules/manager-home/utils/routeStatus.js";
import { todayIsoDate, formatDisplayDate } from "@/shared/utils/time.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

function displayNameFromUser(user) {
  if (user?.fullName?.trim()) return user.fullName.trim();
  if (!user?.email) return "Dispatch";
  const local = user.email.split("@")[0] ?? "Dispatch";
  const part = local.split(/[._-]/)[0] ?? local;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

function pct(part, total) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function dataForSelectedDate(data, selectedDate) {
  if (!data) return null;
  if (data.date && data.date !== selectedDate) return null;
  return data;
}

const QUICK_ACTIONS = [
  { to: "/schedules/create", label: "Create schedule", icon: "M12 4v16m8-8H4" },
  { to: "/schedules", label: "Schedules", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { to: "/routes", label: "Routes", icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
  { to: "/stores", label: "Stores", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m4-14h6" },
];

export function DispatchTeamDashboardScreen() {
  const { user } = useAuth();
  const { assignedCities, hasMultipleCities } = useAssignedCityScope();
  const { date } = useOpsDateScope();
  const [stageFilter, setStageFilter] = useState(null);
  const isToday = date === todayIsoDate();

  const statsQuery = useDashboardStatsQuery(date, true);
  const routesQuery = useRoutesQuery({ date, limit: 100 }, true);
  const schedulesQuery = useSchedulesQuery({ date, limit: 50 }, true);

  const stats = dataForSelectedDate(statsQuery.data, date);
  const routes = routesQuery.data?.items ?? [];
  const schedules = schedulesQuery.data?.items ?? [];
  const routeSummary = useMemo(() => summarizeRoutes(routes), [routes]);

  const routeTotal = routesQuery.isFetched ? routeSummary.total : stats?.todayRoutes ?? 0;
  const completed = routesQuery.isFetched ? routeSummary.completed : stats?.completedRoutes ?? 0;
  const { inProgress, pending, other } = routeSummary;

  const STAGE_FILTERS = {
    pending: new Set(["pending", "assigned"]),
    in_progress: new Set(["active", "in_progress"]),
    completed: new Set(["completed", "not_verified"]),
  };

  const filteredRoutes = useMemo(() => {
    if (!stageFilter) return routes;
    const set = STAGE_FILTERS[stageFilter];
    if (!set) return routes;
    return routes.filter((r) => set.has(r.status ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes, stageFilter]);

  const metricsLoading =
    statsQuery.isLoading ||
    routesQuery.isLoading ||
    (statsQuery.isFetching && !stats) ||
    (routesQuery.isFetching && !routesQuery.isFetched);

  const lifecycleStages = [
    { key: "pending", label: "Pending", value: pending, color: "var(--amber)" },
    { key: "in_progress", label: "In progress", value: inProgress, color: "var(--blue)" },
    { key: "completed", label: "Completed", value: completed, color: "var(--green)" },
    { key: "other", label: "Other", value: other, color: "var(--text-muted)" },
  ];

  function refreshAll() {
    void statsQuery.refetch();
    void routesQuery.refetch();
    void schedulesQuery.refetch();
  }

  const topBar = (
    <OpsTopBar
      onRefresh={refreshAll}
      refreshing={statsQuery.isFetching || routesQuery.isFetching || schedulesQuery.isFetching}
      maxDate={maxScheduleBrowseDate()}
    />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={`${PAGE_CONTENT} space-y-7`}>
        <section className="ops-fade flex flex-col gap-4 pt-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Good day
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text)" }}>
              {displayNameFromUser(user)}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Dispatch overview for your assigned {hasMultipleCities ? "cities" : "city"}.
            </p>
          </div>
          <div className="ops-identity px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
              Assigned {assignedCities.length === 1 ? "city" : "cities"}
            </p>
            {assignedCities.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {assignedCities.map((city) => (
                  <span key={city} className="ops-citychip">
                    {city}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--amber)" }}>
                No city assigned yet.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <OpsStatCard
            icon="routes"
            label={isToday ? "Routes today" : "Routes on date"}
            value={routeTotal}
            sublabel="scheduled"
            percent={routeTotal > 0 ? 100 : 0}
            barColor="var(--accent)"
            loading={metricsLoading}
            delay={0}
          />
          <OpsStatCard
            icon="schedule"
            label="Schedules"
            value={schedulesQuery.isLoading ? "—" : schedules.length}
            sublabel={isToday ? "today" : "on date"}
            barColor="var(--accent-2)"
            loading={schedulesQuery.isLoading}
            delay={80}
          />
          <OpsStatCard
            icon="active"
            label="In progress"
            value={inProgress}
            sublabel="active now"
            percent={pct(inProgress, routeTotal)}
            barColor="var(--blue)"
            loading={metricsLoading}
            delay={160}
          />
          <OpsStatCard
            icon="check"
            label="Completed"
            value={completed}
            sublabel="done"
            percent={pct(completed, routeTotal)}
            barColor="var(--green)"
            loading={metricsLoading}
            delay={240}
          />
        </section>

        <section className="ops-fade space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Route lifecycle
            </h2>
            {stageFilter ? (
              <button
                type="button"
                onClick={() => setStageFilter(null)}
                className="text-xs font-semibold"
                style={{ color: "var(--accent)" }}
              >
                Clear filter
              </button>
            ) : (
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                Tap a stage to filter routes
              </span>
            )}
          </div>
          <OpsLifecycleStrip
            stages={lifecycleStages}
            activeKey={stageFilter}
            onSelect={setStageFilter}
            loading={metricsLoading}
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className="ops-quick">
              <span className="ops-quick__icon">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                </svg>
              </span>
              {a.label}
            </Link>
          ))}
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <OpsPanel
            title={isToday ? "Today's schedules" : `Schedules · ${formatDisplayDate(date)}`}
            subtitle={
              schedulesQuery.isLoading
                ? "Loading…"
                : `${schedules.length} schedule${schedules.length === 1 ? "" : "s"}`
            }
            action={
              <Link to="/schedules" className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                View all
              </Link>
            }
          >
            {schedulesQuery.isLoading ? (
              <OpsEmpty>Loading schedules…</OpsEmpty>
            ) : schedules.length === 0 ? (
              <OpsEmpty>No schedules for this date.</OpsEmpty>
            ) : (
              <ul>
                {schedules.map((schedule) => (
                  <li key={schedule.id}>
                    <Link to={`/schedules/${schedule.id}`} className="ops-row flex items-center gap-3 px-6 py-3">
                      <span className="ops-avatar h-10 w-10 text-sm">
                        {(schedule.store?.storeName ?? "S").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {schedule.store?.storeName ?? "Store"}
                        </p>
                        <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                          {schedule.city}, {schedule.state} · {schedule.routeCount ?? 0} routes
                        </p>
                      </div>
                      <span className="ops-teamtag shrink-0 capitalize">{schedule.status ?? "—"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </OpsPanel>

          <OpsPanel
            title={isToday ? "Today's routes" : `Routes · ${formatDisplayDate(date)}`}
            subtitle={
              routesQuery.isLoading
                ? "Loading…"
                : stageFilter
                  ? `${filteredRoutes.length} of ${routes.length} route(s) · filtered`
                  : `${routesQuery.data?.total ?? routes.length} route(s)`
            }
            action={
              <Link to="/routes" className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                View all
              </Link>
            }
          >
            {routesQuery.isLoading ? (
              <OpsEmpty>Loading routes…</OpsEmpty>
            ) : filteredRoutes.length === 0 ? (
              <OpsEmpty>{stageFilter ? "No routes in this stage." : "No routes for this date."}</OpsEmpty>
            ) : (
              <table className="w-full min-w-[460px] text-left text-sm">
                <thead className="sticky top-0 text-xs font-semibold uppercase tracking-wide" style={{ background: "rgba(7,11,18,0.9)", color: "var(--text-dim)" }}>
                  <tr>
                    <th className="px-5 py-3">Route</th>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoutes.map((route) => (
                    <tr key={route.id} className="ops-row border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="px-5 py-3">
                        <Link to={`/routes/${route.id}`} className="font-medium" style={{ color: "var(--text)" }}>
                          {route.routeName || "Route"}
                        </Link>
                        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                          {route.schedule?.city ?? route.location ?? "—"} · {route.arrivalTime}–
                          {route.departureTime}
                        </p>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        {route.driverName || route.driverEmail || "Unassigned"}
                      </td>
                      <td className="px-4 py-3">
                        <OpsStatusBadge status={route.status} label={formatStatusLabel(route.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </OpsPanel>
        </div>
      </div>
    </DashboardLayout>
  );
}
