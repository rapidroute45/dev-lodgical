import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OPS_ROLES, UserRole } from "@/shared/utils/constants.js";
import { formatTimestamp } from "@/shared/utils/time.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import {
  usePayrollBillQuery,
  usePayrollSettingsQuery,
  useUpdatePayrollBillMutation,
  useDeletePayrollBillMutation,
  useSendPayrollToTeamLeadMutation,
  useAcknowledgePayrollMutation,
  useApprovePayrollMutation,
  useDisputePayrollMutation,
  useMarkPayrollPaidMutation,
} from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import {
  formatMoney,
  formatPeriodRange,
  payrollReceiptUrl,
  statusMeta,
  ROUTE_CATEGORY_LABELS,
} from "@/modules/payroll/utils/format.js";
import { PayrollBillRouteGrid } from "@/modules/payroll/presentation/components/PayrollBillRouteGrid.jsx";

const ROUTE_CATEGORIES = ["SMALL", "MEDIUM", "FULL"];

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

function settingsRateForCategory(settings, category) {
  if (!settings) return null;
  if (category === "MEDIUM") return settings.mediumRouteRate;
  if (category === "FULL") return settings.fullRouteRate;
  return settings.smallRouteRate;
}

function formatCategoryRatesSummary(rows) {
  const onBill = rows.filter((r) => r.count > 0);
  if (onBill.length === 0) return "";
  return onBill.map((r) => `${r.label} $${r.rate}`).join(" · ");
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function PayrollBillDetailScreen() {
  const { id: billId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: bill, isLoading, isError, refetch, isFetching } = usePayrollBillQuery(billId);
  const updateMutation = useUpdatePayrollBillMutation();
  const deleteMutation = useDeletePayrollBillMutation();
  const sendMutation = useSendPayrollToTeamLeadMutation();
  const acknowledgeMutation = useAcknowledgePayrollMutation();
  const approveMutation = useApprovePayrollMutation();
  const disputeMutation = useDisputePayrollMutation();
  const markPaidMutation = useMarkPayrollPaidMutation();

  const [draft, setDraft] = useState({});
  const [expanded, setExpanded] = useState(new Set());
  const [disputing, setDisputing] = useState(false);
  const [disputeNote, setDisputeNote] = useState("");
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [opsNote, setOpsNote] = useState("");
  const [standardRateDraft, setStandardRateDraft] = useState("");
  const [removedRouteIds, setRemovedRouteIds] = useState(new Set());
  const [opsMenuOpen, setOpsMenuOpen] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const isTeamLead = user?.role === UserRole.TEAM_LEAD;
  const isOps = OPS_ROLES.includes(user?.role);

  const canEditAdjustments =
    isOps &&
    (bill?.status === "draft" ||
      bill?.status === "team_lead_disputed" ||
      bill?.status === "pending_team_lead");

  const { data: payrollSettings } = usePayrollSettingsQuery(canEditAdjustments);
  const canTeamLeadReview = isTeamLead && bill?.status === "pending_team_lead";
  const canAcknowledge = canTeamLeadReview && !bill?.teamLeadAcknowledgedAt;
  const canApproveAfterAck = canTeamLeadReview && Boolean(bill?.teamLeadAcknowledgedAt);
  const canMarkPaid = isOps && bill?.status === "team_lead_approved";
  const canDelete =
    isOps &&
    (bill?.status === "draft" ||
      bill?.status === "team_lead_disputed" ||
      bill?.status === "pending_team_lead");
  const showAdjustments =
    isOps || (bill?.status !== "draft" && bill?.status !== "team_lead_disputed");

  useEffect(() => {
    if (!bill) return;
    const next = {};
    bill.lineItems.forEach((line) => {
      next[line.driverId] = {
        bonus: String(line.bonus ?? 0),
        deduction: String(line.deduction ?? 0),
        overtime: String(line.overtime ?? 0),
      };
    });
    setDraft(next);
    setOpsNote(bill.note ?? "");
    setStandardRateDraft(String(bill.standardRate ?? 100));
    setRemovedRouteIds(new Set());
  }, [bill?.id, bill?.status, bill?.updatedAt]);

  const effectiveRate = useMemo(() => {
    if (!canEditAdjustments || !standardRateDraft.trim()) return bill?.standardRate ?? 100;
    const n = Number(standardRateDraft);
    return Number.isFinite(n) && n > 0 ? n : bill?.standardRate ?? 100;
  }, [bill?.standardRate, canEditAdjustments, standardRateDraft]);

  const visibleLineItems = useMemo(() => {
    if (!bill) return [];
    return bill.lineItems
      .map((line) => ({
        ...line,
        routes: line.routes.filter((r) => !removedRouteIds.has(r.routeId)),
      }))
      .filter((line) => line.routes.length > 0);
  }, [bill, removedRouteIds]);

  const categoryRateRows = useMemo(() => {
    const byCategory = new Map();
    for (const line of visibleLineItems) {
      for (const route of line.routes) {
        const category = (route.routeCategory ?? "SMALL").toUpperCase();
        const rate = route.rate ?? route.defaultRate ?? 0;
        const existing = byCategory.get(category);
        if (existing) {
          existing.count += 1;
        } else {
          byCategory.set(category, { rate, count: 1 });
        }
      }
    }
    return ROUTE_CATEGORIES.map((category) => {
      const onBill = byCategory.get(category);
      const settingsRate = settingsRateForCategory(payrollSettings, category);
      return {
        category,
        label: ROUTE_CATEGORY_LABELS[category] ?? category,
        rate: onBill?.rate ?? settingsRate ?? 0,
        count: onBill?.count ?? 0,
      };
    });
  }, [visibleLineItems, payrollSettings]);

  const categoryRatesSummary = formatCategoryRatesSummary(categoryRateRows);

  const canSendToTeamLead =
    isOps &&
    (bill?.status === "draft" || bill?.status === "team_lead_disputed") &&
    visibleLineItems.length > 0;
  const isResendToTeamLead = bill?.status === "pending_team_lead";

  const grandTotal = useMemo(() => {
    if (!bill) return 0;
    if (!canEditAdjustments) return bill.totalAmount;
    return visibleLineItems.reduce((sum, line) => {
      const d = draft[line.driverId];
      const bonus = d ? num(d.bonus) : line.bonus;
      const deduction = d ? num(d.deduction) : line.deduction;
      const overtime = d ? num(d.overtime) : line.overtime;
      return sum + line.basePay + bonus + overtime - deduction;
    }, 0);
  }, [bill, draft, canEditAdjustments, visibleLineItems]);

  const hasChanges = useMemo(() => {
    if (!bill) return false;
    if (removedRouteIds.size > 0) return true;
    if ((opsNote ?? "") !== (bill.note ?? "")) return true;
    if (effectiveRate !== bill.standardRate) return true;
    return bill.lineItems.some((line) => {
      const d = draft[line.driverId];
      if (!d) return false;
      return (
        num(d.bonus) !== line.bonus ||
        num(d.deduction) !== line.deduction ||
        num(d.overtime) !== line.overtime
      );
    });
  }, [bill, draft, opsNote, effectiveRate, removedRouteIds]);

  const canSaveBill = canEditAdjustments && (hasChanges || isResendToTeamLead);

  function buildAdjustments() {
    return Object.entries(draft).map(([driverId, v]) => ({
      driverId,
      bonus: num(v.bonus),
      deduction: num(v.deduction),
      overtime: num(v.overtime),
    }));
  }

  function buildUpdatePayload() {
    return {
      adjustments: buildAdjustments(),
      note: opsNote.trim() || null,
      standardRate: effectiveRate,
      removeRouteIds: removedRouteIds.size > 0 ? [...removedRouteIds] : undefined,
    };
  }

  async function handleSave() {
    setError(null);
    try {
      if (hasChanges) {
        await updateMutation.mutateAsync({ id: billId, ...buildUpdatePayload() });
      }
      if (isResendToTeamLead) {
        await sendMutation.mutateAsync(billId);
        setMessage(hasChanges ? "Saved and team lead notified" : "Team lead notified");
      } else {
        setMessage("Payroll bill saved");
      }
    } catch (err) {
      setError(err.message || "Could not save");
    }
  }

  async function handleDeleteBill() {
    if (!window.confirm("Delete this payroll bill? Routes can be billed again later.")) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(billId);
      navigate("/payroll");
    } catch (err) {
      setError(err.message || "Could not delete");
    }
  }

  async function handleSendToTeamLead() {
    setError(null);
    try {
      if (canEditAdjustments) {
        await updateMutation.mutateAsync({ id: billId, ...buildUpdatePayload() });
      }
      await sendMutation.mutateAsync(billId);
      setMessage("Sent to team lead for review");
    } catch (err) {
      setError(err.message || "Could not send");
    }
  }

  async function handleAcknowledge() {
    setError(null);
    try {
      await acknowledgeMutation.mutateAsync(billId);
      setMessage("Payroll acknowledged");
    } catch (err) {
      setError(err.message || "Could not acknowledge");
    }
  }

  async function handleApprove() {
    setError(null);
    try {
      await approveMutation.mutateAsync(billId);
      setMessage("Bill approved");
    } catch (err) {
      setError(err.message || "Could not approve");
    }
  }

  async function handleDispute() {
    const note = disputeNote.trim();
    if (!note) {
      setError("Describe the issue first");
      return;
    }
    setError(null);
    try {
      await disputeMutation.mutateAsync({ id: billId, note });
      setDisputing(false);
      setDisputeNote("");
      setMessage("Issue sent to dispatch");
    } catch (err) {
      setError(err.message || "Could not send note");
    }
  }

  function handleReceiptPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  async function handleMarkPaid() {
    if (!receiptFile) {
      setError("Upload payment receipt first");
      return;
    }
    setError(null);
    try {
      await markPaidMutation.mutateAsync({ id: billId, file: receiptFile });
      setReceiptFile(null);
      setReceiptPreview(null);
      setMessage("Payment recorded");
    } catch (err) {
      setError(err.message || "Could not record payment");
    }
  }

  function toggleExpand(driverId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(driverId)) next.delete(driverId);
      else next.add(driverId);
      return next;
    });
  }

  const busy =
    updateMutation.isPending ||
    deleteMutation.isPending ||
    sendMutation.isPending ||
    approveMutation.isPending ||
    acknowledgeMutation.isPending ||
    disputeMutation.isPending ||
    markPaidMutation.isPending;

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />
  );

  const titleRow = (
    <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link to="/payroll" className="ops-btn p-2.5">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>Payroll bill</h1>
          {bill ? (
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{bill.teamName}</p>
          ) : null}
        </div>
      </div>
      {isOps && bill && (canEditAdjustments || canDelete || canSendToTeamLead) ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpsMenuOpen((v) => !v)}
            className="ops-btn px-4 py-2 text-sm font-semibold"
            aria-label="Bill actions"
          >
            ⋮
          </button>
          {opsMenuOpen ? (
            <div
              className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--border-strong)", background: "var(--bg-card-solid)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
            >
              {canEditAdjustments ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpsMenuOpen(false);
                    document.getElementById("payroll-bill-edit")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="ops-row block w-full px-4 py-2.5 text-left text-sm"
                  style={{ color: "var(--text)" }}
                >
                  Edit bill
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpsMenuOpen(false);
                    void handleDeleteBill();
                  }}
                  disabled={busy}
                  className="ops-row block w-full px-4 py-2.5 text-left text-sm"
                  style={{ color: "#fda4af" }}
                >
                  Delete bill
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          {titleRow}
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading bill…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !bill) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          {titleRow}
          <p className="ops-banner ops-banner--error">Could not load this payroll bill.</p>
        </div>
      </DashboardLayout>
    );
  }

  const meta = statusMeta(bill.status);
  const receiptUri = payrollReceiptUrl(bill.paymentReceiptUrl);

  return (
    <DashboardLayout topBar={topBar}>
      <div className={`${PAGE_CONTENT} pb-28`}>
        {titleRow}

        {error ? (
          <div className="ops-banner ops-banner--error">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="ops-banner ops-banner--success">
            {message}
          </div>
        ) : null}

        <div className="ops-panel ops-fade p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              {formatPeriodRange(bill.periodStart, bill.periodEnd)}
            </p>
            <span className={statusBadgeClass(bill.status)}>
              {meta.label}
            </span>
          </div>
          <p className="mt-2 text-lg font-bold" style={{ color: "var(--text)" }}>
            {bill.teamName}
            {bill.teamNumber ? ` · #${bill.teamNumber}` : ""}
          </p>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Total payable</span>
            <span className="text-3xl font-extrabold" style={{ color: "var(--accent)" }}>{formatMoney(grandTotal)}</span>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            {categoryRatesSummary
              ? `${categoryRatesSummary} per route · `
              : `$${canEditAdjustments ? effectiveRate : bill.standardRate} per completed route · `}
            {visibleLineItems.length} driver{visibleLineItems.length === 1 ? "" : "s"}
          </p>
        </div>

        {canEditAdjustments ? (
          <div id="payroll-bill-edit" className="ops-panel ops-fade p-4">
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Edit bill</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Rates per route ($)</p>
            <div className="mt-1 overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
              {categoryRateRows.map((row) => (
                <div key={row.category} className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{row.label}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {row.count > 0
                        ? `${row.count} route${row.count === 1 ? "" : "s"} on bill`
                        : "Default rate"}
                    </p>
                  </div>
                  <p className="text-base font-extrabold" style={{ color: "var(--green)" }}>${row.rate}</p>
                </div>
              ))}
            </div>
            <label className="mt-4 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Flat override ($)</label>
            <p className="mb-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Optional — applies the same rate to all routes when saved
            </p>
            <input
              type="number"
              value={standardRateDraft}
              onChange={(e) => setStandardRateDraft(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <label className="mt-3 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Internal note</label>
            <textarea
              value={opsNote}
              onChange={(e) => setOpsNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="Optional note for ops"
            />
          </div>
        ) : bill.note ? (
          <div className="ops-panel ops-fade p-4">
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Ops note</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{bill.note}</p>
          </div>
        ) : null}

        {bill.status === "team_lead_disputed" && bill.teamLeadNote ? (
          <div className="ops-banner ops-banner--error">
            <p className="text-sm font-bold">Team lead note</p>
            <p className="mt-1 text-sm">{bill.teamLeadNote}</p>
          </div>
        ) : null}

        {bill.status === "paid" && receiptUri ? (
          <div className="ops-panel ops-fade p-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Paid{bill.paidByName ? ` by ${bill.paidByName}` : ""}
              {bill.paidAt ? ` · ${formatTimestamp(bill.paidAt)}` : ""}
            </p>
            <img src={receiptUri} alt="Payment receipt" className="mt-3 max-h-64 rounded-lg" style={{ border: "1px solid var(--border)" }} />
          </div>
        ) : null}

        {visibleLineItems.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No routes on this bill.</p>
        ) : (
          visibleLineItems.map((line) => {
            const d = draft[line.driverId];
            const bonus = d ? num(d.bonus) : line.bonus;
            const deduction = d ? num(d.deduction) : line.deduction;
            const overtime = d ? num(d.overtime) : line.overtime;
            const lineTotal = line.basePay + bonus + overtime - deduction;
            const isOpen = expanded.has(line.driverId);

            return (
              <div key={line.driverId} className="ops-panel ops-fade p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold" style={{ color: "var(--text)" }}>{line.driverName}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {line.routes.length} route{line.routes.length === 1 ? "" : "s"} ·{" "}
                      {formatMoney(line.basePay)} base
                    </p>
                  </div>
                  <p className="text-lg font-extrabold" style={{ color: "var(--accent)" }}>{formatMoney(lineTotal)}</p>
                </div>

                {showAdjustments ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {["bonus", "deduction", "overtime"].map((field) => (
                      <div key={field}>
                        <label className="text-[10px] font-bold uppercase capitalize" style={{ color: "var(--text-dim)" }}>
                          {field} ($)
                        </label>
                        {canEditAdjustments ? (
                          <input
                            type="number"
                            value={d?.[field] ?? "0"}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                [line.driverId]: {
                                  ...prev[line.driverId],
                                  [field]: e.target.value,
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm"
                            style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", color: "var(--text)" }}
                          />
                        ) : (
                          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
                            {formatMoney(field === "bonus" ? bonus : field === "deduction" ? deduction : overtime)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => toggleExpand(line.driverId)}
                  className="mt-3 text-xs font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  {isOpen ? "Hide" : "View"} route details {isOpen ? "▲" : "▼"}
                </button>

                {isOpen ? (
                  <PayrollBillRouteGrid
                    routes={line.routes}
                    canRemove={canEditAdjustments}
                    onRemove={(routeId) =>
                      setRemovedRouteIds((prev) => new Set([...prev, routeId]))
                    }
                  />
                ) : null}
              </div>
            );
          })
        )}

        {canMarkPaid ? (
          <div className="ops-panel ops-fade p-4">
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Payment receipt</p>
            <input type="file" accept="image/*" onChange={handleReceiptPick} className="mt-2 text-sm" style={{ color: "var(--text-muted)" }} />
            {receiptPreview ? (
              <img src={receiptPreview} alt="Receipt preview" className="mt-3 max-h-48 rounded-lg" style={{ border: "1px solid var(--border)" }} />
            ) : null}
          </div>
        ) : null}

        {disputing ? (
          <div className="ops-panel ops-fade p-4">
            <label className="text-sm font-bold" style={{ color: "var(--text)" }}>Describe the issue</label>
            <textarea
              value={disputeNote}
              onChange={(e) => setDisputeNote(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setDisputing(false)}
                className="ops-btn px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDispute()}
                disabled={busy}
                className="ops-btn px-4 py-2 text-sm font-bold"
                style={{ borderColor: "rgba(251, 113, 133, 0.4)", background: "rgba(251, 113, 133, 0.12)", color: "#fda4af" }}
              >
                Send to dispatch
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {canSendToTeamLead || canAcknowledge || canApproveAfterAck || canEditAdjustments || canDelete || canMarkPaid ? (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 backdrop-blur-md"
          style={{ borderTop: "1px solid var(--border)", background: "rgba(7, 11, 18, 0.85)" }}
        >
          <div className="mx-auto flex max-w-4xl flex-wrap justify-end gap-2">
            {canDelete ? (
              <button
                type="button"
                onClick={() => void handleDeleteBill()}
                disabled={busy}
                className="ops-btn px-4 py-2.5 text-sm font-semibold"
                style={{ borderColor: "rgba(251, 113, 133, 0.4)", color: "#fda4af" }}
              >
                Delete
              </button>
            ) : null}
            {canEditAdjustments ? (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={busy || !canSaveBill}
                className="ops-btn ops-btn--accent px-5 py-2.5 font-bold"
              >
                Save
              </button>
            ) : null}
            {canSendToTeamLead ? (
              <button
                type="button"
                onClick={() => void handleSendToTeamLead()}
                disabled={busy}
                className="ops-btn ops-btn--accent px-5 py-2.5 font-bold"
              >
                Send to team lead
              </button>
            ) : null}
            {canAcknowledge && !disputing ? (
              <button
                type="button"
                onClick={() => void handleAcknowledge()}
                disabled={busy}
                className="ops-btn ops-btn--accent px-5 py-2.5 font-bold"
              >
                Acknowledge payroll
              </button>
            ) : null}
            {canApproveAfterAck && !disputing ? (
              <>
                <button
                  type="button"
                  onClick={() => setDisputing(true)}
                  disabled={busy}
                  className="ops-btn px-4 py-2.5 text-sm font-bold"
                  style={{ borderColor: "rgba(251, 191, 36, 0.4)", background: "rgba(251, 191, 36, 0.12)", color: "#fcd34d" }}
                >
                  Report issue
                </button>
                <button
                  type="button"
                  onClick={() => void handleApprove()}
                  disabled={busy}
                  className="ops-btn px-5 py-2.5 font-bold"
                  style={{ borderColor: "rgba(52, 211, 153, 0.4)", background: "rgba(52, 211, 153, 0.12)", color: "#6ee7b7" }}
                >
                  Approve
                </button>
              </>
            ) : null}
            {canMarkPaid ? (
              <button
                type="button"
                onClick={() => void handleMarkPaid()}
                disabled={busy || !receiptFile}
                className="ops-btn px-5 py-2.5 font-bold"
                style={{ borderColor: "rgba(52, 211, 153, 0.4)", background: "rgba(52, 211, 153, 0.12)", color: "#6ee7b7" }}
              >
                Mark paid
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
