/** Matches backend default DWELL_THRESHOLD_MINUTES. */
export const STATIONARY_THRESHOLD_MINUTES = 2;

export function computeDwellMinutes(dwell) {
  if (!dwell?.active) return 0;
  if (dwell.startedAt) {
    const started = new Date(dwell.startedAt).getTime();
    if (!Number.isNaN(started)) {
      return Math.max(dwell.minutes ?? 0, Math.floor((Date.now() - started) / 60_000));
    }
  }
  return dwell.minutes ?? 0;
}

export function isDriverStationary(dwell, thresholdMinutes = STATIONARY_THRESHOLD_MINUTES) {
  if (!dwell?.active) return false;
  if (dwell.alertSent) return true;
  return computeDwellMinutes(dwell) >= thresholdMinutes;
}

export function formatStationaryLabel(dwell, thresholdMinutes = STATIONARY_THRESHOLD_MINUTES) {
  if (!isDriverStationary(dwell, thresholdMinutes)) return null;
  const minutes = computeDwellMinutes(dwell);
  const threshold = dwell?.thresholdMinutes ?? thresholdMinutes;
  const duration = minutes >= threshold ? `${minutes}+ min` : `${threshold}+ min`;
  return `Not moving · ${duration} at same location`;
}
