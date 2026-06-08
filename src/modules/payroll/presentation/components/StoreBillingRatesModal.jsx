import { useEffect, useState } from "react";
import { ModalSheet } from "./ModalSheet.jsx";
import { RateField } from "./RateField.jsx";
import {
  useStoreBillingRatesQuery,
  useUpdateStoreBillingRatesMutation,
} from "@/modules/payroll/infrastructure/api/payroll.queries.js";

export function StoreBillingRatesModal({ open, storeId, storeName, onClose }) {
  const { data, isLoading } = useStoreBillingRatesQuery(storeId, open && Boolean(storeId));
  const updateMutation = useUpdateStoreBillingRatesMutation(storeId ?? "");
  const [useDefaults, setUseDefaults] = useState(true);
  const [small, setSmall] = useState("200");
  const [medium, setMedium] = useState("300");
  const [full, setFull] = useState("400");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !data) return;
    setUseDefaults(!data.usesCustomRates);
    const source = data.usesCustomRates ? data.customRates ?? data : data;
    setSmall(String(Math.round(source.smallRouteRate)));
    setMedium(String(Math.round(source.mediumRouteRate)));
    setFull(String(Math.round(source.fullRouteRate)));
    setError(null);
  }, [open, data]);

  function handleToggleDefaults(next) {
    setUseDefaults(next);
    if (next && data) {
      setSmall(String(Math.round(data.defaultRates.smallRouteRate)));
      setMedium(String(Math.round(data.defaultRates.mediumRouteRate)));
      setFull(String(Math.round(data.defaultRates.fullRouteRate)));
    }
  }

  async function handleSave() {
    if (!storeId) return;
    setError(null);
    try {
      if (useDefaults) {
        await updateMutation.mutateAsync({ useDefaultRates: true });
      } else {
        await updateMutation.mutateAsync({
          smallRouteRate: Number(small),
          mediumRouteRate: Number(medium),
          fullRouteRate: Number(full),
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || "Could not save rates");
    }
  }

  return (
    <ModalSheet open={open} title={`${storeName} billing rates`} onClose={onClose}>
      {isLoading ? (
        <p className="py-8 text-center text-sm text-dispatch-muted">Loading…</p>
      ) : (
        <div className="space-y-2">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <label className="flex items-center justify-between rounded-xl border border-dispatch-border px-3 py-3">
            <span className="text-sm font-medium text-dispatch-text">Use default rates</span>
            <input
              type="checkbox"
              checked={useDefaults}
              onChange={(e) => handleToggleDefaults(e.target.checked)}
              className="h-4 w-4 rounded border-dispatch-border text-dispatch-primary"
            />
          </label>
          <RateField label="Small route rate" value={small} onChange={setSmall} readOnly={useDefaults} />
          <RateField label="Medium route rate" value={medium} onChange={setMedium} readOnly={useDefaults} />
          <RateField label="Full route rate" value={full} onChange={setFull} readOnly={useDefaults} />
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={updateMutation.isPending}
            className="mt-2 w-full rounded-xl bg-dispatch-primary py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {updateMutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </ModalSheet>
  );
}
