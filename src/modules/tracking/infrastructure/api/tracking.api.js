import { api } from "@/shared/utils/api.js";

export async function fetchLiveRoutes(params = {}) {
  const res = await api.get("/routes/live", { params });
  return {
    items: res.data.data ?? [],
    date: res.data.date,
    count: res.data.count ?? 0,
  };
}

export async function fetchRouteTracking(routeId) {
  const res = await api.get(`/routes/${routeId}/tracking`);
  return res.data.data;
}

export async function fetchRoutePlannedSegment(routeId) {
  const res = await api.get(`/routes/${routeId}/planned-segment`);
  return res.data.data;
}
