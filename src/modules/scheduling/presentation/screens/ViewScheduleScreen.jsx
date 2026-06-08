import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useScheduleQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { formatDisplayDate } from "@/shared/utils/time.js";
import {
  formatScheduleStatus,
  scheduleStatusClass,
} from "@/modules/scheduling/utils/scheduleStatus.js";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { RouteDetailCard } from "../components/RouteDetailCard.jsx";
import { SectionCard } from "../components/SectionCard.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";

export function ViewScheduleScreen() {
  const { id } = useParams();
  const { data: schedule, isLoading, isError } = useScheduleQuery(id, Boolean(id));

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className={`${PAGE_HEADER_INNER} items-center`}>
        <Link
          to="/schedules"
          className="rounded-xl border border-dispatch-border p-2.5 text-dispatch-muted hover:bg-dispatch-bg"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-dispatch-text">
            {schedule?.store?.storeName ?? "Schedule details"}
          </h1>
          {schedule?.date ? (
            <p className="text-xs text-dispatch-muted">{formatDisplayDate(schedule.date)}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {schedule ? (
            <>
              <Link
                to={`/schedules/${schedule.id}/edit`}
                className="rounded-xl border border-dispatch-border px-3 py-2 text-xs font-bold text-dispatch-primary hover:bg-dispatch-bg"
              >
                Edit schedule
              </Link>
              <StatusBadge
                label={formatScheduleStatus(schedule.status)}
                className={scheduleStatusClass(schedule.status)}
              />
            </>
          ) : null}
        </div>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-2xl bg-dispatch-border/30" />
            <div className="h-48 animate-pulse rounded-2xl bg-dispatch-border/30" />
          </div>
        ) : isError || !schedule ? (
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-12 text-center">
            <p className="text-lg font-bold text-dispatch-text">Schedule not found</p>
            <Link to="/schedules" className="mt-4 inline-block text-sm font-bold text-dispatch-primary">
              Back to schedules
            </Link>
          </div>
        ) : (
          <>
            <SectionCard
              title="Location & store"
              subtitle="Where this schedule operates"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            >
              <dl className="grid gap-4 sm:grid-cols-2">
                <MetaRow label="City / State" value={`${schedule.city}, ${schedule.state}`} />
                <MetaRow label="Store" value={schedule.store?.storeName ?? "—"} />
                <MetaRow label="Store ID" value={schedule.store?.storeId ?? "—"} />
                <MetaRow label="Address" value={schedule.store?.address ?? "—"} />
                <MetaRow label="Schedule date" value={formatDisplayDate(schedule.date)} />
                <MetaRow label="Notes" value={schedule.notes?.trim() || "—"} />
              </dl>
            </SectionCard>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile label="Total routes" value={schedule.routeCount ?? schedule.routes?.length ?? 0} color="primary" />
              <StatTile label="Pending" value={schedule.pendingRouteCount ?? 0} color="orange" />
              <StatTile label="Status" value={formatScheduleStatus(schedule.status)} color="muted" />
            </div>

            {(schedule.pendingRouteCount ?? 0) > 0 ? (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                <strong>{schedule.pendingRouteCount}</strong> route
                {schedule.pendingRouteCount === 1 ? "" : "s"} awaiting driver acceptance.
              </div>
            ) : null}

            <SectionCard
              title={`Routes (${schedule.routes?.length ?? 0})`}
              subtitle="Teams, drivers, times, and stops"
            >
              {!schedule.routes?.length ? (
                <p className="text-center text-sm text-dispatch-muted py-8">
                  No routes on this schedule yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {schedule.routes.map((route, i) => (
                    <RouteDetailCard
                      key={route.id}
                      route={route}
                      index={i + 1}
                      scheduleId={schedule.id}
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetaRow({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-dispatch-light">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-dispatch-text">{value}</dd>
    </div>
  );
}

function StatTile({ label, value, color }) {
  const bg =
    color === "primary"
      ? "from-dispatch-primary-soft to-white border-dispatch-primary/20"
      : color === "orange"
        ? "from-orange-50 to-white border-orange-200"
        : "from-dispatch-bg to-white border-dispatch-border";
  const text =
    color === "primary" ? "text-dispatch-primary" : color === "orange" ? "text-orange-700" : "text-dispatch-text";

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${bg} p-4`}>
      <p className="text-xs font-semibold text-dispatch-muted">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${text}`}>{value}</p>
    </div>
  );
}
