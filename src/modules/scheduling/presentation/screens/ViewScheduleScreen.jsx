import { Navigate, useParams } from "react-router-dom";

/** Card view removed — schedule detail opens the route spreadsheet. */
export function ViewScheduleScreen() {
  const { id } = useParams();
  if (!id) return <Navigate to="/schedules" replace />;
  return <Navigate to={`/schedules/${id}/routes`} replace />;
}
