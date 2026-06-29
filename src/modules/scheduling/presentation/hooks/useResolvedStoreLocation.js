import { useEffect, useMemo } from "react";
import {
  findLocationOption,
  storeLocationsFromStores,
} from "@/modules/scheduling/utils/storeLocations.js";

/** Infer state from stores when city is set but state is missing (e.g. assigned city). */
export function useResolvedStoreLocation(stores, city, state, setCity, setState) {
  const locations = useMemo(() => storeLocationsFromStores(stores), [stores]);

  const resolvedLocation = useMemo(
    () => findLocationOption(locations, city, state),
    [locations, city, state]
  );

  useEffect(() => {
    if (!stores.length || state?.trim() || !city?.trim()) return;
    const loc = findLocationOption(locations, city, "");
    if (!loc) return;
    setCity(loc.city);
    setState(loc.state);
  }, [stores, city, state, locations, setCity, setState]);

  return { locations, resolvedLocation };
}
