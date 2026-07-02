import { useMemo, useRef } from "react";

import { RouteDriverMarker } from "@/modules/tracking/presentation/components/RouteGoogleMapMarkers.jsx";
import { useMarkerAnimation } from "@/modules/tracking/presentation/components/useMarkerAnimation.js";
import { isPlausibleLiveDriverJump } from "@/modules/tracking/utils/trailSpeedFilter.js";

function readRecordedAt(point) {
  return point?.updatedAt ?? point?.recordedAt ?? null;
}

export function AnimatedRouteDriverMarker({
  targetPosition,
  title = "Driver (live)",
  durationMs = 2800,
}) {
  const acceptedRef = useRef(null);

  const stableTarget = useMemo(() => {
    if (targetPosition?.lat == null || targetPosition?.lng == null) {
      return null;
    }

    const next = {
      lat: targetPosition.lat,
      lng: targetPosition.lng,
      recordedAt: readRecordedAt(targetPosition),
    };

    const prev = acceptedRef.current;
    if (!prev) {
      acceptedRef.current = next;
      return { lat: next.lat, lng: next.lng };
    }

    if (
      !isPlausibleLiveDriverJump(
        { lat: prev.lat, lng: prev.lng, recordedAt: prev.recordedAt },
        { lat: next.lat, lng: next.lng, recordedAt: next.recordedAt }
      )
    ) {
      return { lat: prev.lat, lng: prev.lng };
    }

    if (prev.lat === next.lat && prev.lng === next.lng) {
      return { lat: prev.lat, lng: prev.lng };
    }

    acceptedRef.current = next;
    return { lat: next.lat, lng: next.lng };
  }, [
    targetPosition?.lat,
    targetPosition?.lng,
    targetPosition?.updatedAt,
    targetPosition?.recordedAt,
  ]);

  const animatedPosition = useMarkerAnimation(stableTarget, durationMs);

  if (!animatedPosition?.lat || !animatedPosition?.lng) {
    return null;
  }

  return (
    <RouteDriverMarker
      position={{ lat: animatedPosition.lat, lng: animatedPosition.lng }}
      title={title}
    />
  );
}
