import { useCallback, useEffect, useMemo, useState } from "react";
import {
  APIProvider,
  Map,
  Polyline,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { CONFIG } from "@/shared/utils/constants.js";
import { smoothTrailForDisplay } from "@/modules/tracking/utils/smoothTrail.js";
import {
  buildSegmentProgressPaths,
  inferProgressIndexFromTrail,
  isOffPlannedSegment,
} from "@/modules/tracking/utils/plannedSegmentTrail.js";
import {
  collectRouteAnchorPoints,
  filterMapPathPoints,
  filterTrailOutliers,
  TRAIL_DISPLAY_MAX_JUMP_M,
  polylineEndsNearTarget,
} from "@/modules/tracking/utils/mapPathFilters.js";
import { readDropoffMapCoords, readMapCoords, readPickupMapCoords } from "@/modules/tracking/utils/routeMapUtils.js";
import { geocodeAddressWithVariants } from "@/modules/tracking/utils/geocodeAddressVariants.js";
import { useGoogleDrivingRoutePath } from "@/modules/tracking/utils/drivingRoutePath.js";
import {
  RouteDriverMarker,
  RouteDropoffMarker,
  RoutePickupMarker,
  RouteStartMarker,
} from "@/modules/tracking/presentation/components/RouteGoogleMapMarkers.jsx";
import {
  GoogleMapsKeyHelp,
  useGoogleMapsKeyError,
} from "@/modules/tracking/utils/googleMapsKeyError.jsx";
import { LiveTrackingMap } from "@/modules/tracking/presentation/components/LiveTrackingMap.jsx";
import "@/modules/scheduling/presentation/components/routePlanningMap.css";
import "../components/liveTracking.css";

const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 };

/** Dashed grey polyline for off-route planned segment. */
const OFF_ROUTE_PLANNED_LINE = {
  strokeColor: "#94a3b8",
  strokeOpacity: 0,
  strokeWeight: 4,
  icons: [
    {
      icon: { path: "M 0,-1 0,1", strokeOpacity: 0.65, scale: 3 },
      offset: "0",
      repeat: "16px",
    },
  ],
};

function FitMapToPoints({ points, followDriver, driverPoint }) {
  const map = useMap();
  const pointsKey = JSON.stringify(points);

  useEffect(() => {
    if (!map || points.length === 0) return;

    if (followDriver && driverPoint) {
      map.panTo(driverPoint);
      return;
    }

    const parsed = JSON.parse(pointsKey);
    if (parsed.length === 1) {
      map.setCenter(parsed[0]);
      map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const point of parsed) {
      bounds.extend(point);
    }
    map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
  }, [map, pointsKey, points.length, followDriver, driverPoint]);

  return null;
}

function resolveDropoffsFromApi(dropoffs) {
  return dropoffs
    .map((stop, index) => {
      const position = readDropoffMapCoords(stop);
      if (!position) return null;
      return {
        ...stop,
        position,
        sequence: stop.sequence ?? index + 1,
      };
    })
    .filter(Boolean);
}

function LiveRouteMapLayers({
  pickup,
  dropoffs,
  driverLocation,
  driverName,
  trail,
  followDriver,
  geocodeContext = {},
  onResolvedCounts,
  onOffRouteChange,
  plannedSegment = null,
  progressIndex = null,
}) {
  const geocoding = useMapsLibrary("geocoding");
  const [resolvedPickup, setResolvedPickup] = useState(() => {
    const position = readPickupMapCoords(pickup);
    return position ? { ...pickup, position } : null;
  });
  const [resolvedDropoffs, setResolvedDropoffs] = useState(() => resolveDropoffsFromApi(dropoffs));

  const addressKey = useMemo(
    () =>
      JSON.stringify({
        pickup: pickup?.address ?? "",
        dropoffs: dropoffs.map((stop) => stop.address ?? ""),
        city: geocodeContext.city ?? "",
        state: geocodeContext.state ?? "",
      }),
    [pickup?.address, dropoffs, geocodeContext.city, geocodeContext.state]
  );

  useEffect(() => {
    setResolvedDropoffs(resolveDropoffsFromApi(dropoffs));
    const pickupPosition = readPickupMapCoords(pickup);
    setResolvedPickup(pickupPosition ? { ...pickup, position: pickupPosition } : null);
  }, [addressKey, pickup, dropoffs]);

  useEffect(() => {
    if (!geocoding) return undefined;

    let cancelled = false;
    const geocoder = new geocoding.Geocoder();

    async function geocodeOne(address) {
      return geocodeAddressWithVariants(geocoder, address, geocodeContext);
    }

    async function run() {
      const pickupCoords = readPickupMapCoords(pickup);
      let nextPickup = pickupCoords;
      if (!nextPickup && pickup?.address?.trim()) {
        nextPickup = await geocodeOne(pickup.address);
      }

      const nextDropoffs = [];
      for (let index = 0; index < dropoffs.length; index += 1) {
        const stop = dropoffs[index];
        const sequence = stop.sequence ?? index + 1;
        let position = readDropoffMapCoords(stop);

        if (!position && stop.address?.trim()) {
          position = await geocodeOne(stop.address);
        }

        if (position) {
          nextDropoffs.push({
            ...stop,
            position,
            sequence,
          });
        }
      }

      if (cancelled) return;
      setResolvedPickup(nextPickup ? { ...pickup, position: nextPickup } : null);
      setResolvedDropoffs(nextDropoffs);
      onResolvedCounts?.({
        totalDropoffs: dropoffs.length,
        mappedDropoffs: nextDropoffs.length,
      });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [geocoding, addressKey, pickup, dropoffs, geocodeContext, onResolvedCounts]);

  const driverPoint = readMapCoords(driverLocation);

  const routeStartPoint = useMemo(() => {
    if (!trail?.length) return null;
    return readMapCoords(trail[0]);
  }, [trail]);

  const routeAnchors = useMemo(() => {
    const pendingDropoff = resolvedDropoffs[0] ?? null;
    return collectRouteAnchorPoints({
      pickup: resolvedPickup,
      dropoffs: pendingDropoff ? [pendingDropoff] : resolvedDropoffs,
      driverPoint,
    });
  }, [resolvedPickup, resolvedDropoffs, driverPoint]);

  const straightPath = useMemo(() => {
    const path = [];
    if (resolvedPickup?.position) path.push(resolvedPickup.position);
    for (const stop of resolvedDropoffs) {
      if (stop.position) path.push(stop.position);
    }
    return path;
  }, [resolvedPickup, resolvedDropoffs]);

  const plannedPath = useGoogleDrivingRoutePath(straightPath);

  const segmentPolyline = useMemo(() => {
    if (Array.isArray(plannedSegment?.polyline) && plannedSegment.polyline.length >= 2) {
      return plannedSegment.polyline
        .map((point) => readMapCoords(point))
        .filter(Boolean);
    }
    return [];
  }, [plannedSegment]);

  const nextStopPosition = resolvedDropoffs[0]?.position ?? null;

  const trustedSegmentPolyline = useMemo(() => {
    if (segmentPolyline.length < 2) return [];
    if (!nextStopPosition) return segmentPolyline;
    return polylineEndsNearTarget(segmentPolyline, nextStopPosition)
      ? segmentPolyline
      : [];
  }, [segmentPolyline, nextStopPosition]);

  const latestRawPoint = useMemo(() => {
    if (driverPoint) return driverPoint;
    if (!trail?.length) return null;
    return readMapCoords(trail[trail.length - 1]);
  }, [driverPoint, trail]);

  const offRoute = useMemo(() => {
    const segmentForCheck = trustedSegmentPolyline.length >= 2 ? trustedSegmentPolyline : [];
    return isOffPlannedSegment(latestRawPoint, segmentForCheck);
  }, [latestRawPoint, trustedSegmentPolyline]);

  useEffect(() => {
    onOffRouteChange?.(offRoute);
  }, [offRoute, onOffRouteChange]);

  const effectiveProgressIndex = useMemo(() => {
    if (typeof progressIndex === "number" && Number.isFinite(progressIndex)) {
      return progressIndex;
    }
    if (trustedSegmentPolyline.length >= 2 && trail?.length) {
      return inferProgressIndexFromTrail(trustedSegmentPolyline, trail);
    }
    return 0;
  }, [progressIndex, trustedSegmentPolyline, trail]);

  const { remainingPath } = useMemo(() => {
    if (offRoute || trustedSegmentPolyline.length < 2) {
      return { remainingPath: [] };
    }
    return buildSegmentProgressPaths(trustedSegmentPolyline, effectiveProgressIndex);
  }, [offRoute, trustedSegmentPolyline, effectiveProgressIndex]);

  const actualTrailPath = useMemo(
    () =>
      smoothTrailForDisplay(filterTrailOutliers(trail ?? [], TRAIL_DISPLAY_MAX_JUMP_M))
        .map((point) => readMapCoords(point))
        .filter(Boolean),
    [trail]
  );

  const offRoutePlannedPath =
    offRoute && trustedSegmentPolyline.length >= 2 ? trustedSegmentPolyline : [];

  const onRouteRemainingPath =
    !offRoute && remainingPath.length >= 2
      ? remainingPath
      : !offRoute && trustedSegmentPolyline.length < 2 && plannedPath.length >= 2
        ? plannedPath
        : [];

  const driverMarkerPoint = useMemo(() => {
    return (
      latestRawPoint ??
      (actualTrailPath.length >= 1 ? actualTrailPath[actualTrailPath.length - 1] : null)
    );
  }, [latestRawPoint, actualTrailPath]);

  const fitPoints = useMemo(() => {
    const paths = [
      ...filterMapPathPoints(onRouteRemainingPath, routeAnchors),
      ...filterMapPathPoints(offRoutePlannedPath, routeAnchors),
      ...filterMapPathPoints(actualTrailPath, routeAnchors),
    ];
    if (routeStartPoint) paths.push(routeStartPoint);
    if (driverMarkerPoint) paths.push(driverMarkerPoint);
    for (const anchor of routeAnchors) paths.push(anchor);
    return paths;
  }, [
    onRouteRemainingPath,
    offRoutePlannedPath,
    actualTrailPath,
    routeStartPoint,
    driverMarkerPoint,
    routeAnchors,
  ]);

  const center = fitPoints[0] ?? DEFAULT_CENTER;

  return (
    <Map
      mapId={CONFIG.GOOGLE_MAPS_MAP_ID}
      defaultCenter={center}
      defaultZoom={fitPoints.length <= 1 ? 13 : 11}
      gestureHandling="greedy"
      disableDefaultUI={false}
      fullscreenControl
      mapTypeControl={false}
      streetViewControl={false}
      style={{ width: "100%", height: "100%" }}
    >
      <FitMapToPoints
        points={fitPoints}
        followDriver={followDriver}
        driverPoint={driverMarkerPoint}
      />

      {resolvedPickup?.position ? (
        <RoutePickupMarker
          position={resolvedPickup.position}
          title={resolvedPickup.name || "Store / pickup"}
        />
      ) : null}

      {routeStartPoint ? (
        <RouteStartMarker position={routeStartPoint} title="Route start" />
      ) : null}

      {resolvedDropoffs.map((stop) =>
        stop.position ? (
          <RouteDropoffMarker
            key={stop.id ?? `stop-${stop.sequence}`}
            position={stop.position}
            sequence={stop.sequence}
            title={stop.name || `Stop ${stop.sequence}`}
          />
        ) : null
      )}

      {driverMarkerPoint ? (
        <RouteDriverMarker
          position={driverMarkerPoint}
          title={driverName ? `${driverName} (live)` : "Driver (live)"}
        />
      ) : null}

      {!offRoute && onRouteRemainingPath.length >= 2 ? (
        <Polyline
          path={filterMapPathPoints(onRouteRemainingPath, routeAnchors)}
          strokeColor="#94a3b8"
          strokeOpacity={0.85}
          strokeWeight={4}
        />
      ) : null}

      {offRoute && offRoutePlannedPath.length >= 2 ? (
        <Polyline
          path={filterMapPathPoints(offRoutePlannedPath, routeAnchors)}
          {...OFF_ROUTE_PLANNED_LINE}
        />
      ) : null}

      {actualTrailPath.length >= 2 ? (
        <Polyline
          path={actualTrailPath}
          strokeColor="#2563eb"
          strokeOpacity={0.9}
          strokeWeight={5}
        />
      ) : null}
    </Map>
  );
}

export function RouteLiveGoogleMap({
  pickup,
  dropoffs = [],
  driverLocation,
  driverName,
  trail = [],
  followDriver = false,
  geocodeContext = {},
  className = "",
  plannedSegment = null,
  progressIndex = null,
  isLive = true,
}) {
  const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;
  const keyFailed = useGoogleMapsKeyError(Boolean(apiKey));
  const [mappedDropoffs, setMappedDropoffs] = useState(null);
  const [offRoute, setOffRoute] = useState(false);
  const handleResolvedCounts = useCallback(({ mappedDropoffs: mapped }) => {
    setMappedDropoffs(mapped);
  }, []);
  const handleOffRouteChange = useCallback((value) => {
    setOffRoute(Boolean(value));
  }, []);
  const hasRoutePoints =
    Boolean(pickup?.address?.trim()) ||
    dropoffs.some((stop) => stop.address?.trim()) ||
    readMapCoords(driverLocation) ||
    (trail?.length >= 1);

  const mapDrivers = driverLocation
    ? [
        {
          id: "driver",
          driverName,
          driverLocation,
        },
      ]
    : [];

  if (!apiKey || keyFailed) {
    return (
      <div className={`space-y-3 ${className}`.trim()}>
        <GoogleMapsKeyHelp />
        {hasRoutePoints ? (
          <>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Showing OpenStreetMap fallback until a valid Google Maps key is configured.
            </p>
            <LiveTrackingMap
              drivers={mapDrivers}
              trail={trail}
              routeStart={trail?.length ? trail[0] : null}
              stops={dropoffs}
              pickup={pickup}
            />
          </>
        ) : null}
      </div>
    );
  }

  if (!hasRoutePoints) {
    return (
      <div className={`live-tracking-map route-live-map-empty ${className}`.trim()}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No route locations yet. Add pickup and stops on the route spreadsheet.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {mappedDropoffs != null && mappedDropoffs < dropoffs.length ? (
        <div className="ops-banner ops-banner--warning mb-2 text-xs">
          {mappedDropoffs} of {dropoffs.length} stop(s) on the map. Missing addresses could not be
          located — check spelling or re-save the route.
        </div>
      ) : null}
      {isLive && offRoute ? (
        <div className="ops-banner ops-banner--warning mb-2 text-xs">
          Driver is off the planned route — grey dashed line is the planned path; blue shows where
          they actually drove.
        </div>
      ) : null}
      <div className="live-tracking-map route-live-google-map">
        <APIProvider apiKey={apiKey} libraries={["geocoding"]}>
          <LiveRouteMapLayers
            pickup={pickup}
            dropoffs={dropoffs}
            driverLocation={driverLocation}
            driverName={driverName}
            trail={trail}
            followDriver={followDriver}
            geocodeContext={geocodeContext}
            onResolvedCounts={handleResolvedCounts}
            onOffRouteChange={handleOffRouteChange}
            plannedSegment={plannedSegment}
            progressIndex={progressIndex}
          />
        </APIProvider>
      </div>
      <div className="route-planning-map-legend mt-2">
        <span className="route-planning-map-legend-item">
          <span className="route-planning-map-legend-dot route-planning-map-legend-dot--pickup" />
          Pickup (store) — green <strong>P</strong>
        </span>
        <span className="route-planning-map-legend-item">
          <span
            className="route-planning-map-legend-dot"
            style={{ background: "#15803d" }}
          />
          Route start — dark green <strong>S</strong>
        </span>
        <span className="route-planning-map-legend-item">
          <span className="route-planning-map-legend-dot route-planning-map-legend-dot--dropoff" />
          Dropoffs — blue <strong>1, 2, 3…</strong>
        </span>
        <span className="route-planning-map-legend-item">
          <span
            className="route-planning-map-legend-dot route-planning-map-legend-dot--driver"
          />
          Driver live — red pulsing marker
        </span>
        <span className="route-planning-map-legend-item">
          <span
            className="route-planning-map-legend-dot"
            style={{ background: "#94a3b8" }}
          />
          Planned route ahead (grey)
        </span>
        <span className="route-planning-map-legend-item">
          <span
            className="route-planning-map-legend-dot"
            style={{ background: "#2563eb" }}
          />
          Driver track — where they went (blue)
        </span>
        <span className="route-planning-map-legend-item">
          <span className="route-planning-map-legend-dot route-planning-map-legend-dot--planned-dashed" />
          Planned route when off-track (dashed)
        </span>
      </div>
    </div>
  );
}
