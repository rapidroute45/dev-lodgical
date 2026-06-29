import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { OpsStatCard } from "@/modules/manager-home/presentation/components/OpsWidgets.jsx";
import {
  useRoutesQuery,
  useSchedulesQuery,
  useStoreQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { groupSchedulesByStore } from "@/modules/scheduling/utils/groupSchedulesByStore.js";
import { sortRoutesByCategory } from "@/modules/scheduling/utils/routeSort.js";
import { formatDisplayDate, todayIsoDate } from "@/shared/utils/time.js";
import {
  formatScheduleStatus,
  scheduleStatusClass,
} from "@/modules/scheduling/utils/scheduleStatus.js";
import { DateNavigator } from "../components/DateNavigator.jsx";
import { RouteSummaryRow } from "../components/RouteSummaryRow.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

export function StoreOperationsScreen() {
  const { id: storeId } = useParams();
  const location = useLocation();
  const [date, setDate] = useState(() => location.state?.date ?? todayIsoDate());

  useEffect(() => {
    if (location.state?.date) {
      setDate(location.state.date);
    }
  }, [location.state?.date]);

  const {
    data: store,
    isLoading: storeLoading,
    isError: storeError,
    refetch: refetchStore,
    isFetching,
  } = useStoreQuery(storeId, Boolean(storeId));

  const scheduleFilters = useMemo(
    () => ({ date, storeId, status: "all" }),
    [date, storeId]
  );
  const routeFilters = useMemo(
    () => ({ date, storeId, limit: 100 }),
    [date, storeId]
  );

  const { data: scheduleData, isLoading: schedulesLoading, refetch: refetchSchedules } =
    useSchedulesQuery(scheduleFilters, Boolean(storeId && date));
  const { data: routeData, isLoading: routesLoading, refetch: refetchRoutes } =
    useRoutesQuery(routeFilters, Boolean(storeId && date));

  const groupedSchedules = useMemo(
    () => groupSchedulesByStore(scheduleData?.items ?? []),
    [scheduleData?.items]
  );
  const routes = useMemo(
    () => sortRoutesByCategory(routeData?.items ?? []),
    [routeData?.items]
  );

  const topBar = (
    <OpsTopBar
      date={date}
      setDate={setDate}
      onRefresh={() => {
        void refetchStore();
        void refetchSchedules();
        void refetchRoutes();
      }}
      refreshing={isFetching}
    />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link to="/stores" className="ops-btn p-2.5" aria-label="Back to stores">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                {store?.storeName ?? "Store operations"}
              </h1>
              {store ? (
                <p className="mt-0.5 truncate text-sm" style={{ color: "var(--text-muted)" }}>
                  {store.storeId} · {store.city}, {store.state}
                </p>
              ) : null}
            </div>
          </div>
          <Link
            to={`/schedules/create?storeId=${encodeURIComponent(storeId)}`}
            className="ops-btn ops-btn--accent shrink-0 px-5 py-2.5 font-bold"
          >
            + Schedule
          </Link>
        </div>

        {storeLoading ? (
          <div className="ops-skel h-32 rounded-2xl" />
        ) : storeError || !store ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>Store not found</p>
            <Link to="/stores" className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold">
              Back to stores
            </Link>
          </div>
        ) : (
          <>
            <section className="ops-panel ops-fade p-5">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Pickup location
              </p>
              <p className="mt-1 text-base font-bold" style={{ color: "var(--text)" }}>{store.storeName}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{store.address}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {store.city}, {store.state}
              </p>
            </section>

            <DateNavigator date={date} onDateChange={setDate} />

            <div className="grid gap-4 sm:grid-cols-2">
              <OpsStatCard
                icon="schedule"
                label="Schedules"
                value={groupedSchedules.length}
                loading={schedulesLoading}
                delay={0}
              />
              <OpsStatCard
                icon="routes"
                label="Routes"
                value={routes.length}
                barColor="var(--accent)"
                loading={routesLoading}
                delay={60}
              />
            </div>

            <section className="ops-panel ops-fade overflow-hidden">
              <div className="ops-panel__head px-5 py-4">
                <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
                  Schedules · {formatDisplayDate(date)}
                </h2>
              </div>
              <div className="p-5">
                {schedulesLoading ? (
                  <div className="ops-skel h-24 rounded-2xl" />
                ) : groupedSchedules.length === 0 ? (
                  <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    No schedules for this store on this date.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {groupedSchedules.map((group) => (
                      <li key={group.key}>
                        <div className="ops-card ops-fade p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold" style={{ color: "var(--text)" }}>{store.storeName}</p>
                                <StatusBadge
                                  label={formatScheduleStatus(group.status)}
                                  className={scheduleStatusClass(group.status)}
                                />
                              </div>
                              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                                {group.routeCount ?? 0} route
                                {(group.routeCount ?? 0) === 1 ? "" : "s"}
                                {(group.pendingRouteCount ?? 0) > 0
                                  ? ` · ${group.pendingRouteCount} pending`
                                  : ""}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group.primaryScheduleId ? (
                                <>
                                  <Link
                                    to={`/schedules/${group.primaryScheduleId}`}
                                    className="ops-btn px-3 py-1.5 text-xs font-semibold"
                                  >
                                    Card view
                                  </Link>
                                  <Link
                                    to={`/schedules/${group.primaryScheduleId}/routes`}
                                    className="ops-btn px-3 py-1.5 text-xs font-semibold"
                                    style={{ color: "var(--accent)" }}
                                  >
                                    Spreadsheet
                                  </Link>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="ops-panel ops-fade overflow-hidden">
              <div className="ops-panel__head px-5 py-4">
                <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
                  Routes · {formatDisplayDate(date)}
                </h2>
              </div>
              <div className="p-5">
                {routesLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="ops-skel h-20 rounded-2xl" />
                    ))}
                  </div>
                ) : routes.length === 0 ? (
                  <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    No routes for this store on this date.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {routes.map((route, index) => (
                      <li key={route.id}>
                        <RouteSummaryRow
                          route={route}
                          index={index + 1}
                          to={`/routes/${route.id}`}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
