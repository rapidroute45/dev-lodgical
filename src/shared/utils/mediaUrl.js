import { CONFIG } from "./constants.js";

/** Resolve stored media path or full URL to a loadable URL. */
export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const base = CONFIG.UPLOADS_BASE_URL ?? "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
