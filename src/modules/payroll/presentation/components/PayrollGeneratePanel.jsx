import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTeamsQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import {
  isoDateDaysAgo,
  maxPayrollPeriodEndIso,
  todayIsoDate,
} from "@/shared/utils/time.js";
import {
  useGeneratePayrollMutation,
  usePayrollPreviewQuery,
} from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import { PayrollPreviewDetailModal } from "./PayrollPreviewDetailModal.jsx";

export function PayrollGeneratePanel() {
  const navigate = useNavigate();
  const { data: teams = [] } = useTeamsQuery();
  const [teamId, setTeamId] = useState("");
  const [periodStart, setPeriodStart] = useState(isoDateDaysAgo(6));
  const [periodEnd, setPeriodEnd] = useState(todayIsoDate());
  const [previewRequested, setPreviewRequested] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const selectedTeam = useMemo(() => teams.find((t) => t.id === teamId) ?? null, [teams, teamId]);

  const previewEnabled = Boolean(teamId && periodStart && periodEnd && previewRequested);
  const { data: preview, isLoading: previewLoading, isFetching: previewFetching, refetch } =
    usePayrollPreviewQuery({ teamId, periodStart, periodEnd }, previewEnabled);
  const generateMutation = useGeneratePayrollMutation();

  function handlePreview() {
    setError(null);
    if (!teamId) {
      setError("Select a team first");
      return;
    }
    if (periodEnd < periodStart) {
      setError("End date must be on or after start date");
      return;
    }
    if (periodEnd > maxPayrollPeriodEndIso()) {
      setError("End date cannot be in the future");
      return;
    }
    setPreviewRequested(true);
    setPreviewModalOpen(true);
    void refetch();
  }

  async function handleGenerate() {
    setError(null);
    if (!teamId) return;
    if (periodEnd < periodStart || periodEnd > maxPayrollPeriodEndIso()) {
      setError("Check the date range");
      return;
    }
    try {
      const bill = await generateMutation.mutateAsync({ teamId, periodStart, periodEnd });
      navigate(`/payroll/${bill.id}`);
    } catch (err) {
      setError(err.message || "Could not generate payroll");
    }
  }

  return (
    <div className="ops-panel ops-fade p-5">
      <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Generate payroll</h3>
      {error ? (
        <div className="ops-banner ops-banner--error mt-2">{error}</div>
      ) : null}
      <p className="mt-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Team</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {teams.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTeamId(t.id);
              setPreviewRequested(false);
              setPreviewModalOpen(false);
            }}
            className={`ops-chip ${teamId === t.id ? "ops-chip--active" : ""}`}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label>
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Start</span>
          <input
            type="date"
            value={periodStart}
            min={isoDateDaysAgo(730)}
            onChange={(e) => {
              setPeriodStart(e.target.value);
              if (periodEnd < e.target.value) setPeriodEnd(e.target.value);
              setPreviewRequested(false);
              setPreviewModalOpen(false);
            }}
            className="mt-1 w-full rounded-xl px-2 py-2 text-sm"
            style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", color: "var(--text)", colorScheme: "dark" }}
          />
        </label>
        <label>
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>End</span>
          <input
            type="date"
            value={periodEnd}
            min={periodStart}
            max={maxPayrollPeriodEndIso()}
            onChange={(e) => {
              setPeriodEnd(e.target.value);
              setPreviewRequested(false);
              setPreviewModalOpen(false);
            }}
            className="mt-1 w-full rounded-xl px-2 py-2 text-sm"
            style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", color: "var(--text)", colorScheme: "dark" }}
          />
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handlePreview}
          className="ops-btn flex-1 justify-center py-2.5 font-bold"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={generateMutation.isPending || !teamId}
          className="ops-btn ops-btn--accent flex-1 justify-center py-2.5 font-bold"
        >
          {generateMutation.isPending ? "Generating…" : "Generate payroll"}
        </button>
      </div>
      <PayrollPreviewDetailModal
        open={previewModalOpen}
        preview={preview ?? null}
        teamLabel={selectedTeam?.name ?? preview?.teamName}
        loading={previewModalOpen && previewEnabled && (previewLoading || previewFetching) && !preview}
        onClose={() => setPreviewModalOpen(false)}
      />
    </div>
  );
}
