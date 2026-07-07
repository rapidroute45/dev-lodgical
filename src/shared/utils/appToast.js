const TOAST_DURATION_MS = 5000;

const VARIANTS = {
  error: {
    border: "rgba(248,113,113,0.45)",
    titleColor: "#fecaca",
    bodyColor: "#fca5a5",
  },
  success: {
    border: "rgba(52,211,153,0.4)",
    titleColor: "#a7f3d0",
    bodyColor: "#6ee7b7",
  },
  info: {
    border: "rgba(56,189,248,0.35)",
    titleColor: "#e2e8f0",
    bodyColor: "#94a3b8",
  },
};

/** Lightweight toast banner (no external library). */
export function showAppToast(title, body, variant = "info") {
  if (typeof document === "undefined" || !title) return;

  const existing = document.getElementById("dispatch-app-toast");
  if (existing) existing.remove();

  const colors = VARIANTS[variant] ?? VARIANTS.info;

  const root = document.createElement("div");
  root.id = "dispatch-app-toast";
  root.setAttribute("role", "alert");
  root.style.cssText = [
    "position:fixed",
    "top:16px",
    "right:16px",
    "z-index:9999",
    "max-width:min(360px,calc(100vw - 32px))",
    "padding:12px 16px",
    "border-radius:12px",
    `border:1px solid ${colors.border}`,
    "background:rgba(7,11,18,0.94)",
    "box-shadow:0 16px 48px rgba(0,0,0,0.45)",
    "backdrop-filter:blur(8px)",
    "font-family:system-ui,sans-serif",
    "pointer-events:none",
  ].join(";");

  const titleEl = document.createElement("div");
  titleEl.style.cssText = `font-weight:700;font-size:14px;margin-bottom:4px;color:${colors.titleColor};`;
  titleEl.textContent = title;
  root.appendChild(titleEl);

  if (body) {
    const bodyEl = document.createElement("div");
    bodyEl.style.cssText = `font-size:13px;line-height:1.4;color:${colors.bodyColor};`;
    bodyEl.textContent = body;
    root.appendChild(bodyEl);
  }

  document.body.appendChild(root);
  window.setTimeout(() => root.remove(), TOAST_DURATION_MS);
}

export function showErrorToast(message, title = "Something went wrong") {
  showAppToast(title, message, "error");
}

export function showSuccessToast(message, title = "Success") {
  showAppToast(message, title, "success");
}
