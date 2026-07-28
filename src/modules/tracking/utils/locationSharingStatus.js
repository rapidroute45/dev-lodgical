/** Prefer server ingest time for "last heard"; fall back to GPS recordedAt. */
export function getDriverLocationLastPingAt(driverLocation) {
  return driverLocation?.ingestedAt ?? driverLocation?.updatedAt ?? null;
}

/** Capture time of the fix actually drawn on the map, not when the server heard from the app. */
export function getDriverLocationFixAt(driverLocation) {
  return driverLocation?.updatedAt ?? null;
}

const STALE_LOCATION_MS = 2 * 60 * 1000;

/** Dispatch UI — location sharing / freshness badge. */
export function getLocationSharingStatus(driverLocation) {
  if (!getDriverLocationLastPingAt(driverLocation) && driverLocation?.lat == null) {
    return {
      mode: "none",
      label: "No location yet",
      badgeClass: "bg-amber-50 text-amber-800 border border-amber-200",
    };
  }

  if (driverLocation?.estimated) {
    return {
      mode: "estimated",
      label: "Estimated (no live GPS)",
      badgeClass: "bg-amber-50 text-amber-800 border border-amber-200",
    };
  }

  if (isDriverLocationStale(driverLocation)) {
    return {
      mode: "stale",
      label: "Location delayed",
      badgeClass: "bg-amber-50 text-amber-800 border border-amber-200",
    };
  }

  return {
    mode: "shared",
    label: "Live GPS active",
    badgeClass: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  };
}

export function isLocationPingStale(lastPingAt) {
  if (!lastPingAt) return true;
  const ms = Date.parse(String(lastPingAt));
  if (Number.isNaN(ms)) return true;
  return Date.now() - ms > STALE_LOCATION_MS;
}

export function isDriverLocationStale(driverLocation) {
  if (driverLocation?.estimated) return true;
  // Two independent ways the marker can be lying: the app stopped checking in, or it
  // checked in on time but the newest fix it carried is itself old (backfill, lost GPS
  // with working network). Either one means the drawn position is not current.
  return (
    isLocationPingStale(getDriverLocationLastPingAt(driverLocation)) ||
    isLocationPingStale(getDriverLocationFixAt(driverLocation))
  );
}

export function getStaleLocationHint(driverLocation) {
  if (!isDriverLocationStale(driverLocation)) return null;
  if (driverLocation?.estimated) {
    return "Showing estimated position along the planned route — no live GPS from the driver.";
  }
  const lastPingAt = getDriverLocationLastPingAt(driverLocation);
  if (!lastPingAt) {
    return "No recent GPS from the driver. They may be offline or location sharing may be disabled.";
  }
  if (!isLocationPingStale(lastPingAt)) {
    return "The driver app is still reporting, but its newest GPS fix is old. Location on the map may be outdated.";
  }
  return "Driver GPS has not updated recently. Location on the map may be outdated.";
}
