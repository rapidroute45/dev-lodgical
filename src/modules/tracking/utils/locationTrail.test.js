import assert from 'node:assert/strict';
import test from 'node:test';

import { applyDriverLocationPayloadToTrail } from './locationTrail.js';

test('applyDriverLocationPayloadToTrail appends latest point when trailPoints absent', () => {
  const next = applyDriverLocationPayloadToTrail([], {
    routeId: 'r1',
    driverId: 'd1',
    lat: 36.1,
    lng: -115.1,
    recordedAt: '2026-06-23T12:00:00.000Z',
  });
  assert.equal(next.length, 1);
  assert.equal(next[0]?.lat, 36.1);
});

test('applyDriverLocationPayloadToTrail prefers trailPoints when present', () => {
  const next = applyDriverLocationPayloadToTrail([], {
    lat: 36.1,
    lng: -115.1,
    recordedAt: '2026-06-23T12:00:00.000Z',
    trailPoints: [
      { lat: 36.2, lng: -115.2, recordedAt: '2026-06-23T12:00:01.000Z' },
    ],
  });
  assert.equal(next.length, 1);
  assert.equal(next[0]?.lat, 36.2);
});
