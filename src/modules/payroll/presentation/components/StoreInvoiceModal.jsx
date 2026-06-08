import { useEffect, useMemo, useState } from "react";
import { ModalSheet } from "./ModalSheet.jsx";
import { formatDisplayDate } from "@/shared/utils/time.js";
import { formatMoney } from "@/modules/payroll/utils/format.js";
import { openStoreInvoicePrint } from "@/modules/payroll/utils/generateStoreInvoicePdf.js";
import {
  useGenerateStoreInvoiceMutation,
  useInvoiceBillTosQuery,
  useStoreInvoicePreviewQuery,
} from "@/modules/payroll/infrastructure/api/payroll.queries.js";

function parseDecimal(raw) {
  return String(raw).replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

export function StoreInvoiceModal({ open, onClose, periodStart, periodEnd, search, city }) {
  const { data: billTos = [] } = useInvoiceBillTosQuery(open);
  const [billToName, setBillToName] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [showBillToPicker, setShowBillToPicker] = useState(false);
  const [weeklyIncentive, setWeeklyIncentive] = useState("0");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const previewParams = useMemo(
    () => ({
      periodStart,
      periodEnd,
      search,
      city,
      billToName: billToName.trim(),
      billToAddress: billToAddress.trim(),
      weeklyPerformanceIncentiveRate: Number(weeklyIncentive) || 0,
    }),
    [periodStart, periodEnd, search, city, billToName, billToAddress, weeklyIncentive]
  );

  const canPreview = Boolean(billToName.trim() && billToAddress.trim());
  const { data: preview, isLoading: previewLoading, isFetching } = useStoreInvoicePreviewQuery(
    previewParams,
    open && canPreview
  );
  const generateMutation = useGenerateStoreInvoiceMutation();

  useEffect(() => {
    if (!open) {
      setBillToName("");
      setBillToAddress("");
      setWeeklyIncentive("0");
      setShowBillToPicker(false);
      setError(null);
      return;
    }
    if (preview?.defaults?.weeklyPerformanceIncentive !== undefined) {
      setWeeklyIncentive(String(Math.round(preview.defaults.weeklyPerformanceIncentive)));
    }
  }, [open, preview?.defaults?.weeklyPerformanceIncentive]);

  const leadTime =
    preview?.leadTime ??
    `${formatDisplayDate(periodStart).replace(/^0/, "").replace(/, \d{4}$/, "")}`;

  function selectBillTo(name, address) {
    setBillToName(name);
    setBillToAddress(address);
    setShowBillToPicker(false);
  }

  async function runInvoiceAction(mode) {
    if (!billToName.trim() || !billToAddress.trim()) {
      setError("Bill-to name and address are required");
      return;
    }
    setError(null);
    setBusy(mode);
    try {
      const payload = {
        periodStart,
        periodEnd,
        search,
        city,
        billToName: billToName.trim(),
        billToAddress: billToAddress.trim(),
        weeklyPerformanceIncentiveRate: Number(weeklyIncentive) || 0,
      };
      if (mode === "preview") {
        if (!preview) {
          setError("Loading invoice preview…");
          return;
        }
        openStoreInvoicePrint(preview);
        return;
      }
      const invoice = await generateMutation.mutateAsync(payload);
      openStoreInvoicePrint(invoice);
      onClose();
    } catch (err) {
      setError(err.message || "Could not build invoice");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ModalSheet open={open} title="Generate invoice" onClose={onClose} wide>
      <div className="space-y-3">
        <p className="text-sm text-dispatch-muted">
          Lead time: {leadTime} ({formatDisplayDate(periodStart)} – {formatDisplayDate(periodEnd)})
        </p>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-[11px] font-semibold text-dispatch-muted">Bill to</label>
          <button
            type="button"
            onClick={() => setShowBillToPicker((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-dispatch-border bg-[#FAFBFC] px-3 py-2.5 text-sm"
          >
            <span className="truncate">{billToName || "Select saved bill-to or type below"}</span>
            <span className="text-dispatch-muted">{showBillToPicker ? "▲" : "▼"}</span>
          </button>
          {showBillToPicker ? (
            <div className="mt-1 overflow-hidden rounded-xl border border-dispatch-border">
              {billTos.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-dispatch-muted">No saved bill-tos yet</p>
              ) : (
                billTos.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectBillTo(item.name, item.address)}
                    className="block w-full border-b border-dispatch-border px-3 py-2.5 text-left last:border-0 hover:bg-dispatch-bg"
                  >
                    <p className="text-sm font-semibold text-dispatch-text">{item.name}</p>
                    <p className="truncate text-xs text-dispatch-muted">{item.address}</p>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <input
          type="text"
          value={billToName}
          onChange={(e) => setBillToName(e.target.value)}
          placeholder="Bill-to name"
          className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm"
        />
        <textarea
          value={billToAddress}
          onChange={(e) => setBillToAddress(e.target.value)}
          placeholder="Address"
          rows={3}
          className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm"
        />

        <div>
          <label className="mb-1 block text-[11px] font-semibold text-dispatch-muted">
            Weekly performance incentive (per route)
          </label>
          <div className="flex items-center rounded-xl border border-dispatch-border px-3 py-2.5">
            <span className="mr-2 font-bold text-emerald-600">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={weeklyIncentive}
              onChange={(e) => setWeeklyIncentive(parseDecimal(e.target.value))}
              className="w-full border-0 bg-transparent text-sm font-semibold outline-none"
            />
          </div>
        </div>

        {canPreview ? (
          <div className="rounded-xl border border-dispatch-border bg-dispatch-bg p-3">
            {previewLoading ? (
              <p className="text-center text-sm text-dispatch-muted">Loading preview…</p>
            ) : (
              <>
                <p className="mb-2 text-sm font-bold text-dispatch-text">Route base pay by store</p>
                {(preview?.storeLines ?? []).length === 0 ? (
                  <p className="text-sm text-dispatch-muted">No completed routes in this period.</p>
                ) : (
                  (preview?.storeLines ?? []).map((store) => (
                    <div key={store.storeId} className="mb-2 rounded-lg border border-dispatch-border bg-dispatch-surface p-3">
                      <p className="text-sm font-semibold text-dispatch-text">
                        {store.storeName} · {store.routeCount} route{store.routeCount === 1 ? "" : "s"}
                      </p>
                      {store.categories.map((cat) => (
                        <p key={cat.category} className="text-xs text-dispatch-muted">
                          {cat.label}: {cat.count} × {formatMoney(cat.routeBase)} = {formatMoney(cat.total)}
                        </p>
                      ))}
                      {store.overtimeHours > 0 ? (
                        <p className="text-xs text-dispatch-muted">
                          Overtime: {store.overtimeHours}h × {formatMoney(store.overtimeHourlyRate)} ={" "}
                          {formatMoney(store.overtimeTotal)}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
                {preview ? (
                  <div className="mt-2 flex items-center justify-between border-t border-dispatch-border pt-2">
                    <span className="text-sm font-bold text-dispatch-text">Invoice total</span>
                    <span className="text-base font-extrabold text-emerald-600">
                      {formatMoney(preview.total)}
                      {isFetching ? " …" : ""}
                    </span>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void runInvoiceAction("preview")}
            disabled={Boolean(busy)}
            className="flex-1 rounded-xl border border-dispatch-primary py-3 text-sm font-bold text-dispatch-primary disabled:opacity-60"
          >
            {busy === "preview" ? "Opening…" : "Preview invoice"}
          </button>
          <button
            type="button"
            onClick={() => void runInvoiceAction("generate")}
            disabled={Boolean(busy)}
            className="flex-1 rounded-xl bg-dispatch-primary py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy === "generate" ? "Generating…" : "Generate invoice"}
          </button>
        </div>
      </div>
    </ModalSheet>
  );
}
