import { useMemo, useState } from "react";
import { useResolvedStoreLocation } from "@/modules/scheduling/presentation/hooks/useResolvedStoreLocation.js";
import { Link } from "react-router-dom";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
import {
  useSchedulesQuery,
  useStoresQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { OpsStatCard } from "@/modules/manager-home/presentation/components/OpsWidgets.jsx";
import { DateNavigator } from "@/modules/scheduling/presentation/components/DateNavigator.jsx";
import { LocationStoreSection } from "@/modules/scheduling/presentation/components/LocationStoreSection.jsx";
import { ScheduleStatusFilter } from "@/modules/scheduling/presentation/components/ScheduleStatusFilter.jsx";
import { ScheduleCard } from "@/modules/scheduling/presentation/components/ScheduleCard.jsx";
import { groupSchedulesByStore } from "@/modules/scheduling/utils/groupSchedulesByStore.js";

export function DispatchTeamSchedulesPanel({ city }) {
  const memberCity = city?.trim() ?? "";
  const { date, setDate } = useOpsDateScope();
  const [state, setState] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStore, setSelectedStore] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { data: allStores = [], isLoading: storesLoading } = useStoresQuery(true);

  useResolvedStoreLocation(allStores, memberCity, state, () => {}, setState);

  const listFilters = useMemo(
    () => ({
      date,
      city: memberCity || undefined,
      state: state.trim() || undefined,
      storeId: selectedStore?.id,
      status: statusFilter,
    }),
    [date, memberCity, state, selectedStore, statusFilter]
  );

  const { data, isLoading, refetch, isFetching } = useSchedulesQuery(
    listFilters,
    Boolean(memberCity)
  );
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
      routes,
      pending,
    };
  }, [schedules, groupedSchedules.length]);

  if (!memberCity) {
    return (
      <div className="ops-banner ops-banner--warning">
        <div>
          <p className="font-semibold">No city assigned</p>
          <p className="mt-1 text-sm">
            Assign a city to this dispatch team member to see their schedules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DateNavigator
        date={date}
        onDateChange={(d) => {
          setDate(d);
          setExpandedId(null);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <OpsStatCard icon="schedule" label="Stores" value={summary.stores} loading={isLoading} delay={0} />
        <OpsStatCard icon="routes" label="Routes" value={summary.routes} loading={isLoading} delay={60} />
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

      <div className="grid w-full gap-6 xl:grid-cols-[minmax(280px,340px)_1fr] xl:items-start">
        <div className="space-y-6">
          <LocationStoreSection
            stores={allStores}
            isLoadingStores={storesLoading}
            city={memberCity}
            state={state}
            selectedStore={selectedStore}
            cityLocked
            onSelectLocation={() => {}}
            onSelectStore={(store) => {
              setSelectedStore(store);
              if (store) setState(store.state);
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
              Schedules in {memberCity}
              {!isLoading && total > 0 ? (
                <span className="ml-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                  {schedules.length} of {total}
                </span>
              ) : null}
            </h2>
            <button
              type="button"
              onClick={() => refetch()}
              className="ops-btn px-3 py-1.5 text-xs font-semibold"
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
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
              <p className="text-lg font-bold" style={{ color: "var(--text)" }}>No schedules for this day</p>
              <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
                Nothing scheduled in {memberCity} on this date.
              </p>
              <Link
                to="/schedules/create"
                className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold"
              >
                Create schedule
              </Link>
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
  );
}
