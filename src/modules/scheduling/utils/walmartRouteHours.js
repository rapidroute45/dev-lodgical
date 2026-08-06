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
