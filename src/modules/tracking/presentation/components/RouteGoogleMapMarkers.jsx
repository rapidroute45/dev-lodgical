import { AdvancedMarker } from "@vis.gl/react-google-maps";

const MARKER_COLORS = {
  pickup: "#16a34a",
  dropoff: "#2563eb",
  driver: "#ea580c",
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
    <AdvancedMarker position={position} title={title} zIndex={40}>
      <MarkerBubble label="D" color={MARKER_COLORS.driver} />
    </AdvancedMarker>
  );
}
