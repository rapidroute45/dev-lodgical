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
  "chicago|IL": "America/Chicago",
  "chicago|il": "America/Chicago",
  "new york|NY": "America/New_York",
  "new york|ny": "America/New_York",
};

/** Resolve IANA timezone for an ops city/state pair. */
export function resolveCityTimeZone(city, state) {
  if (!city?.trim() || !state?.trim()) return null;
  const key = locationKey(city, state);
  return CITY_TIMEZONES[key] ?? CITY_TIMEZONES[key.toLowerCase()] ?? null;
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
