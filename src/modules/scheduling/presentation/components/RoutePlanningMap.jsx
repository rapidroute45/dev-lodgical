import { useEffect, useMemo, useState } from "react";
import { APIProvider, Map, Polyline, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { CONFIG } from "@/shared/utils/constants.js";
import {
  RouteDropoffMarker,
  RoutePickupMarker,
} from "@/modules/tracking/presentation/components/RouteGoogleMapMarkers.jsx";
import {
  GoogleMapsKeyHelp,
  useGoogleMapsKeyError,
} from "@/modules/tracking/utils/googleMapsKeyError.jsx";
import { geocodeAddressWithVariants } from "@/modules/tracking/utils/geocodeAddressVariants.js";
import {
  flattenTrailSegments,
  prepareDrawableTrailSegments,
  trailSegmentPolylineOptions,
} from "@/modules/tracking/utils/trailDisplay.js";
import { readDropoffMapCoords, readMapCoords, readPickupMapCoords } from "@/modules/tracking/utils/routeMapUtils.js";
import "./routePlanningMap.css";

const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 };

function FitMapToPoints({ points }) {
  const map = useMap();
  const pointsKey = JSON.stringify(points);

  useEffect(() => {
    if (!map || points.length === 0) return;
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
    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
  }, [map, pointsKey, points.length]);

  return null;
}

function GeocodedMarkers({ pickup, dropoffs, driverTrail = [], addressKey }) {
  const geocoding = useMapsLibrary("geocoding");
  const [resolvedPickup, setResolvedPickup] = useState(null);
  const [resolvedDropoffs, setResolvedDropoffs] = useState([]);
  const [loading, setLoading] = useState(false);

  const trailSegments = useMemo(
    () =>
      prepareDrawableTrailSegments(driverTrail ?? [], {
        source: "RoutePlanningMap",
        isLive: false,
      }),
    [driverTrail]
  );

  const trailPath = useMemo(
    () => flattenTrailSegments(trailSegments).map((point) => readMapCoords(point)).filter(Boolean),
    [trailSegments]
  );

  useEffect(() => {
    if (!geocoding) return undefined;

    let cancelled = false;
    const geocoder = new geocoding.Geocoder();

    async function geocodeOne(address) {
      return geocodeAddressWithVariants(geocoder, address, { country: "Pakistan" });
    }

    async function run() {
      setLoading(true);
      const pickupCoords = readPickupMapCoords(pickup);
      let nextPickup = pickupCoords;
      if (!nextPickup && pickup?.address?.trim()) {
        nextPickup = await geocodeOne(pickup.address);
      }

      const nextDropoffs = [];
      for (let index = 0; index < dropoffs.length; index += 1) {
        const stop = dropoffs[index];
        let position = readDropoffMapCoords(stop);
        if (!position && stop.address?.trim()) {
          position = await geocodeOne(stop.address);
        }
        if (position) {
          nextDropoffs.push({ ...stop, position, sequence: index + 1 });
        }
      }

      if (cancelled) return;
      setResolvedPickup(nextPickup ? { ...pickup, position: nextPickup } : null);
      setResolvedDropoffs(nextDropoffs);
      setLoading(false);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [geocoding, addressKey, pickup, dropoffs]);

  const stopPoints = useMemo(() => {
    const list = [];
    if (resolvedPickup?.position) list.push(resolvedPickup.position);
    for (const stop of resolvedDropoffs) {
      if (stop.position) list.push(stop.position);
    }
    return list;
  }, [resolvedPickup, resolvedDropoffs]);

  const fitPoints = useMemo(
    () => [...stopPoints, ...trailPath],
    [stopPoints, trailPath]
  );

  const center = fitPoints[0] ?? DEFAULT_CENTER;

  return (
    <>
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
        <FitMapToPoints points={fitPoints} />
        {resolvedPickup?.position ? (
          <RoutePickupMarker
            position={resolvedPickup.position}
            title={resolvedPickup.name || "Pickup"}
          />
        ) : null}
        {resolvedDropoffs.map((stop) =>
          stop.position ? (
            <RouteDropoffMarker
              key={stop.localId ?? stop.serverId ?? stop.id ?? `stop-${stop.sequence}`}
              position={stop.position}
              sequence={stop.sequence}
              title={stop.name || `Stop ${stop.sequence}`}
            />
          ) : null
        )}
        {trailSegments.map((segment) =>
          segment.points.length >= 2 ? (
            <Polyline
              key={segment.key}
              path={segment.points.map((point) => readMapCoords(point)).filter(Boolean)}
              {...trailSegmentPolylineOptions(segment.snapped)}
            />
          ) : null
        )}
      </Map>
      {loading && stopPoints.length === 0 && trailPath.length === 0 ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold"
          style={{ background: "rgba(7,11,18,0.7)", color: "var(--text-muted)" }}
        >
          Locating stops…
        </div>
      ) : null}
    </>
  );
}

export function RoutePlanningMap({
  pickup,
  dropoffs = [],
  driverTrail = [],
  className = "",
}) {
  const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;
  const keyFailed = useGoogleMapsKeyError(Boolean(apiKey));
  const hasDriverTrail = (driverTrail ?? []).length >= 2;
  const hasAddresses =
    Boolean(pickup?.address?.trim()) ||
    dropoffs.some((stop) => stop.address?.trim()) ||
    hasDriverTrail;

  const addressKey = useMemo(
    () =>
      JSON.stringify({
        pickup: pickup?.address ?? "",
        dropoffs: dropoffs.map((stop) => stop.address ?? ""),
      }),
    [pickup?.address, dropoffs]
  );

  const showDriverTrailLegend = hasDriverTrail;

  if (!apiKey || keyFailed) {
    return (
      <div className={`space-y-3 ${className}`.trim()}>
        <GoogleMapsKeyHelp />
        {!hasAddresses ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Add a pickup address and dropoff stops to preview them on the map.
          </p>
        ) : null}
      </div>
    );
  }

  if (!hasAddresses) {
    return (
      <div className={`route-planning-map-wrap route-planning-map-wrap--empty ${className}`.trim()}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Add a pickup address and dropoff stops to preview them on the map.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="route-planning-map-wrap relative">
        <APIProvider apiKey={apiKey} libraries={["geocoding"]}>
          <GeocodedMarkers
            pickup={pickup}
            dropoffs={dropoffs}
            driverTrail={driverTrail}
            addressKey={addressKey}
          />
        </APIProvider>
      </div>
      <div className="route-planning-map-legend mt-2">
        <span className="route-planning-map-legend-item">
          <span className="route-planning-map-legend-dot route-planning-map-legend-dot--pickup" />
          Pickup (store)
        </span>
        <span className="route-planning-map-legend-item">
          <span className="route-planning-map-legend-dot route-planning-map-legend-dot--dropoff" />
          Dropoff stops
        </span>
        {showDriverTrailLegend ? (
          <>
            <span className="route-planning-map-legend-item">
              <span className="route-planning-map-legend-line route-planning-map-legend-line--driver" />
              Driver route
            </span>
            <span className="route-planning-map-legend-item">
              <span className="route-planning-map-legend-line route-planning-map-legend-line--uncertain" />
              Uncertain GPS
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
