const ACTIVE = new Set(["active", "in_progress"]);
const PENDING = new Set(["pending", "assigned"]);
const COMPLETED = new Set(["completed", "not_verified"]);

export function summarizeRoutes(routes = []) {
  let inProgress = 0;
  let completed = 0;
  let pending = 0;
  let other = 0;

  for (const r of routes) {
    const s = r.status ?? "";
    if (COMPLETED.has(s)) completed += 1;
    else if (ACTIVE.has(s)) inProgress += 1;
    else if (PENDING.has(s)) pending += 1;
    else other += 1;
  }

  return { inProgress, completed, pending, other, total: routes.length };
}

export function statusBadgeClass(status) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "in_progress":
    case "active":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "pending":
    case "assigned":
      return "bg-amber-50 text-amber-800 ring-amber-600/20";
    case "cancelled":
      return "bg-dispatch-bg text-dispatch-muted ring-dispatch-light/30";
    case "not_verified":
      return "bg-rose-50 text-rose-700 ring-rose-600/20";
    default:
      return "bg-dispatch-bg text-dispatch-muted ring-dispatch-light/30";
  }
}

export function formatStatusLabel(status) {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
