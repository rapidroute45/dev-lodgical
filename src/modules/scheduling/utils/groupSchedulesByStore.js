function scheduleStoreId(schedule) {
  return schedule.storeId ?? schedule.store?.id ?? "";
}

/** Merge list rows that share the same store on the same date into one card. */
export function groupSchedulesByStore(schedules) {
  const map = new Map();

  for (const schedule of schedules) {
    const storeId = scheduleStoreId(schedule);
    const date = schedule.date ?? "";
    const key = `${storeId}|${date}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        storeId,
        date,
        store: schedule.store,
        city: schedule.city,
        state: schedule.state,
        schedules: [],
      });
    }

    map.get(key).schedules.push(schedule);
  }

  return Array.from(map.values()).map((group) => {
    const routeCount = group.schedules.reduce((n, s) => n + (s.routeCount ?? 0), 0);
    const pendingRouteCount = group.schedules.reduce(
      (n, s) => n + (s.pendingRouteCount ?? 0),
      0
    );
    const primary =
      group.schedules.reduce((best, s) =>
        (s.routeCount ?? 0) > (best.routeCount ?? 0) ? s : best
      ) ?? group.schedules[0];

    return {
      ...group,
      routeCount,
      pendingRouteCount,
      primaryScheduleId: primary?.id,
      status: primary?.status,
      id: group.key,
    };
  });
}
