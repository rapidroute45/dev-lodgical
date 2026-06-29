const TOAST_DURATION_MS = 4500;

/** Lightweight foreground push banner (no toast library). */
export function showPushNotificationToast(title, body) {
  if (typeof document === "undefined" || !title) return;

  const existing = document.getElementById("dispatch-push-toast");
  if (existing) existing.remove();

  const root = document.createElement("div");
  root.id = "dispatch-push-toast";
  root.setAttribute("role", "status");
  root.style.cssText = [
    "position:fixed",
    "top:16px",
    "right:16px",
    "z-index:9999",
    "max-width:min(360px,calc(100vw - 32px))",
    "padding:12px 16px",
    "border-radius:12px",
    "border:1px solid rgba(56,189,248,0.35)",
    "background:rgba(7,11,18,0.92)",
    "color:#e2e8f0",
    "box-shadow:0 16px 48px rgba(0,0,0,0.45)",
    "backdrop-filter:blur(8px)",
    "font-family:system-ui,sans-serif",
    "pointer-events:none",
  ].join(";");

  const titleEl = document.createElement("div");
  titleEl.style.cssText = "font-weight:700;font-size:14px;margin-bottom:4px;";
  titleEl.textContent = title;

  root.appendChild(titleEl);

  if (body) {
    const bodyEl = document.createElement("div");
    bodyEl.style.cssText = "font-size:13px;color:#94a3b8;line-height:1.4;";
    bodyEl.textContent = body;
    root.appendChild(bodyEl);
  }

  document.body.appendChild(root);

  window.setTimeout(() => {
    root.remove();
  }, TOAST_DURATION_MS);
}
