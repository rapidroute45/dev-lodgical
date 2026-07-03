import {
  filterTrailSpeedOutliers,
  splitTrailIntoSegments,
  TRAIL_DISPLAY_MAX_JUMP_M,
  TRAIL_SEGMENT_GAP_M,
  TRAIL_SEGMENT_GAP_SEC,
} from "./mapPathFilters.js";
import { logGpsPipeline, summarizeTrailPoint } from "./gpsPipelineLog.js";
import { smoothTrailForDisplay } from "./smoothTrail.js";
import { splitTrailBySnappedFlag, trailSegmentPolylineOptions } from "./trailSnappedSegments.js";

export { trailSegmentPolylineOptions } from "./trailSnappedSegments.js";

function normalizeDrawablePoint(point) {
  if (point?.lat == null || point?.lng == null) return null;
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    recordedAt: point.recordedAt ?? null,
    snapped: point.snapped !== false,
  };
}

function sortTrailPoints(points) {
  return [...points].sort((a, b) => {
    const at = Date.parse(a.recordedAt ?? "") || 0;
    const bt = Date.parse(b.recordedAt ?? "") || 0;
    return at - bt;
  });
}

/**
 * Prepare GPS trail for map display: drop impossible spikes, smooth jitter,
 * split at offline gaps — returns one or more drawable segment arrays.
 */
export function prepareTrailSegmentsForDisplay(trail, context = {}) {
  const input = trail ?? [];
  const displayGapM = context.displayGapM ?? TRAIL_SEGMENT_GAP_M;

  logGpsPipeline("display_start", { pointCount: input.length }, context);

  const speedFiltered = filterTrailSpeedOutliers(input);
  if (speedFiltered.length < input.length) {
    const keptKeys = new Set(
      speedFiltered.map((point) => `${point.lat},${point.lng},${point.recordedAt ?? ""}`)
    );
    const dropped = input.filter((point) => {
      const key = `${point?.lat},${point?.lng},${point?.recordedAt ?? ""}`;
      return !keptKeys.has(key);
    });
    logGpsPipeline(
      "display_speed_filter",
      {
        action: "discard",
        reason: "impossible_speed",
        dropped: input.length - speedFiltered.length,
        kept: speedFiltered.length,
        samples: dropped.slice(0, 3).map(summarizeTrailPoint),
      },
      context
    );
  }

  const smoothed = smoothTrailForDisplay(speedFiltered);
  if (smoothed.length !== speedFiltered.length) {
    logGpsPipeline(
      "display_smooth",
      { action: "collapse", in: speedFiltered.length, out: smoothed.length },
      context
    );
  }

  const segments = splitTrailIntoSegments(smoothed, displayGapM, TRAIL_SEGMENT_GAP_SEC);
  logGpsPipeline(
    "display_segments",
    {
      action: "split",
      segmentCount: segments.length,
      pointCount: smoothed.length,
      segmentLengths: segments.map((segment) => segment.length),
      displayGapM,
    },
    context
  );

  logGpsPipeline(
    "display_complete",
    {
      in: input.length,
      drawableSegments: segments.length,
      drawablePoints: segments.reduce((sum, segment) => sum + segment.length, 0),
    },
    context
  );

  return segments;
}

/**
 * Drawable trail segments for live + completed maps.
 * Uses raw GPS only (no planned-route reprojection) plus jump splitting for bad edges.
 */
export function prepareDrawableTrailSegments(trail, options = {}) {
  const { source = "map", isLive = true } = options;

  const normalized = sortTrailPoints(
    (trail ?? []).map(normalizeDrawablePoint).filter(Boolean)
  );

  if (normalized.length === 0) return [];

  const snappedGroups = splitTrailBySnappedFlag(normalized);
  const drawable = [];

  snappedGroups.forEach((group, groupIndex) => {
    if (group.points.length < 2) return;

    const jumpGapM = group.snapped === false ? TRAIL_DISPLAY_MAX_JUMP_M : TRAIL_DISPLAY_MAX_JUMP_M;

    prepareTrailSegmentsForDisplay(group.points, {
      source,
      isLive,
      displayGapM: jumpGapM,
    }).forEach((points, index) => {
      if (points.length < 2) return;
      drawable.push({
        points,
        snapped: group.snapped !== false,
        key: `${group.snapped === false ? "unsnapped" : "snapped"}-${groupIndex}-${index}`,
      });
    });
  });

  logGpsPipeline(
    "display_drawable",
    {
      in: normalized.length,
      drawableSegments: drawable.length,
      snappedSegments: drawable.filter((segment) => segment.snapped).length,
      unsnappedSegments: drawable.filter((segment) => !segment.snapped).length,
    },
    { source, isLive }
  );

  return drawable;
}

/** Flat list of all trail points across segments (bounds fitting, last point lookup). */
export function flattenTrailSegments(segments) {
  if (Array.isArray(segments) && segments[0]?.points) {
    return segments.flatMap((segment) => segment.points ?? []);
  }
  return segments.flat();
}

/** Leaflet polyline options from a drawable segment. */
export function trailSegmentLeafletOptions(snapped) {
  const google = trailSegmentPolylineOptions(snapped);
  if (snapped === false) {
    return {
      color: google.strokeColor,
      weight: google.strokeWeight,
      opacity: google.strokeOpacity,
      dashArray: "8 10",
    };
  }
  return {
    color: google.strokeColor,
    weight: google.strokeWeight,
    opacity: google.strokeOpacity,
    dashArray: null,
  };
}
