import { useEffect, useState } from "react";
import { ModalSheet } from "./ModalSheet.jsx";
import { formatDisplayDate } from "@/shared/utils/time.js";
import { formatMoney, ROUTE_CATEGORY_LABELS } from "@/modules/payroll/utils/format.js";

export function PayrollPreviewDetailModal({ open, preview, teamLabel, loading, onClose }) {
  const [expandedDrivers, setExpandedDrivers] = useState(new Set());

  useEffect(() => {
    if (!open) setExpandedDrivers(new Set());
  }, [open]);

  function toggleDriver(driverId) {
    setExpandedDrivers((prev) => {
      const next = new Set(prev);
      if (next.has(driverId)) next.delete(driverId);
      else next.add(driverId);
      return next;
    });
  }

  const title = preview ? teamLabel ?? preview.teamName : "Payroll preview";

  return (
    <ModalSheet open={open} title={title} onClose={onClose} wide>
      {loading ? (
        <p className="py-12 text-center text-sm text-dispatch-muted">Loading preview…</p>
      ) : !preview ? (
        <p className="py-12 text-center text-sm text-dispatch-muted">No preview data.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-center text-xs text-dispatch-muted">
            {formatDisplayDate(preview.periodStart)} – {formatDisplayDate(preview.periodEnd)}
          </p>

          <div className="rounded-xl bg-dispatch-primary-soft px-4 py-3">
            <p className="text-sm font-semibold text-dispatch-text">
              {preview.routeCount} routes · {preview.driverCount} drivers ·{" "}
              {formatMoney(preview.totalAmount)}
            </p>
            {preview.adjustmentsTotal !== 0 ? (
              <p className="mt-1 text-xs font-semibold text-dispatch-primary">
                Adjustments: {formatMoney(preview.adjustmentsTotal)}
              </p>
            ) : null}
          </div>

          {(preview.drivers ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-dispatch-muted">No routes in this period.</p>
          ) : (
            <div className="divide-y divide-dispatch-border rounded-xl border border-dispatch-border">
              {preview.drivers.map((driver) => {
                const openDriver = expandedDrivers.has(driver.driverId);
                return (
                  <div key={driver.driverId}>
                    <button
                      type="button"
                      onClick={() => toggleDriver(driver.driverId)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-dispatch-bg"
                    >
                      <div>
                        <p className="text-sm font-bold text-dispatch-text">{driver.driverName}</p>
                        <p className="text-xs text-dispatch-muted">
                          {driver.routeCount} route{driver.routeCount === 1 ? "" : "s"} ·{" "}
                          {formatMoney(driver.total ?? driver.totalAmount ?? 0)}
                        </p>
                      </div>
                      <span className="text-dispatch-muted">{openDriver ? "▲" : "▼"}</span>
                    </button>
                    {openDriver ? (
                      <ul className="border-t border-dispatch-border bg-dispatch-bg">
                        {(driver.routes ?? []).map((route) => {
                          const category = route.routeCategory?.toUpperCase();
                          return (
                            <li
                              key={route.routeId}
                              className="flex items-start gap-2 border-b border-dispatch-border px-4 py-3 last:border-0"
                            >
                              <span className="mt-0.5 text-emerald-600">✓</span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-dispatch-text">
                                  {route.routeName || "Route"}
                                  {route.location ? ` · ${route.location}` : ""}
                                </p>
                                <p className="text-xs text-dispatch-muted">
                                  {formatDisplayDate(route.scheduleDate)} · {formatMoney(route.rate)}
                                  {category && ROUTE_CATEGORY_LABELS[category]
                                    ? ` · ${ROUTE_CATEGORY_LABELS[category]}`
                                    : ""}
                                  {route.hasAdjustment ? " · adjusted" : ""}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-center text-[11px] text-dispatch-light">
            Review routes and amounts before generating payroll.
          </p>
        </div>
      )}
    </ModalSheet>
  );
}
