import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OPS_ROLES } from "@/shared/utils/constants.js";
import { formatDisplayDate } from "@/shared/utils/time.js";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import {
  usePayrollBillsQuery,
  usePayrollPendingSummaryQuery,
} from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import { formatMoney, formatPeriodRange, statusMeta, ROUTE_CATEGORY_LABELS } from "@/modules/payroll/utils/format.js";
import { PayrollGeneratePanel } from "../components/PayrollGeneratePanel.jsx";
import { PayrollSettingsModal } from "../components/PayrollSettingsModal.jsx";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "pending_team_lead", label: "With lead" },
  { key: "team_lead_approved", label: "Ready to pay" },
  { key: "paid", label: "Paid" },
];

function TeamPendingCard({ team, isOps, onOpenBill }) {
  const [teamExpanded, setTeamExpanded] = useState(false);
  const [expandedDrivers, setExpandedDrivers] = useState(new Set());
  const activeMeta = team.activeBillStatus ? statusMeta(team.activeBillStatus) : null;

  function toggleDriver(driverId) {
    setExpandedDrivers((prev) => {
      const next = new Set(prev);
      if (next.has(driverId)) next.delete(driverId);
      else next.add(driverId);
      return next;
    });
  }

  return (
    <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
      <button
        type="button"
        onClick={() => setTeamExpanded((v) => !v)}
        className="flex w-full items-start justify-between text-left"
      >
        <div>
          <p className="text-base font-bold text-dispatch-text">{team.teamName}</p>
          <p className="text-xs text-dispatch-muted">
            {team.routeCount} route{team.routeCount === 1 ? "" : "s"} · {team.driverCount} driver
            {team.driverCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-dispatch-primary">{formatMoney(team.pendingAmount)}</p>
          <span className="text-xs text-dispatch-muted">{teamExpanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {team.activeBillId && activeMeta ? (
        <Link
          to={`/payroll/${team.activeBillId}`}
          className="mt-3 flex items-center justify-between border-t border-dispatch-border pt-3"
        >
          <span className={`rounded-lg px-2 py-1 text-xs font-bold ${activeMeta.className}`}>
            Open bill · {activeMeta.label}
          </span>
          <span className="text-dispatch-primary">→</span>
        </Link>
      ) : null}

      {teamExpanded ? (
        <div className="mt-3 space-y-2 border-t border-dispatch-border pt-3">
          {team.drivers.length === 0 ? (
            <p className="text-xs text-dispatch-muted">No drivers to show</p>
          ) : (
            team.drivers.map((driver) => {
              const open = expandedDrivers.has(driver.driverId);
              return (
                <div key={driver.driverId}>
                  <button
                    type="button"
                    onClick={() => toggleDriver(driver.driverId)}
                    className="flex w-full items-center justify-between py-2 text-left"
                  >
                    <div>
                      <p className="text-sm font-bold text-dispatch-text">{driver.driverName}</p>
                      <p className="text-xs text-dispatch-muted">
                        {driver.routeCount} route{driver.routeCount === 1 ? "" : "s"} ·{" "}
                        {formatMoney(driver.pendingAmount)}
                      </p>
                    </div>
                    <span className="text-dispatch-muted">{open ? "▲" : "▼"}</span>
                  </button>
                  {open
                    ? driver.routes.map((r) => (
                        <div
                          key={r.routeId}
                          className="flex items-center justify-between border-b border-dispatch-border py-2 pl-2 text-sm last:border-0"
                        >
                          <div>
                            <p className="font-semibold text-dispatch-text">
                              {r.routeName || "Route"}
                              {r.location ? ` · ${r.location}` : ""}
                            </p>
                            <p className="text-xs text-dispatch-muted">
                              {formatDisplayDate(r.scheduleDate)} · {formatMoney(r.rate)}
                              {r.routeCategory
                                ? ` · ${ROUTE_CATEGORY_LABELS[r.routeCategory] ?? r.routeCategory}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {isOps && team.pendingAmount === 0 && !team.activeBillId ? (
        <p className="mt-2 text-xs text-dispatch-muted">No unbilled completed routes</p>
      ) : null}
    </div>
  );
}

export function PayrollBillsListScreen() {
  const { user } = useAuth();
  const isOps = OPS_ROLES.includes(user?.role);
  const [filter, setFilter] = useState("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
    isFetching: summaryFetching,
  } = usePayrollPendingSummaryQuery();
  const {
    data: bills = [],
    isLoading: billsLoading,
    isError: billsError,
    refetch: refetchBills,
    isFetching: billsFetching,
  } = usePayrollBillsQuery();

  const filtered = useMemo(
    () => (filter === "all" ? bills : bills.filter((b) => b.status === filter)),
    [bills, filter]
  );

  const teamsWithActivity = useMemo(
    () => (summary?.teams ?? []).filter((t) => t.pendingAmount > 0 || t.activeBillId),
    [summary?.teams]
  );

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div>
          <h1 className="text-xl font-bold text-dispatch-text">Payroll</h1>
          <p className="text-sm text-dispatch-muted">Driver bills and pending balances</p>
        </div>
        <div className="flex items-center gap-2">
          {isOps ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-xl border border-dispatch-border px-3 py-2 text-sm font-semibold text-dispatch-text hover:bg-dispatch-bg"
              >
                ⋮
              </button>
              {menuOpen ? (
                <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-dispatch-border bg-dispatch-surface shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(true);
                      setMenuOpen(false);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm hover:bg-dispatch-bg"
                  >
                    Driver rate settings
                  </button>
                  <Link
                    to="/payroll/store-payroll"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-dispatch-bg"
                  >
                    Store payroll
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => {
              void refetchSummary();
              void refetchBills();
            }}
            className="rounded-xl border border-dispatch-border px-3 py-2 text-sm font-semibold text-dispatch-muted hover:bg-dispatch-bg"
          >
            {summaryFetching || billsFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <PayrollSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

        {summaryLoading ? (
          <p className="text-center text-sm text-dispatch-muted">Loading pending payroll…</p>
        ) : summaryError ? (
          <p className="text-center text-sm text-red-600">Could not load pending payroll.</p>
        ) : summary ? (
          <>
            {isOps ? <PayrollGeneratePanel /> : null}
            <div className="rounded-2xl bg-dispatch-primary p-5 text-white shadow-lg">
              <p className="text-sm font-semibold opacity-90">
                {isOps ? "Total pending (all teams)" : "Your team pending"}
              </p>
              <p className="mt-1 text-4xl font-extrabold">{formatMoney(summary.totalPendingAmount)}</p>
              <p className="mt-2 text-xs opacity-85">
                {summary.totalRouteCount} unbilled route{summary.totalRouteCount === 1 ? "" : "s"}
                {summary.rates
                  ? ` · S ${summary.rates.smallRouteRate} / M ${summary.rates.mediumRouteRate} / F ${summary.rates.fullRouteRate}`
                  : ""}
              </p>
            </div>

            <section>
              <h2 className="mb-3 text-base font-bold text-dispatch-text">Pending by team</h2>
              {teamsWithActivity.length === 0 ? (
                <p className="text-sm text-dispatch-muted">No pending balances right now.</p>
              ) : (
                <div className="space-y-3">
                  {teamsWithActivity.map((team) => (
                    <TeamPendingCard
                      key={team.teamId}
                      team={team}
                      isOps={isOps}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}

        <section>
          <h2 className="mb-3 text-base font-bold text-dispatch-text">Payroll bills</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  filter === f.key
                    ? "border-dispatch-primary bg-dispatch-primary text-white"
                    : "border-dispatch-border bg-dispatch-surface text-dispatch-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {billsLoading ? (
            <p className="text-sm text-dispatch-muted">Loading bills…</p>
          ) : billsError ? (
            <p className="text-sm text-red-600">Could not load payroll bills.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-dispatch-muted">No payroll bills yet.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((bill) => {
                const meta = statusMeta(bill.status);
                return (
                  <Link
                    key={bill.id}
                    to={`/payroll/${bill.id}`}
                    className="block rounded-2xl border border-dispatch-border bg-dispatch-surface p-4 shadow-sm transition hover:border-dispatch-primary/40"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-base font-bold text-dispatch-text">{bill.teamName}</p>
                      <span className={`rounded-lg px-2 py-1 text-xs font-bold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-dispatch-muted">
                      {formatPeriodRange(bill.periodStart, bill.periodEnd)}
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-dispatch-primary">
                      {formatMoney(bill.totalAmount)}
                    </p>
                    <p className="mt-1 text-xs text-dispatch-muted">
                      {bill.lineItems.length} driver{bill.lineItems.length === 1 ? "" : "s"} ·{" "}
                      {bill.lineItems.reduce((s, l) => s + l.routeCount, 0)} routes
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
