import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { UserRole, MANAGER_ROLES, PAYROLL_VIEWER_ROLES } from "@/shared/utils/constants.js";
import { usePayrollPendingSummaryQuery } from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import { formatMoney } from "@/modules/payroll/utils/format.js";
import { todayIsoDate, formatDisplayDate } from "@/shared/utils/time.js";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
import {
  useDashboardStatsQuery,
  useAvailableDriversQuery,
} from "@/modules/manager-home/infrastructure/api/dashboard.queries.js";
import { useTodayRoutesQuery } from "@/modules/manager-home/infrastructure/api/routes.queries.js";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
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

function displayNameFromUser(user) {
  if (user?.fullName?.trim()) return user.fullName.trim();
  if (!user?.email) return "Manager";
  const local = user.email.split("@")[0] ?? "Manager";
  const part = local.split(/[._-]/)[0] ?? local;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

function formatRole(role) {
  if (role === UserRole.DISPATCH_MANAGER) return "Dispatch Manager";
  if (role === UserRole.ADMIN) return "Administrator";
  return role
    ? role
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "—";
}

function shortId(id) {
  return id ? id.slice(-6).toUpperCase() : "------";
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

const STAGE_FILTERS = {
  pending: new Set(["pending", "assigned"]),
  in_progress: new Set(["active", "in_progress"]),
  completed: new Set(["completed", "not_verified"]),
};

export function ManagerDashboardScreen() {
  const { user } = useAuth();
  const { date } = useOpsDateScope();
  const [stageFilter, setStageFilter] = useState(null);
  const isToday = date === todayIsoDate();
  const isManager = user?.role && MANAGER_ROLES.includes(user.role);
  const canViewPayroll = user?.role && PAYROLL_VIEWER_ROLES.includes(user.role);

  const statsQuery = useDashboardStatsQuery(date, isManager);
  const payrollQuery = usePayrollPendingSummaryQuery(canViewPayroll);
  const availableQuery = useAvailableDriversQuery(date, isManager);
  const routesQuery = useTodayRoutesQuery(date, isManager);

  const {
    data: statsRaw,
    isLoading: statsLoading,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = statsQuery;
  const {
    data: availableRaw,
    isLoading: driversLoading,
    isFetching: driversFetching,
    refetch: refetchDrivers,
  } = availableQuery;
  const {
    data: routesData,
    isLoading: routesLoading,
    isFetching: routesFetching,
    isFetched: routesFetched,
    refetch: refetchRoutes,
  } = routesQuery;

  const stats = dataForSelectedDate(statsRaw, date);
  const available = dataForSelectedDate(availableRaw, date);

  const routes = routesData?.items ?? [];
  const routeSummary = useMemo(() => summarizeRoutes(routes), [routes]);

  const routeMetrics = useMemo(() => {
    if (routesFetched) {
      return {
        total: routeSummary.total,
        completed: routeSummary.completed,
        inProgress: routeSummary.inProgress,
        pending: routeSummary.pending,
        other: routeSummary.other,
      };
    }
    return {
      total: stats?.todayRoutes ?? 0,
      completed: stats?.completedRoutes ?? 0,
      inProgress: 0,
      pending: 0,
      other: 0,
    };
  }, [routesFetched, routeSummary, stats]);

  const { total: routeTotal, completed, inProgress, pending } = routeMetrics;

  const availableCount = stats?.availableDrivers ?? available?.count ?? 0;

  const assignedDriverCount = useMemo(() => {
    const ids = new Set();
    routes.forEach((r) => {
      if (r.driverId) ids.add(r.driverId);
    });
    return ids.size;
  }, [routes]);

  const driverPool = availableCount + assignedDriverCount;
  const availablePercent = pct(availableCount, driverPool);

  const filteredRoutes = useMemo(() => {
    if (!stageFilter) return routes;
    const set = STAGE_FILTERS[stageFilter];
    if (!set) return routes;
    return routes.filter((r) => set.has(r.status ?? ""));
  }, [routes, stageFilter]);

  const metricsLoading =
    statsLoading ||
    routesLoading ||
    (statsFetching && !stats) ||
    (routesFetching && !routesFetched);

  const driversBusy = statsFetching || driversFetching || routesFetching;

  const lifecycleStages = [
    { key: "pending", label: "Pending", value: pending, color: "var(--amber)" },
    { key: "in_progress", label: "In progress", value: inProgress, color: "var(--blue)" },
    { key: "completed", label: "Completed", value: completed, color: "var(--green)" },
    { key: "other", label: "Other", value: routeSummary.other, color: "var(--text-muted)" },
  ];

  function refreshAll() {
    void refetchStats();
    void refetchDrivers();
    void refetchRoutes();
  }

  const topBar = (
    <OpsTopBar onRefresh={refreshAll} refreshing={driversBusy} />
  );

  if (user?.role === UserRole.ACCOUNTANT) {
    return <Navigate to="/payroll" replace />;
  }

  if (!isManager) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="ops-card ops-fade mx-auto mt-10 max-w-md p-8 text-center">
          <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
            Dashboard not available
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            This dashboard is for dispatch managers and administrators. Your role:{" "}
            <span className="font-semibold capitalize">{user?.role ?? "unknown"}</span>.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (user?.isPending?.()) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="ops-card ops-fade mx-auto mt-10 max-w-md p-8 text-center">
          <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
            Account pending
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            An administrator must assign your role before you can use the dispatch dashboard.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const routesSublabel = isToday ? "today" : "on date";

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mx-auto w-full max-w-7xl space-y-7 pb-16">
        {/* Welcome + identity */}
        <section className="ops-fade flex flex-col gap-4 pt-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Good day
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--text)" }}>
              {displayNameFromUser(user)}
            </h1>
          </div>
          <div className="ops-identity flex items-center gap-6 px-5 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Manager ID
              </p>
              <p className="mt-0.5 font-mono text-lg font-extrabold" style={{ color: "var(--accent)" }}>
                {shortId(user?.id)}
              </p>
            </div>
            <div className="h-9 w-px" style={{ background: "var(--border)" }} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Role
              </p>
              <p className="mt-0.5 text-lg font-bold" style={{ color: "var(--text)" }}>
                {formatRole(user?.role)}
              </p>
            </div>
          </div>
        </section>

        {/* KPI stat cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <OpsStatCard
            icon="drivers"
            label="Available drivers"
            value={availableCount}
            sublabel="free"
            percent={availablePercent}
            barColor="var(--green)"
            loading={statsLoading || driversLoading || (statsFetching && !stats) || (driversFetching && !available)}
            delay={0}
          />
          <OpsStatCard
            icon="routes"
            label={isToday ? "Routes today" : "Routes on date"}
            value={routeTotal}
            sublabel="scheduled"
            percent={routeTotal > 0 ? 100 : 0}
            barColor="var(--accent)"
            loading={metricsLoading}
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
            icon="payroll"
            label="Payroll pending"
            value={canViewPayroll ? formatMoney(payrollQuery.data?.totalPendingAmount ?? 0) : "—"}
            sublabel="unbilled"
            barColor="var(--accent-2)"
            loading={canViewPayroll && payrollQuery.isLoading}
            to={canViewPayroll ? "/payroll" : undefined}
            delay={240}
          />
        </section>

        {/* Route lifecycle */}
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

        {/* Quick actions */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: "/schedules/create", label: "Create schedule", icon: "M12 4v16m8-8H4" },
            { to: "/tracking", label: "Live tracking", icon: "M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" },
            { to: "/available-drivers", label: "Available drivers", icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" },
            { to: "/routes", label: "All routes", icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
          ].map((a) => (
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

        {/* Panels */}
        <div className="grid gap-5 xl:grid-cols-2">
          <OpsPanel
            title="Available drivers"
            subtitle={driversLoading ? "Loading…" : `${available?.count ?? 0} drivers with no route ${isToday ? "today" : "on date"}`}
          >
            {driversLoading ? (
              <OpsEmpty>Loading drivers…</OpsEmpty>
            ) : !available?.drivers?.length ? (
              <OpsEmpty>No available drivers for this date.</OpsEmpty>
            ) : (
              <ul>
                {available.drivers.map((d) => (
                  <li key={d.id} className="ops-row flex items-center gap-3 px-6 py-3">
                    <span className="ops-avatar h-10 w-10 text-sm">
                      {(d.displayName || d.email || "?").charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {d.displayName}
                      </p>
                      <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                        {d.email}
                      </p>
                    </div>
                    <span className="ops-teamtag shrink-0">{d.teamName || "No team"}</span>
                  </li>
                ))}
              </ul>
            )}
          </OpsPanel>

          <OpsPanel
            title={isToday ? "Today's routes" : `Routes · ${formatDisplayDate(date)}`}
            subtitle={
              routesLoading
                ? "Loading…"
                : stageFilter
                  ? `${filteredRoutes.length} of ${routes.length} route(s) · filtered`
                  : `${routesData?.total ?? routes.length} route(s) ${routesSublabel}`
            }
            action={
              <Link to="/routes" className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                View all
              </Link>
            }
          >
            {routesLoading ? (
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
                  {filteredRoutes.map((r) => (
                    <tr key={r.id} className="ops-row border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="px-5 py-3">
                        <p className="font-medium" style={{ color: "var(--text)" }}>
                          {r.routeName || "Route"}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                          {r.location || "—"} · {r.arrivalTime}–{r.departureTime}
                        </p>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        {r.driverName || r.driverEmail || "Unassigned"}
                      </td>
                      <td className="px-4 py-3">
                        <OpsStatusBadge status={r.status} label={formatStatusLabel(r.status)} />
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
