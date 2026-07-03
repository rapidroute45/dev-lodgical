/** Patch React Query schedule caches without refetching full schedule documents. */

export function patchScheduleAfterRouteCreate(queryClient, scheduleId, route) {
  if (!scheduleId || !route?.id) return;

  queryClient.setQueryData(["schedules", scheduleId], (schedule) => {
    if (!schedule) return schedule;
    const routes = schedule.routes ?? [];
    if (routes.some((item) => item.id === route.id)) return schedule;
    const nextRoutes = [...routes, route];
    return {
      ...schedule,
      routes: nextRoutes,
      routeCount: nextRoutes.length,
    };
  });
}

export function patchScheduleAfterRouteUpdate(queryClient, scheduleId, route) {
  if (!scheduleId || !route?.id) return;

  queryClient.setQueryData(["schedules", scheduleId], (schedule) => {
    if (!schedule) return schedule;
    const routes = (schedule.routes ?? []).map((item) =>
      item.id === route.id ? { ...item, ...route } : item
    );
    return { ...schedule, routes };
  });
}

export function patchScheduleAfterRouteDelete(queryClient, scheduleId, routeId) {
  if (!scheduleId || !routeId) return;

  queryClient.setQueryData(["schedules", scheduleId], (schedule) => {
    if (!schedule) return schedule;
    const nextRoutes = (schedule.routes ?? []).filter((item) => item.id !== routeId);
    return {
      ...schedule,
      routes: nextRoutes,
      routeCount: nextRoutes.length,
    };
  });
}

/** Mark list/dashboard queries stale without triggering network refetches. */
export function markSchedulingListsStale(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["schedules", "list"], refetchType: "none" });
  queryClient.invalidateQueries({ queryKey: ["routes", "list"], refetchType: "none" });
  queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "none" });
}
