import { useQuery } from "@tanstack/react-query";
import { fetchLiveRoutes, fetchRouteTracking, fetchRoutePlannedSegment } from "./tracking.api.js";
import { useLocationQueryParams } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";

export function useLiveRoutesQuery(params, enabled = true) {
  const scopeParams = useLocationQueryParams(params);
  return useQuery({
    queryKey: ["routes", "live", { ...params, ...scopeParams }],
    queryFn: () => fetchLiveRoutes({ ...params, ...scopeParams }),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useRouteTrackingQuery(routeId, enabled = true) {
  return useQuery({
    queryKey: ["routes", routeId, "tracking"],
    queryFn: () => fetchRouteTracking(routeId),
    enabled: enabled && Boolean(routeId),
    refetchInterval: 15_000,
  });
}

export function useRoutePlannedSegmentQuery(routeId, enabled = true) {
  return useQuery({
    queryKey: ["routes", routeId, "planned-segment"],
    queryFn: () => fetchRoutePlannedSegment(routeId),
    enabled: enabled && Boolean(routeId),
    refetchInterval: 30_000,
  });
}
