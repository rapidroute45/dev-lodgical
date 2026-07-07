import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  markSchedulingListsStale,
  patchScheduleAfterRouteCreate,
  patchScheduleAfterRouteDelete,
  patchScheduleAfterRouteUpdate,
} from "./scheduleCache.js";
import {
  createRoute,
  createSchedule,
  createStore,
  completeRouteOps,
  completeRouteStopOps,
  deleteRoute,
  deleteSchedule,
  fetchAvailableDrivers,
  fetchCities,
  fetchLocations,
  fetchRoute,
  fetchRoutes,
  fetchRoutesSearch,
  fetchSchedule,
  fetchSchedules,
  fetchStore,
  fetchStores,
  fetchTeam,
  fetchTeams,
  returnRouteStopOps,
  updateRouteStopStatusOps,
  updateRoute,
  updateSchedule,
  updateStore,
} from "./scheduling.api.js";
import { useLocationQueryParams } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";

export function useStoresQuery(enabled = true, params) {
  const scopeParams = useLocationQueryParams(params);
  const merged = { activeOnly: true, ...scopeParams, ...params };
  return useQuery({
    queryKey: ["stores", merged.city ?? "", merged.state ?? "", merged.activeOnly ?? "active"],
    queryFn: () => fetchStores(merged),
    enabled,
  });
}

export function useStoreQuery(id, enabled = true) {
  return useQuery({
    queryKey: ["stores", id],
    queryFn: () => fetchStore(id),
    enabled: enabled && Boolean(id),
  });
}

export function useTeamsQuery(enabled = true) {
  return useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
    enabled,
  });
}

export function useTeamQuery(teamId, enabled = true) {
  return useQuery({
    queryKey: ["teams", teamId],
    queryFn: () => fetchTeam(teamId),
    enabled: enabled && Boolean(teamId),
  });
}

export function useCitiesQuery(enabled = true) {
  return useQuery({
    queryKey: ["cities"],
    queryFn: fetchCities,
    enabled,
  });
}

export function useLocationsQuery(enabled = true) {
  return useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSchedulesQuery(filters, enabled = true) {
  const scopeParams = useLocationQueryParams(filters);
  const date = typeof filters === "string" ? filters : filters?.date;
  return useQuery({
    queryKey: [
      "schedules",
      "list",
      date,
      scopeParams.city ?? "",
      scopeParams.state ?? "",
      filters?.storeId ?? "",
      filters?.status ?? "",
    ],
    queryFn: () =>
      fetchSchedules({
        date,
        city: scopeParams.city,
        state: scopeParams.state,
        storeId: filters?.storeId,
        status: filters?.status === "all" ? undefined : filters?.status,
        limit: 50,
      }),
    enabled: enabled && Boolean(date),
  });
}

export function useScheduleQuery(id, enabled = true) {
  return useQuery({
    queryKey: ["schedules", id],
    queryFn: () => fetchSchedule(id),
    enabled: enabled && Boolean(id),
  });
}

export function useScheduleGroupQuery(scheduleIds, enabled = true, options = {}) {
  const ids = scheduleIds ?? [];
  const { refetchInterval, staleTime = 30_000 } = options;
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ["schedules", id],
      queryFn: () => fetchSchedule(id),
      enabled: enabled && Boolean(id),
      refetchInterval,
      staleTime,
    })),
  });
}

export function useRoutesQuery(params, enabled = true) {
  const scopeParams = useLocationQueryParams(params);
  return useQuery({
    queryKey: [
      "routes",
      "list",
      params?.date ?? "",
      scopeParams.city ?? "",
      scopeParams.state ?? "",
      params?.storeId ?? "",
      params?.status ?? "",
      params?.teamId ?? "",
    ],
    queryFn: () => fetchRoutes({ ...params, ...scopeParams }),
    enabled: enabled && Boolean(params?.date),
  });
}

export function useRoutesSearchQuery(params, enabled = true) {
  const scopeParams = useLocationQueryParams(params);
  const search = params?.q?.trim() ?? "";
  return useQuery({
    queryKey: [
      "routes",
      "search",
      search,
      params?.fromDate ?? "",
      params?.toDate ?? "",
      scopeParams.city ?? "",
      scopeParams.state ?? "",
      params?.page ?? 1,
    ],
    queryFn: () =>
      fetchRoutesSearch({
        ...params,
        ...scopeParams,
        q: search,
      }),
    enabled: enabled && Boolean(params?.fromDate) && Boolean(params?.toDate),
  });
}

export function useRouteQuery(id, enabled = true, options = {}) {
  const { refetchInterval } = options;
  return useQuery({
    queryKey: ["routes", id],
    queryFn: () => fetchRoute(id),
    enabled: enabled && Boolean(id),
    refetchInterval,
  });
}

export function useAvailableDriversQuery(teamId, params, enabled = true) {
  return useQuery({
    queryKey: [
      "available-drivers",
      teamId,
      params?.date,
      params?.arrivalTime,
      params?.departureTime,
    ],
    queryFn: () => fetchAvailableDrivers(teamId, params),
    enabled: enabled && Boolean(teamId && params?.date),
  });
}

export function useCreateStoreMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStore,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores"] }),
  });
}

export function useUpdateStoreMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => updateStore(id, body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["stores"] });
      qc.invalidateQueries({ queryKey: ["stores", vars.id] });
    },
  });
}

export function useCreateScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => updateSchedule(id, body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["schedules", vars.id] });
      qc.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}

export function useDeleteScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["routes"] });
    },
  });
}

export function useCreateRouteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRoute,
    onSuccess: (createdRoute, vars) => {
      const scheduleId = vars?.scheduleId ?? createdRoute?.scheduleId;
      patchScheduleAfterRouteCreate(qc, scheduleId, createdRoute);
      markSchedulingListsStale(qc);
    },
  });
}

export function useUpdateRouteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, body }) => updateRoute(routeId, body),
    onSuccess: (updatedRoute, vars) => {
      const scheduleId = vars?.scheduleId ?? updatedRoute?.scheduleId;
      patchScheduleAfterRouteUpdate(qc, scheduleId, updatedRoute ?? { id: vars.routeId });
      markSchedulingListsStale(qc);
      if (vars?.routeId) {
        qc.setQueryData(["routes", vars.routeId], updatedRoute);
      }
    },
  });
}

export function useDeleteRouteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId }) => deleteRoute(routeId),
    onSuccess: (_data, vars) => {
      patchScheduleAfterRouteDelete(qc, vars?.scheduleId, vars?.routeId);
      markSchedulingListsStale(qc);
    },
  });
}

export function useCompleteRouteStopOpsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, stopId }) => completeRouteStopOps(routeId, stopId),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      if (vars?.routeId) {
        qc.invalidateQueries({ queryKey: ["routes", vars.routeId] });
      }
    },
  });
}

export function useCompleteRouteOpsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId }) => completeRouteOps(routeId),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      if (vars?.routeId) {
        qc.invalidateQueries({ queryKey: ["routes", vars.routeId] });
      }
    },
  });
}

export function useVerifyRouteDeliveryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, scheduleId }) =>
      updateRoute(routeId, {
        status: "completed",
        deliveryVerification: "verified",
      }).then((data) => ({ data, scheduleId })),
    onSuccess: (result, vars) => {
      const updatedRoute = result?.data;
      const scheduleId = vars?.scheduleId ?? result?.scheduleId ?? updatedRoute?.scheduleId;
      patchScheduleAfterRouteUpdate(qc, scheduleId, updatedRoute ?? { id: vars.routeId });
      markSchedulingListsStale(qc);
      if (vars?.routeId) {
        qc.setQueryData(["routes", vars.routeId], updatedRoute);
      }
    },
  });
}

export function useMarkRouteNotVerifiedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, scheduleId }) =>
      updateRoute(routeId, {
        status: "not_verified",
        deliveryVerification: "rejected",
      }).then((data) => ({ data, scheduleId })),
    onSuccess: (result, vars) => {
      const updatedRoute = result?.data;
      const scheduleId = vars?.scheduleId ?? result?.scheduleId ?? updatedRoute?.scheduleId;
      patchScheduleAfterRouteUpdate(qc, scheduleId, updatedRoute ?? { id: vars.routeId });
      markSchedulingListsStale(qc);
      if (vars?.routeId) {
        qc.setQueryData(["routes", vars.routeId], updatedRoute);
      }
    },
  });
}

export function useReturnRouteStopOpsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, stopId, reason, customReason }) =>
      returnRouteStopOps(routeId, stopId, { reason, customReason }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      if (vars?.routeId) {
        qc.invalidateQueries({ queryKey: ["routes", vars.routeId] });
      }
    },
  });
}

export function useUpdateRouteStopStatusOpsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, stopId, status, reason, customReason }) =>
      updateRouteStopStatusOps(routeId, stopId, { status, reason, customReason }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      if (vars?.routeId) {
        qc.invalidateQueries({ queryKey: ["routes", vars.routeId] });
      }
    },
  });
}
