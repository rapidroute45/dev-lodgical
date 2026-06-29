import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useScheduleDateNavigation } from "@/modules/manager-home/presentation/hooks/useScheduleDateNavigation.js";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { OpsStatCard } from "@/modules/manager-home/presentation/components/OpsWidgets.jsx";
import {
  useDeleteScheduleMutation,
  useScheduleQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { MANAGER_ROLES } from "@/shared/utils/constants.js";
import { apiErrorMessage } from "@/shared/utils/api.js";
import { formatDisplayDate, todayIsoDate } from "@/shared/utils/time.js";
import {
  formatScheduleStatus,
  scheduleStatusClass,
} from "@/modules/scheduling/utils/scheduleStatus.js";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { RouteDetailCard } from "../components/RouteDetailCard.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

function summarizeRoutes(routes = []) {
  let unassigned = 0;
  let pending = 0;
  let inProgress = 0;
  for (const route of routes) {
    if (!route.driverId) unassigned += 1;
    const status = route.status ?? "pending";
    if (status === "pending" || status === "assigned") pending += 1;
    if (status === "active" || status === "in_progress") inProgress += 1;
  }
  return { total: routes.length, unassigned, pending, inProgress };
}

export function ViewScheduleScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canDeleteSchedule = MANAGER_ROLES.includes(user?.role);
  const deleteSchedule = useDeleteScheduleMutation();
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: schedule, isLoading, isError, refetch, isFetching } = useScheduleQuery(id, Boolean(id));

  const summary = useMemo(
    () => summarizeRoutes(schedule?.routes ?? []),
    [schedule?.routes]
  );

  async function handleDeleteSchedule() {
    if (!schedule || deleting) return;

    const routeCount = schedule.routeCount ?? schedule.routes?.length ?? 0;
    const label = schedule.store?.storeName ?? "this schedule";
    const dateLabel = schedule.date ? formatDisplayDate(schedule.date) : "this date";
    const confirmed = window.confirm(
      `Delete the entire schedule for ${label} on ${dateLabel}?\n\nThis permanently removes the schedule and all ${routeCount} route${routeCount === 1 ? "" : "s"} on it. This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteSchedule.mutateAsync(schedule.id);
      navigate("/schedules", { replace: true });
    } catch (err) {
      setDeleteError(apiErrorMessage(err, "Could not delete schedule."));
    } finally {
      setDeleting(false);
    }
  }

  const displayDate = schedule?.date ?? todayIsoDate();
  const storeId = schedule?.storeId ?? schedule?.store?.id;
  const handleTopBarDateChange = useScheduleDateNavigation({
    storeId,
    currentDate: displayDate,
    target: "schedule",
    city: schedule?.city,
    state: schedule?.state,
  });

  const topBar = (
    <OpsTopBar
      date={displayDate}
      setDate={handleTopBarDateChange}
      onRefresh={refetch}
      refreshing={isFetching}
    />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link to="/schedules" className="ops-btn p-2.5" aria-label="Back to schedules">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                {schedule?.store?.storeName ?? "Schedule details"}
              </h1>
              {schedule?.date ? (
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  {formatDisplayDate(schedule.date)}
                  {schedule.city ? ` · ${schedule.city}, ${schedule.state}` : ""}
                </p>
              ) : null}
            </div>
          </div>

          {schedule ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                to={`/schedules/${schedule.id}/routes`}
                className="ops-btn px-4 py-2 text-sm font-semibold"
              >
                Spreadsheet
              </Link>
              {canDeleteSchedule ? (
                <button
                  type="button"
                  onClick={() => void handleDeleteSchedule()}
                  disabled={deleting}
                  className="ops-btn px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  style={{ color: "var(--rose)", borderColor: "color-mix(in srgb, var(--rose) 35%, transparent)" }}
                >
                  {deleting ? "Deleting…" : "Delete schedule"}
                </button>
              ) : null}
              <StatusBadge
                label={formatScheduleStatus(schedule.status)}
                className={scheduleStatusClass(schedule.status)}
              />
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="ops-skel h-40 rounded-2xl" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="ops-skel h-24 rounded-2xl" />
              ))}
            </div>
            <div className="ops-skel h-48 rounded-2xl" />
          </div>
        ) : isError || !schedule ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>Schedule not found</p>
            <Link to="/schedules" className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold">
              Back to schedules
            </Link>
          </div>
        ) : (
          <>
            {deleteError ? (
              <div className="ops-banner ops-banner--error">{deleteError}</div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <OpsStatCard icon="routes" label="Total routes" value={summary.total} delay={0} />
              <OpsStatCard
                icon="clock"
                label="Pending / awaiting"
                value={summary.pending}
                barColor="var(--amber)"
                delay={60}
              />
              <OpsStatCard
                icon="drivers"
                label="Unassigned"
                value={summary.unassigned}
                barColor="var(--rose)"
                percent={summary.total ? (summary.unassigned / summary.total) * 100 : 0}
                delay={120}
              />
              <OpsStatCard
                icon="active"
                label="In progress"
                value={summary.inProgress}
                barColor="var(--accent)"
                delay={180}
              />
            </div>

            {(schedule.pendingRouteCount ?? 0) > 0 ? (
              <div className="ops-banner ops-banner--warning">
                <strong>{schedule.pendingRouteCount}</strong> route
                {schedule.pendingRouteCount === 1 ? "" : "s"} awaiting driver acceptance.
              </div>
            ) : null}

            <section className="ops-panel ops-fade overflow-hidden">
              <div className="ops-panel__head flex items-start gap-3 px-5 py-4">
                <span className="ops-stat__icon flex h-10 w-10 shrink-0 items-center justify-center">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>Location & store</h2>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                    Where this schedule operates
                  </p>
                </div>
              </div>
              <dl className="grid gap-4 p-5 sm:grid-cols-2">
                <MetaRow label="City / State" value={`${schedule.city}, ${schedule.state}`} />
                <MetaRow label="Store" value={schedule.store?.storeName ?? "—"} />
                <MetaRow label="Store ID" value={schedule.store?.storeId ?? "—"} />
                <MetaRow label="Address" value={schedule.store?.address ?? "—"} />
                <MetaRow label="Schedule date" value={formatDisplayDate(schedule.date)} />
                <MetaRow label="Notes" value={schedule.notes?.trim() || "—"} />
              </dl>
            </section>

            <section className="ops-panel ops-fade overflow-hidden">
              <div className="ops-panel__head px-5 py-4">
                <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
                  Routes ({schedule.routes?.length ?? 0})
                </h2>
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  Teams, drivers, times, and stops
                </p>
              </div>
              <div className="p-5">
                {!schedule.routes?.length ? (
                  <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
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
              </div>
            </section>

            {canDeleteSchedule ? (
              <section className="ops-panel ops-fade overflow-hidden">
                <div className="ops-panel__head px-5 py-4">
                  <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>Delete schedule</h2>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                    Permanently remove this schedule and every route on it
                  </p>
                </div>
                <div className="p-5">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Only dispatch managers and administrators can delete a full schedule. Assigned
                    drivers will be notified that their routes were removed.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleDeleteSchedule()}
                    disabled={deleting}
                    className="ops-btn mt-4 px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                    style={{
                      color: "var(--rose)",
                      borderColor: "color-mix(in srgb, var(--rose) 35%, transparent)",
                      background: "color-mix(in srgb, var(--rose) 8%, transparent)",
                    }}
                  >
                    {deleting ? "Deleting schedule…" : "Delete entire schedule"}
                  </button>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetaRow({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
        {value}
      </dd>
    </div>
  );
}
