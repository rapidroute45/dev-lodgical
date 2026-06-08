import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { UserRole, MANAGER_ROLES, PAYROLL_VIEWER_ROLES } from "@/shared/utils/constants.js";
import { usePayrollPendingSummaryQuery } from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import { formatMoney } from "@/modules/payroll/utils/format.js";
import {
  todayIsoDate,
  formatDisplayDate,
  addDaysToIsoDate,
} from "@/shared/utils/time.js";
import {
  useDashboardStatsQuery,
  useAvailableDriversQuery,
} from "@/modules/manager-home/infrastructure/api/dashboard.queries.js";
import { useTodayRoutesQuery } from "@/modules/manager-home/infrastructure/api/routes.queries.js";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import {
  DonutStatCard,
  RouteMixDonutCard,
} from "@/modules/manager-home/presentation/components/DonutStatCard.jsx";
import {
  summarizeRoutes,
  statusBadgeClass,
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

/** Ignore cached query rows until the API `date` matches the picker. */
function dataForSelectedDate(data, selectedDate) {
  if (!data) return null;
  if (data.date && data.date !== selectedDate) return null;
  return data;
}

export function ManagerDashboardScreen() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayIsoDate());
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

  const {
    total: routeTotal,
    completed,
    inProgress,
    pending,
  } = routeMetrics;

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

  const routeMixSegments = useMemo(
    () => [
      {
        key: "completed",
        value: completed,
        color: "#22C55E",
        legend: `Done ${completed}`,
      },
      {
        key: "in_progress",
        value: inProgress,
        color: "#3B82F6",
        legend: `Active ${inProgress}`,
      },
      {
        key: "pending",
        value: pending,
        color: "#F59E0B",
        legend: `Pending ${pending}`,
      },
      {
        key: "other",
        value: routeSummary.other,
        color: "#94A3B8",
        legend: `Other ${routeSummary.other}`,
      },
    ],
    [completed, inProgress, pending, routeSummary.other, date]
  );

  const metricsLoading =
    statsLoading ||
    routesLoading ||
    (statsFetching && !stats) ||
    (routesFetching && !routesFetched);

  const routesLabel = isToday
    ? "Today's routes"
    : `Routes · ${formatDisplayDate(date)}`;
  const routesSublabel = isToday ? "of today" : "on date";

  function refreshAll() {
    void refetchStats();
    void refetchDrivers();
    void refetchRoutes();
  }

  const topBar = (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-dispatch-border bg-dispatch-surface/90 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-dispatch-primary text-xs font-bold text-white">
          D
        </span>
        <span className="text-sm font-bold text-dispatch-text">Dispatch</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setDate((d) => addDaysToIsoDate(d, -1))}
          className="rounded-lg border border-dispatch-border bg-dispatch-surface p-2 text-dispatch-muted hover:bg-dispatch-bg"
          aria-label="Previous day"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-[140px] rounded-xl border border-dispatch-border bg-dispatch-surface px-4 py-2 text-center">
          <p className="text-xs text-dispatch-muted">Operations date</p>
          <p className="text-sm font-semibold text-dispatch-text">{formatDisplayDate(date)}</p>
        </div>
        <button
          type="button"
          onClick={() => setDate((d) => addDaysToIsoDate(d, 1))}
          disabled={date >= todayIsoDate()}
          className="rounded-lg border border-dispatch-border bg-dispatch-surface p-2 text-dispatch-muted hover:bg-dispatch-bg disabled:opacity-40"
          aria-label="Next day"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setDate(todayIsoDate())}
          className="rounded-lg border border-dispatch-primary/30 bg-dispatch-primary-soft px-3 py-2 text-xs font-semibold text-dispatch-primary"
        >
          Today
        </button>
        <button
          type="button"
          onClick={refreshAll}
          className="rounded-lg border border-dispatch-border bg-dispatch-surface px-3 py-2 text-sm font-medium text-dispatch-muted hover:bg-dispatch-bg"
        >
          Refresh
        </button>
      </div>
    </header>
  );

  if (user?.role === UserRole.ACCOUNTANT) {
    return <Navigate to="/payroll" replace />;
  }
  if (user?.role === UserRole.DISPATCH_TEAM) {
    return <Navigate to="/schedules" replace />;
  }
  if (!isManager) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-dispatch-bg p-6">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-lg font-semibold text-amber-900">Dashboard not available</p>
          <p className="mt-2 text-sm text-amber-800">
            This dashboard is for dispatch managers and administrators. Your role:{" "}
            <span className="font-medium capitalize">{user?.role ?? "unknown"}</span>.
          </p>
        </div>
      </div>
    );
  }

  if (user?.isPending?.()) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-dispatch-bg p-6">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-dispatch-surface p-8 text-center shadow-lg">
          <p className="text-lg font-semibold text-dispatch-text">Account pending</p>
          <p className="mt-2 text-sm text-dispatch-muted">
            An administrator must assign your role before you can use the dispatch dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className="w-full space-y-8">
        <section>
          <p className="text-sm font-medium text-dispatch-primary">Good day</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-dispatch-text sm:text-4xl">
            {displayNameFromUser(user)}
          </h1>
          
        </section>

        <div className="grid gap-4 rounded-2xl border border-brand-100 bg-gradient-to-r from-[#EEF4FF] to-[#F8FAFF] p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-dispatch-muted">
              Manager ID
            </p>
            <p className="mt-1 text-xl font-extrabold text-dispatch-blue">
              {shortId(user?.id)}
            </p>
          </div>
          <div className="sm:border-l sm:border-brand-100 sm:pl-5">
            <p className="text-xs font-medium uppercase tracking-wide text-dispatch-muted">Role</p>
            <p className="mt-1 text-lg font-bold text-auth-badge-text">
              {formatRole(user?.role)}
            </p>
          </div>
        </div>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-dispatch-text">Key metrics</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            <RouteMixDonutCard
              key={date}
              label={routesLabel}
              total={routeTotal}
              segments={routeMixSegments}
              loading={metricsLoading}
            />
            <DonutStatCard
              label="Available drivers"
              value={availableCount}
              percent={availablePercent}
              color="#22C55E"
              trackColor="#DCFCE7"
              sublabel="free"
              loading={
                statsLoading ||
                driversLoading ||
                (statsFetching && !stats) ||
                (driversFetching && !available)
              }
            />
            <DonutStatCard
              label="Completed"
              value={completed}
              percent={pct(completed, routeTotal)}
              color="#8B5CF6"
              trackColor="#EDE9FE"
              sublabel={routesSublabel}
              loading={metricsLoading}
            />
            <DonutStatCard
              label="In progress"
              value={inProgress}
              percent={pct(inProgress, routeTotal)}
              color="#3B82F6"
              trackColor="#DBEAFE"
              sublabel={routesSublabel}
              loading={metricsLoading}
            />
            {canViewPayroll ? (
              <Link to="/payroll" className="block transition hover:opacity-90">
                <DonutStatCard
                  label="Payroll pending"
                  value={formatMoney(payrollQuery.data?.totalPendingAmount ?? 0)}
                  percent={0}
                  color="#22C55E"
                  sublabel="unbilled"
                  loading={payrollQuery.isLoading}
                />
              </Link>
            ) : (
              <DonutStatCard
                label="Payroll pending"
                value="—"
                percent={0}
                color="#22C55E"
                comingSoon
              />
            )}
            <DonutStatCard
              label="Pending assignment"
              value={pending}
              percent={pct(pending, routeTotal)}
              color="#F59E0B"
              trackColor="#FFEDD5"
              sublabel={routesSublabel}
              loading={metricsLoading}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-dispatch-text">Live operations</h2>
          <p className="mt-1 text-sm text-dispatch-muted">Route status breakdown for selected date</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "In progress", value: routeSummary.inProgress, color: "#3B82F6" },
              { label: "Completed", value: routeSummary.completed, color: "#22C55E" },
              { label: "Pending", value: routeSummary.pending, color: "#F59E0B" },
              { label: "Other", value: routeSummary.other, color: "#94A3B8" },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                className={`text-center ${i < arr.length - 1 ? "border-r border-dispatch-border" : ""}`}
              >
                <p className="text-3xl font-extrabold" style={{ color: item.color }}>
                  {routesLoading ? "…" : item.value}
                </p>
                <p className="mt-1 text-xs font-medium text-dispatch-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-dispatch-border bg-dispatch-surface shadow-sm">
            <div className="border-b border-dispatch-border px-6 py-4">
              <h2 className="text-lg font-semibold text-dispatch-text">Available drivers</h2>
              <p className="text-sm text-dispatch-muted">
                {driversLoading
                  ? "Loading…"
                  : `${available?.count ?? 0} drivers with no route today`}
              </p>
            </div>
            <div className="max-h-[360px] overflow-auto">
              {driversLoading ? (
                <p className="p-6 text-sm text-dispatch-muted">Loading drivers…</p>
              ) : !available?.drivers?.length ? (
                <p className="p-6 text-sm text-dispatch-muted">No available drivers for this date.</p>
              ) : (
                <ul className="divide-y divide-dispatch-border">
                  {available.drivers.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-6 py-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-dispatch-primary-soft text-sm font-bold text-dispatch-primary">
                        {(d.displayName || d.email || "?").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-dispatch-text">
                          {d.displayName}
                        </p>
                        <p className="truncate text-xs text-dispatch-muted">{d.email}</p>
                      </div>
                      <span className="shrink-0 text-xs text-dispatch-light">
                        {d.teamName || "No team"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-dispatch-border bg-dispatch-surface shadow-sm">
            <div className="border-b border-dispatch-border px-6 py-4">
              <h2 className="text-lg font-semibold text-dispatch-text">
                {isToday ? "Today's routes" : `Routes · ${formatDisplayDate(date)}`}
              </h2>
              <p className="text-sm text-dispatch-muted">
                {routesLoading
                  ? "Loading…"
                  : `${routesData?.total ?? routes.length} route(s) scheduled`}
              </p>
            </div>
            <div className="max-h-[360px] overflow-auto">
              {routesLoading ? (
                <p className="p-6 text-sm text-dispatch-muted">Loading routes…</p>
              ) : routes.length === 0 ? (
                <p className="p-6 text-sm text-dispatch-muted">No routes for this date.</p>
              ) : (
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="sticky top-0 bg-dispatch-bg text-xs font-semibold uppercase tracking-wide text-dispatch-muted">
                    <tr>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Driver</th>
                      <th className="px-4 py-3">Team</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dispatch-border">
                    {routes.map((r) => (
                      <tr key={r.id} className="hover:bg-dispatch-bg/80">
                        <td className="px-4 py-3">
                          <p className="font-medium text-dispatch-text">
                            {r.routeName || "Route"}
                          </p>
                          <p className="text-xs text-dispatch-muted">
                            {r.location || "—"} · {r.arrivalTime}–{r.departureTime}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-dispatch-muted">
                          {r.driverName || r.driverEmail || "Unassigned"}
                        </td>
                        <td className="px-4 py-3 text-dispatch-muted">
                          {r.teamName || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusBadgeClass(r.status)}`}
                          >
                            {formatStatusLabel(r.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
