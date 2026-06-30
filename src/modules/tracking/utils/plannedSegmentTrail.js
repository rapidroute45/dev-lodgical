export const OFF_ROUTE_THRESHOLD_M = 50;
export const ROUTE_SNAP_RADIUS_M = 40;

/** Haversine distance in meters. */
export function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function projectOnSegment(point, a, b) {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return {
      lat: a.lat,
      lng: a.lng,
      t: 0,
      distanceM: haversineMeters(point.lat, point.lng, a.lat, a.lng),
    };
  }

  let t = ((point.lng - a.lng) * dx + (point.lat - a.lat) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const lat = a.lat + t * dy;
  const lng = a.lng + t * dx;
  return {
    lat,
    lng,
    t,
    distanceM: haversineMeters(point.lat, point.lng, lat, lng),
  };
}

/** Shortest distance from a GPS point to any segment of the planned polyline. */
export function distanceToPolylineM(gps, polyline) {
  if (!polyline?.length) {
    return { distanceM: Infinity, nearestIndex: 0, projectedLat: gps.lat, projectedLng: gps.lng };
  }

  if (polyline.length === 1) {
    const only = polyline[0];
    return {
      distanceM: haversineMeters(gps.lat, gps.lng, only.lat, only.lng),
      nearestIndex: 0,
      projectedLat: only.lat,
      projectedLng: only.lng,
    };
  }

  let bestIndex = 0;
  let bestDistanceM = Infinity;
  let bestLat = gps.lat;
  let bestLng = gps.lng;

  for (let i = 0; i < polyline.length - 1; i += 1) {
    const projected = projectOnSegment(gps, polyline[i], polyline[i + 1]);
    if (projected.distanceM < bestDistanceM) {
      bestDistanceM = projected.distanceM;
      bestLat = projected.lat;
      bestLng = projected.lng;
      bestIndex = projected.t >= 0.5 ? i + 1 : i;
    }
  }

  return {
    distanceM: bestDistanceM,
    nearestIndex: bestIndex,
    projectedLat: bestLat,
    projectedLng: bestLng,
  };
}

/** Snap one GPS point onto the nearest segment when within maxSnapM. */
export function snapPointToPolyline(gps, polyline, maxSnapM = ROUTE_SNAP_RADIUS_M) {
  if (!polyline?.length || !Number.isFinite(gps?.lat) || !Number.isFinite(gps?.lng)) {
    return {
      lat: gps?.lat,
      lng: gps?.lng,
      snapped: false,
      nearestIndex: 0,
      distanceM: Infinity,
    };
  }

  const { distanceM, nearestIndex, projectedLat, projectedLng } = distanceToPolylineM(gps, polyline);

  if (distanceM <= maxSnapM) {
    return {
      lat: projectedLat,
      lng: projectedLng,
      snapped: true,
      nearestIndex,
      distanceM,
    };
  }

  return {
    lat: gps.lat,
    lng: gps.lng,
    snapped: false,
    nearestIndex,
    distanceM,
  };
}

/** Snap trail points onto the planned segment for map display (monotonic progress). */
export function snapTrailToSegment(
  trail,
  segmentPolyline,
  progressIndex = 0,
  maxSnapM = ROUTE_SNAP_RADIUS_M
) {
  if (!Array.isArray(segmentPolyline) || segmentPolyline.length < 2 || !trail?.length) {
    return trail ?? [];
  }

  let currentProgress = Math.max(0, Math.floor(progressIndex ?? 0));
  const snappedTrail = [];

  for (const point of trail) {
    const lat = point?.lat ?? point?.latitude;
    const lng = point?.lng ?? point?.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const snap = snapPointToPolyline({ lat, lng }, segmentPolyline, maxSnapM);
    if (snap.snapped) {
      currentProgress = Math.max(currentProgress, snap.nearestIndex);
      snappedTrail.push({
        lat: snap.lat,
        lng: snap.lng,
        recordedAt: point.recordedAt ?? null,
      });
    } else {
      snappedTrail.push({ lat, lng, recordedAt: point.recordedAt ?? null });
    }
  }

  return snappedTrail;
}

/** True when the driver's latest GPS is farther than threshold from the planned segment. */
export function isOffPlannedSegment(latestPoint, segmentPolyline, thresholdM = OFF_ROUTE_THRESHOLD_M) {
  if (!latestPoint || segmentPolyline?.length < 2) return false;
  const lat = latestPoint.lat ?? latestPoint.latitude;
  const lng = latestPoint.lng ?? latestPoint.longitude;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  const { distanceM } = distanceToPolylineM({ lat, lng }, segmentPolyline);
  return distanceM > thresholdM;
}

/**
 * Non-overlapping on-route segment paths.
 * completedPath = driven prefix [0..progressIndex]; remainingPath = ahead [progressIndex..end].
 */
export function buildSegmentProgressPaths(segmentPolyline, progressIndex = 0) {
  if (!Array.isArray(segmentPolyline) || segmentPolyline.length < 2) {
    return { completedPath: [], remainingPath: [], greyPath: [], bluePath: [] };
  }

  const clamped = Math.max(0, Math.min(segmentPolyline.length - 1, Math.floor(progressIndex)));
  const completedPath = segmentPolyline.slice(0, clamped + 1);
  const remainingPath = segmentPolyline.slice(clamped);

  return {
    completedPath: completedPath.length >= 2 ? completedPath : [],
    remainingPath: remainingPath.length >= 2 ? remainingPath : [],
    /** @deprecated use remainingPath */
    greyPath: remainingPath.length >= 2 ? remainingPath : [],
    /** @deprecated use completedPath */
    bluePath: completedPath.length >= 2 ? completedPath : [],
  };
}

/** Re-snap trail onto segment for display when progressIndex is missing. */
export function inferProgressIndexFromTrail(segmentPolyline, trail, maxSnapM = 40) {
  if (!segmentPolyline?.length || !trail?.length) return 0;

  let bestIndex = 0;
  let bestDist = Infinity;

  for (const point of trail) {
    const lat = point.lat ?? point.latitude;
    const lng = point.lng ?? point.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    for (let i = 0; i < segmentPolyline.length; i += 1) {
      const seg = segmentPolyline[i];
      const dist = haversineMeters(lat, lng, seg.lat, seg.lng);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
  }

  return bestDist <= maxSnapM ? bestIndex : 0;
}
