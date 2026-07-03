import { api } from "@/shared/utils/api.js";
import { logGps } from "@/modules/tracking/utils/gpsTrackingDebug.js";

export async function fetchLiveRoutes(params = {}) {
  const res = await api.get("/routes/live", { params });
  return {
    items: res.data.data ?? [],
    date: res.data.date,
    count: res.data.count ?? 0,
  };
}

export async function fetchRouteTracking(routeId) {
  logGps("web.http.tracking.in", { routeId, path: `/routes/${routeId}/tracking` });
  const res = await api.get(`/routes/${routeId}/tracking`);
  logGps("web.http.tracking.out", {
    routeId,
    tracking: res.data?.data?.tracking ?? null,
    trailPointCount: res.data?.data?.locationTrail?.length ?? 0,
  });
  return res.data.data;
}

export async function fetchRoutePlannedSegment(routeId) {
  const res = await api.get(`/routes/${routeId}/planned-segment`);
  return res.data.data;
}
