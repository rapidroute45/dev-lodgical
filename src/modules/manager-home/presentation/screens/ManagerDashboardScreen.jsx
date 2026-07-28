import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { UserRole, MANAGER_ROLES, PAYROLL_VIEWER_ROLES } from "@/shared/utils/constants.js";
import { usePayrollPendingSummaryQuery } from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import { formatMoney } from "@/modules/payroll/utils/format.js";
import { todayIsoDate, formatDisplayDate } from "@/shared/utils/time.js";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
import {
  useDashboardStatsQuery,
  useDayReturnsQuery,
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
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

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
  const navigate = useNavigate();
  const { date } = useOpsDateScope();
  const [stageFilter, setStageFilter] = useState(null);
  const isToday = date === todayIsoDate();
  const isManager = user?.role && MANAGER_ROLES.includes(user.role);
  const canViewPayroll = user?.role && PAYROLL_VIEWER_ROLES.includes(user.role);

  const statsQuery = useDashboardStatsQuery(date, isManager);
  const payrollQuery = usePayrollPendingSummaryQuery(canViewPayroll);
  const returnsQuery = useDayReturnsQuery(date, isManager);
  const routesQuery = useTodayRoutesQuery(date, isManager);

  const {
    data: statsRaw,
    isLoading: statsLoading,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = statsQuery;
  const {
    data: returnsRaw,
    isLoading: returnsLoading,
    isFetching: returnsFetching,
    refetch: refetchReturns,
  } = returnsQuery;
  const {
    data: routesData,
    isLoading: routesLoading,
    isFetching: routesFetching,
    isFetched: routesFetched,
    refetch: refetchRoutes,
  } = routesQuery;

  const stats = dataForSelectedDate(statsRaw, date);
  const dayReturns = dataForSelectedDate(returnsRaw, date);

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

  const returnsCount = dayReturns?.totalReturns ?? stats?.pendingReturns ?? 0;
  const returnsRouteCount = dayReturns?.routes?.length ?? 0;
  const returnsPercent = pct(returnsCount, Math.max(returnsCount, 1));

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

  const pageBusy = statsFetching || returnsFetching || routesFetching;

  const lifecycleStages = [
    { key: "pending", label: "Pending", value: pending, color: "var(--amber)" },
    { key: "in_progress", label: "In progress", value: inProgress, color: "var(--blue)" },
    { key: "completed", label: "Completed", value: completed, color: "var(--green)" },
    { key: "other", label: "Other", value: routeSummary.other, color: "var(--text-muted)" },
  ];

  function refreshAll() {
    void refetchStats();
    void refetchReturns();
    void refetchRoutes();
  }

  const topBar = (
    <OpsTopBar onRefresh={refreshAll} refreshing={pageBusy} />
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
      <div className={`${PAGE_CONTENT} space-y-7`}>
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
            icon="returns"
            label="Returns"
            value={returnsCount}
            sublabel={isToday ? "today" : "on date"}
            percent={returnsCount > 0 ? returnsPercent : 0}
            barColor="var(--amber)"
            loading={returnsLoading || (returnsFetching && !dayReturns)}
            to="/returns"
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
            { to: "/returns", label: "Returns", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
            { to: "/all-routes", label: "All routes", icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
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
            title="Returns"
            subtitle={
              returnsLoading
                ? "Loading…"
                : `${returnsCount} return${returnsCount === 1 ? "" : "s"} · ${returnsRouteCount} route${
                    returnsRouteCount === 1 ? "" : "s"
                  } ${isToday ? "today" : "on date"}`
            }
            action={
              <Link to="/returns" className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                View all
              </Link>
            }
          >
            {returnsLoading ? (
              <OpsEmpty>Loading returns…</OpsEmpty>
            ) : !dayReturns?.routes?.length ? (
              <OpsEmpty>No returns for this date.</OpsEmpty>
            ) : (
              <ul>
                {dayReturns.routes.map((route) => (
                  <li key={route.routeId}>
                    <button
                      type="button"
                      className="ops-row flex w-full flex-wrap items-center gap-3 px-6 py-3 text-left cursor-pointer"
                      onClick={() =>
                        navigate(`/returns?routeId=${encodeURIComponent(route.routeId)}`)
                      }
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
                        style={{ background: "rgba(245,158,11,0.16)", color: "var(--amber)" }}
                      >
                        {route.returnsCount}
                      </span>
                      <div className="min-w-0 flex-1 basis-[140px]">
                        <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {route.routeName}
                        </p>
                        <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                          {route.driverName || route.driverEmail || "Unassigned"}
                          {route.storeName ? ` · ${route.storeName}` : ""}
                        </p>
                      </div>
                      <span className="ops-teamtag shrink-0">
                        {route.teamName || route.teamCode || "No team"}
                      </span>
                    </button>
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
              <Link to="/all-routes" className="text-xs font-bold" style={{ color: "var(--accent)" }}>
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
                  {filteredRoutes.map((r) => {
                    const scheduleId = r.scheduleId ?? r.schedule?.id;
                    return (
                      <tr
                        key={r.id}
                        className={`ops-row border-t${scheduleId ? " cursor-pointer" : ""}`}
                        style={{ borderColor: "var(--border)" }}
                        onClick={() => {
                          if (scheduleId) navigate(`/schedules/${scheduleId}/routes`);
                        }}
                      >
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
                    );
                  })}
                </tbody>
              </table>
            )}
          </OpsPanel>
        </div>
      </div>
    </DashboardLayout>
  );
}
