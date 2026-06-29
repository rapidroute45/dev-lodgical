/** Prefer server ingest time for "last heard"; fall back to GPS recordedAt. */
export function getDriverLocationLastPingAt(driverLocation) {
  return driverLocation?.ingestedAt ?? driverLocation?.updatedAt ?? null;
}

/** Dispatch UI — one-time location snapshot at route start. */
export function getLocationSharingStatus(driverLocation) {
  if (!getDriverLocationLastPingAt(driverLocation) && driverLocation?.lat == null) {
    return {
      mode: "none",
      label: "No location yet",
      badgeClass: "bg-amber-50 text-amber-800 border border-amber-200",
    };
  }

  return {
    mode: "shared",
    label: "Shared at route start",
    badgeClass: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  };
}

export function isLocationPingStale() {
  return false;
}

export function isDriverLocationStale() {
  return false;
}

export function getStaleLocationHint() {
  return null;
}
