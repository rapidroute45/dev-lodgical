import { api } from "@/shared/utils/api.js";

export async function fetchStores(params = {}) {
  const { activeOnly = true, ...rest } = params;
  const res = await api.get("/stores", {
    params: {
      limit: 500,
      activeStatus: activeOnly ? "active" : undefined,
      ...rest,
    },
  });
  return res.data.data ?? [];
}

export async function fetchStore(id) {
  const res = await api.get(`/stores/${id}`);
  return res.data.data;
}

export async function createStore(body) {
  const res = await api.post("/stores", body);
  return res.data.data;
}

export async function updateStore(id, body) {
  const res = await api.put(`/stores/${id}`, body);
  return res.data.data;
}

export async function createSchedule(body) {
  const res = await api.post("/schedules", body);
  return res.data.data;
}

export async function updateSchedule(id, body) {
  const res = await api.put(`/schedules/${id}`, body);
  return res.data.data;
}

export async function deleteSchedule(id) {
  await api.delete(`/schedules/${id}`);
}

export async function createRoute(body) {
  const res = await api.post("/routes", body);
  return res.data.data;
}

export async function updateRoute(routeId, body) {
  const res = await api.put(`/routes/${routeId}`, body);
  return res.data.data;
}

export async function deleteRoute(routeId) {
  await api.delete(`/routes/${routeId}`);
}

export async function completeRouteStopOps(routeId, stopId) {
  const res = await api.post(`/routes/${routeId}/stops/${stopId}/ops-complete`);
  return res.data;
}

export async function completeRouteOps(routeId) {
  const res = await api.post(`/routes/${routeId}/ops-complete-route`);
  return res.data;
}

export async function returnRouteStopOps(routeId, stopId, body) {
  const res = await api.post(`/routes/${routeId}/stops/${stopId}/ops-return`, body);
  return res.data;
}

export async function updateRouteStopStatusOps(routeId, stopId, body) {
  const res = await api.patch(`/routes/${routeId}/stops/${stopId}/status`, body);
  return res.data;
}

export async function fetchRoute(id) {
  const res = await api.get(`/routes/${id}`);
  return res.data.data;
}

export async function fetchRoutes(params) {
  const res = await api.get("/routes", { params });
  const body = res.data;
  return {
    items: body.data ?? [],
    total: body.total ?? body.data?.length ?? 0,
    count: body.count ?? body.data?.length ?? 0,
    page: body.page ?? 1,
    limit: body.limit ?? 50,
  };
}

export async function fetchTeams() {
  const res = await api.get("/teams");
  return res.data.data ?? [];
}

export async function fetchTeam(teamId) {
  const res = await api.get(`/teams/${teamId}`);
  return res.data.data;
}

export async function fetchSchedules(params) {
  const res = await api.get("/schedules", { params });
  const body = res.data;
  return {
    items: body.data ?? [],
    total: body.total ?? body.data?.length ?? 0,
    count: body.count ?? body.data?.length ?? 0,
  };
}

export async function fetchSchedule(id) {
  const res = await api.get(`/schedules/${id}`);
  return res.data.data;
}

export async function fetchAvailableDrivers(teamId, params) {
  const res = await api.get(`/availability/drivers/${teamId}`, { params });
  return res.data.data ?? [];
}

export async function fetchCities() {
  const res = await api.get("/cities");
  return res.data.data?.cities ?? [];
}

export async function fetchLocations() {
  const res = await api.get("/cities");
  const data = res.data.data ?? {};
  return {
    states: data.states ?? [],
    locations: data.locations ?? [],
    cities: data.cities ?? [],
  };
}
