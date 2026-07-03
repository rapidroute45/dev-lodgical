function trailPointKey(point) {
  const recordedAt =
    point?.recordedAt instanceof Date
      ? point.recordedAt.toISOString()
      : String(point?.recordedAt ?? "");
  return `${point?.lat ?? ""},${point?.lng ?? ""},${recordedAt}`;
}

export function normalizeTrailPoint(point) {
  if (point?.lat == null || point?.lng == null) return null;
  return {
    lat: point.lat,
    lng: point.lng,
    recordedAt: point.recordedAt ?? null,
    snapped: point.snapped !== false,
  };
}

export function appendTrailPoints(existingTrail, incomingPoints) {
  const next = Array.isArray(existingTrail) ? [...existingTrail] : [];
  const seen = new Set(next.map(trailPointKey));

  for (const raw of incomingPoints ?? []) {
    const point = normalizeTrailPoint(raw);
    if (!point) continue;
    const key = trailPointKey(point);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(point);
  }

  return next.sort((a, b) => {
    const at = Date.parse(a.recordedAt ?? "") || 0;
    const bt = Date.parse(b.recordedAt ?? "") || 0;
    return at - bt;
  });
}

export function applyDriverLocationPayloadToTrail(prevTrail, payload) {
  if (Array.isArray(payload?.trailPoints) && payload.trailPoints.length > 0) {
    return appendTrailPoints(prevTrail, payload.trailPoints);
  }

  if (payload?.lat == null || payload?.lng == null) {
    return prevTrail;
  }

  return appendTrailPoints(prevTrail, [
    {
      lat: payload.lat,
      lng: payload.lng,
      recordedAt: payload.recordedAt,
    },
  ]);
}
