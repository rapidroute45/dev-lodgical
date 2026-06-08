import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardStats,
  fetchAvailableDrivers,
} from "./dashboard.api.js";

export const dashboardKeys = {
  stats: (date) => ["dashboard", "stats", date ?? "today"],
  availableDrivers: (date) => ["dashboard", "available-drivers", date ?? "today"],
};

export function useDashboardStatsQuery(date, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.stats(date),
    queryFn: () => fetchDashboardStats(date),
    enabled,
  });
}

export function useAvailableDriversQuery(date, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.availableDrivers(date),
    queryFn: () => fetchAvailableDrivers(date),
    enabled,
  });
}
