import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { RouteDetailCard } from "../components/RouteDetailCard.jsx";
import { useRouteQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { formatDisplayDate } from "@/shared/utils/time.js";
import {
  formatRouteStatus,
  routeStatusClass,
} from "@/modules/scheduling/utils/scheduleStatus.js";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import {
  canTrackRoute,
  isLiveRouteTracking,
  routeTrackingLabel,
} from "@/modules/tracking/utils/routeTrackingAccess.js";

export function ViewRouteScreen() {
  const { id: routeId } = useParams();
  const { data: route, isLoading, isError, refetch, isFetching } = useRouteQuery(routeId, Boolean(routeId));

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link to="/routes" className="ops-btn p-2.5" aria-label="Back to routes">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                {route?.routeName ?? "Route details"}
              </h1>
              {route?.scheduleDate || route?.schedule?.date ? (
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  {formatDisplayDate(route.scheduleDate ?? route.schedule?.date)}
                </p>
              ) : null}
            </div>
          </div>

          {route ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {route.scheduleId ? (
                <Link
                  to={`/schedules/${route.scheduleId}/routes`}
                  className="ops-btn px-4 py-2 text-sm font-semibold"
                >
                  Spreadsheet
                </Link>
              ) : null}
              {canTrackRoute(route) ? (
                <Link
                  to={`/routes/tracking/${route.id}`}
                  className="ops-btn ops-btn--accent px-4 py-2 text-sm font-semibold"
                >
                  {isLiveRouteTracking(route.status) ? "Live track" : routeTrackingLabel(route.status)}
                </Link>
              ) : null}
              <StatusBadge
                label={formatRouteStatus(route.status)}
                className={routeStatusClass(route.status)}
              />
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="ops-skel h-40 rounded-2xl" />
            <div className="ops-skel h-32 rounded-2xl" />
          </div>
        ) : isError || !route ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>Route not found</p>
            <Link to="/routes" className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold">
              Back to routes
            </Link>
          </div>
        ) : (
          <RouteDetailCard route={route} index={1} scheduleId={route.scheduleId} />
        )}
      </div>
    </DashboardLayout>
  );
}
