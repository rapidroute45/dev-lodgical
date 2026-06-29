/** Prefer server ingest time for "last heard"; fall back to GPS recordedAt. */
export function getDriverLocationLastPingAt(driverLocation) {
  return driverLocation?.ingestedAt ?? driverLocation?.updatedAt ?? null;
}

const STALE_LOCATION_MS = 2 * 60 * 1000;

/** Dispatch UI — one-time location snapshot at route start. */
export function getLocationSharingStatus(driverLocation) {
  if (!getDriverLocationLastPingAt(driverLocation) && driverLocation?.lat == null) {
    return {
      mode: "none",
      label: "No location yet",
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
  return isLocationPingStale(getDriverLocationLastPingAt(driverLocation));
}

export function getStaleLocationHint(driverLocation) {
  if (!isDriverLocationStale(driverLocation)) return null;
  const lastPingAt = getDriverLocationLastPingAt(driverLocation);
  if (!lastPingAt) {
    return "No recent GPS from the driver. They may be offline or location sharing may be disabled.";
  }
  return "Driver GPS has not updated recently. Location on the map may be outdated.";
}
