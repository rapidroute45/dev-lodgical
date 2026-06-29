import { useEffect, useMemo, useRef, useState } from "react";
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
  let s = String(raw).replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
  if (!s) return "";

  const [intPartRaw, ...decimalParts] = s.split(".");
  const intPart = intPartRaw.replace(/^0+(?=\d)/, "") || (decimalParts.length ? "0" : "");
  if (decimalParts.length === 0) return intPart;
  return `${intPart}.${decimalParts.join("")}`;
}

function MoneyField({ label, value, onChange }) {
  function handleFocus(event) {
    if (value === "0") {
      onChange("");
      event.target.select();
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
        {label}
      </label>
      <div
        className="flex items-center rounded-xl px-3 py-2.5"
        style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)" }}
      >
        <span className="mr-2 font-bold" style={{ color: "var(--green)" }}>$</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(parseDecimal(e.target.value))}
          onFocus={handleFocus}
          placeholder="0"
          className="w-full border-0 bg-transparent text-sm font-semibold outline-none"
          style={{ color: "var(--text)" }}
        />
      </div>
    </div>
  );
}

function StoreMultiSelect({ stores, selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const storeById = useMemo(
    () => new Map(stores.map((store) => [store.id, store])),
    [stores]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(
      (store) =>
        store.storeName?.toLowerCase().includes(q) ||
        store.storeId?.toLowerCase().includes(q) ||
        store.city?.toLowerCase().includes(q)
    );
  }, [stores, query]);

  const selectedStores = useMemo(
    () => selectedIds.map((id) => storeById.get(id)).filter(Boolean),
    [selectedIds, storeById]
  );

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function toggleStore(id) {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  function removeStore(id) {
    onChange(selectedIds.filter((item) => item !== id));
  }

  const triggerLabel =
    selectedStores.length === 0
      ? "Select stores"
      : selectedStores.length === 1
        ? selectedStores[0].storeName
        : `${selectedStores.length} stores selected`;

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
        Stores
      </label>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ops-field flex w-full items-center justify-between text-sm"
        style={{ color: selectedStores.length ? "var(--text)" : "var(--text-muted)" }}
        aria-expanded={open}
      >
        <span className="truncate">{triggerLabel}</span>
        <span style={{ color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {selectedStores.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedStores.map((store) => (
            <span
              key={store.id}
              className="inline-flex max-w-full items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              <span className="truncate">{store.storeName}</span>
              <button
                type="button"
                onClick={() => removeStore(store.id)}
                className="shrink-0 rounded p-0.5 leading-none"
                style={{ color: "var(--text-muted)" }}
                aria-label={`Remove ${store.storeName}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {open ? (
        <div
          className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl shadow-lg"
          style={{
            border: "1px solid var(--border-strong)",
            background: "var(--bg-card-solid)",
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <svg
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--text-muted)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stores…"
              className="w-full border-0 bg-transparent text-sm outline-none"
              style={{ color: "var(--text)" }}
              autoFocus
            />
          </div>

          <ul className="max-h-48 overflow-y-auto py-1">
            {stores.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No stores available
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No stores match your search
              </li>
            ) : (
              filtered.map((store) => {
                const picked = selectedSet.has(store.id);
                return (
                  <li key={store.id}>
                    <button
                      type="button"
                      onClick={() => toggleStore(store.id)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-white/5"
                      style={{ color: "var(--text)" }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{store.storeName}</span>
                        {(store.city || store.storeId) ? (
                          <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--text-muted)" }}>
                            {[store.storeId, store.city && store.state ? `${store.city}, ${store.state}` : store.city]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        ) : null}
                      </span>
                      {picked ? (
                        <svg
                          className="h-4 w-4 shrink-0"
                          style={{ color: "var(--accent)" }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="h-4 w-4 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function StoreInvoiceModal({ open, onClose, periodStart, periodEnd, search, city, stores = [] }) {
  const { data: billTos = [] } = useInvoiceBillTosQuery(open);
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const [billToName, setBillToName] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [showBillToPicker, setShowBillToPicker] = useState(false);
  const [weeklyIncentive, setWeeklyIncentive] = useState("");
  const [ruralAmount, setRuralAmount] = useState("");
  const [overtimeAmount, setOvertimeAmount] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const incentiveDefaultsAppliedRef = useRef(false);

  const storeIdsParam = useMemo(
    () => selectedStoreIds.join(","),
    [selectedStoreIds]
  );

  const previewParams = useMemo(
    () => ({
      periodStart,
      periodEnd,
      search,
      city,
      storeIds: storeIdsParam || undefined,
      billToName: billToName.trim(),
      billToAddress: billToAddress.trim(),
      weeklyPerformanceIncentiveRate: Number(weeklyIncentive) || 0,
      ruralAmount: Number(ruralAmount) || 0,
      overtimeAmount: Number(overtimeAmount) || 0,
    }),
    [
      periodStart,
      periodEnd,
      search,
      city,
      storeIdsParam,
      billToName,
      billToAddress,
      weeklyIncentive,
      ruralAmount,
      overtimeAmount,
    ]
  );

  const canPreview =
    selectedStoreIds.length > 0 && Boolean(billToName.trim() && billToAddress.trim());
  const { data: preview, isLoading: previewLoading, isFetching } = useStoreInvoicePreviewQuery(
    previewParams,
    open && canPreview
  );
  const generateMutation = useGenerateStoreInvoiceMutation();

  useEffect(() => {
    if (!open) {
      setSelectedStoreIds([]);
      setBillToName("");
      setBillToAddress("");
      setWeeklyIncentive("");
      setRuralAmount("");
      setOvertimeAmount("");
      setShowBillToPicker(false);
      setError(null);
      incentiveDefaultsAppliedRef.current = false;
      return;
    }

    if (incentiveDefaultsAppliedRef.current) return;
    if (preview?.defaults?.weeklyPerformanceIncentive === undefined) return;

    const defaultIncentive = Math.round(preview.defaults.weeklyPerformanceIncentive);
    setWeeklyIncentive(defaultIncentive > 0 ? String(defaultIncentive) : "");
    incentiveDefaultsAppliedRef.current = true;
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
    if (selectedStoreIds.length === 0) {
      setError("Select at least one store for this invoice");
      return;
    }
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
        storeIds: selectedStoreIds,
        billToName: billToName.trim(),
        billToAddress: billToAddress.trim(),
        weeklyPerformanceIncentiveRate: Number(weeklyIncentive) || 0,
        ruralAmount: Number(ruralAmount) || 0,
        overtimeAmount: Number(overtimeAmount) || 0,
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

  const selectedCount = selectedStoreIds.length;

  return (
    <ModalSheet open={open} title="Generate invoice" onClose={onClose} wide>
      <div className="space-y-3">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Lead time: {leadTime} ({formatDisplayDate(periodStart)} – {formatDisplayDate(periodEnd)})
        </p>
        {error ? (
          <div className="ops-banner ops-banner--error">
            {error}
          </div>
        ) : null}

        <StoreMultiSelect
          stores={stores}
          selectedIds={selectedStoreIds}
          onChange={setSelectedStoreIds}
        />

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Bill to</label>
          <button
            type="button"
            onClick={() => setShowBillToPicker((v) => !v)}
            className="ops-field flex w-full items-center justify-between text-sm"
            style={{ color: "var(--text)" }}
          >
            <span className="truncate">{billToName || "Select saved bill-to or type below"}</span>
            <span style={{ color: "var(--text-muted)" }}>{showBillToPicker ? "▲" : "▼"}</span>
          </button>
          {showBillToPicker ? (
            <div className="mt-1 overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
              {billTos.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>No saved bill-tos yet</p>
              ) : (
                billTos.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectBillTo(item.name, item.address)}
                    className="ops-row block w-full px-3 py-2.5 text-left"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.name}</p>
                    <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{item.address}</p>
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
          className="w-full rounded-xl px-3 py-2.5 text-sm"
          style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
        <textarea
          value={billToAddress}
          onChange={(e) => setBillToAddress(e.target.value)}
          placeholder="Address"
          rows={3}
          className="w-full rounded-xl px-3 py-2.5 text-sm"
          style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", color: "var(--text)" }}
        />

        <MoneyField
          label="Weekly performance incentive (per route)"
          value={weeklyIncentive}
          onChange={setWeeklyIncentive}
        />

        <MoneyField label="Rural" value={ruralAmount} onChange={setRuralAmount} />

        <MoneyField label="OT" value={overtimeAmount} onChange={setOvertimeAmount} />

        {canPreview ? (
          <div className="rounded-xl p-3" style={{ border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.02)" }}>
            {previewLoading ? (
              <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading preview…</p>
            ) : (
              <>
                <p className="mb-2 text-sm font-bold" style={{ color: "var(--text)" }}>Route base pay</p>
                {(preview?.storeLines ?? []).length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No completed routes for the selected stores in this period.</p>
                ) : (
                  (preview?.storeLines ?? []).map((store) => (
                    <div key={store.storeId} className="mb-2 rounded-lg p-3" style={{ border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.03)" }}>
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {store.storeName} · {store.routeCount} route{store.routeCount === 1 ? "" : "s"}
                      </p>
                      {store.categories.map((cat) => (
                        <p key={cat.category} className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {cat.label}: {cat.count} × {formatMoney(cat.routeBase)} = {formatMoney(cat.total)}
                        </p>
                      ))}
                      {store.hoursSpent > 0 ? (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Time on routes: {Number(store.hoursSpent).toFixed(2)}h
                        </p>
                      ) : (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Time on routes: — (routes need start &amp; complete timestamps)
                        </p>
                      )}
                    </div>
                  ))
                )}
                {preview ? (
                  <>
                    {preview.totalHoursSpent > 0 ? (
                      <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        Total time on routes: {Number(preview.totalHoursSpent).toFixed(2)}h
                      </p>
                    ) : (
                      <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        Total time on routes: — (no completed routes with start/finish times in this period)
                      </p>
                    )}
                    {Number(preview.overtimeAmount) > 0 ? (
                      <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        OT: {formatMoney(preview.overtimeAmount)}
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                      <span className="text-sm font-bold" style={{ color: "var(--text)" }}>Invoice total</span>
                      <span className="text-base font-extrabold" style={{ color: "var(--green)" }}>
                        {formatMoney(preview.total)}
                        {isFetching ? " …" : ""}
                      </span>
                    </div>
                  </>
                ) : null}
              </>
            )}
          </div>
        ) : selectedCount > 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Enter bill-to name and address to preview this invoice.
          </p>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Select one or more stores to build the invoice.
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void runInvoiceAction("preview")}
            disabled={Boolean(busy) || !canPreview}
            className="ops-btn flex-1 justify-center py-3 font-bold disabled:opacity-50"
          >
            {busy === "preview" ? "Opening…" : "Preview invoice"}
          </button>
          <button
            type="button"
            onClick={() => void runInvoiceAction("generate")}
            disabled={Boolean(busy) || !canPreview}
            className="ops-btn ops-btn--accent flex-1 justify-center py-3 font-bold disabled:opacity-50"
          >
            {busy === "generate" ? "Generating…" : "Generate invoice"}
          </button>
        </div>
      </div>
    </ModalSheet>
  );
}
