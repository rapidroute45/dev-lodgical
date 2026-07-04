/** Segment styling kind for drawable trail polylines. */
export function trailSegmentKind(point) {
  if (point?.estimated === true) return "estimated";
  if (point?.snapped !== false) return "snapped";
  return "unsnapped";
}

/** Split trail into drawable segments grouped by snap confidence and estimation. */
export function splitTrailBySnappedFlag(trail) {
  const input = Array.isArray(trail) ? trail : [];
  if (input.length === 0) return [];

  const segments = [];
  let current = [];
  let currentKind = null;

  for (const point of input) {
    const kind = trailSegmentKind(point);
    if (current.length === 0) {
      currentKind = kind;
      current = [point];
      continue;
    }

    if (kind === currentKind) {
      current.push(point);
      continue;
    }

    segments.push({ points: current, snapped: currentKind === "snapped", kind: currentKind });
    current = [point];
    currentKind = kind;
  }

  if (current.length > 0) {
    segments.push({ points: current, snapped: currentKind === "snapped", kind: currentKind });
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

const ESTIMATED_TRAIL_LINE = {
  strokeColor: "#60a5fa",
  strokeOpacity: 0.65,
  strokeWeight: 4,
  icons: [
    {
      icon: { path: "M 0,-1 0,1", strokeOpacity: 0.75, scale: 3 },
      offset: "0",
      repeat: "12px",
    },
  ],
};

export function trailSegmentPolylineOptions(snappedOrKind) {
  if (snappedOrKind === "estimated") {
    return ESTIMATED_TRAIL_LINE;
  }
  if (snappedOrKind === false || snappedOrKind === "unsnapped") {
    return UNSNAPPED_TRAIL_LINE;
  }
  return {
    strokeColor: "#2563eb",
    strokeOpacity: 0.9,
    strokeWeight: 5,
  };
}
