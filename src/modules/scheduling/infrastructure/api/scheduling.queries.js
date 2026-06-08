import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRoute,
  createSchedule,
  createStore,
  deleteRoute,
  deleteSchedule,
  fetchAvailableDrivers,
  fetchCities,
  fetchRoute,
  fetchRoutes,
  fetchSchedule,
  fetchSchedules,
  fetchStore,
  fetchStores,
  fetchTeams,
  updateRoute,
  updateSchedule,
  updateStore,
} from "./scheduling.api.js";

export function useStoresQuery(enabled = true, params) {
  return useQuery({
    queryKey: ["stores", params?.city ?? "", params?.state ?? "", params?.activeOnly ?? "active"],
    queryFn: () => fetchStores({ activeOnly: true, ...params }),
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

export function useCitiesQuery(enabled = true) {
  return useQuery({
    queryKey: ["cities"],
    queryFn: fetchCities,
    enabled,
  });
}

export function useSchedulesQuery(filters, enabled = true) {
  const date = typeof filters === "string" ? filters : filters?.date;
  return useQuery({
    queryKey: [
      "schedules",
      "list",
      date,
      filters?.city ?? "",
      filters?.state ?? "",
      filters?.storeId ?? "",
      filters?.status ?? "",
    ],
    queryFn: () =>
      fetchSchedules({
        date,
        city: filters?.city,
        state: filters?.state,
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

export function useRoutesQuery(params, enabled = true) {
  return useQuery({
    queryKey: [
      "routes",
      "list",
      params?.date ?? "",
      params?.city ?? "",
      params?.state ?? "",
      params?.storeId ?? "",
      params?.status ?? "",
      params?.teamId ?? "",
    ],
    queryFn: () => fetchRoutes(params),
    enabled: enabled && Boolean(params?.date),
  });
}

export function useRouteQuery(id, enabled = true) {
  return useQuery({
    queryKey: ["routes", id],
    queryFn: () => fetchRoute(id),
    enabled: enabled && Boolean(id),
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
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (vars?.scheduleId) {
        qc.invalidateQueries({ queryKey: ["schedules", vars.scheduleId] });
      }
    },
  });
}

export function useUpdateRouteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, body }) => updateRoute(routeId, body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      if (vars?.scheduleId) {
        qc.invalidateQueries({ queryKey: ["schedules", vars.scheduleId] });
      }
      if (vars?.routeId) {
        qc.invalidateQueries({ queryKey: ["routes", vars.routeId] });
      }
    },
  });
}

export function useDeleteRouteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId }) => deleteRoute(routeId),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["routes"] });
      if (vars?.scheduleId) {
        qc.invalidateQueries({ queryKey: ["schedules", vars.scheduleId] });
      }
    },
  });
}
