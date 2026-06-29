import { useEffect, useState } from "react";
import { ModalSheet } from "./ModalSheet.jsx";
import { RateField } from "./RateField.jsx";
import {
  useStoreBillingSettingsQuery,
  useUpdateStoreBillingSettingsMutation,
} from "@/modules/payroll/infrastructure/api/payroll.queries.js";

export function StoreBillingSettingsModal({ open, onClose }) {
  const { data, isLoading } = useStoreBillingSettingsQuery(open);
  const updateMutation = useUpdateStoreBillingSettingsMutation();
  const [small, setSmall] = useState("200");
  const [medium, setMedium] = useState("300");
  const [full, setFull] = useState("400");
  const [overtimeRate, setOvertimeRate] = useState("30");
  const [weeklyIncentive, setWeeklyIncentive] = useState("0");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !data) return;
    setSmall(String(Math.round(data.smallRouteRate)));
    setMedium(String(Math.round(data.mediumRouteRate)));
    setFull(String(Math.round(data.fullRouteRate)));
    setOvertimeRate(String(Math.round(data.overtimeHourlyRate ?? 30)));
    setWeeklyIncentive(String(Math.round(data.weeklyPerformanceIncentive ?? 0)));
    setError(null);
  }, [open, data]);

  async function handleSave() {
    setError(null);
    try {
      await updateMutation.mutateAsync({
        smallRouteRate: Number(small),
        mediumRouteRate: Number(medium),
        fullRouteRate: Number(full),
        overtimeHourlyRate: Number(overtimeRate),
        weeklyPerformanceIncentive: Number(weeklyIncentive),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Could not save rates");
    }
  }

  return (
    <ModalSheet open={open} title="Default store rates" onClose={onClose}>
      {isLoading ? (
        <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Default Small, Medium, and Full billing rates. Stores can override from payroll detail.
          </p>
          {error ? (
            <div className="ops-banner ops-banner--error">
              {error}
            </div>
          ) : null}
          <RateField label="Small route rate" value={small} onChange={setSmall} />
          <RateField label="Medium route rate" value={medium} onChange={setMedium} />
          <RateField label="Full route rate" value={full} onChange={setFull} />
          <RateField label="Overtime hourly rate" value={overtimeRate} onChange={setOvertimeRate} />
          <RateField
            label="Weekly performance incentive (per route)"
            value={weeklyIncentive}
            onChange={setWeeklyIncentive}
          />
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={updateMutation.isPending}
            className="ops-btn ops-btn--accent mt-2 w-full justify-center py-3 font-bold"
          >
            {updateMutation.isPending ? "Saving…" : "Save rates"}
          </button>
        </div>
      )}
    </ModalSheet>
  );
}
