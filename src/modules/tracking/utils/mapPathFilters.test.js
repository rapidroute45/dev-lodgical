import assert from "node:assert/strict";
import test from "node:test";

import {
  filterTrailSpeedOutliers,
  splitTrailIntoSegments,
  TRAIL_SEGMENT_GAP_M,
} from "./mapPathFilters.js";
import {
  flattenTrailSegments,
  prepareTrailSegmentsForDisplay,
  prepareDrawableTrailSegments,
  TRAIL_SEGMENT_KIND_GAP,
} from "./trailDisplay.js";
import { trailSegmentPolylineOptions } from "./trailSnappedSegments.js";

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

/** Two clusters either side of a 10 minute offline hole ~3 km apart. */
function trailWithOfflineGap() {
  const base = Date.parse("2026-07-03T10:00:00.000Z");
  const at = (lat, offsetSec) =>
    point(lat, 74.358, new Date(base + offsetSec * 1_000).toISOString());
  return [
    at(31.52, 0),
    at(31.5205, 5),
    at(31.521, 10),
    at(31.55, 610),
    at(31.5505, 615),
    at(31.551, 620),
  ];
}

test("prepareDrawableTrailSegments bridges a GPS gap with a distinct gap segment", () => {
  const drawable = prepareDrawableTrailSegments(trailWithOfflineGap(), { source: "test" });
  const gaps = drawable.filter((segment) => segment.kind === TRAIL_SEGMENT_KIND_GAP);

  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].points.length, 2);

  const gapIndex = drawable.indexOf(gaps[0]);
  assert.ok(gapIndex > 0 && gapIndex < drawable.length - 1);

  const before = drawable[gapIndex - 1];
  const after = drawable[gapIndex + 1];
  assert.deepEqual(gaps[0].points[0], before.points[before.points.length - 1]);
  assert.deepEqual(gaps[0].points[1], after.points[0]);
});

test("completed routes join gaps with solid straight blue lines", () => {
  const drawable = prepareDrawableTrailSegments(trailWithOfflineGap(), {
    source: "test",
    isLive: false,
  });

  // One continuous polyline — holes become straight chords between consecutive fixes.
  assert.equal(drawable.length, 1);
  assert.equal(drawable[0].kind, "trail");
  assert.equal(drawable[0].forceSolid, true);
  assert.ok(drawable[0].points.length >= 2);

  const style = trailSegmentPolylineOptions(drawable[0]);
  assert.equal(style.strokeColor, "#2563eb");
  assert.equal(style.icons, undefined);
});

test("prepareDrawableTrailSegments emits no gap bridge for a continuous trail", () => {
  const base = Date.parse("2026-07-03T10:00:00.000Z");
  const trail = [];
  for (let i = 0; i < 20; i += 1) {
    trail.push(
      point(31.52 + i * 0.0004, 74.358 + i * 0.0004, new Date(base + i * 1_000).toISOString())
    );
  }

  const drawable = prepareDrawableTrailSegments(trail, { source: "test" });
  assert.equal(
    drawable.some((segment) => segment.kind === TRAIL_SEGMENT_KIND_GAP),
    false
  );
});

test("gap bridges are styled distinctly and excluded from bounds flattening", () => {
  const drawable = prepareDrawableTrailSegments(trailWithOfflineGap(), { source: "test" });
  const gap = drawable.find((segment) => segment.kind === TRAIL_SEGMENT_KIND_GAP);
  const gapStyle = trailSegmentPolylineOptions(gap);
  const confirmedStyle = trailSegmentPolylineOptions({ kind: "trail", snapped: true });
  const unsnappedStyle = trailSegmentPolylineOptions({ kind: "trail", snapped: false });

  assert.notDeepEqual(gapStyle, confirmedStyle);
  assert.notDeepEqual(gapStyle, unsnappedStyle);
  assert.ok(Array.isArray(gapStyle.icons));

  assert.deepEqual(trailSegmentPolylineOptions(true), confirmedStyle);
  assert.deepEqual(trailSegmentPolylineOptions(false), unsnappedStyle);

  const flattened = flattenTrailSegments(drawable);
  const realPoints = drawable
    .filter((segment) => segment.kind !== TRAIL_SEGMENT_KIND_GAP)
    .reduce((sum, segment) => sum + segment.points.length, 0);
  assert.equal(flattened.length, realPoints);
});
