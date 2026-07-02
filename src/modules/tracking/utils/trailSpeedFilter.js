const EARTH_RADIUS_M = 6_371_000;

/** ~150 km/h — parity with Dev-co routePath.ts */
export const TRAIL_MAX_SEGMENT_SPEED_MPS = 42;

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

/** Drop trail segments that imply impossible driving speed. */
export function filterTrailSpeedOutliers(
  points,
  maxSpeedMps = TRAIL_MAX_SEGMENT_SPEED_MPS
) {
  const normalized = (points ?? []).map(normalizePoint).filter(Boolean);
  if (normalized.length <= 1) return normalized;

  const kept = [normalized[0]];
  for (let i = 1; i < normalized.length; i += 1) {
    const prev = kept[kept.length - 1];
    const next = normalized[i];
    const prevMs = Date.parse(prev.recordedAt ?? "") || 0;
    const nextMs = Date.parse(next.recordedAt ?? "") || 0;
    const dtSec = Math.max(0.001, Math.abs(nextMs - prevMs) / 1000);
    const distanceM = haversineMeters(prev.lat, prev.lng, next.lat, next.lng);
    if (distanceM / dtSec <= maxSpeedMps) {
      kept.push(next);
    }
  }

  return kept;
}

/** Reject a live driver jump before animating the marker. */
export function isPlausibleLiveDriverJump(from, to, maxSpeedMps = TRAIL_MAX_SEGMENT_SPEED_MPS) {
  if (!from || !to) return true;
  const fromMs = Date.parse(from.recordedAt ?? from.updatedAt ?? "") || Date.now();
  const toMs = Date.parse(to.recordedAt ?? to.updatedAt ?? "") || Date.now();
  const dtSec = Math.max(0.001, Math.abs(toMs - fromMs) / 1000);
  const distanceM = haversineMeters(from.lat, from.lng, to.lat, to.lng);
  return distanceM / dtSec <= maxSpeedMps;
}
