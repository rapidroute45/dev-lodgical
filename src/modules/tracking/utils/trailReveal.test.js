import assert from "node:assert/strict";
import test from "node:test";

import {
  isSegmentExtension,
  lastAnimatableSegmentIndex,
  planTrailReveal,
  resolveRevealDurationMs,
  revealTrailSegments,
  TRAIL_REVEAL_MAX_MS,
  TRAIL_REVEAL_MIN_MS,
} from "./trailReveal.js";
import { TRAIL_SEGMENT_KIND_GAP } from "./trailSnappedSegments.js";

const BASE_MS = Date.parse("2026-07-03T10:00:00.000Z");

function point(lat, lng, offsetSec) {
  return { lat, lng, recordedAt: new Date(BASE_MS + offsetSec * 1_000).toISOString() };
}

function segment(key, points) {
  return { key, kind: "trail", snapped: true, points };
}

function sampleSegments() {
  return [
    segment("snapped-0-0", [point(31.5, 74.3, 0), point(31.5, 74.31, 1)]),
    segment("snapped-0-1", [
      point(31.6, 74.4, 10),
      point(31.6, 74.41, 11),
      point(31.6, 74.42, 12),
      point(31.6, 74.43, 13),
    ]),
  ];
}

test("revealTrailSegments returns the input unchanged at full progress", () => {
  const segments = sampleSegments();
  assert.deepEqual(revealTrailSegments(segments, { fromIndex: 0, progress: 1 }), segments);
  assert.deepEqual(revealTrailSegments(segments, { fromIndex: 2, progress: 1 }), segments);
  assert.deepEqual(revealTrailSegments(segments), segments);
});

test("revealTrailSegments only shortens the trailing segment", () => {
  const segments = sampleSegments();
  const revealed = revealTrailSegments(segments, { fromIndex: 0, progress: 1 / 3 });

  assert.equal(revealed.length, segments.length);
  assert.deepEqual(revealed[0], segments[0]);
  assert.deepEqual(revealed[1].points, segments[1].points.slice(0, 2));
  assert.equal(revealed[1].key, segments[1].key);
});

test("revealTrailSegments interpolates along the edge between two points", () => {
  const segments = [segment("snapped-0-0", [point(0, 0, 0), point(0, 2, 1)])];
  const revealed = revealTrailSegments(segments, { fromIndex: 0, progress: 0.5 });

  assert.equal(revealed[0].points.length, 2);
  assert.deepEqual(revealed[0].points[0], segments[0].points[0]);
  assert.equal(revealed[0].points[1].lat, 0);
  assert.equal(revealed[0].points[1].lng, 1);
});

test("revealTrailSegments grows forward from an already revealed index", () => {
  const segments = sampleSegments();
  const revealed = revealTrailSegments(segments, { fromIndex: 2, progress: 0 });

  assert.deepEqual(revealed[1].points, segments[1].points.slice(0, 3));
});

test("revealTrailSegments never drops points and clamps out-of-range progress", () => {
  const segments = sampleSegments();
  assert.deepEqual(revealTrailSegments(segments, { fromIndex: 0, progress: 4 }), segments);
  assert.deepEqual(revealTrailSegments(segments, { fromIndex: 9, progress: 0 }), segments);
  assert.ok(revealTrailSegments(segments, { fromIndex: 0, progress: -1 })[1].points.length >= 2);
});

test("revealTrailSegments leaves a trailing gap bridge alone", () => {
  const segments = [
    ...sampleSegments(),
    { key: "gap-2", kind: TRAIL_SEGMENT_KIND_GAP, snapped: null, points: [point(0, 0, 0), point(1, 1, 1)] },
  ];
  assert.deepEqual(revealTrailSegments(segments, { fromIndex: 0, progress: 0.2 }), segments);
});

test("lastAnimatableSegmentIndex skips empty and gap tails", () => {
  assert.equal(lastAnimatableSegmentIndex(sampleSegments()), 1);
  assert.equal(lastAnimatableSegmentIndex([]), -1);
  assert.equal(lastAnimatableSegmentIndex([segment("a", [point(0, 0, 0)])]), -1);
});

test("resolveRevealDurationMs uses the real elapsed time of the revealed points", () => {
  const points = [point(0, 0, 0), point(0, 1, 1), point(0, 2, 2), point(0, 3, 5)];
  assert.equal(resolveRevealDurationMs(points, 0, 3), 5_000);
  assert.equal(resolveRevealDurationMs(points, 1, 3), 4_000);
});

test("resolveRevealDurationMs clamps and falls back without usable timestamps", () => {
  const slow = [point(0, 0, 0), point(0, 1, 600)];
  assert.equal(resolveRevealDurationMs(slow, 0, 1), TRAIL_REVEAL_MAX_MS);

  const instant = [point(0, 0, 0), point(0, 1, 0)];
  assert.equal(resolveRevealDurationMs(instant, 0, 1), TRAIL_REVEAL_MIN_MS);

  const undated = [
    { lat: 0, lng: 0, recordedAt: null },
    { lat: 0, lng: 1, recordedAt: null },
    { lat: 0, lng: 2, recordedAt: null },
  ];
  const fallback = resolveRevealDurationMs(undated, 0, 2);
  assert.ok(fallback >= TRAIL_REVEAL_MIN_MS && fallback <= TRAIL_REVEAL_MAX_MS);
});

test("planTrailReveal draws everything at once on first paint and when not live", () => {
  const segments = sampleSegments();

  assert.deepEqual(planTrailReveal(null, segments, { isLive: true }), {
    fromIndex: 3,
    target: 3,
    durationMs: 0,
  });
  assert.deepEqual(planTrailReveal(segments, segments, { isLive: false, position: 0 }), {
    fromIndex: 3,
    target: 3,
    durationMs: 0,
  });
  assert.equal(planTrailReveal(null, [], { isLive: true }).durationMs, 0);
});

test("planTrailReveal animates appended points over their real elapsed time", () => {
  const previous = sampleSegments();
  const next = sampleSegments();
  next[1] = {
    ...next[1],
    points: [...next[1].points, point(31.6, 74.44, 14), point(31.6, 74.45, 18)],
  };

  const plan = planTrailReveal(previous, next, { isLive: true, position: 3 });
  assert.equal(plan.fromIndex, 3);
  assert.equal(plan.target, 5);
  assert.equal(plan.durationMs, 5_000);
});

test("planTrailReveal retargets from the current position instead of restarting", () => {
  const previous = sampleSegments();
  const next = sampleSegments();
  next[1] = { ...next[1], points: [...next[1].points, point(31.6, 74.44, 14)] };

  const plan = planTrailReveal(previous, next, { isLive: true, position: 1.5 });
  assert.equal(plan.fromIndex, 1.5);
  assert.equal(plan.target, 4);
});

test("planTrailReveal draws a mid-trail backfill immediately", () => {
  const previous = sampleSegments();
  const backfilled = sampleSegments();
  backfilled[1] = {
    ...backfilled[1],
    points: [
      backfilled[1].points[0],
      point(31.6, 74.405, 10.5),
      ...backfilled[1].points.slice(1),
    ],
  };

  const plan = planTrailReveal(previous, backfilled, { isLive: true, position: 1 });
  assert.equal(plan.durationMs, 0);
  assert.equal(plan.fromIndex, plan.target);
  assert.deepEqual(
    revealTrailSegments(backfilled, { fromIndex: plan.fromIndex, progress: 0 }),
    backfilled
  );
});

test("planTrailReveal resumes forward and stops once the tail is fully drawn", () => {
  const segments = sampleSegments();

  const resumed = planTrailReveal(segments, segments, { isLive: true, position: 1 });
  assert.equal(resumed.fromIndex, 1);
  assert.equal(resumed.target, 3);
  assert.ok(resumed.durationMs > 0);

  const settled = planTrailReveal(segments, segments, { isLive: true, position: 3 });
  assert.deepEqual(settled, { fromIndex: 3, target: 3, durationMs: 0 });

  const overshoot = planTrailReveal(segments, segments, { isLive: true, position: 9 });
  assert.deepEqual(overshoot, { fromIndex: 3, target: 3, durationMs: 0 });
});

test("isSegmentExtension accepts appends and rejects backfilled prefixes", () => {
  const previous = segment("snapped-0-0", [
    point(31.5, 74.3, 0),
    point(31.5, 74.31, 1),
    point(31.5, 74.32, 2),
    point(31.5, 74.33, 3),
  ]);
  const appended = segment("snapped-0-0", [...previous.points, point(31.5, 74.34, 4)]);
  const backfilled = segment("snapped-0-0", [
    previous.points[0],
    point(31.5, 74.305, 0.5),
    ...previous.points.slice(1),
  ]);
  const rekeyed = segment("snapped-0-1", appended.points);

  assert.equal(isSegmentExtension(previous, appended, 3), true);
  assert.equal(isSegmentExtension(previous, previous, 3), true);
  assert.equal(isSegmentExtension(previous, backfilled, 3), false);
  assert.equal(isSegmentExtension(previous, rekeyed, 3), false);
  assert.equal(
    isSegmentExtension(previous, segment("snapped-0-0", previous.points.slice(0, 2)), 3),
    false
  );
});

test("isSegmentExtension tolerates the provisional trailing point being replaced", () => {
  const previous = segment("snapped-0-0", [
    point(31.5, 74.3, 0),
    point(31.5, 74.31, 1),
    point(31.5, 74.32, 2),
    point(31.5, 74.33, 3),
  ]);
  // Display smoothing kept point 3 only because it was last; the next batch supersedes it.
  const resmoothed = segment("snapped-0-0", [
    ...previous.points.slice(0, 3),
    point(31.5, 74.34, 4),
    point(31.5, 74.35, 5),
  ]);

  assert.equal(isSegmentExtension(previous, resmoothed, 3), true);
  assert.equal(isSegmentExtension(previous, resmoothed, 1), true);
});
