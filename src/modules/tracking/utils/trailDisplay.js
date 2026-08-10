import {
  exceedsTrailSegmentGap,
  filterTrailSpeedOutliers,
  filterTrailOutAndBackSpikes,
  splitTrailIntoSegments,
  TRAIL_DISPLAY_MAX_JUMP_M,
  TRAIL_DISPLAY_SNAPPED_GAP_M,
  TRAIL_SEGMENT_GAP_M,
  TRAIL_SEGMENT_GAP_SEC,
} from "./mapPathFilters.js";
import { logGpsPipeline, summarizeTrailPoint } from "./gpsPipelineLog.js";
import { smoothTrailForDisplay, MIN_SEPARATION_SNAPPED_M } from "./smoothTrail.js";
import {
  splitTrailBySnappedFlag,
  trailSegmentPolylineOptions,
  TRAIL_SEGMENT_KIND_GAP,
} from "./trailSnappedSegments.js";

export {
  trailSegmentPolylineOptions,
  TRAIL_SEGMENT_KIND_GAP,
} from "./trailSnappedSegments.js";

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

  const spikeFiltered = filterTrailOutAndBackSpikes(input);
  if (spikeFiltered.length < input.length) {
    logGpsPipeline(
      "display_spike_filter",
      {
        action: "discard",
        reason: "out_and_back_spike",
        dropped: input.length - spikeFiltered.length,
        kept: spikeFiltered.length,
      },
      context
    );
  }

  const speedFiltered = filterTrailSpeedOutliers(spikeFiltered);
  if (speedFiltered.length < spikeFiltered.length) {
    const keptKeys = new Set(
      speedFiltered.map((point) => `${point.lat},${point.lng},${point.recordedAt ?? ""}`)
    );
    const dropped = spikeFiltered.filter((point) => {
      const key = `${point?.lat},${point?.lng},${point?.recordedAt ?? ""}`;
      return !keptKeys.has(key);
    });
    logGpsPipeline(
      "display_speed_filter",
      {
        action: "discard",
        reason: "impossible_speed",
        dropped: spikeFiltered.length - speedFiltered.length,
        kept: speedFiltered.length,
        samples: dropped.slice(0, 3).map(summarizeTrailPoint),
      },
      context
    );
  }

  const smoothed = smoothTrailForDisplay(speedFiltered, {
    minSeparationM: context.isSnapped ? MIN_SEPARATION_SNAPPED_M : undefined,
  });
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
 *
 * Completed routes intentionally keep one continuous polyline: any missing stretch
 * between consecutive fixes is a straight blue chord (no silent holes like the
 * stub-near-driver vs rest-of-route gap).
 */
export function prepareDrawableTrailSegments(trail, options = {}) {
  const { source = "map", isLive = true } = options;

  const normalized = sortTrailPoints(
    (trail ?? []).map(normalizeDrawablePoint).filter(Boolean)
  );

  if (normalized.length === 0) return [];

  // Completed: one solid blue path. Splitting + bridging still left holes when a
  // short stub (e.g. near the driver marker) and the main run were separated by
  // filtered single-point groups or snapped-gap thresholds.
  if (!isLive) {
    const completedPoints = prepareCompletedTrailPoints(normalized, { source });
    if (completedPoints.length < 2) return [];
    return [
      {
        points: completedPoints,
        snapped: true,
        forceSolid: true,
        kind: "trail",
        key: "completed-trail",
      },
    ];
  }

  const snappedGroups = splitTrailBySnappedFlag(normalized);
  const drawable = [];

  snappedGroups.forEach((group, groupIndex) => {
    if (group.points.length < 2) return;

    // Snapped runs are OSRM road geometry, already continuous and already following the
    // street grid, so they only split at a genuine data hole. Raw runs keep the tight
    // threshold because a long edge there really is a straight line through buildings.
    const jumpGapM =
      group.snapped === false ? TRAIL_DISPLAY_MAX_JUMP_M : TRAIL_DISPLAY_SNAPPED_GAP_M;

    prepareTrailSegmentsForDisplay(group.points, {
      source,
      isLive,
      isSnapped: group.snapped !== false,
      displayGapM: jumpGapM,
    }).forEach((points, index) => {
      if (points.length < 2) return;
      drawable.push({
        points,
        snapped: group.snapped !== false,
        kind: "trail",
        key: `${group.snapped === false ? "unsnapped" : "snapped"}-${groupIndex}-${index}`,
      });
    });
  });

  const withGapBridges = insertGapBridgeSegments(drawable, {
    solidGaps: false,
    minGapM: null,
  });

  logGpsPipeline(
    "display_drawable",
    {
      in: normalized.length,
      drawableSegments: drawable.length,
      snappedSegments: drawable.filter((segment) => segment.snapped).length,
      unsnappedSegments: drawable.filter((segment) => !segment.snapped).length,
      gapBridges: withGapBridges.length - drawable.length,
      isLive,
    },
    { source, isLive }
  );

  return withGapBridges;
}

/**
 * Keep chronological GPS for a completed route, drop only impossible spikes/speed
 * outliers, and never split — the map polyline then straight-lines every hole.
 */
function prepareCompletedTrailPoints(normalized, context = {}) {
  const spikeFiltered = filterTrailOutAndBackSpikes(normalized);
  const speedFiltered = filterTrailSpeedOutliers(spikeFiltered);
  const smoothed = smoothTrailForDisplay(speedFiltered, {
    minSeparationM: MIN_SEPARATION_SNAPPED_M,
  });

  logGpsPipeline(
    "display_completed_continuous",
    {
      in: normalized.length,
      afterSpike: spikeFiltered.length,
      afterSpeed: speedFiltered.length,
      out: smoothed.length,
    },
    { ...context, isLive: false }
  );

  return smoothed;
}

/**
 * Bridge holes left by gap splitting with an explicit 2-point segment so ops can see
 * the driver moved between the fixes without implying we know the path taken.
 * On completed routes (`solidGaps`), chords are solid blue straight lines.
 */
function insertGapBridgeSegments(segments, options = {}) {
  if (segments.length < 2) return segments;

  const solidGaps = Boolean(options.solidGaps);
  const minGapM = typeof options.minGapM === "number" ? options.minGapM : null;

  const bridged = [segments[0]];
  for (let index = 1; index < segments.length; index += 1) {
    const previous = segments[index - 1];
    const current = segments[index];
    const from = previous.points[previous.points.length - 1];
    const to = current.points[0];

    const shouldBridge =
      minGapM != null
        ? haversineGapM(from, to) >= minGapM
        : exceedsTrailSegmentGap(from, to, TRAIL_DISPLAY_MAX_JUMP_M, TRAIL_SEGMENT_GAP_SEC);

    if (shouldBridge) {
      bridged.push({
        points: [from, to],
        snapped: solidGaps ? true : null,
        solid: solidGaps,
        kind: TRAIL_SEGMENT_KIND_GAP,
        key: `gap-${index}`,
      });
    }

    bridged.push(current);
  }

  return bridged;
}

function haversineGapM(from, to) {
  if (!from || !to) return 0;
  const lat1 = Number(from.lat);
  const lng1 = Number(from.lng);
  const lat2 = Number(to.lat);
  const lng2 = Number(to.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return 0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(a));
}

/**
 * Flat list of all real trail points across segments (bounds fitting, last point lookup).
 * Gap bridges are excluded — their endpoints already belong to the neighbouring segments.
 */
export function flattenTrailSegments(segments) {
  if (Array.isArray(segments) && segments[0]?.points) {
    return segments
      .filter((segment) => segment?.kind !== TRAIL_SEGMENT_KIND_GAP)
      .flatMap((segment) => segment.points ?? []);
  }
  return segments.flat();
}

/** Leaflet polyline options from a drawable segment (or a bare `snapped` flag). */
export function trailSegmentLeafletOptions(segmentOrSnapped) {
  const google = trailSegmentPolylineOptions(segmentOrSnapped);
  const isSegment = segmentOrSnapped !== null && typeof segmentOrSnapped === "object";
  const kind = isSegment ? segmentOrSnapped.kind : null;
  const snapped = isSegment ? segmentOrSnapped.snapped : segmentOrSnapped;

  if (kind === TRAIL_SEGMENT_KIND_GAP) {
    if (isSegment && segmentOrSnapped.solid) {
      return {
        color: google.strokeColor,
        weight: google.strokeWeight,
        opacity: google.strokeOpacity,
        dashArray: null,
      };
    }
    return {
      color: google.strokeColor,
      weight: google.strokeWeight,
      opacity: 0.45,
      dashArray: "2 14",
    };
  }
  if (snapped === false && !(isSegment && segmentOrSnapped.forceSolid)) {
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
