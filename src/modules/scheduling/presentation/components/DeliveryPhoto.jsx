import { useState } from "react";
import { mediaUrl } from "@/shared/utils/mediaUrl.js";

export function DeliveryPhoto({ photoPath, alt, className = "" }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const src = mediaUrl(photoPath);

  if (!src) return null;

  if (loadError) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-4 text-xs ${className}`}
        style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.03)", color: "var(--text-muted)" }}
      >
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Photo unavailable (file may have been removed from server)
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className={`group relative block w-full overflow-hidden rounded-xl border text-left ${className}`}
        style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.03)" }}
      >
        <img
          src={src}
          alt={alt ?? "Delivery proof"}
          className="h-36 w-full object-cover transition group-hover:scale-[1.02] sm:h-44"
          onError={() => setLoadError(true)}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
            View full size
          </span>
        </span>
      </button>

      {previewOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute -top-10 right-0 rounded-lg bg-white/10 px-3 py-1 text-sm font-semibold text-white hover:bg-white/20"
            >
              Close
            </button>
            <img
              src={src}
              alt={alt ?? "Delivery proof"}
              className="max-h-[85vh] w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
