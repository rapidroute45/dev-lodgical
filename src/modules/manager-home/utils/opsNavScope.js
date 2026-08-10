import { getUserAssignedCities } from "@/shared/utils/assignedCities.js";
import {
  canManageLocationScope,
  PAYROLL_VIEWER_ROLES,
  UserRole,
} from "@/shared/utils/constants.js";
import { citiesMatch } from "@/modules/scheduling/utils/storeLocations.js";

function isCityAssignedRole(role) {
  return role === UserRole.DISPATCH_TEAM || role === UserRole.ONSITE_MANAGER;
}

/**
 * @param {string|null|undefined} city
 * @param {string[]|null|undefined} allowedCities
 * @param {{ requireAssigned?: boolean }} [opts]
 * When requireAssigned is true (city-scoped roles), empty allowedCities means deny all.
 */
export function cityInScope(city, allowedCities, opts = {}) {
  if (!allowedCities?.length) return !opts.requireAssigned;
  if (!city?.trim()) return false;
  return allowedCities.some((item) => citiesMatch(item, city));
}

export function stateInScope(state, globalState) {
  if (!globalState?.trim()) return true;
  if (!state?.trim()) return false;
  return state.trim().toUpperCase() === globalState.trim().toUpperCase();
}

export function routeCity(route) {
  return route?.schedule?.city ?? route?.location ?? route?.city ?? "";
}

export function routeState(route) {
  return route?.schedule?.state ?? route?.state ?? "";
}

export function routeInScope(route, allowedCities, globalState, opts = {}) {
  if (globalState && !stateInScope(routeState(route), globalState)) return false;
  if (!allowedCities?.length) return !opts.requireAssigned;
  return cityInScope(routeCity(route), allowedCities, opts);
}

export function storeInScope(store, allowedCities, globalState, opts = {}) {
  if (globalState && !stateInScope(store?.state, globalState)) return false;
  if (!allowedCities?.length) return !opts.requireAssigned;
  return cityInScope(store?.city, allowedCities, opts);
}

export function cityRecordInScope(cityRecord, allowedCities, globalState, opts = {}) {
  if (globalState) {
    const recordState =
      typeof cityRecord === "string" ? null : cityRecord?.state;
    if (recordState && !stateInScope(recordState, globalState)) return false;
  }
  if (!allowedCities?.length) return !opts.requireAssigned;
  const name = typeof cityRecord === "string" ? cityRecord : cityRecord?.name;
  return cityInScope(name, allowedCities, opts);
}

export function filterRoutesByScope(routes, allowedCities, globalState, opts = {}) {
  if (!allowedCities?.length && !globalState) {
    return opts.requireAssigned ? [] : routes;
  }
  return routes.filter((route) => routeInScope(route, allowedCities, globalState, opts));
}

export function filterStoresByScope(stores, allowedCities, globalState, opts = {}) {
  if (!allowedCities?.length && !globalState) {
    return opts.requireAssigned ? [] : stores;
  }
  return stores.filter((store) => storeInScope(store, allowedCities, globalState, opts));
}

export function filterCitiesByScope(cities, allowedCities, globalState, opts = {}) {
  if (!allowedCities?.length && !globalState) {
    return opts.requireAssigned ? [] : cities;
  }
  return cities.filter((city) => cityRecordInScope(city, allowedCities, globalState, opts));
}

export function routesQueryCityParam(allowedCities) {
  if (allowedCities?.length === 1) return allowedCities[0];
  return undefined;
}

export function getOpsNavScope(user, locationScope = {}) {
  const assignedCities = getUserAssignedCities(user);
  const canUseGlobalScope = canManageLocationScope(user?.role);
  const cityAssignedRole = isCityAssignedRole(user?.role);
  const pickerCity = locationScope.city?.trim() || null;
  const pickerState = locationScope.state?.trim() || null;
  const scopeOpts = cityAssignedRole ? { requireAssigned: true } : {};

  let effectiveCities = assignedCities;
  let globalState = null;

  if (canUseGlobalScope) {
    if (pickerCity) effectiveCities = [pickerCity];
    globalState = pickerState;
  } else if (pickerCity && cityInScope(pickerCity, assignedCities, scopeOpts)) {
    // City-scoped roles (DT / OM) may narrow to one of their assigned cities.
    effectiveCities = [pickerCity];
  }

  // OM/DT are always city-scoped even with zero assignments (empty result set).
  const isCityScoped = cityAssignedRole || effectiveCities.length > 0 || Boolean(globalState);
  const isDispatchTeam = user?.role === UserRole.DISPATCH_TEAM;
  const showPayroll = PAYROLL_VIEWER_ROLES.includes(user?.role);

  return {
    assignedCities: effectiveCities,
    globalState,
    isCityScoped,
    isCityAssignedRole: cityAssignedRole,
    requireAssigned: cityAssignedRole,
    isDispatchTeam,
    showPayroll,
    routesQueryCity: pickerCity && (canUseGlobalScope || cityInScope(pickerCity, assignedCities, scopeOpts))
      ? pickerCity
      : routesQueryCityParam(effectiveCities),
    routesQueryState: canUseGlobalScope ? globalState ?? undefined : undefined,
  };
}
