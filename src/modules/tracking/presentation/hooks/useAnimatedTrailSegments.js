import { useEffect, useMemo, useRef, useState } from "react";
import {
  planTrailReveal,
  revealTrailSegments,
} from "@/modules/tracking/utils/trailReveal.js";

const FULLY_REVEALED = { fromIndex: 0, progress: 1 };

/**
 * Grow the newest part of the drawn trail instead of snapping it forward a whole batch.
 * Display only: the revealed output settles on exactly the segments passed in, and the
 * stored trail is never touched. Backfills and re-splits draw at full length immediately.
 */
export function useAnimatedTrailSegments(segments, { isLive = true } = {}) {
  const [reveal, setReveal] = useState(FULLY_REVEALED);
  const frameRef = useRef(null);
  const previousSegmentsRef = useRef(null);
  const positionRef = useRef(0);

  useEffect(() => {
    const previousSegments = previousSegmentsRef.current;
    previousSegmentsRef.current = segments;

    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const { fromIndex, target, durationMs } = planTrailReveal(previousSegments, segments, {
      isLive,
      position: positionRef.current,
    });
    positionRef.current = fromIndex;

    if (durationMs <= 0) {
      setReveal(FULLY_REVEALED);
      return undefined;
    }

    const startedAt = performance.now();
    setReveal({ fromIndex, progress: 0 });

    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      positionRef.current = fromIndex + (target - fromIndex) * progress;
      frameRef.current = progress < 1 ? requestAnimationFrame(step) : null;
      setReveal({ fromIndex, progress });
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [segments, isLive]);

  return useMemo(() => revealTrailSegments(segments, reveal), [segments, reveal]);
}
