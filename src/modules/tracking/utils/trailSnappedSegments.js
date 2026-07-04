/** Split trail into drawable segments grouped by road-snap confidence. */
export function splitTrailBySnappedFlag(trail) {
  const input = Array.isArray(trail) ? trail : [];
  if (input.length === 0) return [];

  const segments = [];
  let current = [];
  let currentSnapped = null;

  for (const point of input) {
    const snapped = point?.snapped !== false;
    if (current.length === 0) {
      currentSnapped = snapped;
      current = [point];
      continue;
    }

    if (snapped === currentSnapped) {
      current.push(point);
      continue;
    }

    segments.push({ points: current, snapped: currentSnapped });
    current = [point];
    currentSnapped = snapped;
  }

  if (current.length > 0) {
    segments.push({ points: current, snapped: currentSnapped });
  }

  return segments;
}

const UNSNAPPED_TRAIL_LINE = {
  strokeColor: "#64748b",
  strokeOpacity: 0.55,
  strokeWeight: 4,
  icons: [
    {
      icon: { path: "M 0,-1 0,1", strokeOpacity: 0.7, scale: 3 },
      offset: "0",
      repeat: "14px",
    },
  ],
};

export function trailSegmentPolylineOptions(snapped) {
  if (snapped === false) {
    return UNSNAPPED_TRAIL_LINE;
  }
  return {
    strokeColor: "#2563eb",
    strokeOpacity: 0.9,
    strokeWeight: 5,
  };
}
