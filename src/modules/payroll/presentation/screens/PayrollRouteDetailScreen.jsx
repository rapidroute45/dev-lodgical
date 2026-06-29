import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { RouteDetailCard } from "@/modules/scheduling/presentation/components/RouteDetailCard.jsx";
import { useRouteQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { usePayrollPendingSummaryQuery } from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import { formatMoney } from "@/modules/payroll/utils/format.js";
import { MANAGER_ROLES } from "@/shared/utils/constants.js";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { todayIsoDate } from "@/shared/utils/time.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

export function PayrollRouteDetailScreen() {
  const { id: routeId } = useParams();
  const { user } = useAuth();
  const isOps = MANAGER_ROLES.includes(user?.role);

  const { data: route, isLoading, isError, refetch, isFetching } = useRouteQuery(routeId, Boolean(routeId));
  const { data: pendingSummary } = usePayrollPendingSummaryQuery(isOps);

  const teamPending = pendingSummary?.teams?.find((t) => t.teamId === route?.teamId);
  const routeLine = teamPending?.drivers
    ?.find((d) => d.driverId === route?.driverId)
    ?.routes?.find((r) => r.routeId === routeId);

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/payroll" className="ops-btn p-2.5">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="min-w-0 flex-1 truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Route payroll
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="ops-skel h-40 rounded-2xl" />
        ) : isError || !route ? (
          <p className="text-center" style={{ color: "var(--text-muted)" }}>Route not found</p>
        ) : (
          <>
            {routeLine ? (
              <div className="ops-panel ops-fade mb-4 p-4">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                  Payroll line
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text)" }}>
                  {routeLine.routeName} · {formatMoney(routeLine.amount ?? 0)}
                </p>
                {routeLine.overtimeHours > 0 ? (
                  <p className="text-xs" style={{ color: "var(--amber)" }}>
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
