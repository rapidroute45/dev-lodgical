function trailPointKey(point) {
  const recordedAt =
    point?.recordedAt instanceof Date
      ? point.recordedAt.toISOString()
      : String(point?.recordedAt ?? "");
  return `${point?.lat ?? ""},${point?.lng ?? ""},${recordedAt}`;
}

export function normalizeTrailPoint(point) {
  if (point?.lat == null || point?.lng == null) return null;
  return {
    lat: point.lat,
    lng: point.lng,
    recordedAt: point.recordedAt ?? null,
    snapped: point.snapped !== false,
  };
}

export function appendTrailPoints(existingTrail, incomingPoints) {
  const next = Array.isArray(existingTrail) ? [...existingTrail] : [];
  const seen = new Set(next.map(trailPointKey));

  for (const raw of incomingPoints ?? []) {
    const point = normalizeTrailPoint(raw);
    if (!point) continue;
    const key = trailPointKey(point);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(point);
  }

  return next.sort((a, b) => {
    const at = Date.parse(a.recordedAt ?? "") || 0;
    const bt = Date.parse(b.recordedAt ?? "") || 0;
    return at - bt;
  });
}

export function applyDriverLocationPayloadToTrail(prevTrail, payload) {
  if (Array.isArray(payload?.trailPoints) && payload.trailPoints.length > 0) {
    return appendTrailPoints(prevTrail, payload.trailPoints);
  }

  if (payload?.lat == null || payload?.lng == null) {
    return prevTrail;
  }

  return appendTrailPoints(prevTrail, [
    {
      lat: payload.lat,
      lng: payload.lng,
      recordedAt: payload.recordedAt,
    },
  ]);
}

function locationTimestampMs(location) {
  return Date.parse(location?.ingestedAt ?? location?.updatedAt ?? location?.recordedAt ?? "") || 0;
}

/** Keep newer driver location when REST poll returns stale DB snapshot. */
export function mergeDriverLocationFromPoll(previous, incoming) {
  if (!incoming) return previous ?? null;
  if (!previous) return incoming;

  const prevMs = locationTimestampMs(previous);
  const nextMs = locationTimestampMs(incoming);
  if (nextMs >= prevMs) return incoming;
  return previous;
}

/** Keep longer trail on poll unless incoming is clearly newer (more points or newer tail). */
export function mergeTrailFromPoll(previous, incoming) {
  const prev = Array.isArray(previous) ? previous : [];
  const next = Array.isArray(incoming) ? incoming : [];
  if (next.length === 0) return prev;
  if (prev.length === 0) return next;

  const prevTailMs = Date.parse(prev[prev.length - 1]?.recordedAt ?? "") || 0;
  const nextTailMs = Date.parse(next[next.length - 1]?.recordedAt ?? "") || 0;
  if (next.length > prev.length || nextTailMs >= prevTailMs) return next;
  return prev;
}

/** Max distance (m) between live marker and trail tail before trusting trail instead. */
const MARKER_TRAIL_MAX_DISTANCE_M = 2000;
/** Prefer trail tail when driverLocation is this far from tail and not newer. */
const MARKER_TRAIL_BACKWARD_JUMP_M = 250;

/**
 * Prefer driverLocation for the live marker unless it is implausibly far from the trail
 * (stale bad GPS fix while the snapped trail is on-road).
 */
export function resolveLiveDriverMarkerPoint(driverLocation, trail) {
  const driver = normalizeTrailPoint(driverLocation);
  const trailPoints = Array.isArray(trail) ? trail : [];
  const lastTrail = trailPoints.length
    ? normalizeTrailPoint(trailPoints[trailPoints.length - 1])
    : null;

  if (!driver) {
    return lastTrail ? { lat: lastTrail.lat, lng: lastTrail.lng } : null;
  }
  if (!lastTrail) {
    return { lat: driver.lat, lng: driver.lng };
  }

  const distanceM = haversineMeters(driver.lat, driver.lng, lastTrail.lat, lastTrail.lng);
  if (distanceM > MARKER_TRAIL_MAX_DISTANCE_M) {
    return { lat: lastTrail.lat, lng: lastTrail.lng };
  }

  const driverMs = locationTimestampMs(driverLocation);
  const trailMs = Date.parse(lastTrail.recordedAt ?? "") || 0;
  if (
    distanceM > MARKER_TRAIL_BACKWARD_JUMP_M &&
    trailMs > 0 &&
    driverMs > 0 &&
    driverMs <= trailMs
  ) {
    return { lat: lastTrail.lat, lng: lastTrail.lng };
  }

  return { lat: driver.lat, lng: driver.lng };
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
