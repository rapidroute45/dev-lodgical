import { CONFIG } from "./constants.js";

/** Resolve `/uploads/...` paths to a loadable image URL (same as mobile). */
export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = CONFIG.UPLOADS_BASE_URL ?? "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
