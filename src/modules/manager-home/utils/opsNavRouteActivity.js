import { UserRole } from "@/shared/utils/constants.js";

const COMPLETED_ROUTE_STATUSES = new Set(["completed", "not_verified"]);

export function isCompletedRoute(route) {
  return COMPLETED_ROUTE_STATUSES.has(route?.status ?? "");
}

export function routeCountsForNavIndicator(route, viewer, { isDispatchTeamViewer = false } = {}) {
  if (!route) return false;
  if (!isDispatchTeamViewer) return true;
  if (!viewer?.id) return false;
  const viewerId = String(viewer.id);
  if (route.assignedBy && String(route.assignedBy) === viewerId) return true;
  if (route.schedule?.createdBy && String(route.schedule.createdBy) === viewerId) return true;
  return false;
}

export function filterRoutesForNavViewer(routes, viewer) {
  const isDispatchTeamViewer = viewer?.role === UserRole.DISPATCH_TEAM;
  if (!isDispatchTeamViewer) return routes;
  return routes.filter((route) => routeCountsForNavIndicator(route, viewer, { isDispatchTeamViewer: true }));
}

export function buildRouteActivityMaps(routes, viewer) {
  const isDispatchTeamViewer = viewer?.role === UserRole.DISPATCH_TEAM;
  const byDriver = new Map();
  const byTeam = new Map();

  for (const route of routes) {
    if (!isCompletedRoute(route)) continue;
    if (!routeCountsForNavIndicator(route, viewer, { isDispatchTeamViewer })) continue;

    if (route.driverId) {
      const key = String(route.driverId);
      byDriver.set(key, (byDriver.get(key) ?? 0) + 1);
    }
    if (route.teamId) {
      const key = String(route.teamId);
      byTeam.set(key, (byTeam.get(key) ?? 0) + 1);
    }
  }

  return { byDriver, byTeam };
}
