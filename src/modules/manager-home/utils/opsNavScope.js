import { getUserAssignedCities } from "@/shared/utils/assignedCities.js";
import { canManageLocationScope, PAYROLL_VIEWER_ROLES, UserRole } from "@/shared/utils/constants.js";
import { citiesMatch } from "@/modules/scheduling/utils/storeLocations.js";

export function cityInScope(city, allowedCities) {
  if (!allowedCities?.length) return true;
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

export function routeInScope(route, allowedCities, globalState) {
  if (globalState && !stateInScope(routeState(route), globalState)) return false;
  if (!allowedCities?.length) return true;
  return cityInScope(routeCity(route), allowedCities);
}

export function storeInScope(store, allowedCities, globalState) {
  if (globalState && !stateInScope(store?.state, globalState)) return false;
  if (!allowedCities?.length) return true;
  return cityInScope(store?.city, allowedCities);
}

export function cityRecordInScope(cityRecord, allowedCities, globalState) {
  if (globalState) {
    const recordState =
      typeof cityRecord === "string" ? null : cityRecord?.state;
    if (recordState && !stateInScope(recordState, globalState)) return false;
  }
  if (!allowedCities?.length) return true;
  const name = typeof cityRecord === "string" ? cityRecord : cityRecord?.name;
  return cityInScope(name, allowedCities);
}

export function filterRoutesByScope(routes, allowedCities, globalState) {
  if (!allowedCities?.length && !globalState) return routes;
  return routes.filter((route) => routeInScope(route, allowedCities, globalState));
}

export function filterStoresByScope(stores, allowedCities, globalState) {
  if (!allowedCities?.length && !globalState) return stores;
  return stores.filter((store) => storeInScope(store, allowedCities, globalState));
}

export function filterCitiesByScope(cities, allowedCities, globalState) {
  if (!allowedCities?.length && !globalState) return cities;
  return cities.filter((city) => cityRecordInScope(city, allowedCities, globalState));
}

export function routesQueryCityParam(allowedCities) {
  if (allowedCities?.length === 1) return allowedCities[0];
  return undefined;
}

export function getOpsNavScope(user, locationScope = {}) {
  const assignedCities = getUserAssignedCities(user);
  const canUseGlobalScope = canManageLocationScope(user?.role);
  const globalCity = canUseGlobalScope ? locationScope.city?.trim() || null : null;
  const globalState = canUseGlobalScope ? locationScope.state?.trim() || null : null;

  let effectiveCities = assignedCities;
  if (globalCity) {
    effectiveCities = [globalCity];
  }

  const isCityScoped = effectiveCities.length > 0 || Boolean(globalState);
  const isDispatchTeam = user?.role === UserRole.DISPATCH_TEAM;
  const showPayroll = PAYROLL_VIEWER_ROLES.includes(user?.role);

  return {
    assignedCities: effectiveCities,
    globalState,
    isCityScoped,
    isDispatchTeam,
    showPayroll,
    routesQueryCity: globalCity ?? routesQueryCityParam(effectiveCities),
    routesQueryState: globalState ?? undefined,
  };
}
