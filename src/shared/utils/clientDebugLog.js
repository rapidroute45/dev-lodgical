/** Dev-only client log — proxied to local Dev-co, written to .cursor/debug-287b50.log */
export function clientDebugLog(payload) {
  if (!import.meta.env.DEV) return;

  fetch("/api/v1/_debug/client-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "287b50",
      timestamp: Date.now(),
      ...payload,
    }),
  }).catch(() => undefined);
}
