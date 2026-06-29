export const SCHEDULE_STATUS_STYLES = {
  draft: "ops-badge ops-badge--pending",
  pending: "ops-badge ops-badge--pending",
  active: "ops-badge ops-badge--active",
  completed: "ops-badge ops-badge--done",
  cancelled: "ops-badge ops-badge--muted",
};

export function scheduleStatusClass(status) {
  return SCHEDULE_STATUS_STYLES[status] ?? "ops-badge ops-badge--muted";
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
      return "ops-badge ops-badge--done";
    case "in_progress":
    case "active":
      return "ops-badge ops-badge--active";
    case "pending":
    case "assigned":
      return "ops-badge ops-badge--pending";
    case "cancelled":
      return "ops-badge ops-badge--muted";
    case "not_verified":
      return "ops-badge ops-badge--rose";
    default:
      return "ops-badge ops-badge--muted";
  }
}
