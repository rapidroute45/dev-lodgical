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

export function findLocationOption(locations, city, state) {
  if (!city?.trim() || !state?.trim()) return undefined;
  const key = locationKey(city, state);
  return locations.find((l) => l.key === key);
}
