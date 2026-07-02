import { useEffect, useRef, useState } from "react";

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/**
 * Smoothly interpolate map marker position between GPS updates.
 */
export function useMarkerAnimation(target, durationMs = 2800) {
  const [position, setPosition] = useState(target ?? null);
  const fromRef = useRef(target ?? null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!target?.lat || !target?.lng) return undefined;

    if (!fromRef.current?.lat) {
      fromRef.current = target;
      setPosition(target);
      return undefined;
    }

    const from = fromRef.current;
    if (from.lat === target.lat && from.lng === target.lng) {
      return undefined;
    }

    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(progress);
      setPosition({
        lat: from.lat + (target.lat - from.lat) * eased,
        lng: from.lng + (target.lng - from.lng) * eased,
      });
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target?.lat, target?.lng, durationMs]);

  return position ?? target ?? null;
}

/** Animate a Leaflet marker between two lat/lng pairs. */
export function animateLeafletMarker(marker, from, to, durationMs = 2800) {
  if (!marker || !from || !to) return () => undefined;

  let frameId = null;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min(1, (now - start) / durationMs);
    const eased = easeOutCubic(progress);
    const lat = from[0] + (to[0] - from[0]) * eased;
    const lng = from[1] + (to[1] - from[1]) * eased;
    marker.setLatLng([lat, lng]);
    if (progress < 1) {
      frameId = requestAnimationFrame(tick);
    }
  };

  frameId = requestAnimationFrame(tick);

  return () => {
    if (frameId) cancelAnimationFrame(frameId);
  };
}
