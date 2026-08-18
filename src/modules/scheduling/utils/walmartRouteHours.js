import { DEFAULT_ROUTE_CATEGORY } from "@/modules/scheduling/constants.js";

/** Static route hours for Walmart stores by category. */
export const WALMART_ROUTE_HOURS = {
  SMALL: 5.5,
  MEDIUM: 8.5,
  FULL: 10,
};

export function isWalmartStoreName(storeName) {
  return Boolean(storeName?.trim().toLowerCase().startsWith("walmart"));
}

/** True when schedule store or route name indicates Walmart. */
export function isWalmartRoute({ storeName, routeName, location } = {}) {
  if (isWalmartStoreName(storeName)) return true;
  if (isWalmartStoreName(routeName)) return true;
  if (isWalmartStoreName(location)) return true;
  return false;
}

/** Fixed Walmart hours for category, or null when not a Walmart route. */
export function walmartHoursForCategory(category, { storeName, routeName, location } = {}) {
  if (!isWalmartRoute({ storeName, routeName, location })) return null;
  const key = String(category ?? DEFAULT_ROUTE_CATEGORY).toUpperCase();
  if (key === "MEDIUM") return WALMART_ROUTE_HOURS.MEDIUM;
  if (key === "FULL") return WALMART_ROUTE_HOURS.FULL;
  return WALMART_ROUTE_HOURS.SMALL;
}

function parseTimeToMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? "").trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

/** Departure time from arrival + fixed Walmart hours, or null when not applicable. */
export function walmartDepartureForRoute(
  { routeCategory, arrivalTime },
  { storeName, routeName, location } = {}
) {
  const hours = walmartHoursForCategory(routeCategory, { storeName, routeName, location });
  if (hours == null) return null;
  const start = parseTimeToMinutes(arrivalTime);
  if (start == null) return null;
  let total = start + Math.round(hours * 60);
  if (total >= 24 * 60) total = 23 * 60 + 59;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** True when departure still matches the Walmart category default (not manually overridden). */
export function isWalmartDepartureSynced(
  row,
  { storeName, routeName, location } = {}
) {
  const expected = walmartDepartureForRoute(row, { storeName, routeName, location });
  if (!expected) return false;
  return String(row.departureTime ?? "").trim() === expected;
}
