import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { RouteDetailCard } from "@/modules/scheduling/presentation/components/RouteDetailCard.jsx";
import { useRouteQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { usePayrollPendingSummaryQuery } from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import { formatMoney } from "@/modules/payroll/utils/format.js";
import { MANAGER_ROLES } from "@/shared/utils/constants.js";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";

export function PayrollRouteDetailScreen() {
  const { id: routeId } = useParams();
  const { user } = useAuth();
  const isOps = MANAGER_ROLES.includes(user?.role);

  const { data: route, isLoading, isError } = useRouteQuery(routeId, Boolean(routeId));
  const { data: pendingSummary } = usePayrollPendingSummaryQuery(isOps);

  const teamPending = pendingSummary?.teams?.find((t) => t.teamId === route?.teamId);
  const routeLine = teamPending?.drivers
    ?.find((d) => d.driverId === route?.driverId)
    ?.routes?.find((r) => r.routeId === routeId);

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={`${PAGE_HEADER_INNER} items-center`}>
        <Link
          to="/payroll"
          className="rounded-xl border border-dispatch-border p-2.5 text-dispatch-muted hover:bg-dispatch-bg"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-dispatch-text">
          Route payroll
        </h1>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-dispatch-border/30" />
        ) : isError || !route ? (
          <p className="text-center text-dispatch-muted">Route not found</p>
        ) : (
          <>
            {routeLine ? (
              <div className="mb-4 rounded-xl border border-dispatch-border bg-dispatch-surface p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-dispatch-muted">
                  Payroll line
                </p>
                <p className="mt-1 text-sm text-dispatch-text">
                  {routeLine.routeName} · {formatMoney(routeLine.amount ?? 0)}
                </p>
                {routeLine.overtimeHours > 0 ? (
                  <p className="text-xs text-amber-700">
                    OT: {routeLine.overtimeHours} hr
                  </p>
                ) : null}
              </div>
            ) : null}
            <RouteDetailCard route={route} index={1} scheduleId={route.scheduleId} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
