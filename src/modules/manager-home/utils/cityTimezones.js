import { locationKey } from "@/modules/scheduling/utils/storeLocations.js";

const CITY_TIMEZONES = {
  "lahore|PB": "Asia/Karachi",
  "lahore|pb": "Asia/Karachi",
  "karachi|SD": "Asia/Karachi",
  "karachi|sd": "Asia/Karachi",
  "karachi|SINDH": "Asia/Karachi",
  "karachi|sindh": "Asia/Karachi",
  "islamabad|IS": "Asia/Karachi",
  "islamabad|is": "Asia/Karachi",
  "islamabad|ICT": "Asia/Karachi",
  "islamabad|ict": "Asia/Karachi",
  "dallas|TX": "America/Chicago",
  "dallas|tx": "America/Chicago",
  "houston|TX": "America/Chicago",
  "houston|tx": "America/Chicago",
  "bakersfield|CA": "America/Los_Angeles",
  "bakersfield|ca": "America/Los_Angeles",
  "los angeles|CA": "America/Los_Angeles",
  "los angeles|ca": "America/Los_Angeles",
  "burbank|CA": "America/Los_Angeles",
  "burbank|ca": "America/Los_Angeles",
  "chicago|IL": "America/Chicago",
  "chicago|il": "America/Chicago",
  "new york|NY": "America/New_York",
  "new york|ny": "America/New_York",
};

/** Fallback when city is not in CITY_TIMEZONES — uses US state / PK region code. */
const REGION_TIMEZONES = {
  AL: "America/Chicago",
  AK: "America/Anchorage",
  AZ: "America/Phoenix",
  AR: "America/Chicago",
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  DE: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  HI: "Pacific/Honolulu",
  ID: "America/Boise",
  IL: "America/Chicago",
  IN: "America/Indiana/Indianapolis",
  IA: "America/Chicago",
  KS: "America/Chicago",
  KY: "America/New_York",
  LA: "America/Chicago",
  ME: "America/New_York",
  MD: "America/New_York",
  MA: "America/New_York",
  MI: "America/Detroit",
  MN: "America/Chicago",
  MS: "America/Chicago",
  MO: "America/Chicago",
  MT: "America/Denver",
  NE: "America/Chicago",
  NV: "America/Los_Angeles",
  NH: "America/New_York",
  NJ: "America/New_York",
  NM: "America/Denver",
  NY: "America/New_York",
  NC: "America/New_York",
  ND: "America/Chicago",
  OH: "America/New_York",
  OK: "America/Chicago",
  OR: "America/Los_Angeles",
  PA: "America/New_York",
  RI: "America/New_York",
  SC: "America/New_York",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  UT: "America/Denver",
  VT: "America/New_York",
  VA: "America/New_York",
  WA: "America/Los_Angeles",
  WV: "America/New_York",
  WI: "America/Chicago",
  WY: "America/Denver",
  DC: "America/New_York",
  PB: "Asia/Karachi",
  PUNJAB: "Asia/Karachi",
  SINDH: "Asia/Karachi",
  IS: "Asia/Karachi",
  ICT: "Asia/Karachi",
};

/** Resolve IANA timezone for an ops city/state pair. */
export function resolveCityTimeZone(city, state) {
  if (!city?.trim() || !state?.trim()) return null;
  const key = locationKey(city, state);
  const cityTz =
    CITY_TIMEZONES[key] ?? CITY_TIMEZONES[key.toLowerCase()] ?? null;
  if (cityTz) return cityTz;
  const region = state.trim().toUpperCase();
  return REGION_TIMEZONES[region] ?? null;
}

export function formatCityClockParts(now, timeZone) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  const date = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now);

  const tz =
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value ?? "";

  return { time, date, tz };
}
