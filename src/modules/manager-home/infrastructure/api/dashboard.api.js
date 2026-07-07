import { api } from "@/shared/utils/api.js";

/** GET /dashboard/stats — same as mobile useDashboardStatsQuery */
export async function fetchDashboardStats(date, scope = {}) {
  const params = { ...(date ? { date } : {}), ...scope };
  const res = await api.get("/dashboard/stats", { params });
  return res.data.data;
}

/** GET /dashboard/available-drivers — same as mobile */
export async function fetchAvailableDrivers(date) {
  const res = await api.get("/dashboard/available-drivers", {
    params: date ? { date } : undefined,
  });
  return res.data.data;
}

/** GET /dashboard/driver-performance */
export async function fetchDriverPerformance({ days = 7 } = {}) {
  const res = await api.get("/dashboard/driver-performance", { params: { days } });
  return res.data.data;
}

/** GET /dashboard/dispatch-performance */
export async function fetchDispatchPerformance({ days = 7 } = {}) {
  const res = await api.get("/dashboard/dispatch-performance", { params: { days } });
  return res.data.data;
}

/** GET /dashboard/team-performance */
export async function fetchTeamPerformance({ days = 7 } = {}) {
  const res = await api.get("/dashboard/team-performance", { params: { days } });
  return res.data.data;
}
