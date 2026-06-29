import { useEffect, useMemo, useState } from "react";

function pathKey(points) {
  return points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");
}

/**
 * Google Directions driving path (follows roads). Falls back to straight segments.
 */
export function useGoogleDrivingRoutePath(waypoints) {
  const [path, setPath] = useState([]);
  const key = useMemo(() => pathKey(waypoints), [waypoints]);

  useEffect(() => {
    if (waypoints.length < 2) {
      setPath([]);
      return undefined;
    }

    let cancelled = false;

    function applyFallback() {
      if (!cancelled) setPath(waypoints);
    }

    function requestRoute() {
      const maps = globalThis.google?.maps;
      if (!maps?.DirectionsService) {
        applyFallback();
        return;
      }

      const origin = waypoints[0];
      const destination = waypoints[waypoints.length - 1];
      const middle = waypoints.slice(1, -1).map((point) => ({
        location: point,
        stopover: true,
      }));

      const service = new maps.DirectionsService();
      service.route(
        {
          origin,
          destination,
          waypoints: middle,
          travelMode: maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (result, status) => {
          if (cancelled) return;
          if (
            status === maps.DirectionsStatus.OK &&
            result?.routes?.[0]?.overview_path?.length
          ) {
            setPath(
              result.routes[0].overview_path.map((ll) => ({
                lat: ll.lat(),
                lng: ll.lng(),
              }))
            );
            return;
          }
          applyFallback();
        }
      );
    }

    if (globalThis.google?.maps?.DirectionsService) {
      requestRoute();
    } else {
      const timer = setTimeout(requestRoute, 400);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [key, waypoints]);

  return path.length >= 2 ? path : waypoints;
}

/** OSRM road route for Leaflet fallback (no Google key). */
export async function fetchOsrmDrivingPath(waypoints) {
  if (waypoints.length < 2) return [];

  const coordString = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) {
      return waypoints;
    }
    return coords.map(([lng, lat]) => ({ lat, lng }));
  } catch {
    return waypoints;
  }
}
