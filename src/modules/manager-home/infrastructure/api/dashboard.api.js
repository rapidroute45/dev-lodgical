import { api } from "@/shared/utils/api.js";

/** GET /dashboard/stats — same as mobile useDashboardStatsQuery */
export async function fetchDashboardStats(date) {
  const res = await api.get("/dashboard/stats", {
    params: date ? { date } : undefined,
  });
  return res.data.data;
}

/** GET /dashboard/available-drivers — same as mobile */
export async function fetchAvailableDrivers(date) {
  const res = await api.get("/dashboard/available-drivers", {
    params: date ? { date } : undefined,
  });
  return res.data.data;
}
