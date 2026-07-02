/** Dev-only GPS trail pipeline logging for dispatch map display. */
function isDevEnvironment() {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
}

export function logGpsPipeline(stage, detail = {}, context = {}) {
  if (!isDevEnvironment()) return;
  console.log("[gps-pipeline]", {
    layer: "web",
    stage,
    ...context,
    ...detail,
  });
}

export function summarizeTrailPoint(point) {
  if (!point) return null;
  return {
    lat: Number(Number(point.lat).toFixed(6)),
    lng: Number(Number(point.lng).toFixed(6)),
    recordedAt: point.recordedAt ?? null,
  };
}
