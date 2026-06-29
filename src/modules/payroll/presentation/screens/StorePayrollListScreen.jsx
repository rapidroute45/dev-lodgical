import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { useOpsLocationScope } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";
import { ScopedEmptyHint } from "@/modules/manager-home/presentation/components/ScopedEmptyHint.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OPS_ROLES, UserRole } from "@/shared/utils/constants.js";
import {
  formatDisplayDate,
  isoDateDaysAgo,
  maxPayrollPeriodEndIso,
  todayIsoDate,
} from "@/shared/utils/time.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { useStorePayrollSummaryQuery } from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import { formatMoney } from "@/modules/payroll/utils/format.js";
import { StoreBillingSettingsModal } from "../components/StoreBillingSettingsModal.jsx";
import { StorePayrollDetailModal } from "../components/StorePayrollDetailModal.jsx";
import { StoreInvoiceModal } from "../components/StoreInvoiceModal.jsx";

export function StorePayrollListScreen() {
  const { user } = useAuth();
  const { effectiveCity } = useOpsLocationScope();
  const isOps = OPS_ROLES.includes(user?.role);
  const canView = isOps || user?.role === UserRole.TEAM_LEAD;
  const [search, setSearch] = useState("");
  const [periodStart, setPeriodStart] = useState(isoDateDaysAgo(6));
  const [periodEnd, setPeriodEnd] = useState(todayIsoDate());
  const [billingOpen, setBillingOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      periodStart,
      periodEnd,
    }),
    [search, periodStart, periodEnd]
  );

  const { data, isLoading, isRefetching, refetch, isError } = useStorePayrollSummaryQuery(
    params,
    canView
  );

  const stores = data?.stores ?? [];

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isRefetching} />
  );

  if (!canView) {
    return (
      <DashboardLayout topBar={topBar}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>You do not have access to store payroll.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <StoreBillingSettingsModal open={billingOpen} onClose={() => setBillingOpen(false)} />

        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Store payroll
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Billing by store for completed routes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/payroll" className="ops-btn px-4 py-2 text-sm font-semibold">
              Driver payroll
            </Link>
            {isOps ? (
              <button
                type="button"
                onClick={() => setBillingOpen(true)}
                className="ops-btn px-4 py-2 text-sm font-semibold"
              >
                Settings
              </button>
            ) : null}
          </div>
        </div>

        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.03)" }}
        >
          <svg className="h-5 w-5 shrink-0" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores by name"
            className="w-full border-0 bg-transparent text-sm outline-none"
            style={{ color: "var(--text)" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>From</span>
            <input
              type="date"
              value={periodStart}
              min={isoDateDaysAgo(730)}
              max={periodEnd}
              onChange={(e) => {
                setPeriodStart(e.target.value);
                if (periodEnd < e.target.value) setPeriodEnd(e.target.value);
              }}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", color: "var(--text)", colorScheme: "dark" }}
            />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>To</span>
            <input
              type="date"
              value={periodEnd}
              min={periodStart}
              max={maxPayrollPeriodEndIso()}
              onChange={(e) => {
                const iso = e.target.value;
                if (iso <= maxPayrollPeriodEndIso() && iso >= periodStart) setPeriodEnd(iso);
              }}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", color: "var(--text)", colorScheme: "dark" }}
            />
          </label>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {formatDisplayDate(periodStart)} – {formatDisplayDate(periodEnd)}
        </p>

        {isOps ? (
          <button
            type="button"
            onClick={() => setInvoiceOpen(true)}
            className="ops-btn ops-btn--accent w-full justify-center py-3 font-bold"
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
          city={effectiveCity}
          stores={stores.map((store) => ({
            id: store.storeId,
            storeName: store.storeName,
          }))}
        />

        {isLoading ? (
          <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading store payroll…</p>
        ) : isError ? (
          <p className="ops-banner ops-banner--error">Could not load store payroll.</p>
        ) : stores.length === 0 ? (
          <>
            <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>No stores found.</p>
            <div className="pb-8 text-center">
              <ScopedEmptyHint show={!isLoading} />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {stores.map((store) => (
              <button
                key={store.storeId}
                type="button"
                onClick={() =>
                  setSelectedStore({ id: store.storeId, name: store.storeName })
                }
                className="ops-listcard flex w-full items-center justify-between p-4 text-left"
              >
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{store.storeName}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {store.storeCode} · {store.city}, {store.state}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {store.completedRouteCount} route{store.completedRouteCount === 1 ? "" : "s"}
                    </span>
                    {store.usesCustomRates ? (
                      <span className="ops-badge ops-badge--active text-[10px] font-bold">
                        Custom rates
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold" style={{ color: "var(--green)" }}>{formatMoney(store.totalAmount)}</p>
                  <span style={{ color: "var(--text-muted)" }}>→</span>
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
