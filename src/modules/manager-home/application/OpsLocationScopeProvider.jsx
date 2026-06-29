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
import { canManageLocationScope } from "@/shared/utils/constants.js";
import { locationKey } from "@/modules/scheduling/utils/storeLocations.js";
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

export function OpsLocationScopeProvider({ children }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManageScope = canManageLocationScope(user?.role);

  const { data: locationsPayload } = useLocationsQuery(canManageScope);
  const allLocations = useMemo(() => {
    const fromApi = locationsPayload?.locations ?? [];
    return fromApi.map((loc) => ({
      key: locationKey(loc.city, loc.state),
      city: loc.city,
      state: loc.state,
      label: `${loc.city}, ${loc.state}`,
    }));
  }, [locationsPayload]);

  const allowedLocations = allLocations;
  const allowedStates = useMemo(
    () => [...new Set(allowedLocations.map((loc) => loc.state))].sort((a, b) => a.localeCompare(b)),
    [allowedLocations]
  );

  const [state, setStateRaw] = useState(null);
  const [city, setCityRaw] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!canManageScope) {
      setStateRaw(null);
      setCityRaw(null);
      setHydrated(true);
      return;
    }
    const stored = readStoredScope();
    setStateRaw(stored.state);
    setCityRaw(stored.city);
    setHydrated(true);
  }, [canManageScope, user?.id]);

  const invalidateScopeQueries = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const setState = useCallback(
    (next) => {
      if (!canManageScope) return;
      setStateRaw(next);
      setCityRaw(null);
      writeStoredScope({ state: next, city: null });
      invalidateScopeQueries();
    },
    [canManageScope, invalidateScopeQueries]
  );

  const setCity = useCallback(
    (next) => {
      if (!canManageScope) return;
      setCityRaw(next);
      writeStoredScope({ state, city: next });
      invalidateScopeQueries();
    },
    [canManageScope, state, invalidateScopeQueries]
  );

  const resetScope = useCallback(() => {
    if (!canManageScope) return;
    setStateRaw(null);
    setCityRaw(null);
    writeStoredScope({ state: null, city: null });
    invalidateScopeQueries();
  }, [canManageScope, invalidateScopeQueries]);

  const effectiveState = canManageScope && hydrated && state ? state : undefined;
  const effectiveCity = canManageScope && hydrated && city ? city : undefined;
  const isScoped = Boolean(effectiveState || effectiveCity);

  const scopeLabel = useMemo(() => {
    if (!canManageScope) return "All locations";
    if (city && state) return `${state} · ${city}`;
    if (state) return state;
    if (city) return city;
    return "All locations";
  }, [canManageScope, city, state]);

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
      state: canManageScope ? state : null,
      city: canManageScope ? city : null,
      setState,
      setCity,
      resetScope,
      effectiveState,
      effectiveCity,
      isLocked: false,
      isScoped,
      scopeLabel,
      allowedLocations,
      allowedStates,
      citiesForSelectedState,
    }),
    [
      canManageScope,
      state,
      city,
      setState,
      setCity,
      resetScope,
      effectiveState,
      effectiveCity,
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

/** Returns API params — omits keys when "All" or user cannot manage scope. */
export function useLocationQueryParams(override) {
  const { canManageScope, effectiveState, effectiveCity } = useOpsLocationScope();
  return useMemo(() => {
    if (!canManageScope) return {};
    const state = override?.state ?? effectiveState;
    const city = override?.city ?? effectiveCity;
    const params = {};
    if (state) params.state = state;
    if (city) params.city = city;
    return params;
  }, [canManageScope, override?.state, override?.city, effectiveState, effectiveCity]);
}
