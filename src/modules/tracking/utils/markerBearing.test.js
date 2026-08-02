import assert from "node:assert/strict";
import test from "node:test";

import {
  bearingDegrees,
  interpolateHeading,
  shortestRotationDelta,
} from "./markerBearing.js";

const near = (actual, expected, tolerance = 1) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`
  );
};

test("bearingDegrees points north when driving up a meridian", () => {
  near(bearingDegrees({ lat: 31.52, lng: 74.35 }, { lat: 31.53, lng: 74.35 }), 0);
});

test("bearingDegrees points east when driving along a parallel", () => {
  near(bearingDegrees({ lat: 31.52, lng: 74.35 }, { lat: 31.52, lng: 74.36 }), 90);
});

test("bearingDegrees points south-west on a reverse diagonal", () => {
  near(bearingDegrees({ lat: 31.52, lng: 74.35 }, { lat: 31.51, lng: 74.34 }), 220, 10);
});

test("bearingDegrees ignores jitter so the icon does not spin at a stop", () => {
  assert.equal(
    bearingDegrees({ lat: 31.52, lng: 74.35 }, { lat: 31.520001, lng: 74.350001 }),
    null
  );
});

test("bearingDegrees rejects unusable coordinates", () => {
  assert.equal(bearingDegrees(null, { lat: 31.52, lng: 74.35 }), null);
  assert.equal(bearingDegrees({ lat: 31.52, lng: 74.35 }, { lat: "x", lng: 1 }), null);
});

test("shortestRotationDelta crosses north the short way", () => {
  assert.equal(shortestRotationDelta(350, 10), 20);
  assert.equal(shortestRotationDelta(10, 350), -20);
});

test("interpolateHeading unwraps past north instead of spinning back round", () => {
  assert.equal(interpolateHeading(350, 10, 0.5), 360);
});

test("interpolateHeading clamps progress to the target", () => {
  assert.equal(interpolateHeading(0, 90, 2), 90);
  assert.equal(interpolateHeading(0, 90, -1), 0);
});

test("interpolateHeading falls back when either side is unknown", () => {
  assert.equal(interpolateHeading(null, 90, 0.5), 90);
  assert.equal(interpolateHeading(90, null, 0.5), 90);
});
