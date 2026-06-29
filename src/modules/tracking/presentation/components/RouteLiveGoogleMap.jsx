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
import { isOffPlannedSegment } from "@/modules/tracking/utils/plannedSegmentTrail.js";
import { readDropoffMapCoords, readMapCoords, readPickupMapCoords } from "@/modules/tracking/utils/routeMapUtils.js";
import { geocodeAddressWithVariants } from "@/modules/tracking/utils/geocodeAddressVariants.js";
import { useGoogleDrivingRoutePath } from "@/modules/tracking/utils/drivingRoutePath.js";
import {
  RouteDriverMarker,
  RouteDropoffMarker,
  RoutePickupMarker,
} from "@/modules/tracking/presentation/components/RouteGoogleMapMarkers.jsx";
import {
  GoogleMapsKeyHelp,
  useGoogleMapsKeyError,
} from "@/modules/tracking/utils/googleMapsKeyError.jsx";
import { LiveTrackingMap } from "@/modules/tracking/presentation/components/LiveTrackingMap.jsx";
import "@/modules/scheduling/presentation/components/routePlanningMap.css";
import "../components/liveTracking.css";

const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 };

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
        let position = null;

        if (stop.address?.trim()) {
          position = await geocodeOne(stop.address);
        }
        if (!position) {
          position = readDropoffMapCoords(stop);
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

  const trailPath = useMemo(
    () =>
      smoothTrailForDisplay(trail ?? [])
        .map((point) => readMapCoords(point))
        .filter(Boolean),
    [trail]
  );

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

  const driverMarkerPoint =
    driverPoint ?? (trailPath.length >= 1 ? trailPath[trailPath.length - 1] : null);

  const greyPath = segmentPolyline.length >= 2 ? segmentPolyline : plannedPath;
  const actualTrailPath = trailPath;

  const offRoute = useMemo(() => {
    const latest = driverMarkerPoint ?? (trail.length ? trail[trail.length - 1] : null);
    return isOffPlannedSegment(latest, segmentPolyline);
  }, [driverMarkerPoint, trail, segmentPolyline]);

  useEffect(() => {
    onOffRouteChange?.(offRoute);
  }, [offRoute, onOffRouteChange]);

  const fitPoints = useMemo(() => {
    const points = [...greyPath, ...actualTrailPath];
    if (driverMarkerPoint) points.push(driverMarkerPoint);
    return points;
  }, [greyPath, actualTrailPath, driverMarkerPoint]);

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

      {greyPath.length >= 2 ? (
        <Polyline
          path={greyPath}
          strokeColor="#94a3b8"
          strokeOpacity={0.85}
          strokeWeight={4}
        />
      ) : null}

      {actualTrailPath.length >= 2 ? (
        <Polyline
          path={actualTrailPath}
          strokeColor="#2563eb"
          strokeOpacity={0.9}
          strokeWeight={5}
          geodesic
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
          Driver is off the planned route — blue line shows their actual GPS track.
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
          />
        </APIProvider>
      </div>
      <div className="route-planning-map-legend mt-2">
        <span className="route-planning-map-legend-item">
          <span className="route-planning-map-legend-dot route-planning-map-legend-dot--pickup" />
          Pickup (store) — green <strong>P</strong>
        </span>
        <span className="route-planning-map-legend-item">
          <span className="route-planning-map-legend-dot route-planning-map-legend-dot--dropoff" />
          Dropoffs — blue <strong>1, 2, 3…</strong>
        </span>
        <span className="route-planning-map-legend-item">
          <span
            className="route-planning-map-legend-dot"
            style={{ background: "#ea580c" }}
          />
          Driver live — orange <strong>D</strong>
        </span>
        <span className="route-planning-map-legend-item">
          <span
            className="route-planning-map-legend-dot"
            style={{ background: "#94a3b8" }}
          />
          Planned route to next stop
        </span>
        <span className="route-planning-map-legend-item">
          <span
            className="route-planning-map-legend-dot"
            style={{ background: "#2563eb", opacity: 0.5 }}
          />
          Actual driver GPS track
        </span>
      </div>
    </div>
  );
}
