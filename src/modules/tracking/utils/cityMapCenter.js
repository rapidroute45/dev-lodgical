/** Default when no scope and no live points (Lahore — primary ops region). */
export const DEFAULT_MAP_CENTER = { lat: 31.5204, lng: 74.3587, zoom: 11 };

const CITY_CENTERS = {
  "lahore|pb": { lat: 31.5204, lng: 74.3587, zoom: 12 },
  "karachi|sd": { lat: 24.8607, lng: 67.0011, zoom: 11 },
  "karachi|sindh": { lat: 24.8607, lng: 67.0011, zoom: 11 },
  "islamabad|is": { lat: 33.6844, lng: 73.0479, zoom: 12 },
  "islamabad|ict": { lat: 33.6844, lng: 73.0479, zoom: 12 },
  "dallas|tx": { lat: 32.7767, lng: -96.797, zoom: 11 },
  "bakersfield|ca": { lat: 35.3733, lng: -119.0187, zoom: 11 },
  "houston|tx": { lat: 29.7604, lng: -95.3698, zoom: 11 },
  "los angeles|ca": { lat: 34.0522, lng: -118.2437, zoom: 11 },
  "chicago|il": { lat: 41.8781, lng: -87.6298, zoom: 11 },
  "new york|ny": { lat: 40.7128, lng: -74.006, zoom: 11 },
};

const STATE_CENTERS = {
  pb: { lat: 31.1704, lng: 72.7097, zoom: 7 },
  sd: { lat: 24.8607, lng: 67.0011, zoom: 7 },
  sindh: { lat: 24.8607, lng: 67.0011, zoom: 7 },
  tx: { lat: 31.9686, lng: -99.9018, zoom: 6 },
  ca: { lat: 36.7783, lng: -119.4179, zoom: 6 },
  il: { lat: 40.6331, lng: -89.3985, zoom: 6 },
  ny: { lat: 43.0, lng: -75.0, zoom: 6 },
};

function locationKey(city, state) {
  return `${(city ?? "").trim().toLowerCase()}|${(state ?? "").trim().toLowerCase()}`;
}

/** Synchronous lookup for common ops cities/states. */
export function resolveKnownMapCenter(city, state) {
  const cityKey = locationKey(city, state);
  if (city && state && CITY_CENTERS[cityKey]) {
    return CITY_CENTERS[cityKey];
  }
  const stateNorm = (state ?? "").trim().toLowerCase();
  if (stateNorm && STATE_CENTERS[stateNorm]) {
    return STATE_CENTERS[stateNorm];
  }
  return null;
}

/** Nominatim (OSM) geocode — used when city is not in the lookup table. */
export async function fetchMapCenterFromNominatim(city, state) {
  const parts = [city, state].filter(Boolean).join(", ");
  if (!parts.trim()) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", parts);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const results = await res.json();
  const hit = results?.[0];
  if (!hit?.lat || !hit?.lon) return null;

  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    zoom: city ? 12 : 7,
  };
}

export function countryForState(state) {
  const s = (state ?? "").trim().toUpperCase();
  if (["PB", "SD", "IS", "ICT", "SINDH", "PUNJAB"].includes(s)) return "Pakistan";
  if (s.length === 2 && /^[A-Z]{2}$/.test(s)) return "United States";
  return "Pakistan";
}
