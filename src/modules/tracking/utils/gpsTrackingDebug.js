/** Verbose GPS pipeline logs — filter browser console with `[gps]`. */
export const GPS_TRACKING_DEBUG = true;

export function logGps(stage, data = {}, level = "log") {
  if (!GPS_TRACKING_DEBUG && level === "log") return;
  const payload = { stage, ...data, at: new Date().toISOString() };
  if (level === "warn") {
    console.warn("[gps]", payload);
    return;
  }
  if (level === "error") {
    console.error("[gps]", payload);
    return;
  }
  console.log("[gps]", payload);
}
