import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDisplayDate } from "@/shared/utils/time.js";
import { formatMoney, statusMeta, ROUTE_CATEGORY_LABELS } from "@/modules/payroll/utils/format.js";

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
  const activeMeta = team.activeBillStatus ? statusMeta(team.activeBillStatus) : null;

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

      {team.activeBillId && activeMeta ? (
        onOpenBill ? (
          <button
            type="button"
            onClick={() => onOpenBill(team.activeBillId)}
            className="mt-3 flex w-full items-center justify-between pt-3 text-left"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span className={statusBadgeClass(team.activeBillStatus)}>
              Open bill · {activeMeta.label}
            </span>
            <span style={{ color: "var(--accent)" }}>→</span>
          </button>
        ) : (
          <Link
            to={`/payroll/${team.activeBillId}`}
            className="mt-3 flex items-center justify-between pt-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span className={statusBadgeClass(team.activeBillStatus)}>
              Open bill · {activeMeta.label}
            </span>
            <span style={{ color: "var(--accent)" }}>→</span>
          </Link>
        )
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

      {isOps && team.pendingAmount === 0 && !team.activeBillId ? (
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>No unbilled completed routes</p>
      ) : null}
    </div>
  );
}
