const TRACKABLE_STATUSES = new Set([
  "pending",
  "assigned",
  "active",
  "in_progress",
  "completed",
  "not_verified",
]);

export function canTrackRoute(route) {
  if (!route?.id || !route?.driverId) return false;
  if (route.status === "cancelled") return false;
  return TRACKABLE_STATUSES.has(route.status ?? "pending");
}

export function isLiveRouteTracking(status) {
  return status === "in_progress";
}

export function isCompletedRouteTracking(status) {
  return status === "completed" || status === "not_verified";
}

export function routeTrackingLabel(status) {
  if (status === "in_progress") return "Live";
  return "Track";
}

export function routeTrackingTitle(status) {
  if (status === "in_progress") {
    return "View live driver location and route trail";
  }
  if (isCompletedRouteTracking(status)) {
    return "View where the driver traveled and route stops";
  }
  if (status === "active") {
    return "Driver assigned — live map updates when the route is started";
  }
  return "View route map and stops";
}

export function matchesRouteTrackingFilter(status, filter) {
  if (filter === "all") return true;
  if (filter === "in_progress") return status === "active" || status === "in_progress";
  if (filter === "pending") return status === "pending" || status === "assigned";
  if (filter === "completed") return status === "completed" || status === "not_verified";
  return true;
}
