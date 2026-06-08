import { useEffect, useState } from "react";
import { ModalSheet } from "./ModalSheet.jsx";
import { RateField } from "./RateField.jsx";
import { PayrollStoreRatesPickerModal } from "./PayrollStoreRatesPickerModal.jsx";
import {
  usePayrollSettingsQuery,
  useUpdatePayrollSettingsMutation,
} from "@/modules/payroll/infrastructure/api/payroll.queries.js";

export function PayrollSettingsModal({ open, onClose }) {
  const { data, isLoading } = usePayrollSettingsQuery(open);
  const updateMutation = useUpdatePayrollSettingsMutation();
  const [storeRatesOpen, setStoreRatesOpen] = useState(false);
  const [small, setSmall] = useState("200");
  const [medium, setMedium] = useState("300");
  const [full, setFull] = useState("400");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !data) return;
    setSmall(String(Math.round(data.smallRouteRate)));
    setMedium(String(Math.round(data.mediumRouteRate)));
    setFull(String(Math.round(data.fullRouteRate)));
    setError(null);
  }, [open, data]);

  async function handleSave() {
    setError(null);
    try {
      await updateMutation.mutateAsync({
        smallRouteRate: Number(small),
        mediumRouteRate: Number(medium),
        fullRouteRate: Number(full),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Could not save rates");
    }
  }

  return (
    <>
      <ModalSheet open={open} title="Default driver rates" onClose={onClose}>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-dispatch-muted">Loading…</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-dispatch-muted">
              Default Small, Medium, and Full pay for all stores. Override per store below.
            </p>
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <RateField label="Small route rate" value={small} onChange={setSmall} />
            <RateField label="Medium route rate" value={medium} onChange={setMedium} />
            <RateField label="Full route rate" value={full} onChange={setFull} />
            <button
              type="button"
              onClick={() => setStoreRatesOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-dispatch-border bg-[#FAFBFC] px-3 py-3 text-sm font-semibold text-dispatch-text hover:bg-dispatch-bg"
            >
              Per-store driver rates
              <span className="text-dispatch-muted">→</span>
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={updateMutation.isPending}
              className="mt-2 w-full rounded-xl bg-dispatch-primary py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {updateMutation.isPending ? "Saving…" : "Save rates"}
            </button>
          </div>
        )}
      </ModalSheet>
      <PayrollStoreRatesPickerModal open={storeRatesOpen} onClose={() => setStoreRatesOpen(false)} />
    </>
  );
}
