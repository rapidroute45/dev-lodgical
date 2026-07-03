import { CONFIG } from "./constants.js";

/** Resolve `/uploads/...` paths to a loadable image URL (same as mobile). */
export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      if (import.meta.env.DEV && url.pathname.startsWith("/uploads/")) {
        return url.pathname;
      }
    } catch {
      return path;
    }
    return path;
  }
  const base = CONFIG.UPLOADS_BASE_URL ?? "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
