import {
  DEFAULT_ROUTE_CATEGORY,
  ROUTE_CATEGORIES,
} from "@/modules/scheduling/constants.js";

export function normalizeRouteCategory(value) {
  const upper = String(value ?? DEFAULT_ROUTE_CATEGORY).toUpperCase();
  return ROUTE_CATEGORIES.includes(upper) ? upper : DEFAULT_ROUTE_CATEGORY;
}

function categorySortIndex(category) {
  const normalized = normalizeRouteCategory(category);
  const index = ROUTE_CATEGORIES.indexOf(normalized);
  return index >= 0 ? index : ROUTE_CATEGORIES.length;
}

function routeNameSortKey(route) {
  return (route.routeName ?? "").trim();
}

/** Small → Medium → Full, then route name (numeric-aware). */
export function compareRoutesByCategoryThenName(a, b) {
  const catDiff =
    categorySortIndex(a.routeCategory) - categorySortIndex(b.routeCategory);
  if (catDiff !== 0) return catDiff;

  return routeNameSortKey(a).localeCompare(routeNameSortKey(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortRoutesByCategory(routes) {
  return [...(routes ?? [])].sort(compareRoutesByCategoryThenName);
}
