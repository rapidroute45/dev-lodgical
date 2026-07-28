import { Navigate, useParams } from "react-router-dom";
import { useRouteQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";

/** Card view removed — open the schedule spreadsheet for this route. */
export function ViewRouteScreen() {
  const { id: routeId } = useParams();
  const { data: route, isLoading, isError } = useRouteQuery(routeId, Boolean(routeId));

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        Loading route…
      </div>
    );
  }

  if (isError || !route?.scheduleId) {
    return <Navigate to="/routes" replace />;
  }

  return <Navigate to={`/schedules/${route.scheduleId}/routes`} replace />;
}
