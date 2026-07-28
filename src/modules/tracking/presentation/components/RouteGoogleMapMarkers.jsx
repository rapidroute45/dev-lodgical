import { useEffect, useRef, useState } from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";

const MARKER_COLORS = {
  pickup: "#16a34a",
  routeStart: "#15803d",
  dropoff: "#2563eb",
  driver: "#dc2626",
};

const MARKER_TWEEN_MS = 1_000;
const MARKER_TWEEN_MIN_MS = 250;
const MARKER_TWEEN_MAX_MS = 5_000;

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

/** Tween over the real time between two fixes so marker speed matches reality. */
function resolveTweenDurationMs(fromRecordedAt, toRecordedAt) {
  const fromMs = Date.parse(fromRecordedAt ?? "");
  const toMs = Date.parse(toRecordedAt ?? "");
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return MARKER_TWEEN_MS;
  const elapsedMs = toMs - fromMs;
  if (!(elapsedMs > 0)) return MARKER_TWEEN_MS;
  return Math.min(MARKER_TWEEN_MAX_MS, Math.max(MARKER_TWEEN_MIN_MS, elapsedMs));
}

function MarkerBubble({ label, color, size = 22 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: color,
        color: "#ffffff",
        fontWeight: 700,
        fontSize: size <= 20 ? 10 : 11,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid #ffffff",
        boxShadow: "0 1px 4px rgba(15, 23, 42, 0.35)",
        lineHeight: 1,
      }}
    >
      {label}
    </div>
  );
}

function DriverLiveMarker() {
  return (
    <div className="route-driver-live-marker" aria-hidden="true">
      <span className="route-driver-live-marker__pulse" />
      <span className="route-driver-live-marker__core">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
          <path
            d="M5 11h14l-1.5-4.5A2 2 0 0 0 15.7 5H8.3a2 2 0 0 0-1.8 1.5L5 11Zm0 0v5.5a1.5 1.5 0 0 0 1.5 1.5H7a1 1 0 0 0 1-1v-1H16v1a1 1 0 0 0 1 1h.5a1.5 1.5 0 0 0 1.5-1.5V11"
            fill="#ffffff"
          />
        </svg>
      </span>
    </div>
  );
}

export function RoutePickupMarker({ position, title = "Pickup" }) {
  return (
    <AdvancedMarker position={position} title={title} zIndex={30}>
      <MarkerBubble label="P" color={MARKER_COLORS.pickup} size={24} />
    </AdvancedMarker>
  );
}

export function RouteStartMarker({ position, title = "Route start" }) {
  return (
    <AdvancedMarker position={position} title={title} zIndex={28}>
      <MarkerBubble label="S" color={MARKER_COLORS.routeStart} size={22} />
    </AdvancedMarker>
  );
}

export function RouteDropoffMarker({ position, sequence, title }) {
  return (
    <AdvancedMarker
      position={position}
      title={title ?? `Stop ${sequence}`}
      zIndex={35}
    >
      <MarkerBubble label={String(sequence)} color={MARKER_COLORS.dropoff} />
    </AdvancedMarker>
  );
}

export function RouteDriverMarker({
  position,
  recordedAt = null,
  title = "Driver (live)",
  animate = false,
}) {
  const [displayPosition, setDisplayPosition] = useState(position);
  const displayRef = useRef(position);
  const frameRef = useRef(null);
  const previousRecordedAtRef = useRef(recordedAt);

  useEffect(() => {
    displayRef.current = displayPosition;
  }, [displayPosition]);

  useEffect(() => {
    const previousRecordedAt = previousRecordedAtRef.current;
    previousRecordedAtRef.current = recordedAt ?? null;

    if (!position) {
      setDisplayPosition(null);
      return;
    }

    if (!animate) {
      setDisplayPosition(position);
      return;
    }

    const from = displayRef.current ?? position;
    if (from.lat === position.lat && from.lng === position.lng) {
      return;
    }

    const durationMs = resolveTweenDurationMs(previousRecordedAt, recordedAt);
    const startedAt = performance.now();

    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      setDisplayPosition({
        lat: lerp(from.lat, position.lat, progress),
        lng: lerp(from.lng, position.lng, progress),
      });
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [animate, position?.lat, position?.lng, recordedAt]);

  if (!displayPosition) return null;

  return (
    <AdvancedMarker position={displayPosition} title={title} zIndex={50}>
      <DriverLiveMarker />
    </AdvancedMarker>
  );
}
