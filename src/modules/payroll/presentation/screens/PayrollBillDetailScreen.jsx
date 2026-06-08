import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OPS_ROLES, UserRole } from "@/shared/utils/constants.js";
import { formatDisplayDate, formatTimestamp } from "@/shared/utils/time.js";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
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

const ROUTE_CATEGORIES = ["SMALL", "MEDIUM", "FULL"];

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

  const { data: bill, isLoading, isError } = usePayrollBillQuery(billId);
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
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const isTeamLead = user?.role === UserRole.TEAM_LEAD;
  const isOps = OPS_ROLES.includes(user?.role);

  const canEditAdjustments =
    isOps && (bill?.status === "draft" || bill?.status === "team_lead_disputed");

  const { data: payrollSettings } = usePayrollSettingsQuery(canEditAdjustments);
  const canTeamLeadReview = isTeamLead && bill?.status === "pending_team_lead";
  const canAcknowledge = canTeamLeadReview && !bill?.teamLeadAcknowledgedAt;
  const canApproveAfterAck = canTeamLeadReview && Boolean(bill?.teamLeadAcknowledgedAt);
  const canMarkPaid = isOps && bill?.status === "team_lead_approved";
  const canDelete =
    isOps && (bill?.status === "draft" || bill?.status === "team_lead_disputed");
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
      await updateMutation.mutateAsync({ id: billId, ...buildUpdatePayload() });
      setMessage("Payroll bill saved");
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
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div className="flex items-center gap-3">
          <Link to="/payroll" className="text-sm font-semibold text-dispatch-primary hover:underline">
            ← Payroll
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dispatch-text">Payroll bill</h1>
            {bill ? (
              <p className="text-sm text-dispatch-muted">{bill.teamName}</p>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );

  if (isLoading) {
    return (
      <DashboardLayout topBar={topBar}>
        <p className="text-sm text-dispatch-muted">Loading bill…</p>
      </DashboardLayout>
    );
  }

  if (isError || !bill) {
    return (
      <DashboardLayout topBar={topBar}>
        <p className="text-sm text-red-600">Could not load this payroll bill.</p>
      </DashboardLayout>
    );
  }

  const meta = statusMeta(bill.status);
  const receiptUri = payrollReceiptUrl(bill.paymentReceiptUrl);

  return (
    <DashboardLayout topBar={topBar}>
      <div className={`${PAGE_CONTENT} pb-28`}>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold text-dispatch-muted">
              {formatPeriodRange(bill.periodStart, bill.periodEnd)}
            </p>
            <span className={`rounded-lg px-2 py-1 text-xs font-bold ${meta.className}`}>
              {meta.label}
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-dispatch-text">
            {bill.teamName}
            {bill.teamNumber ? ` · #${bill.teamNumber}` : ""}
          </p>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-sm font-semibold text-dispatch-muted">Total payable</span>
            <span className="text-3xl font-extrabold text-dispatch-primary">{formatMoney(grandTotal)}</span>
          </div>
          <p className="mt-2 text-xs text-dispatch-muted">
            {categoryRatesSummary
              ? `${categoryRatesSummary} per route · `
              : `$${canEditAdjustments ? effectiveRate : bill.standardRate} per completed route · `}
            {visibleLineItems.length} driver{visibleLineItems.length === 1 ? "" : "s"}
          </p>
        </div>

        {canEditAdjustments ? (
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
            <p className="text-sm font-bold text-dispatch-text">Edit bill</p>
            <p className="mt-3 text-xs font-semibold text-dispatch-muted">Rates per route ($)</p>
            <div className="mt-1 divide-y divide-dispatch-border rounded-xl border border-dispatch-border">
              {categoryRateRows.map((row) => (
                <div key={row.category} className="flex items-center justify-between px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-dispatch-text">{row.label}</p>
                    <p className="text-xs text-dispatch-muted">
                      {row.count > 0
                        ? `${row.count} route${row.count === 1 ? "" : "s"} on bill`
                        : "Default rate"}
                    </p>
                  </div>
                  <p className="text-base font-extrabold text-emerald-600">${row.rate}</p>
                </div>
              ))}
            </div>
            <label className="mt-4 block text-xs font-semibold text-dispatch-muted">Flat override ($)</label>
            <p className="mb-1 text-xs text-dispatch-muted">
              Optional — applies the same rate to all routes when saved
            </p>
            <input
              type="number"
              value={standardRateDraft}
              onChange={(e) => setStandardRateDraft(e.target.value)}
              className="w-full rounded-xl border border-dispatch-border px-3 py-2 text-sm"
            />
            <label className="mt-3 block text-xs font-semibold text-dispatch-muted">Internal note</label>
            <textarea
              value={opsNote}
              onChange={(e) => setOpsNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-dispatch-border px-3 py-2 text-sm"
              placeholder="Optional note for ops"
            />
          </div>
        ) : bill.note ? (
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
            <p className="text-sm font-bold text-dispatch-text">Ops note</p>
            <p className="mt-2 text-sm text-dispatch-muted">{bill.note}</p>
          </div>
        ) : null}

        {bill.status === "team_lead_disputed" && bill.teamLeadNote ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-800">Team lead note</p>
            <p className="mt-1 text-sm text-red-700">{bill.teamLeadNote}</p>
          </div>
        ) : null}

        {bill.status === "paid" && receiptUri ? (
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
            <p className="text-sm text-dispatch-muted">
              Paid{bill.paidByName ? ` by ${bill.paidByName}` : ""}
              {bill.paidAt ? ` · ${formatTimestamp(bill.paidAt)}` : ""}
            </p>
            <img src={receiptUri} alt="Payment receipt" className="mt-3 max-h-64 rounded-lg border" />
          </div>
        ) : null}

        {visibleLineItems.length === 0 ? (
          <p className="text-sm text-dispatch-muted">No routes on this bill.</p>
        ) : (
          visibleLineItems.map((line) => {
            const d = draft[line.driverId];
            const bonus = d ? num(d.bonus) : line.bonus;
            const deduction = d ? num(d.deduction) : line.deduction;
            const overtime = d ? num(d.overtime) : line.overtime;
            const lineTotal = line.basePay + bonus + overtime - deduction;
            const isOpen = expanded.has(line.driverId);

            return (
              <div key={line.driverId} className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-dispatch-text">{line.driverName}</p>
                    <p className="text-xs text-dispatch-muted">
                      {line.routes.length} route{line.routes.length === 1 ? "" : "s"} ·{" "}
                      {formatMoney(line.basePay)} base
                    </p>
                  </div>
                  <p className="text-lg font-extrabold text-dispatch-primary">{formatMoney(lineTotal)}</p>
                </div>

                {showAdjustments ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {["bonus", "deduction", "overtime"].map((field) => (
                      <div key={field}>
                        <label className="text-[10px] font-semibold capitalize text-dispatch-muted">
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
                            className="mt-1 w-full rounded-lg border border-dispatch-border px-2 py-1.5 text-sm"
                          />
                        ) : (
                          <p className="mt-1 text-sm font-semibold">
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
                  className="mt-3 text-xs font-semibold text-dispatch-primary"
                >
                  {isOpen ? "Hide" : "View"} route details {isOpen ? "▲" : "▼"}
                </button>

                {isOpen
                  ? line.routes.map((r) => (
                      <div
                        key={r.routeId}
                        className="mt-2 flex items-center justify-between border-t border-dispatch-border pt-2 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-dispatch-text">
                            {r.routeName || "Route"}
                            {r.location ? ` · ${r.location}` : ""}
                          </p>
                          <p className="text-xs text-dispatch-muted">
                            {formatDisplayDate(r.scheduleDate)}
                            {r.routeCategory
                              ? ` · ${ROUTE_CATEGORY_LABELS[r.routeCategory.toUpperCase()] ?? r.routeCategory}`
                              : ""}
                            {r.rate != null ? ` · ${formatMoney(r.rate)}` : ""}
                          </p>
                        </div>
                        {canEditAdjustments ? (
                          <button
                            type="button"
                            onClick={() =>
                              setRemovedRouteIds((prev) => new Set([...prev, r.routeId]))
                            }
                            className="text-xs font-semibold text-red-600"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    ))
                  : null}
              </div>
            );
          })
        )}

        {canMarkPaid ? (
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
            <p className="text-sm font-bold text-dispatch-text">Payment receipt</p>
            <input type="file" accept="image/*" onChange={handleReceiptPick} className="mt-2 text-sm" />
            {receiptPreview ? (
              <img src={receiptPreview} alt="Receipt preview" className="mt-3 max-h-48 rounded-lg border" />
            ) : null}
          </div>
        ) : null}

        {disputing ? (
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
            <label className="text-sm font-bold text-dispatch-text">Describe the issue</label>
            <textarea
              value={disputeNote}
              onChange={(e) => setDisputeNote(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-dispatch-border px-3 py-2 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setDisputing(false)}
                className="rounded-xl border border-dispatch-border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDispute()}
                disabled={busy}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                Send to dispatch
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {canSendToTeamLead || canAcknowledge || canApproveAfterAck || canEditAdjustments || canDelete || canMarkPaid ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-dispatch-border bg-dispatch-surface/95 px-4 py-3 backdrop-blur-md lg:left-64">
          <div className="mx-auto flex max-w-4xl flex-wrap justify-end gap-2">
            {canDelete ? (
              <button
                type="button"
                onClick={() => void handleDeleteBill()}
                disabled={busy}
                className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-60"
              >
                Delete
              </button>
            ) : null}
            {canEditAdjustments ? (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={busy || !hasChanges}
                className="rounded-xl border border-dispatch-primary px-4 py-2.5 text-sm font-bold text-dispatch-primary disabled:opacity-60"
              >
                Save
              </button>
            ) : null}
            {canSendToTeamLead ? (
              <button
                type="button"
                onClick={() => void handleSendToTeamLead()}
                disabled={busy}
                className="rounded-xl bg-dispatch-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                Send to team lead
              </button>
            ) : null}
            {canAcknowledge && !disputing ? (
              <button
                type="button"
                onClick={() => void handleAcknowledge()}
                disabled={busy}
                className="rounded-xl bg-dispatch-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
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
                  className="rounded-xl border border-amber-400 px-4 py-2.5 text-sm font-bold text-amber-700 disabled:opacity-60"
                >
                  Report issue
                </button>
                <button
                  type="button"
                  onClick={() => void handleApprove()}
                  disabled={busy}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
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
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
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
