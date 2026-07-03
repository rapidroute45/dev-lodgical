import assert from "node:assert/strict";
import test from "node:test";

import {
  filterTrailSpeedOutliers,
  splitTrailIntoSegments,
  TRAIL_SEGMENT_GAP_M,
} from "./mapPathFilters.js";
import { prepareTrailSegmentsForDisplay, prepareDrawableTrailSegments } from "./trailDisplay.js";

function point(lat, lng, recordedAt) {
  return { lat, lng, recordedAt };
}

test("filterTrailSpeedOutliers keeps sparse highway samples", () => {
  const base = Date.parse("2026-07-01T18:00:00.000Z");
  const trail = [
    point(36.2, -115.1, new Date(base).toISOString()),
    point(36.196, -115.104, new Date(base + 30_000).toISOString()),
    point(36.192, -115.108, new Date(base + 60_000).toISOString()),
  ];
  const filtered = filterTrailSpeedOutliers(trail);
  assert.equal(filtered.length, 3);
});

test("filterTrailSpeedOutliers drops sample helicopter spike at 180 km/h threshold", () => {
  const trail = [
    point(36.101033, -115.179821, "2026-07-01T15:48:57.315Z"),
    point(36.108181, -115.179322, "2026-07-01T15:49:06.158Z"),
    point(36.108181, -115.179331, "2026-07-01T15:49:07.970Z"),
  ];
  const filtered = filterTrailSpeedOutliers(trail, 50);
  assert.equal(filtered.length, 1);
});

test("filterTrailSpeedOutliers drops sample 59 to 60 jump", () => {
  const trail = [
    point(36.108209, -115.182289, "2026-07-01T15:49:35.158Z"),
    point(36.111893, -115.179924, "2026-07-01T15:49:42.422Z"),
  ];
  const filtered = filterTrailSpeedOutliers(trail, 50);
  assert.equal(filtered.length, 1);
});

test("splitTrailIntoSegments separates north and south clusters", () => {
  const trail = [
    point(36.2, -115.1, "2026-07-01T18:00:00.000Z"),
    point(36.199, -115.101, "2026-07-01T18:00:15.000Z"),
    point(36.02, -115.12, "2026-07-01T18:30:00.000Z"),
    point(36.019, -115.121, "2026-07-01T18:30:15.000Z"),
  ];
  const segments = splitTrailIntoSegments(trail, TRAIL_SEGMENT_GAP_M);
  assert.equal(segments.length, 2);
  assert.equal(segments[0].length, 2);
  assert.equal(segments[1].length, 2);
});

test("prepareTrailSegmentsForDisplay returns drawable segments for long routes", () => {
  const base = Date.parse("2026-07-01T18:00:00.000Z");
  const trail = [];
  for (let i = 0; i < 20; i += 1) {
    trail.push(
      point(36.2 - i * 0.0003, -115.1 - i * 0.00012, new Date(base + i * 1_000).toISOString())
    );
  }
  const segments = prepareTrailSegmentsForDisplay(trail);
  assert.ok(segments.length >= 1);
  assert.ok(segments[0].length >= 2);
});

test("prepareDrawableTrailSegments skips diagonal through sparse GPS jumps", () => {
  const trail = [
    point(31.52, 74.358, "2026-07-03T10:00:00.000Z"),
    point(31.525, 74.365, "2026-07-03T10:00:05.000Z"),
    point(31.54, 74.38, "2026-07-03T10:05:00.000Z"),
    point(31.541, 74.381, "2026-07-03T10:05:05.000Z"),
  ];
  const drawable = prepareDrawableTrailSegments(trail, { source: "test" });
  const hasLongDiagonal = drawable.some((segment) => {
    if (segment.points.length < 2) return false;
    const first = segment.points[0];
    const last = segment.points[segment.points.length - 1];
    const latDelta = Math.abs(first.lat - last.lat);
    return latDelta > 0.015 && segment.snapped === true;
  });
  assert.equal(hasLongDiagonal, false);
});
