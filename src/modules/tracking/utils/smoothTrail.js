const EARTH_RADIUS_M = 6_371_000;
const MIN_SEPARATION_M = 8;
const STATIONARY_RADIUS_M = 4;
const STATIONARY_MAX_MS = 8_000;

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizePoint(point) {
  if (point?.lat == null || point?.lng == null) return null;
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, recordedAt: point.recordedAt ?? null };
}

function msBetween(a, b) {
  const at = Date.parse(a ?? "") || 0;
  const bt = Date.parse(b ?? "") || 0;
  return Math.abs(bt - at);
}

/** Display-only trail smoothing — does not mutate stored GPS. */
export function smoothTrailForDisplay(points) {
  const normalized = (points ?? []).map(normalizePoint).filter(Boolean);
  if (normalized.length <= 2) return normalized;

  const deduped = [normalized[0]];
  for (let i = 1; i < normalized.length; i += 1) {
    const prev = deduped[deduped.length - 1];
    const next = normalized[i];
    const dist = haversineMeters(prev.lat, prev.lng, next.lat, next.lng);
    const isLast = i === normalized.length - 1;
    const isStationaryJitter =
      dist < STATIONARY_RADIUS_M && msBetween(prev.recordedAt, next.recordedAt) <= STATIONARY_MAX_MS;

    if (isLast || (dist >= MIN_SEPARATION_M && !isStationaryJitter)) {
      deduped.push(next);
    }
  }

  if (deduped.length <= 2) return deduped;

  const smoothed = [];
  for (let i = 0; i < deduped.length; i += 1) {
    const prev = deduped[i - 1] ?? deduped[i];
    const curr = deduped[i];
    const next = deduped[i + 1] ?? deduped[i];
    smoothed.push({
      lat: (prev.lat + curr.lat + next.lat) / 3,
      lng: (prev.lng + curr.lng + next.lng) / 3,
      recordedAt: curr.recordedAt,
    });
  }

  return smoothed;
}
