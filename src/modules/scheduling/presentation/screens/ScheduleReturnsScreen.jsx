import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { useScheduleReturnsQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { formatDisplayDate } from "@/shared/utils/time.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

function reasonLabel(stop) {
  if (stop.returnReasonCustom?.trim()) return stop.returnReasonCustom.trim();
  if (stop.returnReason?.trim()) return stop.returnReason.trim().replace(/_/g, " ");
  return "No reason given";
}

export function ScheduleReturnsScreen() {
  const { id: scheduleId } = useParams();
  const { data, isLoading, isError, refetch, isFetching } = useScheduleReturnsQuery(
    scheduleId,
    Boolean(scheduleId)
  );

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />
  );

  const storeName = data?.store?.storeName ?? "Schedule returns";

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              to={`/schedules/${scheduleId}/routes`}
              className="ops-btn p-2.5"
              aria-label="Back to spreadsheet"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                Returns
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                {storeName}
                {data?.date ? ` · ${formatDisplayDate(data.date)}` : ""}
                {data?.city ? ` · ${data.city}, ${data.state}` : ""}
              </p>
            </div>
          </div>
          {data ? (
            <div
              className="ops-field px-4 py-2 text-sm font-bold"
              style={{ color: "var(--rose)" }}
            >
              {data.totalReturns} return{data.totalReturns === 1 ? "" : "s"}
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-28 rounded-xl" />
            ))}
          </div>
        ) : isError || !data ? (
          <p className="mt-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Could not load returns for this schedule.
          </p>
        ) : data.totalReturns === 0 ? (
          <p className="mt-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No returns on this schedule.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {data.routes.map((route) => (
              <section key={route.routeId} className="ops-panel ops-fade overflow-hidden">
                <div className="ops-panel__head flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                  <div>
                    <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
                      {route.routeName}
                    </h2>
                    <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                      Returns: {route.returnsCount}
                    </p>
                  </div>
                  <Link
                    to={`/schedules/${scheduleId}/routes`}
                    className="text-xs font-bold hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Spreadsheet
                  </Link>
                </div>
                <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {route.returns.map((stop, index) => (
                    <li key={stop.id} className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <span className="ops-route__idx flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                            {stop.name}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                            {stop.address}
                          </p>
                          <p className="mt-2 text-xs font-semibold" style={{ color: "var(--rose)" }}>
                            Reason: {reasonLabel(stop)}
                          </p>
                          {stop.completedAt ? (
                            <p className="mt-1 text-[11px]" style={{ color: "var(--text-dim)" }}>
                              {new Date(stop.completedAt).toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
