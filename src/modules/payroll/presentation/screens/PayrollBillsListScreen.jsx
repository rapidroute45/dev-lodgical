import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OPS_ROLES } from "@/shared/utils/constants.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import {
  usePayrollBillsQuery,
  usePayrollPendingSummaryQuery,
} from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import { formatMoney, formatPeriodRange, statusMeta } from "@/modules/payroll/utils/format.js";
import { PayrollGeneratePanel } from "../components/PayrollGeneratePanel.jsx";
import { PayrollSettingsModal } from "../components/PayrollSettingsModal.jsx";
import { PayrollPendingByTeamModal } from "../components/PayrollPendingByTeamModal.jsx";
import { TeamPendingCard } from "../components/TeamPendingCard.jsx";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "pending_team_lead", label: "With lead" },
  { key: "team_lead_approved", label: "Ready to pay" },
  { key: "paid", label: "Paid" },
];

const STATUS_BADGE = {
  draft: "muted",
  pending_team_lead: "pending",
  team_lead_approved: "done",
  team_lead_disputed: "rose",
  paid: "done",
};

function statusBadgeClass(status) {
  return `ops-badge ops-badge--${STATUS_BADGE[status] ?? "muted"}`;
}

export function PayrollBillsListScreen() {
  const { user } = useAuth();
  const isOps = OPS_ROLES.includes(user?.role);
  const [filter, setFilter] = useState("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);

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

  const pendingModalTitle = isOps ? "Pending by team" : "Your team pending";

  const topBar = (
    <OpsTopBar
      showDate={false}
      onRefresh={() => {
        void refetchSummary();
        void refetchBills();
      }}
      refreshing={summaryFetching || billsFetching}
    />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <PayrollSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        {summary ? (
          <PayrollPendingByTeamModal
            open={pendingModalOpen}
            title={pendingModalTitle}
            summary={summary}
            teams={teamsWithActivity}
            isOps={isOps}
            onClose={() => setPendingModalOpen(false)}
          />
        ) : null}

        <div className="ops-fade relative z-30 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Payroll
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Driver bills and pending balances
            </p>
          </div>
          {isOps ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="ops-btn px-4 py-2 text-sm font-semibold"
              >
                ⋮
              </button>
              {menuOpen ? (
                <div
                  className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl"
                  style={{ border: "1px solid var(--border-strong)", background: "var(--bg-card-solid)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(true);
                      setMenuOpen(false);
                    }}
                    className="ops-row block w-full px-4 py-2.5 text-left text-sm"
                    style={{ color: "var(--text)" }}
                  >
                    Driver rate settings
                  </button>
                  <Link
                    to="/payroll/store-payroll"
                    onClick={() => setMenuOpen(false)}
                    className="ops-row block px-4 py-2.5 text-sm"
                    style={{ color: "var(--text)" }}
                  >
                    Store payroll
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {summaryLoading ? (
          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading pending payroll…</p>
        ) : summaryError ? (
          <p className="ops-banner ops-banner--error">Could not load pending payroll.</p>
        ) : summary ? (
          <>
            {isOps ? <PayrollGeneratePanel /> : null}
            <button
              type="button"
              onClick={() => setPendingModalOpen(true)}
              className="ops-panel ops-fade w-full p-5 text-left transition-opacity hover:opacity-95"
              style={{ background: "rgba(34, 211, 238, 0.08)", border: "1px solid rgba(34, 211, 238, 0.25)" }}
              aria-label="View pending payroll by team"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                  {isOps ? "Total pending (all teams)" : "Your team pending"}
                </p>
                <span className="text-sm" style={{ color: "var(--accent)" }} aria-hidden="true">→</span>
              </div>
              <p className="mt-1 text-4xl font-extrabold" style={{ color: "var(--accent)" }}>{formatMoney(summary.totalPendingAmount)}</p>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                {summary.totalRouteCount} unbilled route{summary.totalRouteCount === 1 ? "" : "s"}
                {summary.rates
                  ? ` · S ${summary.rates.smallRouteRate} / M ${summary.rates.mediumRouteRate} / F ${summary.rates.fullRouteRate}`
                  : ""}
              </p>
              <p className="mt-2 text-xs font-semibold" style={{ color: "var(--accent)" }}>
                View breakdown
              </p>
            </button>

            <section>
              <h2 className="mb-3 text-base font-bold" style={{ color: "var(--text)" }}>Pending by team</h2>
              {teamsWithActivity.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No pending balances right now.</p>
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
          <h2 className="mb-3 text-base font-bold" style={{ color: "var(--text)" }}>Payroll bills</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`ops-chip ${filter === f.key ? "ops-chip--active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {billsLoading ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading bills…</p>
          ) : billsError ? (
            <p className="ops-banner ops-banner--error">Could not load payroll bills.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No payroll bills yet.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((bill) => {
                const meta = statusMeta(bill.status);
                return (
                  <Link
                    key={bill.id}
                    to={`/payroll/${bill.id}`}
                    className="ops-listcard block p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-base font-bold" style={{ color: "var(--text)" }}>{bill.teamName}</p>
                      <span className={statusBadgeClass(bill.status)}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatPeriodRange(bill.periodStart, bill.periodEnd)}
                    </p>
                    <p className="mt-2 text-2xl font-extrabold" style={{ color: "var(--accent)" }}>
                      {formatMoney(bill.totalAmount)}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
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
