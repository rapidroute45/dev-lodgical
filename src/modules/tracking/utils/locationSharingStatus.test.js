import assert from "node:assert/strict";
import test from "node:test";

import {
  getLocationSharingStatus,
  getStaleLocationHint,
  isDriverLocationStale,
} from "./locationSharingStatus.js";

const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString();

test("fresh ingest with a fresh fix reads as live", () => {
  const location = { lat: 31.5, lng: 74.3, ingestedAt: iso(5_000), updatedAt: iso(5_000) };
  assert.equal(isDriverLocationStale(location), false);
  assert.equal(getLocationSharingStatus(location).mode, "shared");
});

test("no ingest for over two minutes reads as delayed", () => {
  const location = { lat: 31.5, lng: 74.3, ingestedAt: iso(3 * 60_000), updatedAt: iso(3 * 60_000) };
  assert.equal(isDriverLocationStale(location), true);
  assert.equal(getLocationSharingStatus(location).mode, "stale");
});

test("a fresh check-in carrying an old fix still reads as delayed", () => {
  // Backfill, or GPS lost while the network still works: the server heard from the app
  // just now, but the newest position it sent is minutes old.
  const location = { lat: 31.5, lng: 74.3, ingestedAt: iso(2_000), updatedAt: iso(6 * 60_000) };
  assert.equal(isDriverLocationStale(location), true);
  assert.match(getStaleLocationHint(location), /still reporting/);
});

test("estimated positions are always treated as not live", () => {
  const location = { lat: 31.5, lng: 74.3, ingestedAt: iso(1_000), updatedAt: iso(1_000), estimated: true };
  assert.equal(isDriverLocationStale(location), true);
  assert.equal(getLocationSharingStatus(location).mode, "estimated");
});

test("missing location entirely reports no location yet", () => {
  assert.equal(getLocationSharingStatus({}).mode, "none");
});
