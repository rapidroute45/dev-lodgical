import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTeamsQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import {
  isoDateDaysAgo,
  todayIsoDate,
} from "@/shared/utils/time.js";
import {
  useGeneratePayrollMutation,
  usePayrollPreviewQuery,
} from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import { fetchPayrollPreview } from "@/modules/payroll/infrastructure/api/payroll.api.js";
import { ModalSheet } from "./ModalSheet.jsx";
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
  const [photoWarningCount, setPhotoWarningCount] = useState(null);
  const [checkingPhotos, setCheckingPhotos] = useState(false);

  const selectedTeam = useMemo(() => teams.find((t) => t.id === teamId) ?? null, [teams, teamId]);

  const previewEnabled = Boolean(teamId && periodStart && periodEnd && previewRequested);
  const { data: preview, isLoading: previewLoading, isFetching: previewFetching, refetch } =
    usePayrollPreviewQuery({ teamId, periodStart, periodEnd }, previewEnabled);
  const generateMutation = useGeneratePayrollMutation();
  const busy = generateMutation.isPending || checkingPhotos;

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
    setPreviewRequested(true);
    setPreviewModalOpen(true);
    void refetch();
  }

  async function runGenerate(start = periodStart, end = periodEnd) {
    setPhotoWarningCount(null);
    try {
      const bill = await generateMutation.mutateAsync({
        teamId,
        periodStart: start,
        periodEnd: end,
      });
      navigate(`/payroll/${bill.id}`);
    } catch (err) {
      setError(err.message || "Could not generate payroll");
    }
  }

  async function handleGenerate(start = periodStart, end = periodEnd) {
    setError(null);
    if (!teamId) {
      setError("Select a team first");
      return;
    }
    if (end < start) {
      setError("Check the date range");
      return;
    }

    setCheckingPhotos(true);
    let missingCount =
      preview &&
      previewRequested &&
      periodStart === start &&
      periodEnd === end
        ? preview.missingReturnPhotoRouteCount ?? 0
        : 0;
    if (!(preview && previewRequested && periodStart === start && periodEnd === end)) {
      try {
        const data = await fetchPayrollPreview({
          teamId,
          periodStart: start,
          periodEnd: end,
        });
        missingCount = data?.missingReturnPhotoRouteCount ?? 0;
      } catch {
        // Continue to generate; generate endpoint will surface real failures.
      }
    }
    setCheckingPhotos(false);

    if (missingCount > 0) {
      setPeriodStart(start);
      setPeriodEnd(end);
      setPhotoWarningCount(missingCount);
      return;
    }

    await runGenerate(start, end);
  }

  async function handleCreateToday() {
    const today = todayIsoDate();
    setPeriodStart(today);
    setPeriodEnd(today);
    setPreviewRequested(false);
    setPreviewModalOpen(false);
    await handleGenerate(today, today);
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
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex gap-2">
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
            disabled={busy || !teamId}
            className="ops-btn ops-btn--accent flex-1 justify-center py-2.5 font-bold"
          >
            {busy ? "Generating…" : "Generate payroll"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => void handleCreateToday()}
          disabled={busy || !teamId}
          className="ops-btn w-full justify-center py-2.5 font-bold"
        >
          {busy ? "Generating…" : "Create today payroll"}
        </button>
      </div>
      <PayrollPreviewDetailModal
        open={previewModalOpen}
        preview={preview ?? null}
        teamLabel={selectedTeam?.name ?? preview?.teamName}
        loading={previewModalOpen && previewEnabled && (previewLoading || previewFetching) && !preview}
        onClose={() => setPreviewModalOpen(false)}
      />
      <ModalSheet
        open={photoWarningCount != null}
        title="Missing return photos"
        onClose={() => {
          if (!generateMutation.isPending) setPhotoWarningCount(null);
        }}
      >
        <div className="space-y-4">
          <button
            type="button"
            className="flex w-full gap-3 rounded-xl px-3 py-3 text-left transition hover:opacity-95"
            style={{
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
            }}
            onClick={() => {
              const params = new URLSearchParams({
                status: "pending_store_return",
                from: periodStart,
                to: periodEnd,
              });
              navigate(`/store-returns?${params.toString()}`);
            }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24" }}
              aria-hidden
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold" style={{ color: "#fbbf24" }}>
                {photoWarningCount} route{photoWarningCount === 1 ? "" : "s"} missing return photos
              </p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                These routes have returns, but the driver did not upload the store return picture.
                You can still generate payroll, or cancel and wait for the photos.
              </p>
              <p className="mt-2 text-xs font-bold" style={{ color: "#fbbf24" }}>
                Tap to open store returns →
              </p>
            </div>
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="ops-btn flex-1 justify-center py-2.5 font-bold"
              disabled={generateMutation.isPending}
              onClick={() => setPhotoWarningCount(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ops-btn flex-1 justify-center py-2.5 font-bold"
              style={{
                background: "rgba(225, 29, 72, 0.18)",
                border: "1px solid rgba(225, 29, 72, 0.45)",
                color: "var(--rose)",
              }}
              disabled={generateMutation.isPending}
              onClick={() => void runGenerate()}
            >
              {generateMutation.isPending ? "Generating…" : "Generate anyway"}
            </button>
          </div>
        </div>
      </ModalSheet>
    </div>
  );
}
