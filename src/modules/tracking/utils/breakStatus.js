export function formatBreakLabel(driverBreak) {
  if (!driverBreak?.active) return null;
  const endsAt = driverBreak.endsAt ? new Date(driverBreak.endsAt) : null;
  if (!endsAt || Number.isNaN(endsAt.getTime())) {
    return "On break";
  }

  const remainingMs = Math.max(0, endsAt.getTime() - Date.now());
  const totalMin = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  const timeLeft = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return `On break · ${timeLeft} left`;
}

export function isDriverOnBreak(driverBreak) {
  return Boolean(driverBreak?.active);
}
