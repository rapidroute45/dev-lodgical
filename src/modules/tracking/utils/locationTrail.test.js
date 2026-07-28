import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendTrailPoints,
  applyDriverLocationPayloadToTrail,
  MARKER_SNAP_TOLERANCE_M,
  resolveLiveDriverMarkerPoint,
  resolveLiveDriverMarkerTimestamp,
} from './locationTrail.js';

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

test('resolveLiveDriverMarkerPoint prefers trail when off-route', () => {
  const trail = [
    {
      lat: 40.5,
      lng: -74.45,
      recordedAt: '2026-07-01T12:00:10.000Z',
      snapped: false,
    },
  ];
  const driverLocation = {
    lat: 40.51,
    lng: -74.45,
    recordedAt: '2026-07-01T12:00:11.000Z',
  };
  const resolved = resolveLiveDriverMarkerPoint(driverLocation, trail, { offRoute: true });
  assert.equal(resolved?.lat, 40.5);
  assert.equal(resolved?.lng, -74.45);
});

test('resolveLiveDriverMarkerPoint prefers trail when diverged beyond snap tolerance', () => {
  const trailLat = 40.5;
  const driverLat = 40.5 + 80 / 111_320;
  const trail = [
    {
      lat: trailLat,
      lng: -74.45,
      recordedAt: '2026-07-01T12:00:10.000Z',
      snapped: true,
    },
  ];
  const driverLocation = {
    lat: driverLat,
    lng: -74.45,
    recordedAt: '2026-07-01T12:00:11.000Z',
  };
  const resolved = resolveLiveDriverMarkerPoint(driverLocation, trail);
  assert.equal(resolved?.lat, trailLat);
  assert.ok(MARKER_SNAP_TOLERANCE_M === 40);
});

test('resolveLiveDriverMarkerPoint keeps driverLocation when close to trail', () => {
  const trail = [
    {
      lat: 40.5,
      lng: -74.45,
      recordedAt: '2026-07-01T12:00:10.000Z',
      snapped: true,
    },
  ];
  const driverLat = 40.5 + 10 / 111_320;
  const driverLocation = {
    lat: driverLat,
    lng: -74.45,
    recordedAt: '2026-07-01T12:00:11.000Z',
  };
  const resolved = resolveLiveDriverMarkerPoint(driverLocation, trail);
  assert.equal(resolved?.lat, driverLat);
});

test('applyDriverLocationPayloadToTrail skips estimated payloads', () => {
  const existing = [
    { lat: 36.0, lng: -115.0, recordedAt: '2026-06-23T12:00:00.000Z' },
  ];
  const next = applyDriverLocationPayloadToTrail(existing, {
    lat: 36.1,
    lng: -115.1,
    recordedAt: '2026-06-23T12:00:30.000Z',
    estimated: true,
  });
  assert.equal(next.length, 1);
  assert.equal(next[0]?.lat, 36.0);
});

test('appendTrailPoints inserts an offline backfill batch chronologically, not at the end', () => {
  const existing = [
    { lat: 36.0, lng: -115.0, recordedAt: '2026-06-23T12:00:00.000Z' },
    { lat: 36.4, lng: -115.4, recordedAt: '2026-06-23T12:00:40.000Z' },
    { lat: 36.5, lng: -115.5, recordedAt: '2026-06-23T12:00:50.000Z' },
  ];
  const backfill = [
    { lat: 36.2, lng: -115.2, recordedAt: '2026-06-23T12:00:20.000Z' },
    { lat: 36.1, lng: -115.1, recordedAt: '2026-06-23T12:00:10.000Z' },
    { lat: 36.3, lng: -115.3, recordedAt: '2026-06-23T12:00:30.000Z' },
  ];

  const merged = appendTrailPoints(existing, backfill);

  assert.equal(merged.length, 6);
  assert.deepEqual(
    merged.map((point) => point.recordedAt),
    [
      '2026-06-23T12:00:00.000Z',
      '2026-06-23T12:00:10.000Z',
      '2026-06-23T12:00:20.000Z',
      '2026-06-23T12:00:30.000Z',
      '2026-06-23T12:00:40.000Z',
      '2026-06-23T12:00:50.000Z',
    ]
  );
  assert.deepEqual(
    merged.map((point) => point.lat),
    [36.0, 36.1, 36.2, 36.3, 36.4, 36.5]
  );
});

test('appendTrailPoints de-dupes a replayed backfill batch', () => {
  const existing = [
    { lat: 36.0, lng: -115.0, recordedAt: '2026-06-23T12:00:00.000Z' },
    { lat: 36.2, lng: -115.2, recordedAt: '2026-06-23T12:00:20.000Z' },
  ];
  const merged = appendTrailPoints(existing, [
    { lat: 36.1, lng: -115.1, recordedAt: '2026-06-23T12:00:10.000Z' },
    { lat: 36.0, lng: -115.0, recordedAt: '2026-06-23T12:00:00.000Z' },
    { lat: 36.1, lng: -115.1, recordedAt: '2026-06-23T12:00:10.000Z' },
  ]);

  assert.equal(merged.length, 3);
  assert.equal(merged[1]?.lat, 36.1);
});

test('applyDriverLocationPayloadToTrail places a backfilled batch before newer points', () => {
  const existing = [
    { lat: 36.0, lng: -115.0, recordedAt: '2026-06-23T12:00:00.000Z' },
    { lat: 36.9, lng: -115.9, recordedAt: '2026-06-23T12:05:00.000Z' },
  ];
  const next = applyDriverLocationPayloadToTrail(existing, {
    lat: 36.9,
    lng: -115.9,
    recordedAt: '2026-06-23T12:05:00.000Z',
    trailPoints: [
      { lat: 36.3, lng: -115.3, recordedAt: '2026-06-23T12:02:00.000Z' },
      { lat: 36.6, lng: -115.6, recordedAt: '2026-06-23T12:03:00.000Z' },
    ],
  });

  assert.equal(next.length, 4);
  assert.deepEqual(
    next.map((point) => point.lat),
    [36.0, 36.3, 36.6, 36.9]
  );
});

test('resolveLiveDriverMarkerTimestamp reports the timestamp of the chosen source', () => {
  const trail = [
    { lat: 40.5, lng: -74.45, recordedAt: '2026-07-01T12:00:10.000Z', snapped: false },
  ];
  const driverLocation = {
    lat: 40.51,
    lng: -74.45,
    recordedAt: '2026-07-01T12:00:11.000Z',
  };

  const trailPoint = resolveLiveDriverMarkerPoint(driverLocation, trail, { offRoute: true });
  assert.equal(
    resolveLiveDriverMarkerTimestamp(driverLocation, trail, trailPoint),
    '2026-07-01T12:00:10.000Z'
  );

  const driverPoint = resolveLiveDriverMarkerPoint(driverLocation, []);
  assert.equal(
    resolveLiveDriverMarkerTimestamp(driverLocation, [], driverPoint),
    '2026-07-01T12:00:11.000Z'
  );
  assert.equal(resolveLiveDriverMarkerTimestamp(driverLocation, trail, null), null);
});

test('resolveLiveDriverMarkerPoint prefers estimated driverLocation over trail', () => {
  const trail = [
    {
      lat: 40.5,
      lng: -74.45,
      recordedAt: '2026-07-01T12:00:10.000Z',
      snapped: true,
    },
  ];
  const driverLat = 40.5 + 200 / 111_320;
  const driverLocation = {
    lat: driverLat,
    lng: -74.45,
    estimated: true,
    recordedAt: '2026-07-01T12:00:11.000Z',
  };
  const resolved = resolveLiveDriverMarkerPoint(driverLocation, trail);
  assert.equal(resolved?.lat, driverLat);
});
