import {
  filterTrailSpeedOutliers,
  splitTrailIntoSegments,
} from "./mapPathFilters.js";
import { logGpsPipeline, summarizeTrailPoint } from "./gpsPipelineLog.js";
import { smoothTrailForDisplay } from "./smoothTrail.js";

/**
 * Prepare GPS trail for map display: drop impossible spikes, smooth jitter,
 * split at offline gaps — returns one or more drawable segment arrays.
 */
export function prepareTrailSegmentsForDisplay(trail, context = {}) {
  const input = trail ?? [];

  logGpsPipeline(
    "display_start",
    { pointCount: input.length },
    context
  );

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
      {
        action: "collapse",
        in: speedFiltered.length,
        out: smoothed.length,
      },
      context
    );
  }

  const segments = splitTrailIntoSegments(smoothed);
  logGpsPipeline(
    "display_segments",
    {
      action: "split",
      segmentCount: segments.length,
      pointCount: smoothed.length,
      segmentLengths: segments.map((segment) => segment.length),
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

/** Flat list of all trail points across segments (bounds fitting, last point lookup). */
export function flattenTrailSegments(segments) {
  return segments.flat();
}
