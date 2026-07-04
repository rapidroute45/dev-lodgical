import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { useRouteTrackingQuery, useRoutePlannedSegmentQuery } from "@/modules/tracking/infrastructure/api/tracking.queries.js";
import { useTrackingSocket } from "@/modules/tracking/application/TrackingSocketProvider.jsx";
import { RouteLiveGoogleMap } from "@/modules/tracking/presentation/components/RouteLiveGoogleMap.jsx";
import {
  formatStationaryLabel,
  isDriverStationary,
} from "@/modules/tracking/utils/stationaryStatus.js";
import {
  formatBreakLabel,
  isDriverOnBreak,
} from "@/modules/tracking/utils/breakStatus.js";
import { getLocationSharingStatus, getStaleLocationHint, getDriverLocationLastPingAt } from "@/modules/tracking/utils/locationSharingStatus.js";
import { isCompletedRouteTracking } from "@/modules/tracking/utils/routeTrackingAccess.js";
import { applyDriverLocationPayloadToTrail, mergeDriverLocationFromPoll, mergeTrailFromPoll } from "@/modules/tracking/utils/locationTrail.js";
import { logGps } from "@/modules/tracking/utils/gpsTrackingDebug.js";
import { formatRouteStatus, routeStatusClass } from "@/modules/scheduling/utils/scheduleStatus.js";
import { todayIsoDate } from "@/shared/utils/time.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import "../components/liveTracking.css";

function formatLastSeen(updatedAt) {
  if (!updatedAt) return "—";
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function locationBadgeVariant(mode) {
  if (mode === "shared" || mode === "background") return "done";
  if (mode === "foreground") return "active";
  return "pending";
}

export function RouteTrackingScreen() {
  const { id: routeId } = useParams();
  const { subscribe, connected } = useTrackingSocket();
  const { data, isLoading, refetch } = useRouteTrackingQuery(routeId, Boolean(routeId), {
    socketConnected: connected,
  });
  const { data: plannedSegment, refetch: refetchPlannedSegment } = useRoutePlannedSegmentQuery(routeId, Boolean(routeId));

  const [driverLocation, setDriverLocation] = useState(null);
  const [trail, setTrail] = useState([]);
  const [progress, setProgress] = useState(null);
  const [dwell, setDwell] = useState(null);
  const [driverBreak, setDriverBreak] = useState(null);
  const [breakTick, setBreakTick] = useState(0);
  const [followDriver, setFollowDriver] = useState(false);
  const [segmentProgressIndex, setSegmentProgressIndex] = useState(null);
  const [rerouteNotice, setRerouteNotice] = useState(null);
  const [trackingStats, setTrackingStats] = useState(null);

  useEffect(() => {
    if (!data) return;
    setDriverLocation((prev) => mergeDriverLocationFromPoll(prev, data.route?.driverLocation ?? null));
    setTrail((prev) => mergeTrailFromPoll(prev, data.locationTrail ?? []));
    setProgress(data.progress ?? null);
    setTrackingStats(data.tracking ?? null);
    logGps("web.tracking.poll", {
      routeId,
      tracking: data.tracking ?? null,
      trailPointCount: data.locationTrail?.length ?? 0,
      driverLocation: data.route?.driverLocation ?? null,
    });
    setSegmentProgressIndex(
      data.driverRouteProgressIndex ?? data.route?.driverRouteProgressIndex ?? null
    );
    setDriverBreak(data.route?.driverBreak ?? null);
  }, [data]);

  useEffect(() => {
    if (!isDriverOnBreak(driverBreak)) return undefined;
    const timer = window.setInterval(() => setBreakTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [driverBreak?.endsAt]);

  useEffect(() => {
    if (!subscribe || !routeId) return undefined;
    return subscribe((payload) => {
      if (payload?.type === "route:updated" && payload.routeId === routeId) {
        void refetch();
        return;
      }
      if (payload?.type === "driver:stationary" && payload.routeId === routeId) {
        setDwell({
          active: true,
          minutes: payload.dwellMinutes,
          alertSent: true,
        });
        return;
      }
      if (payload?.type === "driver:break-started" && payload.routeId === routeId) {
        setDriverBreak({
          active: true,
          startedAt: payload.startedAt,
          endsAt: payload.endsAt,
          durationMinutes: payload.durationMinutes,
          remainingMinutes: Math.max(
            0,
            Math.ceil((new Date(payload.endsAt).getTime() - Date.now()) / 60_000)
          ),
        });
        return;
      }
      if (payload?.type === "driver:break-ended" && payload.routeId === routeId) {
        setDriverBreak(null);
        return;
      }
      if (payload?.type === "driver:segment-rerouted" && payload.routeId === routeId) {
        setSegmentProgressIndex(payload.progressIndex ?? 0);
        setRerouteNotice("Driver was rerouted to a new path toward the next stop.");
        void refetchPlannedSegment();
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
      if (typeof payload.progressIndex === "number") {
        setSegmentProgressIndex(payload.progressIndex);
      }
      if (payload.progress) setProgress(payload.progress);
      if (payload.dwell) setDwell(payload.dwell);
      if (payload.break !== undefined) setDriverBreak(payload.break);
      if (payload.tracking) {
        setTrackingStats(payload.tracking);
        logGps("web.tracking.socketUpdate", {
          routeId,
          tracking: payload.tracking,
          lat: payload.lat,
          lng: payload.lng,
          recordedAt: payload.recordedAt,
        });
      }
    });
  }, [subscribe, routeId, refetch, refetchPlannedSegment]);

  void breakTick;

  const route = data?.route;
  const isCompleted = isCompletedRouteTracking(route?.status);
  const hasTrail = trail.length >= 2;
  const pickup = data?.pickup ?? route?.pickup ?? null;
  const dropoffs = data?.dropoffs ?? [];
  const geocodeContext = useMemo(
    () => ({
      city: data?.scheduleCity ?? route?.location ?? "",
      state: data?.scheduleState ?? "",
      country:
        data?.scheduleState &&
        /^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)$/i.test(
          data.scheduleState.trim()
        )
          ? "US"
          : "Pakistan",
    }),
    [data?.scheduleCity, data?.scheduleState, route?.location]
  );
  const stationaryLabel = formatStationaryLabel(dwell);
  const isStationary = isDriverStationary(dwell);
  const breakLabel = formatBreakLabel(driverBreak);
  const onBreak = isDriverOnBreak(driverBreak);
  const locationSharing = getLocationSharingStatus(driverLocation);
  const staleLocationHint = getStaleLocationHint(driverLocation);

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={`${PAGE_CONTENT} space-y-4`}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link to="/tracking" className="ops-btn p-2.5" aria-label="Back to live tracking">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                {route?.routeName ?? "Route tracking"}
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                {route?.driverName ? `${route.driverName} · ` : ""}
                {isCompleted ? "Completed route · " : connected ? "Live · " : "Polling · "}
                {isCompleted
                  ? hasTrail
                    ? "Start location recorded"
                    : "No start location"
                  : driverLocation
                    ? `Location shared ${formatLastSeen(getDriverLocationLastPingAt(driverLocation))}`
                    : "Waiting for route start location"}
                {!isCompleted && isStationary && stationaryLabel && !onBreak ? ` · ${stationaryLabel}` : ""}
                {!isCompleted && breakLabel ? ` · ${breakLabel}` : ""}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {route?.status ? (
              <span className={`ops-badge ${routeStatusClass(route.status)}`}>
                {formatRouteStatus(route.status)}
              </span>
            ) : null}
            {!isCompleted ? (
              <button
                type="button"
                onClick={() => setFollowDriver((value) => !value)}
                className={`ops-btn px-4 py-2 text-sm font-semibold ${followDriver ? "ops-btn--accent" : ""}`}
              >
                {followDriver ? "Following driver" : "Follow driver"}
              </button>
            ) : null}
            {!isCompleted && trackingStats ? (
              <span
                className="ops-badge ops-badge--active tabular-nums"
                title="GPS points received vs expected since route start"
              >
                Points: {trackingStats.pointsReceived}/{trackingStats.pointsExpected}
              </span>
            ) : null}
            <Link
              to={`/routes/${routeId}`}
              className="ops-btn px-4 py-2 text-sm font-semibold"
            >
              Route details
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="ops-skel h-[480px] rounded-2xl" />
        ) : (
          <>
            {progress ? (
              <div className="ops-panel ops-fade px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                  <p style={{ color: "var(--text)" }}>
                    <span className="font-bold">
                      {progress.completedDropoffs + progress.returnedDropoffs} /{" "}
                      {progress.totalDropoffs}
                    </span>{" "}
                    stops finished · {progress.pendingDropoffs} pending
                    {pickup?.name ? (
                      <>
                        {" "}
                        · Pickup: <strong>{pickup.name}</strong>
                      </>
                    ) : null}
                  </p>
                  <span
                    className={`ops-badge ops-badge--${locationBadgeVariant(locationSharing.mode)}`}
                    title="Location shared once when the driver started the route"
                  >
                    {locationSharing.mode === "shared" ? (
                      <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "var(--green)" }} />
                    ) : null}
                    Location · {locationSharing.label}
                  </span>
                </div>
              </div>
            ) : null}

            {isCompleted ? (
              <div className="ops-banner ops-banner--success">
                Route completed — map shows where the driver traveled and all stops.
              </div>
            ) : null}

            {staleLocationHint && !isCompleted ? (
              <div className="ops-banner ops-banner--warning">
                {staleLocationHint}
              </div>
            ) : null}

            {!driverLocation && !isCompleted ? (
              <div className="ops-banner ops-banner--warning">
                Waiting for the driver to start the route and share their current location once.
                Pickup and stops still appear on the map.
              </div>
            ) : null}

            {rerouteNotice && !isCompleted ? (
              <div className="ops-banner ops-banner--warning mb-2">
                {rerouteNotice}
              </div>
            ) : null}

            {driverLocation && !isCompleted ? (
              <div className="ops-banner ops-banner--success">
                Last GPS: {Number(driverLocation.lat).toFixed(6)},{" "}
                {Number(driverLocation.lng).toFixed(6)} ·{" "}
                {formatLastSeen(getDriverLocationLastPingAt(driverLocation))}
                {hasTrail ? ` · ${trail.length} points on track` : ""}
              </div>
            ) : null}

            {isCompleted && !hasTrail && !driverLocation ? (
              <div className="ops-banner ops-banner--warning">
                No start location was recorded for this route. Pickup and stops are still shown on the map.
              </div>
            ) : null}

            <RouteLiveGoogleMap
              pickup={pickup}
              dropoffs={dropoffs}
              driverLocation={driverLocation}
              driverName={route?.driverName}
              trail={trail}
              followDriver={followDriver}
              geocodeContext={geocodeContext}
              plannedSegment={plannedSegment}
              progressIndex={segmentProgressIndex ?? plannedSegment?.progressIndex ?? null}
              isLive={!isCompleted}
            />

            <div className="ops-panel ops-fade overflow-hidden">
              <div className="ops-panel__head px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                  Stops
                </p>
              </div>
              <ul className="divide-y p-5" style={{ borderColor: "var(--border)" }}>
                {dropoffs.map((stop) => (
                  <li key={stop.id ?? stop.sequence} className="flex items-start justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                        #{stop.sequence} {stop.name}
                      </p>
                      <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{stop.address}</p>
                    </div>
                    <span className="ops-badge ops-badge--muted shrink-0 uppercase">
                      {stop.status ?? "pending"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
