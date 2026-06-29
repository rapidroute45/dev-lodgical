import { useEffect, useState } from "react";
import { Button } from "@/modules/auth/presentation/components/Button.jsx";
import {
  MAX_BULK_ROUTES_PER_CATEGORY,
  ROUTE_CATEGORY_LABELS,
  ROUTE_CATEGORIES,
} from "@/modules/scheduling/constants.js";

const EMPTY_COUNTS = { SMALL: "", MEDIUM: "", FULL: "" };

export function BulkAddRoutesModal({ open, storeName, onClose, onAdd }) {
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setCounts(EMPTY_COUNTS);
    setError(null);
  }, [open]);

  if (!open) return null;

  function setCount(category, value) {
    const digits = value.replace(/\D/g, "");
    const n = digits === "" ? "" : String(Math.min(Number(digits), MAX_BULK_ROUTES_PER_CATEGORY));
    setCounts((prev) => ({ ...prev, [category]: n }));
    setError(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const parsed = ROUTE_CATEGORIES.map((cat) => ({
      category: cat,
      count: Number.parseInt(counts[cat], 10) || 0,
    }));
    const total = parsed.reduce((sum, row) => sum + row.count, 0);
    if (total === 0) {
      setError("Enter at least one route count.");
      return;
    }
    onAdd(
      ROUTE_CATEGORIES.reduce((acc, cat) => {
        acc[cat] = Number.parseInt(counts[cat], 10) || 0;
        return acc;
      }, {})
    );
  }

  const previewTotal = ROUTE_CATEGORIES.reduce(
    (sum, cat) => sum + (Number.parseInt(counts[cat], 10) || 0),
    0
  );
  const base = storeName?.trim() || "store";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="ops-modal w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Add routes in bulk</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          How many routes per category? Drivers are not assigned — pick teams on each route
          card after.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {ROUTE_CATEGORIES.map((category) => (
            <label key={category} className="block">
              <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                {ROUTE_CATEGORY_LABELS[category]} routes (max {MAX_BULK_ROUTES_PER_CATEGORY})
              </span>
              <input
                type="number"
                min={0}
                max={MAX_BULK_ROUTES_PER_CATEGORY}
                inputMode="numeric"
                placeholder="0"
                value={counts[category]}
                onChange={(e) => setCount(category, e.target.value)}
                className="ops-field w-full px-3 py-2.5 text-sm font-semibold outline-none"
                style={{ color: "var(--text)" }}
              />
            </label>
          ))}

          {previewTotal > 0 ? (
            <p className="ops-field px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Creates <strong style={{ color: "var(--text)" }}>{previewTotal}</strong> route{previewTotal === 1 ? "" : "s"} e.g.{" "}
              <span className="font-mono">{base}-small-1</span>,{" "}
              <span className="font-mono">{base}-medium-1</span>…
            </p>
          ) : null}

          {error ? <p className="text-sm font-medium" style={{ color: "var(--rose)" }}>{error}</p> : null}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="ops-btn flex-1 px-4 py-2.5 text-sm font-semibold">
              Cancel
            </button>
            <Button type="submit" tone="dark" className="flex-1">
              Add routes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
