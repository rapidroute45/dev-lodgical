import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatDisplayDate } from "@/shared/utils/time.js";
import { formatMoney, formatPeriodRange, statusMeta, ROUTE_CATEGORY_LABELS } from "@/modules/payroll/utils/format.js";

const STATUS_BADGE = {
  draft: "muted",
  pending_team_lead: "pending",
  team_lead_approved: "done",
  team_lead_disputed: "rose",
  paid: "done",
};

function statusBadgeClass(status) {
  return `ops-badge ops-badge--${STATUS_BADGE[status] ?? "muted"}`;
}

export function TeamPendingCard({ team, isOps, onOpenBill }) {
  const [teamExpanded, setTeamExpanded] = useState(false);
  const [expandedDrivers, setExpandedDrivers] = useState(new Set());
  const openBills = useMemo(() => {
    if (team.openBills?.length) return team.openBills;
    if (team.activeBillId && team.activeBillStatus) {
      return [{ id: team.activeBillId, status: team.activeBillStatus, periodStart: null, periodEnd: null }];
    }
    return [];
  }, [team.activeBillId, team.activeBillStatus, team.openBills]);
  const hasOpenBills = openBills.length > 0;

  function toggleDriver(driverId) {
    setExpandedDrivers((prev) => {
      const next = new Set(prev);
      if (next.has(driverId)) next.delete(driverId);
      else next.add(driverId);
      return next;
    });
  }

  return (
    <div className="ops-listcard p-4">
      <button
        type="button"
        onClick={() => setTeamExpanded((v) => !v)}
        className="flex w-full items-start justify-between text-left"
      >
        <div>
          <p className="text-base font-bold" style={{ color: "var(--text)" }}>{team.teamName}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {team.routeCount} route{team.routeCount === 1 ? "" : "s"} · {team.driverCount} driver
            {team.driverCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold" style={{ color: "var(--accent)" }}>{formatMoney(team.pendingAmount)}</p>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{teamExpanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {hasOpenBills ? (
        <div className="mt-3 space-y-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          {openBills.map((bill) => {
            const billMeta = statusMeta(bill.status);
            const periodLabel = bill.periodStart && bill.periodEnd
              ? formatPeriodRange(bill.periodStart, bill.periodEnd)
              : null;
            const label = periodLabel
              ? `Open bill · ${billMeta.label} · ${periodLabel}`
              : `Open bill · ${billMeta.label}`;

            if (onOpenBill) {
              return (
                <button
                  key={bill.id}
                  type="button"
                  onClick={() => onOpenBill(bill.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className={statusBadgeClass(bill.status)}>{label}</span>
                  <span style={{ color: "var(--accent)" }}>→</span>
                </button>
              );
            }

            return (
              <Link
                key={bill.id}
                to={`/payroll/${bill.id}`}
                className="flex items-center justify-between"
              >
                <span className={statusBadgeClass(bill.status)}>{label}</span>
                <span style={{ color: "var(--accent)" }}>→</span>
              </Link>
            );
          })}
        </div>
      ) : null}

      {teamExpanded ? (
        <div className="mt-3 space-y-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          {team.drivers.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No drivers to show</p>
          ) : (
            team.drivers.map((driver) => {
              const open = expandedDrivers.has(driver.driverId);
              return (
                <div key={driver.driverId}>
                  <button
                    type="button"
                    onClick={() => toggleDriver(driver.driverId)}
                    className="flex w-full items-center justify-between py-2 text-left"
                  >
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{driver.driverName}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {driver.routeCount} route{driver.routeCount === 1 ? "" : "s"} ·{" "}
                        {formatMoney(driver.pendingAmount)}
                      </p>
                    </div>
                    <span style={{ color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</span>
                  </button>
                  {open
                    ? driver.routes.map((r) => (
                        <div
                          key={r.routeId}
                          className="flex items-center justify-between py-2 pl-2 text-sm"
                          style={{ borderBottom: "1px solid var(--border)" }}
                        >
                          <div>
                            <p className="font-semibold" style={{ color: "var(--text)" }}>
                              {r.routeName || "Route"}
                              {r.location ? ` · ${r.location}` : ""}
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {formatDisplayDate(r.scheduleDate)} · {formatMoney(r.rate)}
                              {r.routeCategory
                                ? ` · ${ROUTE_CATEGORY_LABELS[r.routeCategory] ?? r.routeCategory}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {isOps && team.pendingAmount === 0 && !hasOpenBills ? (
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>No unbilled completed routes</p>
      ) : null}
    </div>
  );
}
