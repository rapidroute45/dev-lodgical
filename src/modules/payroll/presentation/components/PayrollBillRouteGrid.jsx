import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { fetchRoute } from "@/modules/scheduling/infrastructure/api/scheduling.api.js";
import { ROUTE_CATEGORY_LABELS } from "@/modules/scheduling/constants.js";
import { formatRouteStatus, routeStatusClass } from "@/modules/scheduling/utils/scheduleStatus.js";
import { StatusBadge } from "@/modules/scheduling/presentation/components/StatusBadge.jsx";
import { formatMoney } from "@/modules/payroll/utils/format.js";
import { formatDisplayDate, formatRouteDurationHours, formatTimestamp } from "@/shared/utils/time.js";

const GRID_COLUMNS = [
  { key: "routeName", label: "Route" },
  { key: "category", label: "Category" },
  { key: "date", label: "Date" },
  { key: "location", label: "Location" },
  { key: "team", label: "Team" },
  { key: "stops", label: "Stops" },
  { key: "arrival", label: "Arrival" },
  { key: "departure", label: "Departure" },
  { key: "hours", label: "Hours" },
  { key: "vehicle", label: "Vehicle" },
  { key: "miles", label: "Miles" },
  { key: "status", label: "Status" },
  { key: "completed", label: "Completed" },
  { key: "defaultRate", label: "Default" },
  { key: "rate", label: "Pay" },
  { key: "adjustment", label: "Adjustment" },
  { key: "actions", label: "" },
];

function categoryLabel(category) {
  if (!category) return "—";
  const key = String(category).toUpperCase();
  return ROUTE_CATEGORY_LABELS[key] ?? category;
}

function buildRow(payrollRoute, fullRoute, loading) {
  const dropoffs = fullRoute?.dropoffs ?? [];
  const progress = fullRoute?.progress ?? null;
  const stopTotal = dropoffs.length || fullRoute?.stops || 0;
  const stopDone =
    progress != null
      ? (progress.completedDropoffs ?? 0) + (progress.returnedDropoffs ?? 0)
      : dropoffs.filter((stop) => stop.status === "completed" || stop.status === "returned").length;

  const hours = fullRoute
    ? formatRouteDurationHours(fullRoute.startedAt, fullRoute.completedAt, dropoffs)
    : null;

  return {
    routeId: payrollRoute.routeId,
    routeName: payrollRoute.routeName || fullRoute?.routeName || "Route",
    category: categoryLabel(payrollRoute.routeCategory ?? fullRoute?.routeCategory),
    date: payrollRoute.scheduleDate ? formatDisplayDate(payrollRoute.scheduleDate) : "—",
    location: payrollRoute.location || fullRoute?.location || "—",
    team: fullRoute?.teamName
      ? `${fullRoute.teamName}${fullRoute.teamCode ? ` (${fullRoute.teamCode})` : ""}`
      : loading
        ? "…"
        : "—",
    stops: fullRoute || !loading ? `${stopDone}/${stopTotal || 0}` : "…",
    arrival: fullRoute?.arrivalTime ?? (loading ? "…" : "—"),
    departure: fullRoute?.departureTime ?? (loading ? "…" : "—"),
    hours: hours != null ? `${hours}h` : loading ? "…" : "—",
    vehicle: fullRoute?.vehicleType ?? (loading ? "…" : "—"),
    miles:
      fullRoute?.totalMiles != null
        ? String(fullRoute.totalMiles)
        : fullRoute?.mileage != null
          ? String(fullRoute.mileage)
          : loading
            ? "…"
            : "—",
    status: fullRoute?.status ?? null,
    completed: payrollRoute.completedAt
      ? formatTimestamp(payrollRoute.completedAt)
      : fullRoute?.completedAt
        ? formatTimestamp(fullRoute.completedAt)
        : "—",
    defaultRate: payrollRoute.defaultRate != null ? formatMoney(payrollRoute.defaultRate) : "—",
    rate: payrollRoute.rate != null ? formatMoney(payrollRoute.rate) : "—",
    adjustment: payrollRoute.hasAdjustment
      ? payrollRoute.adjustmentReason?.trim() || "Adjusted"
      : "—",
    loading,
  };
}

export function PayrollBillRouteGrid({ routes, canRemove, onRemove }) {
  const routeQueries = useQueries({
    queries: routes.map((route) => ({
      queryKey: ["routes", route.routeId],
      queryFn: () => fetchRoute(route.routeId),
      enabled: Boolean(route.routeId),
    })),
  });

  const rows = useMemo(
    () =>
      routes.map((payrollRoute, index) =>
        buildRow(payrollRoute, routeQueries[index]?.data, routeQueries[index]?.isLoading)
      ),
    [routes, routeQueries]
  );

  if (routes.length === 0) return null;

  return (
    <div
      className="mt-3 overflow-x-auto rounded-xl"
      style={{ border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.02)" }}
    >
      <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.03)" }}>
            {GRID_COLUMNS.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: "var(--text-dim)" }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.routeId} style={{ borderBottom: "1px solid var(--border)" }}>
              <td className="px-3 py-2.5 font-semibold" style={{ color: "var(--text)" }}>
                <Link to={`/routes/${row.routeId}`} className="hover:underline" style={{ color: "var(--accent)" }}>
                  {row.routeName}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--text-muted)" }}>
                {row.category}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--text-muted)" }}>
                {row.date}
              </td>
              <td className="max-w-[140px] truncate px-3 py-2.5" style={{ color: "var(--text-muted)" }} title={row.location}>
                {row.location}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--text-muted)" }}>
                {row.team}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--text)" }}>
                {row.stops}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--text-muted)" }}>
                {row.arrival}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--text-muted)" }}>
                {row.departure}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--text)" }}>
                {row.hours}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--text-muted)" }}>
                {row.vehicle}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--text-muted)" }}>
                {row.miles}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                {row.status ? (
                  <StatusBadge
                    label={formatRouteStatus(row.status)}
                    className={routeStatusClass(row.status)}
                  />
                ) : row.loading ? (
                  "…"
                ) : (
                  "—"
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--text-muted)" }}>
                {row.completed}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--text-muted)" }}>
                {row.defaultRate}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 font-semibold" style={{ color: "var(--green)" }}>
                {row.rate}
              </td>
              <td className="max-w-[120px] truncate px-3 py-2.5" style={{ color: "var(--amber)" }} title={row.adjustment}>
                {row.adjustment}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                {canRemove ? (
                  <button
                    type="button"
                    onClick={() => onRemove?.(row.routeId)}
                    className="text-xs font-semibold"
                    style={{ color: "var(--rose)" }}
                  >
                    Remove
                  </button>
                ) : (
                  <Link
                    to={`/routes/${row.routeId}`}
                    className="text-xs font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    Open
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
