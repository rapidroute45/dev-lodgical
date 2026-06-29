import { haversineMeters } from "./plannedSegmentTrail.js";

export const GPS_PATH_MAX_JUMP_M = 50_000;
export const MAP_REGION_MAX_SPAN_M = 800_000;
export const SEGMENT_POLYLINE_END_THRESHOLD_M = 50_000;

/** Remove GPS teleport spikes from a trail for map display. */
export function filterTrailOutliers(points, maxJumpM = GPS_PATH_MAX_JUMP_M) {
  const normalized = (points ?? [])
    .map((point) => {
      if (point?.lat == null || point?.lng == null) return null;
      const lat = Number(point.lat);
      const lng = Number(point.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng, recordedAt: point.recordedAt ?? null };
    })
    .filter(Boolean);

  if (normalized.length <= 1) return normalized;

  const kept = [normalized[0]];
  for (let i = 1; i < normalized.length; i += 1) {
    const prev = kept[kept.length - 1];
    const next = normalized[i];
    if (haversineMeters(prev.lat, prev.lng, next.lat, next.lng) <= maxJumpM) {
      kept.push(next);
    }
  }
  return kept;
}

/** Keep map bounds from stretching to bad polyline / trail outliers. */
export function filterMapPathPoints(points, anchorPoints = [], maxSpanM = MAP_REGION_MAX_SPAN_M) {
  const anchors = (anchorPoints ?? []).filter(
    (point) => point && Number.isFinite(point.lat) && Number.isFinite(point.lng)
  );
  if (anchors.length === 0) return points ?? [];

  return (points ?? []).filter((point) => {
    if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return false;
    return anchors.some(
      (anchor) => haversineMeters(point.lat, point.lng, anchor.lat, anchor.lng) <= maxSpanM
    );
  });
}

export function polylineEndsNearTarget(
  polyline,
  target,
  thresholdM = SEGMENT_POLYLINE_END_THRESHOLD_M
) {
  if (!polyline?.length || !target) return false;
  const end = polyline[polyline.length - 1];
  return haversineMeters(end.lat, end.lng, target.lat, target.lng) <= thresholdM;
}

export function collectRouteAnchorPoints({ pickup, dropoffs, driverPoint }) {
  const anchors = [];
  if (pickup?.position) anchors.push(pickup.position);
  for (const stop of dropoffs ?? []) {
    if (stop?.position) anchors.push(stop.position);
  }
  if (driverPoint) anchors.push(driverPoint);
  return anchors;
}
