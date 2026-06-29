/** Minimal horizontal padding for full-width dashboard pages (8px / 12px). */
export const PAGE_EDGE_X = "px-2 sm:px-3";

/** Sticky page header bar (no horizontal padding — use PAGE_HEADER_INNER inside). */
export const PAGE_HEADER_SHELL =
  "sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md";

export const PAGE_HEADER_INNER = `flex w-full flex-wrap items-center justify-between gap-3 py-3 ${PAGE_EDGE_X}`;

export const PAGE_CONTENT = "w-full space-y-6 pb-16";
