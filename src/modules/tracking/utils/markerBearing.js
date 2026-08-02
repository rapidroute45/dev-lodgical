/** Heading maths for the live driver marker: which way is the vehicle actually pointing. */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** Below this the "movement" is GPS jitter, and a bearing off it would spin the icon. */
export const MIN_BEARING_MOVEMENT_DEG = 0.00002;

function isPoint(point) {
  return (
    point != null && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng))
  );
}

/** Compass bearing (0 = north, clockwise) from one coordinate to the next. */
export function bearingDegrees(from, to) {
  if (!isPoint(from) || !isPoint(to)) return null;

  const fromLat = Number(from.lat) * DEG_TO_RAD;
  const toLat = Number(to.lat) * DEG_TO_RAD;
  const deltaLng = (Number(to.lng) - Number(from.lng)) * DEG_TO_RAD;

  if (
    Math.abs(Number(to.lat) - Number(from.lat)) < MIN_BEARING_MOVEMENT_DEG &&
    Math.abs(Number(to.lng) - Number(from.lng)) < MIN_BEARING_MOVEMENT_DEG
  ) {
    return null;
  }

  const y = Math.sin(deltaLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng);

  return (Math.atan2(y, x) * RAD_TO_DEG + 360) % 360;
}

/** Signed shortest rotation from one heading to another, in (-180, 180]. */
export function shortestRotationDelta(fromDeg, toDeg) {
  const delta = ((toDeg - fromDeg + 540) % 360) - 180;
  return delta === -180 ? 180 : delta;
}

/**
 * Rotate `fromDeg` toward `toDeg` the short way round. Returns an unwrapped angle so a
 * CSS transform animates across 359° → 1° without spinning the long way.
 */
export function interpolateHeading(fromDeg, toDeg, progress) {
  if (!Number.isFinite(fromDeg)) return toDeg;
  if (!Number.isFinite(toDeg)) return fromDeg;
  const clamped = Math.min(1, Math.max(0, progress));
  return fromDeg + shortestRotationDelta(fromDeg, toDeg) * clamped;
}
