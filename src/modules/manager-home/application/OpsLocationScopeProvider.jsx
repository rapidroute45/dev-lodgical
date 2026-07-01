import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import {
  canManageLocationScope,
  canUseLocationScopePicker,
} from "@/shared/utils/constants.js";
import { getUserAssignedCities } from "@/shared/utils/assignedCities.js";
import {
  citiesMatch,
  filterLocationsByAllowedCities,
  locationKey,
} from "@/modules/scheduling/utils/storeLocations.js";
import { useLocationsQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";

const STORAGE_KEY = "ops_location_scope";

const OpsLocationScopeContext = createContext(null);

function readStoredScope() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: null, city: null };
    const parsed = JSON.parse(raw);
    return {
      state: parsed.state?.trim() || null,
      city: parsed.city?.trim() || null,
    };
  } catch {
    return { state: null, city: null };
  }
}

function writeStoredScope(scope) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
  } catch {
    /* ignore */
  }
}

function sanitizeStoredScope(stored, allowedLocations) {
  if (!stored.state && !stored.city) {
    return { state: null, city: null };
  }

  if (stored.city) {
    const cityMatches = allowedLocations.filter((loc) =>
      citiesMatch(loc.city, stored.city)
    );
    if (cityMatches.length === 0) {
      return { state: null, city: null };
    }
    if (stored.state) {
      const exact = cityMatches.find((loc) => loc.state === stored.state);
      if (exact) return { state: exact.state, city: exact.city };
    }
    if (cityMatches.length === 1) {
      return { state: cityMatches[0].state, city: cityMatches[0].city };
    }
    return { state: null, city: null };
  }

  if (stored.state) {
    const hasState = allowedLocations.some((loc) => loc.state === stored.state);
    if (hasState) return { state: stored.state, city: null };
  }

  return { state: null, city: null };
}

export function OpsLocationScopeProvider({ children }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManageScope = canManageLocationScope(user?.role);
  const canPickScope = canUseLocationScopePicker(user?.role);
  const isGlobalScope = canManageScope;
  const assignedCities = useMemo(() => getUserAssignedCities(user), [user]);

  const { data: locationsPayload } = useLocationsQuery(canPickScope);
  const allLocations = useMemo(() => {
    const fromApi = locationsPayload?.locations ?? [];
    return fromApi.map((loc) => ({
      key: locationKey(loc.city, loc.state),
      city: loc.city,
      state: loc.state,
      label: `${loc.city}, ${loc.state}`,
    }));
  }, [locationsPayload]);

  const allowedLocations = useMemo(() => {
    if (isGlobalScope) return allLocations;
    if (assignedCities.length === 0) return allLocations;
    return filterLocationsByAllowedCities(allLocations, assignedCities);
  }, [allLocations, isGlobalScope, assignedCities]);

  const isLocked = !isGlobalScope && allowedLocations.length === 1;

  const allowedStates = useMemo(
    () =>
      [...new Set(allowedLocations.map((loc) => loc.state))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [allowedLocations]
  );

  const [state, setStateRaw] = useState(null);
  const [city, setCityRaw] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!canPickScope) {
      setStateRaw(null);
      setCityRaw(null);
      setHydrated(true);
      return;
    }
    if (locationsPayload === undefined) return;

    if (isLocked) {
      const only = allowedLocations[0];
      setStateRaw(only.state);
      setCityRaw(only.city);
      writeStoredScope({ state: only.state, city: only.city });
      setHydrated(true);
      return;
    }

    const stored = readStoredScope();
    const sanitized = sanitizeStoredScope(stored, allowedLocations);
    setStateRaw(sanitized.state);
    setCityRaw(sanitized.city);
    if (sanitized.state !== stored.state || sanitized.city !== stored.city) {
      writeStoredScope(sanitized);
    }
    setHydrated(true);
  }, [canPickScope, user?.id, locationsPayload, allowedLocations, isLocked]);

  const invalidateScopeQueries = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const setState = useCallback(
    (next) => {
      if (!canPickScope || isLocked) return;
      if (next && !allowedStates.includes(next)) return;
      setStateRaw(next);
      setCityRaw(null);
      writeStoredScope({ state: next, city: null });
      invalidateScopeQueries();
    },
    [canPickScope, isLocked, allowedStates, invalidateScopeQueries]
  );

  const setCity = useCallback(
    (next) => {
      if (!canPickScope || isLocked) return;
      let resolvedState = state;
      if (next) {
        const candidates = allowedLocations.filter((loc) =>
          citiesMatch(loc.city, next)
        );
        if (candidates.length === 1) {
          resolvedState = candidates[0].state;
        } else if (state && candidates.some((loc) => loc.state === state)) {
          resolvedState = state;
        } else if (candidates.length > 0) {
          resolvedState = candidates[0].state;
        }
      }
      setCityRaw(next);
      setStateRaw(resolvedState);
      writeStoredScope({ state: resolvedState, city: next });
      invalidateScopeQueries();
    },
    [canPickScope, isLocked, state, allowedLocations, invalidateScopeQueries]
  );

  const resetScope = useCallback(() => {
    if (!canPickScope || isLocked) return;
    setStateRaw(null);
    setCityRaw(null);
    writeStoredScope({ state: null, city: null });
    invalidateScopeQueries();
  }, [canPickScope, isLocked, invalidateScopeQueries]);

  const effectiveState = canPickScope && hydrated && state ? state : undefined;
  const effectiveCity = canPickScope && hydrated && city ? city : undefined;
  const isScoped = Boolean(effectiveState || effectiveCity);

  const scopeLabel = useMemo(() => {
    if (!canPickScope) return isGlobalScope ? "All locations" : "All my locations";
    if (city && state) return `${state} · ${city}`;
    if (state) return state;
    if (city) return city;
    return isGlobalScope ? "All locations" : "All my locations";
  }, [canPickScope, isGlobalScope, city, state]);

  const citiesForSelectedState = useMemo(() => {
    if (!state) {
      return [...new Set(allowedLocations.map((loc) => loc.city))].sort((a, b) =>
        a.localeCompare(b)
      );
    }
    return [
      ...new Set(
        allowedLocations.filter((loc) => loc.state === state).map((loc) => loc.city)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [allowedLocations, state]);

  const value = useMemo(
    () => ({
      canManageScope,
      canPickScope,
      isGlobalScope,
      state: canPickScope ? state : null,
      city: canPickScope ? city : null,
      setState,
      setCity,
      resetScope,
      effectiveState,
      effectiveCity,
      isLocked,
      isScoped,
      scopeLabel,
      allowedLocations,
      allowedStates,
      citiesForSelectedState,
    }),
    [
      canManageScope,
      canPickScope,
      isGlobalScope,
      state,
      city,
      setState,
      setCity,
      resetScope,
      effectiveState,
      effectiveCity,
      isLocked,
      isScoped,
      scopeLabel,
      allowedLocations,
      allowedStates,
      citiesForSelectedState,
    ]
  );

  return (
    <OpsLocationScopeContext.Provider value={value}>
      {children}
    </OpsLocationScopeContext.Provider>
  );
}

export function useOpsLocationScope() {
  const ctx = useContext(OpsLocationScopeContext);
  if (!ctx) {
    throw new Error("useOpsLocationScope must be used within OpsLocationScopeProvider");
  }
  return ctx;
}

/** Returns API params — omits keys when "All" or user cannot pick scope. */
export function useLocationQueryParams(override) {
  const { canPickScope, effectiveState, effectiveCity } = useOpsLocationScope();
  return useMemo(() => {
    if (!canPickScope) return {};
    const state = override?.state ?? effectiveState;
    const city = override?.city ?? effectiveCity;
    const params = {};
    if (state) params.state = state;
    if (city) params.city = city;
    return params;
  }, [canPickScope, override?.state, override?.city, effectiveState, effectiveCity]);
}
