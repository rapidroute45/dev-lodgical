import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardStats,
  fetchAvailableDrivers,
  fetchDriverPerformance,
  fetchDispatchPerformance,
  fetchTeamPerformance,
} from "./dashboard.api.js";
import { useLocationQueryParams } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";
import { MOBILE_ONLY_ROLES, UserRole } from "@/shared/utils/constants.js";

export const dashboardKeys = {
  stats: (date, scope) => [
    "dashboard",
    "stats",
    date ?? "today",
    scope?.city ?? "",
    scope?.state ?? "",
  ],
  availableDrivers: (date) => ["dashboard", "available-drivers", date ?? "today"],
  driverPerformance: (days) => ["dashboard", "driver-performance", days ?? 7],
  dispatchPerformance: (days) => ["dashboard", "dispatch-performance", days ?? 7],
  teamPerformance: (days) => ["dashboard", "team-performance", days ?? 7],
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

export function useDriverPerformanceQuery(days = 7, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.driverPerformance(days),
    queryFn: () => fetchDriverPerformance({ days }),
    enabled,
  });
}

export function useDispatchPerformanceQuery(days = 7, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.dispatchPerformance(days),
    queryFn: () => fetchDispatchPerformance({ days }),
    enabled,
  });
}

export function useTeamPerformanceQuery(days = 7, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.teamPerformance(days),
    queryFn: () => fetchTeamPerformance({ days }),
    enabled,
  });
}

function mergeUniquePerformers(lists, limit = 5) {
  const seen = new Set();
  const result = [];
  for (const list of lists) {
    for (const entry of list ?? []) {
      if (!entry?.userId || seen.has(entry.userId)) continue;
      seen.add(entry.userId);
      result.push(entry);
      if (result.length >= limit) return result;
    }
  }
  return result;
}

/** Whether this user role has driver or dispatch performance metrics. */
export function isPerformanceEligibleUser(user) {
  if (!user?.id || !user.role) return false;
  return MOBILE_ONLY_ROLES.includes(user.role) || user.role === UserRole.DISPATCH_TEAM;
}

/** @param {Map<string, import('@/modules/manager-home/domain/types.js').PerformanceSummary>} performanceByUserId */
export function performanceForUser(user, performanceByUserId) {
  if (!isPerformanceEligibleUser(user)) return null;
  return performanceByUserId.get(user.id) ?? null;
}

export function useMergedStaffPerformanceQuery(days = 7, enabled = true) {
  const driverQuery = useDriverPerformanceQuery(days, enabled);
  const dispatchQuery = useDispatchPerformanceQuery(days, enabled);

  const merged = useMemo(() => {
    const performanceByUserId = new Map();
    for (const entry of driverQuery.data?.drivers ?? []) {
      performanceByUserId.set(entry.userId, entry);
    }
    for (const entry of dispatchQuery.data?.members ?? []) {
      performanceByUserId.set(entry.userId, entry);
    }

    return {
      window: driverQuery.data?.window ?? dispatchQuery.data?.window ?? null,
      performanceByUserId,
      topPerformers: mergeUniquePerformers([
        driverQuery.data?.topPerformers,
        dispatchQuery.data?.topPerformers,
      ]),
      needsImprovement: mergeUniquePerformers([
        driverQuery.data?.needsImprovement,
        dispatchQuery.data?.needsImprovement,
      ]),
    };
  }, [driverQuery.data, dispatchQuery.data]);

  return {
    ...merged,
    isLoading: driverQuery.isLoading || dispatchQuery.isLoading,
    isFetching: driverQuery.isFetching || dispatchQuery.isFetching,
    refetch() {
      void driverQuery.refetch();
      void dispatchQuery.refetch();
    },
  };
}
