import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge.jsx";
import {
  formatRouteStatus,
  routeStatusClass,
} from "@/modules/scheduling/utils/scheduleStatus.js";
import { formatDisplayDate } from "@/shared/utils/time.js";

export function RouteSummaryRow({
  route,
  index,
  storeName,
  storeMeta,
  showStoreHeader = false,
  nested = false,
  to,
}) {
  const driver =
    route.driverName ??
    route.driverEmail ??
    (route.driverId ? "Offer sent" : "Unassigned");

  const body = (
    <>
      {showStoreHeader ? (
        <div className="mb-3 flex items-center gap-3">
          <span className="ops-avatar flex h-9 w-9 shrink-0 items-center justify-center">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>{storeName}</p>
            {storeMeta ? (
              <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{storeMeta}</p>
            ) : null}
          </div>
          <svg className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <span className="ops-route__idx flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
              {route.routeName || `Route ${index}`}
            </p>
            <StatusBadge
              label={formatRouteStatus(route.status)}
              className={routeStatusClass(route.status)}
            />
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {route.teamName ?? "Team"}
            {route.teamCode ? ` (${route.teamCode})` : ""} · {driver}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
            {route.arrivalTime} – {route.departureTime}
            {route.scheduleDate
              ? ` · ${formatDisplayDate(route.scheduleDate)}`
              : route.schedule?.date
                ? ` · ${formatDisplayDate(route.schedule.date)}`
                : ""}
          </p>
        </div>
        {!showStoreHeader ? (
          <svg className="mt-1 h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        ) : null}
      </div>
    </>
  );

  const className = nested
    ? `ops-listcard ops-listcard--nested ops-listcard--${route.status ?? "pending"} block w-full p-4 text-left`
    : `ops-listcard ops-listcard--${route.status ?? "pending"} block w-full p-4 text-left`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
