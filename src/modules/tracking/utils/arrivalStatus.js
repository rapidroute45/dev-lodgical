/**
 * Live ETA / LATE badge from backend auto-pace detection (driver:location.eta).
 * Mirrors locationSharingStatus.js shape for sidebar / header badges.
 */

export function getArrivalStatus(eta) {
  if (!eta?.status) {
    return {
      mode: "none",
      label: null,
      badgeVariant: null,
    };
  }

  switch (eta.status) {
    case "late":
      return {
        mode: "late",
        label: "LATE",
        badgeVariant: "rose",
      };
    case "at_risk":
      return {
        mode: "at_risk",
        label: "At risk",
        badgeVariant: "pending",
      };
    case "on_time":
      return {
        mode: "on_time",
        label: "On time",
        badgeVariant: "done",
      };
    default:
      return {
        mode: "none",
        label: null,
        badgeVariant: null,
      };
  }
}

export function formatEtaTime(etaAt) {
  if (!etaAt) return null;
  const date = new Date(etaAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
