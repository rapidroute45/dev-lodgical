import { Link } from "react-router-dom";
import { useScheduleQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { formatDisplayDate } from "@/shared/utils/time.js";
import {
  formatScheduleStatus,
  scheduleStatusClass,
} from "@/modules/scheduling/utils/scheduleStatus.js";
import { StatusBadge } from "./StatusBadge.jsx";
import { RouteDetailCard } from "./RouteDetailCard.jsx";

const StoreIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

export function ScheduleCard({ schedule, expanded, onToggle, allowEdit = false }) {
  const storeName = schedule.store?.storeName ?? "Unknown store";
  const total = schedule.routeCount ?? 0;
  const pending = schedule.pendingRouteCount ?? 0;

  const { data: full, isLoading: detailLoading } = useScheduleQuery(
    schedule.id,
    expanded
  );

  const routes = expanded ? (full?.routes ?? []) : [];

  return (
    <article className="overflow-hidden rounded-2xl border border-dispatch-border/80 bg-dispatch-surface shadow-md shadow-dispatch-primary/5 transition hover:shadow-lg">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-dispatch-bg/40"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-dispatch-primary to-dispatch-indigo text-white shadow-lg shadow-dispatch-primary/25">
          <StoreIcon />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-dispatch-text">{storeName}</h3>
            {pending > 0 ? (
              <StatusBadge
                label={`${pending} pending route${pending === 1 ? "" : "s"}`}
                className="bg-orange-50 text-orange-800 ring-orange-200"
              />
            ) : (
              <StatusBadge
                label={formatScheduleStatus(schedule.status)}
                className={scheduleStatusClass(schedule.status)}
              />
            )}
          </div>
          <p className="mt-1 text-sm text-dispatch-muted">
            {schedule.city}, {schedule.state}
            {schedule.store?.storeId ? ` · ${schedule.store.storeId}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-dispatch-light">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-dispatch-primary" />
              {total} route{total === 1 ? "" : "s"}
            </span>
            <span>{formatDisplayDate(schedule.date)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <svg
            className={`h-5 w-5 text-dispatch-muted transition ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <div className="flex flex-col items-end gap-1">
            <Link
              to={`/schedules/${schedule.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-bold text-dispatch-primary hover:underline"
            >
              Full view
            </Link>
            {allowEdit ? (
              <Link
                to={`/schedules/${schedule.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-bold text-dispatch-muted hover:text-dispatch-primary hover:underline"
              >
                Edit
              </Link>
            ) : null}
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-dispatch-border bg-gradient-to-b from-dispatch-bg/80 to-dispatch-surface px-5 py-5">
          <ScheduleMetaGrid schedule={full ?? schedule} loading={detailLoading} />

          <h4 className="mb-3 mt-5 text-sm font-bold text-dispatch-text">
            Routes {detailLoading ? "" : `(${routes.length})`}
          </h4>

          {detailLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-dispatch-border/40"
                />
              ))}
            </div>
          ) : routes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-dispatch-border px-4 py-6 text-center text-sm text-dispatch-muted">
              No routes on this schedule yet.
            </p>
          ) : (
            <div className="space-y-3">
              {routes.map((route, i) => (
                <RouteDetailCard
                  key={route.id}
                  route={route}
                  index={i + 1}
                  scheduleId={schedule.id}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

function ScheduleMetaGrid({ schedule, loading }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-dispatch-border/30" />
        ))}
      </div>
    );
  }

  const items = [
    { label: "Schedule ID", value: schedule.id?.slice(-8).toUpperCase() ?? "—" },
    { label: "Date", value: schedule.date ?? "—" },
    { label: "City / State", value: `${schedule.city}, ${schedule.state}` },
    {
      label: "Store",
      value: schedule.store?.storeName ?? "—",
    },
    {
      label: "Store code",
      value: schedule.store?.storeId ?? "—",
    },
    {
      label: "Address",
      value: schedule.store?.address ?? "—",
    },
    { label: "Status", value: formatScheduleStatus(schedule.status) },
    { label: "Total routes", value: String(schedule.routeCount ?? schedule.routes?.length ?? 0) },
    {
      label: "Pending routes",
      value: String(schedule.pendingRouteCount ?? 0),
    },
    { label: "Notes", value: schedule.notes?.trim() || "—" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-dispatch-border/60 bg-dispatch-surface px-3 py-2.5"
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-dispatch-light">
            {item.label}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-dispatch-text break-words">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
