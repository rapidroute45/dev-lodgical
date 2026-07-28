import { TRAIL_SEGMENT_KIND_GAP } from "./trailSnappedSegments.js";

/** Floor on reveal time so a single stale point still animates rather than blinking in. */
export const TRAIL_REVEAL_MIN_MS = 300;
/** Ceiling on reveal time — bounds how far the drawn line may lag behind stored data. */
export const TRAIL_REVEAL_MAX_MS = 8_000;
const TRAIL_REVEAL_FALLBACK_MS_PER_POINT = 400;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function interpolateTrailPoint(from, to, fraction) {
  return {
    lat: lerp(Number(from.lat), Number(to.lat), fraction),
    lng: lerp(Number(from.lng), Number(to.lng), fraction),
    recordedAt: from.recordedAt ?? null,
  };
}

function samePoint(a, b) {
  if (!a || !b) return false;
  return (
    Number(a.lat) === Number(b.lat) &&
    Number(a.lng) === Number(b.lng) &&
    (a.recordedAt ?? null) === (b.recordedAt ?? null)
  );
}

/** Index of the trailing segment eligible for growth, or -1 when there is nothing to animate. */
export function lastAnimatableSegmentIndex(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return -1;
  const index = segments.length - 1;
  const segment = segments[index];
  if (!segment || segment.kind === TRAIL_SEGMENT_KIND_GAP) return -1;
  if ((segment.points?.length ?? 0) < 2) return -1;
  return index;
}

/**
 * True when `next` merely adds to what `previous` had drawn up to `drawnIndex`.
 * A backfill landing behind the drawn frontier, or a re-split, changes the prefix and
 * must be drawn at full length immediately instead of animated.
 */
export function isSegmentExtension(previous, next, drawnIndex = Number.POSITIVE_INFINITY) {
  if (!previous || !next) return false;
  if (previous.key !== next.key) return false;

  const previousPoints = previous.points ?? [];
  const nextPoints = next.points ?? [];
  if (previousPoints.length === 0) return false;
  if (nextPoints.length < previousPoints.length) return false;
  if (!samePoint(previousPoints[0], nextPoints[0])) return false;

  // Display smoothing always keeps the trailing fix, so the newest point is provisional and
  // a later batch may drop it in favour of one further along. Behind it nothing may move.
  const settled = Math.min(
    Math.ceil(drawnIndex),
    previousPoints.length - 2,
    nextPoints.length - 1
  );
  if (settled <= 0) return true;
  return samePoint(previousPoints[settled], nextPoints[settled]);
}

/**
 * Real time spanned by the points between `fromIndex` and `toIndex`, so a 5 s batch of
 * 1 Hz fixes draws over ~5 s. Falls back to a per-point estimate without usable timestamps.
 */
export function resolveRevealDurationMs(points, fromIndex, toIndex) {
  const startIndex = Math.max(0, Math.floor(fromIndex));
  const from = points?.[startIndex];
  const to = points?.[toIndex];
  const fallbackMs = Math.max(1, toIndex - startIndex) * TRAIL_REVEAL_FALLBACK_MS_PER_POINT;

  const fromMs = Date.parse(from?.recordedAt ?? "");
  const toMs = Date.parse(to?.recordedAt ?? "");
  const hasTimestamps = Number.isFinite(fromMs) && Number.isFinite(toMs);
  const durationMs = hasTimestamps ? Math.max(0, toMs - fromMs) : fallbackMs;

  return clamp(durationMs, TRAIL_REVEAL_MIN_MS, TRAIL_REVEAL_MAX_MS);
}

/**
 * Decide how the trailing segment should grow after a trail update.
 * `durationMs` of 0 means draw everything now — first paint, history, a backfill that
 * changed the prefix, or simply no new points.
 */
export function planTrailReveal(previousSegments, segments, options = {}) {
  const { isLive = true, position = 0 } = options;

  const index = lastAnimatableSegmentIndex(segments);
  if (index < 0) return { fromIndex: 0, target: 0, durationMs: 0 };

  const points = segments[index].points;
  const target = points.length - 1;
  const previousIndex = lastAnimatableSegmentIndex(previousSegments);
  const continues =
    isLive &&
    previousIndex >= 0 &&
    isSegmentExtension(previousSegments[previousIndex], segments[index], position);

  const fromIndex = continues ? clamp(position, 0, target) : target;
  if (fromIndex >= target) return { fromIndex: target, target, durationMs: 0 };

  return {
    fromIndex,
    target,
    durationMs: resolveRevealDurationMs(points, fromIndex, target),
  };
}

/**
 * Display-only view of `segments` where the trailing segment is drawn from `fromIndex`
 * towards its end by `progress`. At progress 1 the input is returned untouched.
 */
export function revealTrailSegments(segments, { fromIndex = 0, progress = 1 } = {}) {
  const index = lastAnimatableSegmentIndex(segments);
  if (index < 0) return segments;

  const points = segments[index].points;
  const target = points.length - 1;
  const start = clamp(Number.isFinite(fromIndex) ? fromIndex : 0, 0, target);
  const position = start + (target - start) * clamp(progress, 0, 1);
  const whole = Math.floor(position);
  if (whole >= target) return segments;

  const revealedPoints = points.slice(0, whole + 1);
  const fraction = position - whole;
  if (fraction > 0 || revealedPoints.length < 2) {
    revealedPoints.push(interpolateTrailPoint(points[whole], points[whole + 1], fraction));
  }

  const next = segments.slice();
  next[index] = { ...segments[index], points: revealedPoints };
  return next;
}
