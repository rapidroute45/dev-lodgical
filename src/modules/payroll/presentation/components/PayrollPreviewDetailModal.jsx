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
        <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading preview…</p>
      ) : !preview ? (
        <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>No preview data.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
            {formatDisplayDate(preview.periodStart)} – {formatDisplayDate(preview.periodEnd)}
          </p>

          <div
            className="rounded-xl px-4 py-3"
            style={{ background: "rgba(34, 211, 238, 0.08)", border: "1px solid rgba(34, 211, 238, 0.25)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {preview.routeCount} routes · {preview.driverCount} drivers ·{" "}
              {formatMoney(preview.totalAmount)}
            </p>
            {preview.adjustmentsTotal !== 0 ? (
              <p className="mt-1 text-xs font-semibold" style={{ color: "var(--accent)" }}>
                Adjustments: {formatMoney(preview.adjustmentsTotal)}
              </p>
            ) : null}
          </div>

          {(preview.drivers ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No routes in this period.</p>
          ) : (
            <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
              {preview.drivers.map((driver) => {
                const openDriver = expandedDrivers.has(driver.driverId);
                return (
                  <div key={driver.driverId} style={{ borderBottom: "1px solid var(--border)" }}>
                    <button
                      type="button"
                      onClick={() => toggleDriver(driver.driverId)}
                      className="ops-row flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div>
                        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{driver.driverName}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {driver.routeCount} route{driver.routeCount === 1 ? "" : "s"} ·{" "}
                          {formatMoney(driver.total ?? driver.totalAmount ?? 0)}
                        </p>
                      </div>
                      <span style={{ color: "var(--text-muted)" }}>{openDriver ? "▲" : "▼"}</span>
                    </button>
                    {openDriver ? (
                      <ul style={{ borderTop: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.02)" }}>
                        {(driver.routes ?? []).map((route) => {
                          const category = route.routeCategory?.toUpperCase();
                          return (
                            <li
                              key={route.routeId}
                              className="flex items-start gap-2 px-4 py-3"
                              style={{ borderBottom: "1px solid var(--border)" }}
                            >
                              <span className="mt-0.5" style={{ color: "var(--green)" }}>✓</span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                                  {route.routeName || "Route"}
                                  {route.location ? ` · ${route.location}` : ""}
                                </p>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
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

          <p className="text-center text-[11px]" style={{ color: "var(--text-dim)" }}>
            Review routes and amounts before generating payroll.
          </p>
        </div>
      )}
    </ModalSheet>
  );
}
