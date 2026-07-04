import { haversineMeters } from "./plannedSegmentTrail.js";

export const GPS_PATH_MAX_JUMP_M = 50_000;
/** Split polylines when consecutive points are farther apart (offline / data gap). */
export const TRAIL_SEGMENT_GAP_M = 3_000;
/** Tighter gap for live/completed map display — avoids diagonals through blocks. */
export const TRAIL_DISPLAY_URBAN_GAP_M = 120;
/** Split drawable edges longer than this (meters). */
export const TRAIL_DISPLAY_MAX_JUMP_M = 300;
/** Split when time gap is large and movement is non-trivial. */
export const TRAIL_SEGMENT_GAP_SEC = 10 * 60;
/** Reject display segments implying impossible driving speed (180 km/h). */
export const TRAIL_MAX_SEGMENT_SPEED_MPS = 50;

export const MAP_REGION_MAX_SPAN_M = 800_000;
export const SEGMENT_POLYLINE_END_THRESHOLD_M = 50_000;

function normalizeTrailPoint(point) {
  if (point?.lat == null || point?.lng == null) return null;
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, recordedAt: point.recordedAt ?? null };
}

export function normalizeTrailPoints(points) {
  return (points ?? []).map(normalizeTrailPoint).filter(Boolean);
}

/** Remove GPS teleport spikes — compares each point to its immediate predecessor in time order. */
export function filterTrailSpeedOutliers(
  points,
  maxSpeedMps = TRAIL_MAX_SEGMENT_SPEED_MPS,
  defaultIntervalSec = 15
) {
  const normalized = normalizeTrailPoints(points);
  if (normalized.length <= 1) return normalized;

  const kept = [normalized[0]];
  for (let i = 1; i < normalized.length; i += 1) {
    const prev = kept[kept.length - 1];
    const next = normalized[i];
    const prevMs = Date.parse(prev.recordedAt ?? "");
    const nextMs = Date.parse(next.recordedAt ?? "");
    const dtSec =
      Number.isFinite(prevMs) && Number.isFinite(nextMs) && nextMs > prevMs
        ? (nextMs - prevMs) / 1000
        : defaultIntervalSec;
    const distanceM = haversineMeters(prev.lat, prev.lng, next.lat, next.lng);
    if (distanceM / Math.max(0.001, dtSec) <= maxSpeedMps) {
      kept.push(next);
    }
  }
  return kept;
}

/** Remove out-and-back GPS spikes already stored in the trail (display + merge cleanup). */
export function filterTrailOutAndBackSpikes(points, minSpikeM = 120, returnWindowSec = 600) {
  const normalized = normalizeTrailPoints(points);
  if (normalized.length <= 2) return normalized;

  const kept = [normalized[0]];
  for (let i = 1; i < normalized.length; i += 1) {
    const ref = kept[kept.length - 1];
    const point = normalized[i];
    const next = normalized[i + 1];
    const distFromRef = haversineMeters(ref.lat, ref.lng, point.lat, point.lng);

    if (distFromRef > minSpikeM && next) {
      const prevMs = Date.parse(ref.recordedAt ?? "");
      const pointMs = Date.parse(point.recordedAt ?? "");
      const nextMs = Date.parse(next.recordedAt ?? "");
      const dtToNext =
        Number.isFinite(pointMs) && Number.isFinite(nextMs) ? (nextMs - pointMs) / 1000 : 0;
      const returnToRef = haversineMeters(ref.lat, ref.lng, next.lat, next.lng);
      if (
        dtToNext > 0 &&
        dtToNext <= returnWindowSec &&
        returnToRef < Math.min(120, distFromRef * 0.65)
      ) {
        continue;
      }
    }

    kept.push(point);
  }

  return kept;
}

/**
 * Split a trail into drawable polylines at large spatial or temporal gaps.
 * Avoids drawing straight lines across a city after offline periods or sparse uploads.
 */
export function splitTrailIntoSegments(
  points,
  maxGapM = TRAIL_SEGMENT_GAP_M,
  maxGapSec = TRAIL_SEGMENT_GAP_SEC
) {
  const normalized = normalizeTrailPoints(points);
  if (normalized.length === 0) return [];
  if (normalized.length === 1) return [];

  const segments = [[normalized[0]]];
  for (let i = 1; i < normalized.length; i += 1) {
    const prev = normalized[i - 1];
    const next = normalized[i];
    const distanceM = haversineMeters(prev.lat, prev.lng, next.lat, next.lng);
    const prevMs = Date.parse(prev.recordedAt ?? "");
    const nextMs = Date.parse(next.recordedAt ?? "");
    const dtSec =
      Number.isFinite(prevMs) && Number.isFinite(nextMs) && nextMs > prevMs
        ? (nextMs - prevMs) / 1000
        : 0;

    const spatialGap = distanceM > maxGapM;
    const temporalGap = dtSec > maxGapSec && distanceM > 200;

    if (spatialGap || temporalGap) {
      segments.push([next]);
    } else {
      segments[segments.length - 1].push(next);
    }
  }

  return segments.filter((segment) => segment.length >= 2);
}

/** Legacy jump filter from last-kept point — prefer filterTrailSpeedOutliers + splitTrailIntoSegments. */
export function filterTrailOutliers(points, maxJumpM = GPS_PATH_MAX_JUMP_M) {
  const normalized = normalizeTrailPoints(points);
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
