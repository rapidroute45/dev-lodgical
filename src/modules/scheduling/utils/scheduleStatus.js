export const SCHEDULE_STATUS_STYLES = {
  draft: "bg-amber-50 text-amber-800 ring-amber-200",
  pending: "bg-orange-50 text-orange-800 ring-orange-200",
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  completed: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function scheduleStatusClass(status) {
  return SCHEDULE_STATUS_STYLES[status] ?? "bg-dispatch-bg text-dispatch-muted ring-dispatch-border";
}

export function formatScheduleStatus(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatRouteStatus(status) {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function routeStatusClass(status) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "in_progress":
    case "active":
      return "bg-blue-50 text-blue-700";
    case "pending":
    case "assigned":
      return "bg-amber-50 text-amber-800";
    case "cancelled":
      return "bg-slate-100 text-slate-600";
    case "not_verified":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-dispatch-bg text-dispatch-muted";
  }
}
