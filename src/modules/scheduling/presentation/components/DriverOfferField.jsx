import { useEffect, useState } from "react";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import { fetchAvailableDrivers } from "@/modules/scheduling/infrastructure/api/scheduling.api.js";

export function DriverOfferField({
  teamId,
  scheduleDate,
  arrivalTime,
  departureTime,
  excludeRouteId,
  driverId,
  driverName,
  onSelect,
  onClear,
}) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded || !teamId || !scheduleDate) return;
    setLoading(true);
    fetchAvailableDrivers(teamId, {
      date: scheduleDate,
      arrivalTime,
      departureTime,
      excludeRouteId,
    })
      .then(setDrivers)
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, [expanded, teamId, scheduleDate, arrivalTime, departureTime, excludeRouteId]);

  const display =
    driverName?.trim() ||
    (driverId ? "Driver offer — pending acceptance" : "Optional — assign driver");

  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-semibold text-dispatch-muted">
        Driver
      </label>
      <button
        type="button"
        disabled={!teamId}
        onClick={() => teamId && setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-dispatch-border bg-[#FAFBFC] px-3 py-2.5 text-left text-sm disabled:opacity-50"
      >
        <span className="font-medium text-dispatch-text">
          {!teamId ? "Select team first" : display}
        </span>
        {teamId ? (
          <svg className="h-4 w-4 text-dispatch-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : null}
      </button>

      {expanded && teamId ? (
        <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-dispatch-border bg-white">
          {loading ? (
            <p className="px-3 py-4 text-sm text-dispatch-muted">Loading drivers…</p>
          ) : drivers.length === 0 ? (
            <p className="px-3 py-4 text-sm text-dispatch-muted">No available drivers</p>
          ) : (
            drivers.map((d) => {
              const label = resolveDisplayName(d.fullName, d.email);
              const selected = driverId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    onSelect(d.id, label);
                    setExpanded(false);
                  }}
                  className={`flex w-full items-center justify-between border-b border-dispatch-border/60 px-3 py-2.5 text-left text-sm last:border-0 hover:bg-dispatch-bg ${
                    selected ? "bg-dispatch-primary-soft" : ""
                  }`}
                >
                  <span className="font-medium text-dispatch-text">{label}</span>
                  {selected ? (
                    <span className="text-xs font-bold text-dispatch-primary">Selected</span>
                  ) : null}
                </button>
              );
            })
          )}
          {driverId && onClear ? (
            <button
              type="button"
              onClick={() => {
                onClear();
                setExpanded(false);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-dispatch-red hover:bg-red-50"
            >
              Clear driver
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
