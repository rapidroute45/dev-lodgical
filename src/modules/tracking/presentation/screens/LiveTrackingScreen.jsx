import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { ScopedEmptyHint } from "@/modules/manager-home/presentation/components/ScopedEmptyHint.jsx";
import { useLiveRoutesQuery, useRouteTrackingQuery } from "@/modules/tracking/infrastructure/api/tracking.queries.js";
import { useRoutesQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { useTrackingSocket } from "@/modules/tracking/application/TrackingSocketProvider.jsx";
import { LiveTrackingMap } from "@/modules/tracking/presentation/components/LiveTrackingMap.jsx";
import { RouteLiveGoogleMap } from "@/modules/tracking/presentation/components/RouteLiveGoogleMap.jsx";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
import { useOpsLocationScope } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";
import { useScopeMapCenter } from "@/modules/tracking/presentation/hooks/useScopeMapCenter.js";
import { countryForState } from "@/modules/tracking/utils/cityMapCenter.js";
import { formatDisplayDate } from "@/shared/utils/time.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { formatRouteStatus, routeStatusClass } from "@/modules/scheduling/utils/scheduleStatus.js";
import { getLocationSharingStatus, getDriverLocationLastPingAt } from "@/modules/tracking/utils/locationSharingStatus.js";
import {
  isCompletedRouteTracking,
  isLiveRouteTracking,
  matchesRouteTrackingFilter,
} from "@/modules/tracking/utils/routeTrackingAccess.js";
import { applyDriverLocationPayloadToTrail } from "@/modules/tracking/utils/locationTrail.js";
import {
  formatStationaryLabel,
  isDriverStationary,
} from "@/modules/tracking/utils/stationaryStatus.js";
import {
  formatBreakLabel,
  isDriverOnBreak,
} from "@/modules/tracking/utils/breakStatus.js";
import "../components/liveTracking.css";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "in_progress", label: "In progress" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
];

const STATUS_SORT_ORDER = {
  in_progress: 0,
  active: 1,
  assigned: 2,
  pending: 3,
  completed: 4,
  not_verified: 5,
  cancelled: 6,
};

function formatLastSeen(updatedAt) {
  if (!updatedAt) return "No location yet";
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function locationBadgeVariant(mode) {
  if (mode === "shared" || mode === "background") return "done";
  if (mode === "foreground") return "active";
  return "pending";
}

function mergeLiveDriver(items, payload) {
  if (!payload?.routeId || payload.lat == null || payload.lng == null) {
    return items;
  }

  if (payload.routeCompleted || payload.status === "completed") {
    return items.filter((item) => item.id !== payload.routeId);
  }

  const index = items.findIndex((item) => item.id === payload.routeId);
  const existing = index === -1 ? null : items[index];

  const nextItem = {
    id: payload.routeId,
    routeName: payload.routeName ?? existing?.routeName,
    driverName: payload.driverName ?? existing?.driverName,
    driverId: payload.driverId ?? existing?.driverId,
    status: payload.status ?? existing?.status ?? "in_progress",
    driverLocation: {
      lat: payload.lat,
      lng: payload.lng,
      updatedAt: payload.recordedAt,
      ingestedAt: payload.ingestedAt ?? payload.recordedAt,
      sharingInBackground: Boolean(payload.backgroundSharing),
    },
    progress: payload.progress ?? existing?.progress,
    dwell: payload.dwell ?? existing?.dwell ?? null,
    driverBreak:
      payload.break ??
      payload.driverBreak ??
      existing?.driverBreak ??
      null,
    schedule: {
      city: payload.city ?? existing?.schedule?.city,
      state: payload.state ?? existing?.schedule?.state,
      storeName: payload.storeName ?? existing?.schedule?.storeName,
    },
  };

  if (index === -1) return [...items, nextItem];
  const copy = [...items];
  copy[index] = { ...copy[index], ...nextItem };
  return copy;
}

function mergeBreakUpdate(items, payload, active) {
  if (!payload?.routeId) return items;
  return items.map((item) => {
    if (item.id !== payload.routeId) return item;
    if (!active) {
      return { ...item, driverBreak: null };
    }
    const startedAt = payload.startedAt ?? item.driverBreak?.startedAt;
    const endsAt = payload.endsAt ?? item.driverBreak?.endsAt;
    const durationMinutes = payload.durationMinutes ?? item.driverBreak?.durationMinutes ?? 0;
    const remainingMinutes =
      endsAt != null
        ? Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 60_000))
        : item.driverBreak?.remainingMinutes ?? 0;
    return {
      ...item,
      driverBreak: {
        active: true,
        startedAt,
        endsAt,
        durationMinutes,
        remainingMinutes,
      },
    };
  });
}

function mergeStationaryAlert(items, payload) {
  if (!payload?.routeId) return items;
  if (payload.outsideStop !== true) return items;
  return items.map((item) => {
    if (item.id !== payload.routeId) return item;
    const startedAt = item.dwell?.startedAt ?? new Date(Date.now() - payload.dwellMinutes * 60_000).toISOString();
    return {
      ...item,
      dwell: {
        active: true,
        minutes: payload.dwellMinutes,
        alertSent: true,
        thresholdMinutes: 3,
        outsideStop: payload.outsideStop !== false,
        startedAt,
      },
    };
  });
}

function SelectedRouteMapPanel({ routeId, routeMeta, onClearSelection }) {
  const { subscribe } = useTrackingSocket();
  const { data, isLoading, refetch } = useRouteTrackingQuery(routeId, Boolean(routeId));
  const [driverLocation, setDriverLocation] = useState(null);
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    if (!data) return;
    setDriverLocation(data.route?.driverLocation ?? null);
    setTrail(data.locationTrail ?? []);
  }, [data]);

  useEffect(() => {
    if (!subscribe || !routeId) return undefined;
    return subscribe((payload) => {
      if (payload?.type === "route:updated" && payload.routeId === routeId) {
        void refetch();
        return;
      }
      if (payload?.routeId !== routeId) return;
      if (payload.lat != null && payload.lng != null) {
        setDriverLocation({
          lat: payload.lat,
          lng: payload.lng,
          updatedAt: payload.recordedAt,
          ingestedAt: payload.ingestedAt ?? payload.recordedAt,
          sharingInBackground: Boolean(payload.backgroundSharing),
        });
        setTrail((prev) => applyDriverLocationPayloadToTrail(prev, payload));
      }
    });
  }, [subscribe, routeId, refetch]);

  const route = data?.route ?? routeMeta;
  const pickup = data?.pickup ?? route?.pickup ?? null;
  const dropoffs = data?.dropoffs ?? [];
  const isCompleted = isCompletedRouteTracking(route?.status ?? routeMeta?.status);
  const geocodeContext = useMemo(() => {
    const state = data?.scheduleState ?? routeMeta?.schedule?.state ?? "";
    return {
      city: data?.scheduleCity ?? route?.location ?? routeMeta?.schedule?.city ?? "",
      state,
      country: countryForState(state),
    };
  }, [
    data?.scheduleCity,
    data?.scheduleState,
    route?.location,
    routeMeta?.schedule?.city,
    routeMeta?.schedule?.state,
  ]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>
            {route?.routeName ?? routeMeta?.routeName ?? "Route map"}
          </p>
          <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
            {route?.driverName ?? routeMeta?.driverName ?? "Driver"}
            {route?.status || routeMeta?.status
              ? ` · ${formatRouteStatus(route?.status ?? routeMeta?.status)}`
              : ""}
          </p>
        </div>
        <button type="button" onClick={onClearSelection} className="ops-btn px-3 py-1.5 text-xs font-semibold">
          All live drivers
        </button>
      </div>

      {isCompleted ? (
        <p className="text-xs font-semibold" style={{ color: "var(--green)" }}>
          Completed route — driver path and stops
        </p>
      ) : null}

      {isLoading ? (
        <div className="ops-skel live-tracking-map rounded-2xl" />
      ) : (
        <RouteLiveGoogleMap
          pickup={pickup}
          dropoffs={dropoffs}
          driverLocation={driverLocation}
          driverName={route?.driverName ?? routeMeta?.driverName}
          trail={trail}
          geocodeContext={geocodeContext}
          isLive={!isCompleted}
        />
      )}
    </div>
  );
}

export function LiveTrackingScreen() {
  const { date } = useOpsDateScope();
  const { effectiveCity, effectiveState } = useOpsLocationScope();
  const scopeMapCenter = useScopeMapCenter(effectiveCity, effectiveState);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const { connected, subscribe } = useTrackingSocket();

  const { data, isLoading, refetch, isFetching } = useLiveRoutesQuery({ date }, true);
  const { data: routesData, isLoading: routesLoading } = useRoutesQuery(
    { date, page: 1, limit: 200 },
    true
  );

  const [liveItems, setLiveItems] = useState([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    setLiveItems(data?.items ?? []);
  }, [data?.items]);

  useEffect(() => {
    const hasActiveDwell = liveItems.some((item) => item.dwell?.active);
    const hasActiveBreak = liveItems.some((item) => isDriverOnBreak(item.driverBreak));
    if (!hasActiveDwell && !hasActiveBreak) return undefined;
    const timer = window.setInterval(() => setTick((value) => value + 1), 30_000);
    return () => window.clearInterval(timer);
  }, [liveItems]);

  useEffect(() => {
    const hasActiveBreak = liveItems.some((item) => isDriverOnBreak(item.driverBreak));
    if (!hasActiveBreak) return undefined;
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [liveItems]);

  useEffect(() => {
    if (!subscribe) return undefined;
    return subscribe((payload) => {
      if (payload?.type === "route:updated") {
        void refetch();
        return;
      }
      if (payload?.type === "driver:stationary") {
        setLiveItems((prev) => mergeStationaryAlert(prev, payload));
        return;
      }
      if (payload?.type === "driver:break-started") {
        setLiveItems((prev) => mergeBreakUpdate(prev, payload, true));
        return;
      }
      if (payload?.type === "driver:break-ended") {
        setLiveItems((prev) => mergeBreakUpdate(prev, payload, false));
        return;
      }
      setLiveItems((prev) => mergeLiveDriver(prev, payload));
    });
  }, [subscribe, refetch]);

  const allRoutes = routesData?.items ?? [];

  const liveByRouteId = useMemo(() => {
    const map = new Map();
    for (const item of liveItems) map.set(item.id, item);
    return map;
  }, [liveItems]);

  const sidebarRoutes = useMemo(
    () =>
      allRoutes
        .filter((route) => matchesRouteTrackingFilter(route.status, statusFilter))
        .sort(
          (a, b) =>
            (STATUS_SORT_ORDER[a.status] ?? 9) - (STATUS_SORT_ORDER[b.status] ?? 9)
        ),
    [allRoutes, statusFilter]
  );

  const selectedSidebarRoute = useMemo(
    () => allRoutes.find((route) => route.id === selectedRouteId) ?? null,
    [allRoutes, selectedRouteId]
  );

  const statusCounts = useMemo(() => {
    const counts = { all: allRoutes.length, in_progress: 0, pending: 0, completed: 0 };
    for (const route of allRoutes) {
      if (matchesRouteTrackingFilter(route.status, "in_progress")) counts.in_progress += 1;
      if (matchesRouteTrackingFilter(route.status, "pending")) counts.pending += 1;
      if (matchesRouteTrackingFilter(route.status, "completed")) counts.completed += 1;
    }
    return counts;
  }, [allRoutes]);

  const mapDrivers = useMemo(
    () =>
      liveItems.map((item) => ({
        id: item.id,
        routeName: item.routeName,
        driverName: item.driverName,
        driverLocation: item.driverLocation,
        progress: item.progress,
      })),
    [liveItems]
  );

  const handleSelectRoute = useCallback((routeId) => {
    setSelectedRouteId(routeId ?? null);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedRouteId(null);
  }, []);

  const topBar = (
    <OpsTopBar onRefresh={refetch} refreshing={isFetching} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={`${PAGE_CONTENT} space-y-4`}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Live tracking
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
              Live drivers on map · all routes in panel · {formatDisplayDate(date)}
              {connected ? " · Live" : " · Polling"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="ops-panel ops-fade p-4">
            {selectedRouteId ? (
              <SelectedRouteMapPanel
                routeId={selectedRouteId}
                routeMeta={selectedSidebarRoute}
                onClearSelection={handleClearSelection}
              />
            ) : (
              <>
                <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                  Live drivers ({liveItems.length})
                </p>
                <LiveTrackingMap
                  drivers={mapDrivers}
                  selectedRouteId={selectedRouteId}
                  onSelectRoute={handleSelectRoute}
                  scopeCenter={scopeMapCenter}
                />
                {liveItems.length === 0 && !isLoading ? (
                  <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                    Select a route from the panel to view its map, or wait for live drivers to appear.
                  </p>
                ) : null}
              </>
            )}
          </div>

          <aside className="ops-panel ops-fade live-tracking-sidebar overflow-hidden">
            <div className="ops-panel__head px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Route maps ({sidebarRoutes.length})
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`ops-chip text-xs ${statusFilter === tab.key ? "ops-chip--active" : ""}`}
                  >
                    {tab.label} ({statusCounts[tab.key] ?? 0})
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
            {routesLoading ? (
              <div className="ops-skel h-40 rounded-2xl" />
            ) : sidebarRoutes.length === 0 ? (
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No routes for this filter on {formatDisplayDate(date)}.
                </p>
                <ScopedEmptyHint show={!routesLoading} />
              </div>
            ) : (
              <ul className="space-y-2">
                {sidebarRoutes.map((route) => {
                  const live = liveByRouteId.get(route.id);
                  const progress = live?.progress;
                  const finished =
                    progress != null
                      ? progress.completedDropoffs + progress.returnedDropoffs
                      : null;
                  const total = progress?.totalDropoffs ?? live?.stops ?? null;
                  const isActive = route.id === selectedRouteId;
                  const stationary = live ? isDriverStationary(live.dwell) : false;
                  const stationaryLabel = live ? formatStationaryLabel(live.dwell) : null;
                  const breakLabel = live ? formatBreakLabel(live.driverBreak) : null;
                  const onBreak = live ? isDriverOnBreak(live.driverBreak) : false;
                  const locationSharing = live
                    ? getLocationSharingStatus(live.driverLocation)
                    : null;
                  const isLive = isLiveRouteTracking(route.status);
                  const isCompleted = isCompletedRouteTracking(route.status);
                  const storeName = route.schedule?.store?.storeName ?? live?.schedule?.storeName;
                  const routeCity = route.schedule?.city ?? live?.schedule?.city;
                  const routeState = route.schedule?.state ?? live?.schedule?.state;

                  return (
                    <li key={route.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectRoute(route.id)}
                        className={`ops-card live-tracking-card w-full p-3 text-left ${
                          isActive ? "live-tracking-card--active" : ""
                        } ${stationary ? "live-tracking-card--stationary" : ""} ${
                          isCompleted ? "live-tracking-card--completed" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>
                            {route.driverName ?? route.driverEmail ?? "Unassigned"}
                          </p>
                          <span className={`ops-badge shrink-0 ${routeStatusClass(route.status)}`}>
                            {formatRouteStatus(route.status)}
                          </span>
                        </div>
                        <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                          {route.routeName ?? "Route"}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                          {storeName ? `${storeName} · ` : ""}
                          {routeCity ?? ""}
                          {routeState ? `, ${routeState}` : ""}
                        </p>
                        {isLive && live ? (
                          <>
                            <p
                              className="mt-2 text-xs font-semibold"
                              style={{ color: stationary ? "var(--rose)" : "var(--accent)" }}
                            >
                              {total > 0 ? `${finished}/${total} stops` : "In progress"}
                              {live.driverLocation
                                ? ` · Location ${formatLastSeen(getDriverLocationLastPingAt(live.driverLocation))}`
                                : " · No start location yet"}
                            </p>
                            {locationSharing ? (
                              <span
                                className={`ops-badge ops-badge--${locationBadgeVariant(locationSharing.mode)} mt-1`}
                              >
                                {locationSharing.mode === "shared" || locationSharing.mode === "background" ? (
                                  <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "var(--green)" }} />
                                ) : null}
                                Location · {locationSharing.label}
                              </span>
                            ) : null}
                            {stationaryLabel && !onBreak ? (
                              <p className="mt-1 text-xs font-bold" style={{ color: "var(--rose)" }}>{stationaryLabel}</p>
                            ) : null}
                            {breakLabel ? (
                              <p className="mt-1 text-xs font-bold" style={{ color: "var(--amber)" }}>{breakLabel}</p>
                            ) : null}
                          </>
                        ) : isCompleted ? (
                          <p className="mt-2 text-xs font-semibold" style={{ color: "var(--green)" }}>
                            Completed · click to view driver path
                          </p>
                        ) : route.driverId ? (
                          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                            {route.status === "active"
                              ? "Assigned · click to view route map"
                              : "Click to view route map"}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
                            Click to view stops map
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
