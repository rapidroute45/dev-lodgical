import { api } from "@/shared/utils/api.js";

/** GET /dashboard/stats — same as mobile useDashboardStatsQuery */
export async function fetchDashboardStats(date, scope = {}) {
  const params = {
    ...(date ? { date } : {}),
    ...(scope.city?.trim?.() ? { city: scope.city.trim() } : {}),
    ...(scope.state?.trim?.() ? { state: scope.state.trim() } : {}),
  };
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

/** GET /dashboard/returns — returned stops for the selected date */
export async function fetchDayReturns(date, scope = {}) {
  const params = {
    ...(date ? { date } : {}),
    ...(scope.city?.trim?.() ? { city: scope.city.trim() } : {}),
    ...(scope.state?.trim?.() ? { state: scope.state.trim() } : {}),
  };
  const res = await api.get("/dashboard/returns", { params });
  const data = res.data?.data;
  return {
    date: data?.date ?? date ?? "",
    totalReturns: data?.totalReturns ?? 0,
    routes: Array.isArray(data?.routes) ? data.routes : [],
  };
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
export async function fetchTeamPerformance({ days = 7, city, state } = {}) {
  const res = await api.get("/dashboard/team-performance", {
    params: {
      days,
      ...(city?.trim?.() ? { city: city.trim() } : {}),
      ...(state?.trim?.() ? { state: state.trim() } : {}),
    },
  });
  return res.data.data;
}
