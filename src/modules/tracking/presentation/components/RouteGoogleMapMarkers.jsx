import { AdvancedMarker } from "@vis.gl/react-google-maps";

const MARKER_COLORS = {
  pickup: "#16a34a",
  dropoff: "#2563eb",
  driver: "#dc2626",
};

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

export function RouteDriverMarker({ position, title = "Driver (live)" }) {
  return (
    <AdvancedMarker position={position} title={title} zIndex={50}>
      <DriverLiveMarker />
    </AdvancedMarker>
  );
}
