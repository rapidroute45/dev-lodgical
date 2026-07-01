import { useEffect, useState } from "react";
import {
  DEFAULT_MAP_CENTER,
  fetchMapCenterFromNominatim,
  resolveKnownMapCenter,
} from "@/modules/tracking/utils/cityMapCenter.js";

/**
 * Map center for LiveTrackingMap from header city/state scope.
 * Falls back to Nominatim for unknown locations.
 */
export function useScopeMapCenter(city, state) {
  const [center, setCenter] = useState(DEFAULT_MAP_CENTER);

  useEffect(() => {
    const trimmedCity = city?.trim() || null;
    const trimmedState = state?.trim() || null;

    if (!trimmedCity && !trimmedState) {
      setCenter(DEFAULT_MAP_CENTER);
      return;
    }

    const known = resolveKnownMapCenter(trimmedCity, trimmedState);
    if (known) {
      setCenter(known);
      return;
    }

    let cancelled = false;
    void fetchMapCenterFromNominatim(trimmedCity, trimmedState).then((resolved) => {
      if (cancelled) return;
      setCenter(resolved ?? DEFAULT_MAP_CENTER);
    });

    return () => {
      cancelled = true;
    };
  }, [city, state]);

  return center;
}
