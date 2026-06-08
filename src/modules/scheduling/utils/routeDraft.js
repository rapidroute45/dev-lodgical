import { defaultDepartureFromArrival } from "@/shared/utils/time.js";
import { DEFAULT_ROUTE_CATEGORY } from "@/modules/scheduling/constants.js";

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
  return {
    name: stop.name.trim(),
    address: stop.address.trim(),
    accessCode: stop.accessCode?.trim() || undefined,
    lat: stop.lat,
    lng: stop.lng,
    placeId: stop.placeId,
  };
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

export function validateDraftRouteStops(route) {
  for (const stop of route.dropoffs) {
    if (!stop.name.trim() || !stop.address.trim()) {
      return "Each stop needs a name and address.";
    }
  }
  return null;
}
