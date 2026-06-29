const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 };

function parseCoords(lat, lng) {
  if (lat == null || lng == null) return null;
  const latN = Number(lat);
  const lngN = Number(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return null;
  return { lat: latN, lng: lngN };
}

/** Driver GPS or any point with lat/lng. */
export function readMapCoords(point) {
  if (!point) return null;
  return parseCoords(point.lat ?? point.destinationLat, point.lng ?? point.destinationLng);
}

/** Pickup — API exposes geocoded coords as lat/lng. */
export function readPickupMapCoords(pickup) {
  if (!pickup) return null;
  return parseCoords(pickup.lat ?? pickup.destinationLat, pickup.lng ?? pickup.destinationLng);
}

/** Dropoff destination — never use driver completion GPS (lat/lng). */
export function readDropoffMapCoords(stop) {
  if (!stop) return null;
  return parseCoords(stop.destinationLat, stop.destinationLng);
}

export { DEFAULT_CENTER };
