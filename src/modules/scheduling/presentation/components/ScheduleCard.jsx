import { Link } from "react-router-dom";
import { useScheduleGroupQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { sortRoutesByCategory } from "@/modules/scheduling/utils/routeSort.js";
import { formatDisplayDate } from "@/shared/utils/time.js";
import {
  formatScheduleStatus,
  scheduleStatusClass,
} from "@/modules/scheduling/utils/scheduleStatus.js";
import { StatusBadge } from "./StatusBadge.jsx";
import { RouteSummaryRow } from "./RouteSummaryRow.jsx";

const StoreIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

export function ScheduleCard({ group, expanded, onToggle }) {
  const schedules = group.schedules ?? [];
  const storeName = group.store?.storeName ?? "Unknown store";
  const total = group.routeCount ?? 0;
  const pending = group.pendingRouteCount ?? 0;
  const primaryScheduleId = group.primaryScheduleId ?? schedules[0]?.id;

  const detailQueries = useScheduleGroupQuery(
    schedules.map((s) => s.id),
    expanded
  );
  const detailLoading = detailQueries.some((q) => q.isLoading);
  const routes = expanded
    ? sortRoutesByCategory(
        detailQueries.flatMap((q, batchIndex) =>
          (q.data?.routes ?? []).map((route) => ({
            ...route,
            _batchIndex: batchIndex,
            _scheduleId: q.data?.id ?? schedules[batchIndex]?.id,
          }))
        )
      )
    : [];

  return (
    <article className="ops-card ops-card--hover ops-fade overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="ops-cardbtn flex w-full items-center gap-4 p-5 text-left"
      >
        <span className="ops-card__logo flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
          <StoreIcon />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>{storeName}</h3>
            {pending > 0 ? (
              <StatusBadge
                label={`${pending} pending route${pending === 1 ? "" : "s"}`}
                className="ops-badge ops-badge--pending"
              />
            ) : (
              <StatusBadge
                label={formatScheduleStatus(group.status)}
                className={scheduleStatusClass(group.status)}
              />
            )}
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {group.city}, {group.state}
            {group.store?.storeId ? ` · ${group.store.storeId}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold" style={{ color: "var(--text-dim)" }}>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
              {total} route{total === 1 ? "" : "s"}
            </span>
            <span>{formatDisplayDate(group.date)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <svg
            className={`h-5 w-5 transition ${expanded ? "rotate-180" : ""}`}
            style={{ color: "var(--text-muted)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <div className="flex flex-col items-end gap-1">
            {primaryScheduleId ? (
              <Link
                to={`/schedules/${primaryScheduleId}/routes`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-bold hover:underline"
                style={{ color: "var(--accent)" }}
              >
                Full view
              </Link>
            ) : null}
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="px-5 py-5" style={{ borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.015)" }}>
          <ScheduleMetaGrid
            group={group}
            detailQueries={detailQueries}
            loading={detailLoading}
          />

          <h4 className="mb-3 mt-5 text-sm font-bold" style={{ color: "var(--text)" }}>
            Routes {detailLoading ? "" : `(${routes.length})`}
          </h4>

          {detailLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="ops-skel h-24 rounded-xl" />
              ))}
            </div>
          ) : routes.length === 0 ? (
            <p className="ops-dashed px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No routes on this schedule yet.
            </p>
          ) : (
            <div className="space-y-3">
              {routes.map((route, i) => (
                <RouteSummaryRow
                  key={route.id}
                  route={route}
                  index={i + 1}
                  to={`/routes/${route.id}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

function ScheduleMetaGrid({ group, detailQueries, loading }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="ops-skel h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  const notes = detailQueries
    .map((q) => q.data?.notes?.trim())
    .filter(Boolean)
    .join(" · ");

  const items = [
    { label: "Date", value: group.date ?? "—" },
    { label: "City / State", value: `${group.city}, ${group.state}` },
    { label: "Store", value: group.store?.storeName ?? "—" },
    { label: "Store code", value: group.store?.storeId ?? "—" },
    { label: "Address", value: group.store?.address ?? "—" },
    {
      label: "Status",
      value: formatScheduleStatus(group.status),
    },
    { label: "Total routes", value: String(group.routeCount ?? 0) },
    { label: "Pending routes", value: String(group.pendingRouteCount ?? 0) },
    { label: "Notes", value: notes || "—" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="ops-field px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
            {item.label}
          </p>
          <p className="mt-0.5 text-sm font-semibold break-words" style={{ color: "var(--text)" }}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
