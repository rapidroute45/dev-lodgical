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

export const TRAIL_SEGMENT_KIND_GAP = "gap";

/**
 * Sparse pale-blue dots across a GPS hole: same trail, but the path between the
 * two fixes is unknown. Deliberately lighter and sparser than the unsnapped dashes.
 */
const GAP_BRIDGE_TRAIL_LINE = {
  strokeColor: "#60a5fa",
  strokeOpacity: 0,
  strokeWeight: 3,
  icons: [
    {
      icon: { path: "M 0,-1 0,1", strokeOpacity: 0.45, scale: 2 },
      offset: "0",
      repeat: "24px",
    },
  ],
};

/** Solid blue chord used on completed routes so ops see one continuous track. */
const COMPLETED_GAP_BRIDGE_LINE = {
  strokeColor: "#2563eb",
  strokeOpacity: 0.9,
  strokeWeight: 5,
};

const SNAPPED_TRAIL_LINE = {
  strokeColor: "#2563eb",
  strokeOpacity: 0.9,
  strokeWeight: 5,
};

/** Accepts a drawable segment or a bare `snapped` flag (legacy call sites). */
export function trailSegmentPolylineOptions(segmentOrSnapped) {
  const isSegment = segmentOrSnapped !== null && typeof segmentOrSnapped === "object";
  if (isSegment && segmentOrSnapped.kind === TRAIL_SEGMENT_KIND_GAP) {
    // Completed routes: straight solid blue joins (not pale dotted).
    if (segmentOrSnapped.solid) return COMPLETED_GAP_BRIDGE_LINE;
    return GAP_BRIDGE_TRAIL_LINE;
  }

  const snapped = isSegment ? segmentOrSnapped.snapped : segmentOrSnapped;
  // Completed maps: render unsnapped stretches as solid blue too (no grey dashes).
  if (snapped === false && !(isSegment && segmentOrSnapped.forceSolid)) {
    return UNSNAPPED_TRAIL_LINE;
  }
  return SNAPPED_TRAIL_LINE;
}
