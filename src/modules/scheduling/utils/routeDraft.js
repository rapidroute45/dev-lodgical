import { defaultDepartureFromArrival } from "@/shared/utils/time.js";
import {
  DEFAULT_ROUTE_CATEGORY,
  MAX_BULK_ROUTES_PER_CATEGORY,
  ROUTE_CATEGORIES,
  ROUTE_CATEGORY_SLUG,
} from "@/modules/scheduling/constants.js";

export function formatStorePickupAddress(store) {
  if (!store) return "";
  const parts = [store.address, store.city, store.state].filter(Boolean);
  return parts.join(", ");
}

export function pickupFromStore(store) {
  return {
    localId: "pickup",
    name: store?.storeName ?? "",
    address: store ? formatStorePickupAddress(store) : "",
  };
}

/** Default route title from store (e.g. "Walmart 1624 - Bakersfield, CA"). */
export function buildRouteNameFromStore(store) {
  if (!store) return "";
  const name = store.storeName?.trim() ?? "";
  const city = store.city?.trim();
  const state = store.state?.trim();
  if (name && city && state) return `${name} - ${city}, ${state}`;
  return name;
}

export function routeDefaultsFromStore(store) {
  if (!store) {
    return {
      routeName: "",
      location: "",
      pickup: pickupFromStore(null),
    };
  }
  return {
    routeName: buildRouteNameFromStore(store),
    location: formatStorePickupAddress(store),
    pickup: pickupFromStore(store),
  };
}

export function applyStoreDefaultsToRoute(route, store) {
  return { ...route, ...routeDefaultsFromStore(store) };
}

/**
 * Rename route for a new category using the next free index in that category
 * (e.g. `walmart 1624-small-5` → `walmart 1624-medium-3` when medium-1/2 exist).
 */
export function routeNameWithCategory(
  routeName,
  category,
  { existingRoutes = [], excludeRouteKey = null } = {}
) {
  const slug = ROUTE_CATEGORY_SLUG[category];
  if (!slug) return routeName ?? "";

  const name = routeName?.trim() ?? "";
  const match = name.match(/^(.+)-(small|medium|full)-(\d+)$/i);
  if (!match) return name;

  const storePrefix = match[1];
  const prefix = `${storePrefix}-${slug}-`;
  let max = 0;

  for (const route of existingRoutes) {
    const routeKey = route.id ?? route.localId ?? route.routeName;
    if (excludeRouteKey && routeKey === excludeRouteKey) continue;

    const otherName = (route.routeName ?? route.name ?? "").trim();
    if (!otherName.toLowerCase().startsWith(prefix.toLowerCase())) continue;

    const suffix = otherName.slice(prefix.length);
    const n = Number.parseInt(suffix, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }

  return `${storePrefix}-${slug}-${max + 1}`;
}

function maxBulkRouteIndex(existingRoutes, storeName, categorySlug) {
  const prefix = `${storeName}-${categorySlug}-`;
  let max = 0;
  for (const route of existingRoutes) {
    const name = route.routeName?.trim() ?? "";
    if (!name.toLowerCase().startsWith(prefix.toLowerCase())) continue;
    const suffix = name.slice(prefix.length);
    const n = Number.parseInt(suffix, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

/**
 * Create multiple draft routes from small/medium/full counts.
 * Names: {storeName}-small-1, {storeName}-small-2, …
 */
export function buildBulkDraftRoutes({ store, counts, team = null, existingRoutes = [] }) {
  if (!store) return [];

  const storeName = store.storeName?.trim() || "route";
  const created = [];
  const pool = [...existingRoutes];

  for (const category of ROUTE_CATEGORIES) {
    const raw = Number.parseInt(String(counts?.[category] ?? ""), 10);
    const count = Number.isFinite(raw)
      ? Math.min(Math.max(raw, 0), MAX_BULK_ROUTES_PER_CATEGORY)
      : 0;
    if (count === 0) continue;

    const slug = ROUTE_CATEGORY_SLUG[category];
    let nextIndex = maxBulkRouteIndex(pool, storeName, slug);

    for (let i = 0; i < count; i++) {
      nextIndex += 1;
      const draft = newDraftRoute(team, store);
      const route = {
        ...draft,
        routeName: `${storeName}-${slug}-${nextIndex}`,
        routeCategory: category,
        driverId: null,
        driverName: "",
      };
      created.push(route);
      pool.push(route);
    }
  }

  return created;
}

export function newDraftRoute(team, store = null) {
  const defaults = routeDefaultsFromStore(store);
  return {
    localId: `new-${Date.now()}-${Math.random()}`,
    routeName: defaults.routeName,
    location: defaults.location,
    routeCategory: DEFAULT_ROUTE_CATEGORY,
    teamId: team?.id ?? "",
    teamName: team?.name ?? "",
    driverId: null,
    driverName: "",
    arrivalTime: "09:00",
    departureTime: "11:00",
    vehicleType: "Van",
    mileage: "",
    notes: "",
    pickup: defaults.pickup,
    dropoffs: [],
    stopsExpanded: false,
  };
}

function stopCoords(stop) {
  const lat = stop.lat ?? stop.destinationLat ?? undefined;
  const lng = stop.lng ?? stop.destinationLng ?? undefined;
  return {
    lat: lat ?? undefined,
    lng: lng ?? undefined,
    placeId: stop.placeId ?? undefined,
  };
}

export function routeSummaryToDraft(route) {
  const pickup = route.pickup;
  return {
    localId: route.id,
    serverId: route.id,
    routeName: route.routeName ?? "",
    location: route.location ?? "",
    routeCategory: route.routeCategory ?? DEFAULT_ROUTE_CATEGORY,
    teamId: route.teamId,
    teamName: route.teamName ?? "",
    driverId: route.driverId,
    driverName: route.driverName ?? "",
    arrivalTime: route.arrivalTime,
    departureTime: route.departureTime,
    vehicleType: route.vehicleType ?? "Van",
    mileage: route.mileage != null ? String(route.mileage) : "",
    notes: route.notes ?? "",
    pickup: pickup
      ? {
          localId: pickup.id ?? "pickup",
          serverId: pickup.id,
          name: pickup.name,
          address: pickup.address,
          ...stopCoords(pickup),
        }
      : pickupFromStore(null),
    dropoffs: (route.dropoffs ?? []).map((d) => ({
      localId: d.id ?? `stop-${d.sequence}`,
      serverId: d.id,
      name: d.name,
      address: d.address,
      accessCode: d.accessCode ?? "",
      ...stopCoords(d),
    })),
    stopsExpanded: (route.dropoffs?.length ?? 0) > 0,
  };
}

function toStopPayload(stop) {
  const payload = {
    name: stop.name.trim(),
    address: stop.address.trim(),
    accessCode: stop.accessCode?.trim() || undefined,
    lat: stop.lat,
    lng: stop.lng,
    placeId: stop.placeId,
  };
  if (stop.serverId) payload.id = stop.serverId;
  return payload;
}

export function draftRoutePayload(route) {
  const departure =
    route.departureTime.trim() || defaultDepartureFromArrival(route.arrivalTime);

  const stopDetails = route.dropoffs
    .map(toStopPayload)
    .filter((s) => s.name && s.address);

  const pickupDetail = toStopPayload(route.pickup ?? { name: "", address: "" });

  return {
    routeName: route.routeName.trim(),
    location: route.location.trim(),
    routeCategory: route.routeCategory ?? DEFAULT_ROUTE_CATEGORY,
    vehicleType: route.vehicleType,
    mileage: route.mileage ? Number(route.mileage) : undefined,
    stops: stopDetails.length,
    pickupDetail:
      pickupDetail.name && pickupDetail.address ? pickupDetail : undefined,
    stopDetails,
    arrivalTime: route.arrivalTime,
    departureTime: departure,
    teamId: route.teamId,
    notes: route.notes.trim() || undefined,
    driverId: route.driverId ?? null,
    status: "pending",
  };
}

export function draftToSpreadsheetRow(draft, scheduleId) {
  const dropoffs = draft.dropoffs ?? [];
  return {
    id: draft.localId,
    scheduleId: scheduleId ?? "",
    isNew: true,
    routeName: draft.routeName ?? "",
    routeCategory: draft.routeCategory ?? DEFAULT_ROUTE_CATEGORY,
    teamId: draft.teamId ?? "",
    driverId: "",
    driverName: "",
    arrivalTime: draft.arrivalTime ?? "09:00",
    departureTime: draft.departureTime ?? "11:00",
    vehicleType: draft.vehicleType ?? "Van",
    mileage:
      draft.mileage != null && draft.mileage !== "" ? String(draft.mileage) : "",
    location: draft.location ?? "",
    notes: draft.notes ?? "",
    status: "pending",
    dropoffs,
    stopCount: dropoffs.length,
  };
}

export function spreadsheetRowToDraft(row, store) {
  const defaults = routeDefaultsFromStore(store);
  const dropoffs = (row.dropoffs ?? []).map((stop) => ({
    localId: stop.localId ?? stop.serverId ?? `stop-${Math.random()}`,
    serverId: stop.serverId,
    name: stop.name ?? "",
    address: stop.address ?? "",
    accessCode: stop.accessCode ?? "",
    lat: stop.lat,
    lng: stop.lng,
    placeId: stop.placeId,
  }));

  return {
    localId: row.id,
    serverId: row.isNew ? undefined : row.id,
    routeName: row.routeName ?? "",
    location: row.location?.trim() || defaults.location,
    routeCategory: row.routeCategory ?? DEFAULT_ROUTE_CATEGORY,
    teamId: row.teamId,
    teamName: row.teamName ?? "",
    driverId: row.driverId || null,
    driverName: row.driverName ?? "",
    arrivalTime: row.arrivalTime,
    departureTime: row.departureTime,
    vehicleType: row.vehicleType ?? "Van",
    mileage: row.mileage,
    notes: row.notes ?? "",
    pickup: defaults.pickup,
    dropoffs,
    stopsExpanded: dropoffs.length > 0,
  };
}

export function validateDraftRouteStops(route) {
  for (const stop of route.dropoffs) {
    if (!stop.name.trim() || !stop.address.trim()) {
      return "Each stop needs a name and address.";
    }
  }
  return null;
}
