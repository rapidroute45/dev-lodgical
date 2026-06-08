import { useEffect, useMemo, useState } from "react";
import { ModalSheet } from "./ModalSheet.jsx";
import { StoreBillingRatesModal } from "./StoreBillingRatesModal.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OPS_ROLES } from "@/shared/utils/constants.js";
import {
  formatDisplayDate,
  isoDateDaysAgo,
  maxPayrollPeriodEndIso,
} from "@/shared/utils/time.js";
import { formatMoney, ROUTE_CATEGORY_LABELS } from "@/modules/payroll/utils/format.js";
import { useStorePayrollDetailQuery } from "@/modules/payroll/infrastructure/api/payroll.queries.js";

const CATEGORIES = ["SMALL", "MEDIUM", "FULL"];

function normalizeCategory(value) {
  const upper = String(value ?? "").toUpperCase();
  return CATEGORIES.includes(upper) ? upper : "SMALL";
}

export function StorePayrollDetailModal({
  open,
  storeId,
  storeName,
  periodStart,
  periodEnd,
  onPeriodChange,
  onClose,
}) {
  const { user } = useAuth();
  const isOps = OPS_ROLES.includes(user?.role);
  const [localStart, setLocalStart] = useState(periodStart);
  const [localEnd, setLocalEnd] = useState(periodEnd);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [ratesOpen, setRatesOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalStart(periodStart);
      setLocalEnd(periodEnd);
    }
  }, [open, periodStart, periodEnd]);

  const queryParams = useMemo(() => ({ periodStart: localStart, periodEnd: localEnd }), [localStart, localEnd]);

  const { data, isLoading, isError, isFetching } = useStorePayrollDetailQuery(
    storeId ?? "",
    queryParams,
    open && Boolean(storeId)
  );

  const routesByCategory = useMemo(() => {
    const groups = { SMALL: [], MEDIUM: [], FULL: [] };
    for (const route of data?.routes ?? []) {
      groups[normalizeCategory(route.routeCategory)].push(route);
    }
    return groups;
  }, [data?.routes]);

  const categorySummaries = useMemo(
    () =>
      CATEGORIES.map((category) => {
        const routes = routesByCategory[category];
        return {
          category,
          label: ROUTE_CATEGORY_LABELS[category],
          count: routes.length,
          total: routes.reduce((sum, route) => sum + route.rate, 0),
          routes,
        };
      }),
    [routesByCategory]
  );

  useEffect(() => {
    if (!open) {
      setExpandedCategory(null);
      return;
    }
    const first = categorySummaries.find((s) => s.count > 0)?.category ?? null;
    setExpandedCategory(first);
  }, [open, storeId, localStart, localEnd, categorySummaries]);

  function applyPeriodChange(start, end) {
    setLocalStart(start);
    setLocalEnd(end);
    onPeriodChange?.(start, end);
  }

  return (
    <>
      <ModalSheet open={open} title={storeName || "Store payroll"} onClose={onClose} wide>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 gap-2">
              <label className="flex-1">
                <span className="mb-1 block text-[10px] font-semibold text-dispatch-muted">From</span>
                <input
                  type="date"
                  value={localStart}
                  min={isoDateDaysAgo(730)}
                  max={localEnd}
                  onChange={(e) => applyPeriodChange(e.target.value, localEnd < e.target.value ? e.target.value : localEnd)}
                  className="w-full rounded-xl border border-dispatch-border px-2 py-2 text-sm"
                />
              </label>
              <label className="flex-1">
                <span className="mb-1 block text-[10px] font-semibold text-dispatch-muted">To</span>
                <input
                  type="date"
                  value={localEnd}
                  min={localStart}
                  max={maxPayrollPeriodEndIso()}
                  onChange={(e) => {
                    const iso = e.target.value;
                    if (iso > maxPayrollPeriodEndIso() || iso < localStart) return;
                    applyPeriodChange(localStart, iso);
                  }}
                  className="w-full rounded-xl border border-dispatch-border px-2 py-2 text-sm"
                />
              </label>
            </div>
            {isOps ? (
              <button
                type="button"
                onClick={() => setRatesOpen(true)}
                title="Per-store billing rates"
                className="mt-5 rounded-lg border border-dispatch-border px-2 py-2 text-xs font-semibold text-dispatch-primary hover:bg-dispatch-bg"
              >
                Rates
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-sm text-dispatch-muted">Loading…</p>
          ) : isError ? (
            <p className="py-8 text-center text-sm text-red-600">Could not load store payroll.</p>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-xl bg-dispatch-primary px-4 py-3 text-white">
                <div>
                  <p className="text-xs font-semibold opacity-90">Total billing</p>
                  <p className="text-2xl font-extrabold">{formatMoney(data?.totalAmount ?? 0)}</p>
                </div>
                <div className="text-right text-xs opacity-90">
                  {data?.completedRouteCount ?? 0} route
                  {(data?.completedRouteCount ?? 0) === 1 ? "" : "s"}
                  {data?.usesCustomRates ? (
                    <p className="mt-1 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold">Custom rates</p>
                  ) : null}
                </div>
              </div>

              {categorySummaries.map((summary) => (
                <div key={summary.category} className="overflow-hidden rounded-xl border border-dispatch-border">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCategory((c) => (c === summary.category ? null : summary.category))
                    }
                    className="flex w-full items-center justify-between bg-dispatch-surface px-4 py-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-bold text-dispatch-text">
                        {summary.label} · {summary.count} route{summary.count === 1 ? "" : "s"}
                      </p>
                      <p className="text-xs text-dispatch-muted">{formatMoney(summary.total)}</p>
                    </div>
                    <span className="text-dispatch-muted">
                      {expandedCategory === summary.category ? "▲" : "▼"}
                    </span>
                  </button>
                  {expandedCategory === summary.category ? (
                    <div className="border-t border-dispatch-border bg-dispatch-bg">
                      {summary.routes.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-dispatch-muted">No routes in this category.</p>
                      ) : (
                        summary.routes.map((route) => (
                          <div
                            key={route.routeId}
                            className="flex items-center justify-between border-b border-dispatch-border px-4 py-3 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-semibold text-dispatch-text">
                                {formatDisplayDate(route.scheduleDate)} · {route.arrivalTime}
                              </p>
                              <p className="text-xs text-dispatch-muted">
                                {route.driverName ?? "Unknown driver"}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-emerald-600">{formatMoney(route.rate)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
              {isFetching && !isLoading ? (
                <p className="text-center text-xs text-dispatch-muted">Refreshing…</p>
              ) : null}
            </>
          )}
        </div>
      </ModalSheet>
      <StoreBillingRatesModal
        open={ratesOpen}
        storeId={storeId}
        storeName={storeName}
        onClose={() => setRatesOpen(false)}
      />
    </>
  );
}
