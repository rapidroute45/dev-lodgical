import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { ScopedEmptyHint } from "@/modules/manager-home/presentation/components/ScopedEmptyHint.jsx";
import { OpsStatCard } from "@/modules/manager-home/presentation/components/OpsWidgets.jsx";
import { todayIsoDate } from "@/shared/utils/time.js";
import {
  useSchedulesQuery,
  useStoresQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { StoreFilterSection } from "../components/StoreFilterSection.jsx";
import { ScheduleStatusFilter } from "../components/ScheduleStatusFilter.jsx";
import { ScheduleCard } from "../components/ScheduleCard.jsx";
import { groupSchedulesByStore } from "@/modules/scheduling/utils/groupSchedulesByStore.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { useOpsElevation } from "@/modules/auth/presentation/context/OpsElevationContext.jsx";

export function SchedulesListScreen() {
  const { user } = useAuth();
  const { canMutateOps } = useOpsElevation();
  const allowCreate = canMutateOps(user?.role);
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(() => searchParams.get("date") ?? todayIsoDate());
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStore, setSelectedStore] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { data: allStores = [], isLoading: storesLoading } = useStoresQuery(true);

  useEffect(() => {
    const queryDate = searchParams.get("date");
    if (queryDate) setDate(queryDate);
  }, [searchParams]);

  useEffect(() => {
    setExpandedId(null);
  }, [date]);

  const listFilters = useMemo(
    () => ({
      date,
      storeId: selectedStore?.id,
      status: statusFilter,
    }),
    [date, selectedStore, statusFilter]
  );

  const { data, isLoading, refetch, isFetching } = useSchedulesQuery(listFilters);
  const schedules = data?.items ?? [];
  const total = data?.total ?? 0;

  const groupedSchedules = useMemo(
    () => groupSchedulesByStore(schedules),
    [schedules]
  );

  const summary = useMemo(() => {
    let routes = 0;
    let pending = 0;
    for (const s of schedules) {
      routes += s.routeCount ?? 0;
      pending += s.pendingRouteCount ?? 0;
    }
    return {
      stores: groupedSchedules.length,
      scheduleCount: schedules.length,
      routes,
      pending,
    };
  }, [schedules, groupedSchedules.length]);

  const topBar = (
    <OpsTopBar date={date} setDate={setDate} onRefresh={refetch} refreshing={isFetching} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Schedules
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Plan and review daily operations
            </p>
          </div>
          {allowCreate ? (
            <Link to="/schedules/create" className="ops-btn ops-btn--accent gap-2 px-5 py-2.5 font-bold">
              <span className="text-lg leading-none">+</span>
              Create schedule
            </Link>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <OpsStatCard
            icon="schedule"
            label="Stores scheduled"
            value={summary.stores}
            loading={isLoading}
            delay={0}
          />
          <OpsStatCard
            icon="routes"
            label="Routes"
            value={summary.routes}
            loading={isLoading}
            delay={60}
          />
          <OpsStatCard
            icon="clock"
            label="Pending acceptance"
            value={summary.pending}
            barColor="var(--amber)"
            percent={summary.routes ? (summary.pending / summary.routes) * 100 : 0}
            loading={isLoading}
            delay={120}
          />
        </div>

        <div className="grid w-full gap-6 xl:grid-cols-[minmax(300px,380px)_1fr] xl:items-start">
          <div className="space-y-5">
            <StoreFilterSection
              stores={allStores}
              isLoadingStores={storesLoading}
              selectedStore={selectedStore}
              onSelectStore={(store) => {
                setSelectedStore(store);
                setExpandedId(null);
              }}
            />

            <div className="ops-panel ops-fade p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Filter by status
              </p>
              <ScheduleStatusFilter
                value={statusFilter}
                onChange={(key) => {
                  setStatusFilter(key);
                  setExpandedId(null);
                }}
              />
            </div>

            {selectedStore ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedStore(null);
                  setExpandedId(null);
                }}
                className="text-sm font-semibold hover:underline"
                style={{ color: "var(--accent)" }}
              >
                Clear store filter
              </button>
            ) : null}
          </div>

          <div className="min-w-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
                Results
                {!isLoading && total > 0 ? (
                  <span className="ml-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                    {groupedSchedules.length} store{groupedSchedules.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="ops-skel h-28 rounded-2xl" />
                ))}
              </div>
            ) : groupedSchedules.length === 0 ? (
              <div className="ops-panel ops-fade px-8 py-14 text-center">
                <div className="ops-stat__icon mx-auto mb-4 flex h-14 w-14 items-center justify-center">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-bold" style={{ color: "var(--text)" }}>No schedules found</p>
                <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
                  Adjust the date, store, or status — or create a new schedule for this day.
                </p>
                <ScopedEmptyHint show={!isLoading} />
                {allowCreate ? (
                  <Link
                    to="/schedules/create"
                    className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold"
                  >
                    Create schedule
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                {groupedSchedules.map((group) => (
                  <ScheduleCard
                    key={group.key}
                    group={group}
                    expanded={expandedId === group.key}
                    onToggle={() =>
                      setExpandedId((id) => (id === group.key ? null : group.key))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
