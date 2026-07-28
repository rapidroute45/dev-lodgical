import { CONFIG } from "./constants.js";

let runtimeUploadsBase =
  import.meta.env.VITE_UPLOADS_BASE_URL?.trim() ||
  import.meta.env.VITE_S3_PUBLIC_BASE_URL?.trim() ||
  "";

/**
 * Edge image CDN for S3 origins (wsrv.nl / images.weserv.nl).
 * Set VITE_MEDIA_EDGE_CDN=off to disable. Default: wsrv.
 */
const EDGE_CDN = (import.meta.env.VITE_MEDIA_EDGE_CDN ?? "wsrv").trim().toLowerCase();

/** Fetch uploads base from API (matches server S3/local config). Call once at app boot. */
export async function hydrateMediaConfig() {
  const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || "/api/v1";
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/public/config`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const json = await res.json();
    const fromApi = json?.data?.uploadsBaseUrl?.trim();
    if (fromApi) {
      runtimeUploadsBase = fromApi.replace(/\/$/, "");
    }
  } catch {
    // API offline — keep build-time env fallback
  }
}

function uploadsBase() {
  return (runtimeUploadsBase || CONFIG.UPLOADS_BASE_URL || "").replace(/\/$/, "");
}

function resolveAbsolute(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const base = uploadsBase();
  if (base) {
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return path.startsWith("/") ? path : `/${path}`;
}

function isOurS3Origin(url) {
  try {
    const host = new URL(url).hostname;
    return (
      host.includes("amazonaws.com") ||
      host.includes("cloudfront.net") ||
      host.includes("dispatch-co-uploads")
    );
  } catch {
    return false;
  }
}

/** Route S3 media via global edge cache (much faster outside us-east-1). */
export function viaEdgeCdn(absoluteUrl, options = {}) {
  if (!absoluteUrl) return null;
  if (EDGE_CDN === "off" || EDGE_CDN === "false" || EDGE_CDN === "0") {
    return absoluteUrl;
  }
  if (absoluteUrl.includes("wsrv.nl") || absoluteUrl.includes("images.weserv.nl")) {
    return absoluteUrl;
  }
  if (!isOurS3Origin(absoluteUrl)) {
    return absoluteUrl;
  }

  const params = new URLSearchParams();
  params.set("url", absoluteUrl);
  params.set("output", options.format || "webp");
  params.set("q", String(options.quality ?? 72));
  params.set("maxage", "1y");
  if (options.width) params.set("w", String(options.width));
  if (options.height) params.set("h", String(options.height));
  if (options.fit) params.set("fit", options.fit);

  return `https://wsrv.nl/?${params.toString()}`;
}

/**
 * Resolve stored media path or full URL to a loadable URL.
 * @param {string|null|undefined} path
 * @param {{ width?: number, height?: number, quality?: number, format?: string, fit?: string, direct?: boolean }} [options]
 */
export function mediaUrl(path, options = {}) {
  const absolute = resolveAbsolute(path);
  if (!absolute) return null;
  if (options.direct) return absolute;
  return viaEdgeCdn(absolute, options);
}
