export function locationKey(city, state) {
  return `${city.trim().toLowerCase()}|${state.trim().toUpperCase()}`;
}

export function storeLocationsFromStores(stores) {
  const map = new Map();
  for (const store of stores) {
    const city = store.city?.trim() ?? "";
    const state = store.state?.trim().toUpperCase() ?? "";
    if (!city || !state) continue;
    const key = locationKey(city, state);
    const existing = map.get(key);
    if (existing) {
      existing.storeCount += 1;
    } else {
      map.set(key, {
        key,
        city,
        state,
        label: `${city}, ${state}`,
        storeCount: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function storesInLocation(stores, city, state) {
  const key = locationKey(city, state);
  return stores
    .filter((s) => locationKey(s.city, s.state) === key)
    .sort((a, b) => a.storeName.localeCompare(b.storeName));
}

export function findLocationsForCity(locations, city) {
  if (!city?.trim()) return [];
  const needle = city.trim().toLowerCase();
  return locations.filter((loc) => loc.city.trim().toLowerCase() === needle);
}

export function findLocationOption(locations, city, state) {
  if (!city?.trim()) return undefined;
  if (state?.trim()) {
    const key = locationKey(city, state);
    return locations.find((loc) => loc.key === key);
  }
  const matches = findLocationsForCity(locations, city);
  return matches.length === 1 ? matches[0] : undefined;
}

export function citiesMatch(a, b) {
  return a?.trim().toLowerCase() === b?.trim().toLowerCase();
}

export function filterLocationsByAllowedCities(locations, allowedCities) {
  if (!allowedCities?.length) return locations;
  return locations.filter((loc) =>
    allowedCities.some((city) => citiesMatch(loc.city, city))
  );
}
