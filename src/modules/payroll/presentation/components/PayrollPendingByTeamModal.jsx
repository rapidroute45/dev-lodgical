import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModalSheet } from "./ModalSheet.jsx";
import { formatMoney } from "@/modules/payroll/utils/format.js";
import { TeamPendingCard } from "./TeamPendingCard.jsx";

export function PayrollPendingByTeamModal({
  open,
  title,
  summary,
  teams,
  isOps,
  onClose,
}) {
  const navigate = useNavigate();
  const [listKey, setListKey] = useState(0);

  useEffect(() => {
    if (!open) setListKey((k) => k + 1);
  }, [open]);

  if (!summary) return null;

  const handleOpenBill = (billId) => {
    onClose();
    navigate(`/payroll/${billId}`);
  };

  return (
    <ModalSheet open={open} title={title} onClose={onClose} wide>
      <div
        className="mb-4 rounded-xl px-4 py-3"
        style={{ background: "rgba(34, 211, 238, 0.08)", border: "1px solid rgba(34, 211, 238, 0.25)" }}
      >
        <p className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>
          {formatMoney(summary.totalPendingAmount)}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {summary.totalRouteCount} unbilled route{summary.totalRouteCount === 1 ? "" : "s"}
          {summary.rates
            ? ` · S ${summary.rates.smallRouteRate} / M ${summary.rates.mediumRouteRate} / F ${summary.rates.fullRouteRate}`
            : ""}
        </p>
      </div>

      {teams.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No pending balances right now.
        </p>
      ) : (
        <div key={listKey} className="space-y-3">
          {teams.map((team) => (
            <TeamPendingCard
              key={team.teamId}
              team={team}
              isOps={isOps}
              onOpenBill={handleOpenBill}
            />
          ))}
        </div>
      )}
    </ModalSheet>
  );
}
