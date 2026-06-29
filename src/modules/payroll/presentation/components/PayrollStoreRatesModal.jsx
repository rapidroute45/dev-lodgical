import { useEffect, useState } from "react";
import { ModalSheet } from "./ModalSheet.jsx";
import { RateField } from "./RateField.jsx";
import {
  usePayrollStoreRatesQuery,
  useUpdatePayrollStoreRatesMutation,
} from "@/modules/payroll/infrastructure/api/payroll.queries.js";

export function PayrollStoreRatesModal({ open, storeId, storeName, onClose }) {
  const { data, isLoading } = usePayrollStoreRatesQuery(storeId, open && Boolean(storeId));
  const updateMutation = useUpdatePayrollStoreRatesMutation(storeId ?? "");
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
    <ModalSheet open={open} title={storeName || "Store rates"} onClose={onClose}>
      {isLoading ? (
        <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : (
        <div className="space-y-2">
          {error ? (
            <div className="ops-banner ops-banner--error">
              {error}
            </div>
          ) : null}
          <label
            className="flex items-center justify-between rounded-xl px-3 py-3"
            style={{ border: "1px solid var(--border)" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>Use default rates</span>
            <input
              type="checkbox"
              checked={useDefaults}
              onChange={(e) => handleToggleDefaults(e.target.checked)}
              className="h-4 w-4 rounded"
              style={{ accentColor: "var(--accent)" }}
            />
          </label>
          <RateField label="Small route rate" value={small} onChange={setSmall} readOnly={useDefaults} />
          <RateField label="Medium route rate" value={medium} onChange={setMedium} readOnly={useDefaults} />
          <RateField label="Full route rate" value={full} onChange={setFull} readOnly={useDefaults} />
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={updateMutation.isPending}
            className="ops-btn ops-btn--accent mt-2 w-full justify-center py-3 font-bold"
          >
            {updateMutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </ModalSheet>
  );
}
