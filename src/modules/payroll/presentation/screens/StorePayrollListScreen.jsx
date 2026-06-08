import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OPS_ROLES, UserRole } from "@/shared/utils/constants.js";
import {
  formatDisplayDate,
  isoDateDaysAgo,
  maxPayrollPeriodEndIso,
  todayIsoDate,
} from "@/shared/utils/time.js";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import { useStorePayrollSummaryQuery } from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import { formatMoney } from "@/modules/payroll/utils/format.js";
import { CityFilterRow } from "../components/CityFilterRow.jsx";
import { StoreBillingSettingsModal } from "../components/StoreBillingSettingsModal.jsx";
import { StorePayrollDetailModal } from "../components/StorePayrollDetailModal.jsx";
import { StoreInvoiceModal } from "../components/StoreInvoiceModal.jsx";
import { useAssignedCityScope } from "../hooks/useAssignedCityScope.js";

export function StorePayrollListScreen() {
  const { user } = useAuth();
  const isOps = OPS_ROLES.includes(user?.role);
  const canView = isOps || user?.role === UserRole.TEAM_LEAD;
  const [search, setSearch] = useState("");
  const [periodStart, setPeriodStart] = useState(isoDateDaysAgo(6));
  const [periodEnd, setPeriodEnd] = useState(todayIsoDate());
  const [billingOpen, setBillingOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const { assignedCity, isCityLocked } = useAssignedCityScope();
  const [cityFilter, setCityFilter] = useState(null);

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      periodStart,
      periodEnd,
      city: isCityLocked ? assignedCity ?? undefined : cityFilter ?? undefined,
    }),
    [search, periodStart, periodEnd, cityFilter, isCityLocked, assignedCity]
  );

  const { data, isLoading, isRefetching, refetch, isError } = useStorePayrollSummaryQuery(
    params,
    canView
  );

  const stores = data?.stores ?? [];

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div>
          <h1 className="text-xl font-bold text-dispatch-text">Store payroll</h1>
          <p className="text-sm text-dispatch-muted">Billing by store for completed routes</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/payroll"
            className="rounded-xl border border-dispatch-border px-3 py-2 text-sm font-semibold text-dispatch-muted hover:bg-dispatch-bg"
          >
            Driver payroll
          </Link>
          {isOps ? (
            <button
              type="button"
              onClick={() => setBillingOpen(true)}
              className="rounded-xl border border-dispatch-border px-3 py-2 text-sm font-semibold text-dispatch-primary hover:bg-dispatch-bg"
            >
              Settings
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-xl border border-dispatch-border px-3 py-2 text-sm font-semibold text-dispatch-muted hover:bg-dispatch-bg"
          >
            {isRefetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
    </header>
  );

  if (!canView) {
    return (
      <DashboardLayout topBar={topBar}>
        <p className="text-sm text-dispatch-muted">You do not have access to store payroll.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <StoreBillingSettingsModal open={billingOpen} onClose={() => setBillingOpen(false)} />

        <div className="flex items-center gap-3 rounded-2xl border border-dispatch-border bg-dispatch-surface px-4 py-3 shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-dispatch-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores by name"
            className="w-full border-0 bg-transparent text-sm outline-none"
          />
        </div>

        <CityFilterRow
          selectedCity={cityFilter}
          lockedCity={isCityLocked ? assignedCity : null}
          onSelect={setCityFilter}
        />

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1 block text-[10px] font-semibold text-dispatch-muted">From</span>
            <input
              type="date"
              value={periodStart}
              min={isoDateDaysAgo(730)}
              max={periodEnd}
              onChange={(e) => {
                setPeriodStart(e.target.value);
                if (periodEnd < e.target.value) setPeriodEnd(e.target.value);
              }}
              className="w-full rounded-xl border border-dispatch-border px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold text-dispatch-muted">To</span>
            <input
              type="date"
              value={periodEnd}
              min={periodStart}
              max={maxPayrollPeriodEndIso()}
              onChange={(e) => {
                const iso = e.target.value;
                if (iso <= maxPayrollPeriodEndIso() && iso >= periodStart) setPeriodEnd(iso);
              }}
              className="w-full rounded-xl border border-dispatch-border px-3 py-2 text-sm"
            />
          </label>
        </div>

        <p className="text-xs text-dispatch-muted">
          {formatDisplayDate(periodStart)} – {formatDisplayDate(periodEnd)}
        </p>

        {isOps ? (
          <button
            type="button"
            onClick={() => setInvoiceOpen(true)}
            className="w-full rounded-xl bg-dispatch-primary py-3 text-sm font-bold text-white shadow-md"
          >
            Generate invoice
          </button>
        ) : null}

        <StoreInvoiceModal
          open={invoiceOpen}
          onClose={() => setInvoiceOpen(false)}
          periodStart={periodStart}
          periodEnd={periodEnd}
          search={search.trim() || undefined}
          city={isCityLocked ? assignedCity ?? undefined : cityFilter ?? undefined}
        />

        {isLoading ? (
          <p className="py-12 text-center text-sm text-dispatch-muted">Loading store payroll…</p>
        ) : isError ? (
          <p className="py-12 text-center text-sm text-red-600">Could not load store payroll.</p>
        ) : stores.length === 0 ? (
          <p className="py-12 text-center text-sm text-dispatch-muted">No stores found.</p>
        ) : (
          <div className="space-y-2">
            {stores.map((store) => (
              <button
                key={store.storeId}
                type="button"
                onClick={() =>
                  setSelectedStore({ id: store.storeId, name: store.storeName })
                }
                className="flex w-full items-center justify-between rounded-2xl border border-dispatch-border bg-dispatch-surface p-4 text-left shadow-sm hover:border-dispatch-primary/40"
              >
                <div>
                  <p className="text-sm font-bold text-dispatch-text">{store.storeName}</p>
                  <p className="text-xs text-dispatch-muted">
                    {store.storeCode} · {store.city}, {store.state}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-dispatch-muted">
                      {store.completedRouteCount} route{store.completedRouteCount === 1 ? "" : "s"}
                    </span>
                    {store.usesCustomRates ? (
                      <span className="rounded-md bg-dispatch-primary-soft px-2 py-0.5 text-[10px] font-bold text-dispatch-primary">
                        Custom rates
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-600">{formatMoney(store.totalAmount)}</p>
                  <span className="text-dispatch-muted">→</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <StorePayrollDetailModal
          open={Boolean(selectedStore)}
          storeId={selectedStore?.id ?? null}
          storeName={selectedStore?.name ?? ""}
          periodStart={periodStart}
          periodEnd={periodEnd}
          onPeriodChange={(start, end) => {
            setPeriodStart(start);
            setPeriodEnd(end);
          }}
          onClose={() => setSelectedStore(null)}
        />
      </div>
    </DashboardLayout>
  );
}
