export function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDisplayDate(isoDate) {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isoDateFromParts(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseIsoDate(isoDate) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    };
  }
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

export function compareIsoDates(a, b) {
  return a.localeCompare(b);
}

export function isoDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function maxPayrollPeriodEndIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatTimestamp(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function addDaysToIsoDate(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Default +2h departure from arrival "HH:mm" (matches mobile). */
export function defaultDepartureFromArrival(arrival) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(arrival).trim());
  if (!match) return "12:00";
  let total = Number(match[1]) * 60 + Number(match[2]) + 120;
  if (total >= 24 * 60) total = 23 * 60 + 59;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Hours from driver start → route complete, or first→last stop completion as fallback. */
export function routeDurationHours(startedAt, completedAt, dropoffs = []) {
  if (startedAt && completedAt) {
    const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    if (ms > 0) return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
  }

  const stopTimes = dropoffs
    .map((stop) => stop?.completedAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (stopTimes.length >= 1) {
    const ms = Math.max(...stopTimes) - Math.min(...stopTimes);
    if (ms >= 0) return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
  }

  return null;
}

export function formatRouteDurationHours(startedAt, completedAt, dropoffs = []) {
  const hours = routeDurationHours(startedAt, completedAt, dropoffs);
  if (hours == null) return "—";
  return `${hours.toFixed(2)}h`;
}
