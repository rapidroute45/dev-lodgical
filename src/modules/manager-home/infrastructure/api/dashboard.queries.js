import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardStats,
  fetchAvailableDrivers,
} from "./dashboard.api.js";
import { useLocationQueryParams } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";

export const dashboardKeys = {
  stats: (date, scope) => [
    "dashboard",
    "stats",
    date ?? "today",
    scope?.city ?? "",
    scope?.state ?? "",
  ],
  availableDrivers: (date) => ["dashboard", "available-drivers", date ?? "today"],
};

export function useDashboardStatsQuery(date, enabled = true) {
  const scopeParams = useLocationQueryParams();
  return useQuery({
    queryKey: dashboardKeys.stats(date, scopeParams),
    queryFn: () => fetchDashboardStats(date, scopeParams),
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
