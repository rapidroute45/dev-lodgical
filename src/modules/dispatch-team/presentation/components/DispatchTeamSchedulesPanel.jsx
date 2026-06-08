import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { todayIsoDate } from "@/shared/utils/time.js";
import {
  useSchedulesQuery,
  useStoresQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { DateNavigator } from "@/modules/scheduling/presentation/components/DateNavigator.jsx";
import { LocationStoreSection } from "@/modules/scheduling/presentation/components/LocationStoreSection.jsx";
import { ScheduleStatusFilter } from "@/modules/scheduling/presentation/components/ScheduleStatusFilter.jsx";
import { ScheduleCard } from "@/modules/scheduling/presentation/components/ScheduleCard.jsx";

export function DispatchTeamSchedulesPanel({ city, allowEdit = true }) {
  const memberCity = city?.trim() ?? "";
  const [date, setDate] = useState(todayIsoDate());
  const [state, setState] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStore, setSelectedStore] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { data: allStores = [], isLoading: storesLoading } = useStoresQuery(true);

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

  const summary = useMemo(() => {
    let routes = 0;
    let pending = 0;
    for (const s of schedules) {
      routes += s.routeCount ?? 0;
      pending += s.pendingRouteCount ?? 0;
    }
    return { schedules: schedules.length, routes, pending };
  }, [schedules]);

  if (!memberCity) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
        <p className="font-semibold text-amber-900">No city assigned</p>
        <p className="mt-1 text-sm text-amber-800">
          Assign a city to this dispatch team member to see their schedules.
        </p>
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

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryPill label="Schedules" value={summary.schedules} accent="primary" />
        <SummaryPill label="Routes" value={summary.routes} accent="blue" />
        <SummaryPill label="Pending acceptance" value={summary.pending} accent="orange" />
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

          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-4 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-dispatch-muted">
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
              className="text-sm font-semibold text-dispatch-primary hover:underline"
            >
              Clear store filter
            </button>
          ) : null}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-dispatch-text">
              Schedules in {memberCity}
              {!isLoading && total > 0 ? (
                <span className="ml-2 text-sm font-semibold text-dispatch-muted">
                  {schedules.length} of {total}
                </span>
              ) : null}
            </h2>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-dispatch-border px-3 py-1.5 text-xs font-semibold text-dispatch-muted hover:bg-dispatch-bg"
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-dispatch-border/40" />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-dispatch-border bg-dispatch-surface px-8 py-12 text-center">
              <p className="font-bold text-dispatch-text">No schedules for this day</p>
              <p className="mt-1 text-sm text-dispatch-muted">
                Nothing scheduled in {memberCity} on this date.
              </p>
              <Link
                to="/schedules/create"
                className="mt-4 inline-flex rounded-xl bg-dispatch-indigo px-5 py-2.5 text-sm font-bold text-white hover:bg-dispatch-indigo-pressed"
              >
                Create schedule
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  expanded={expandedId === schedule.id}
                  onToggle={() =>
                    setExpandedId((id) => (id === schedule.id ? null : schedule.id))
                  }
                  allowEdit={allowEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryPill({ label, value, accent }) {
  const styles = {
    primary: "border-dispatch-primary/20 from-dispatch-primary-soft",
    blue: "border-blue-200 from-blue-50",
    orange: "border-orange-200 from-orange-50",
  };
  const valueColor = {
    primary: "text-dispatch-primary",
    blue: "text-dispatch-blue",
    orange: "text-orange-700",
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br to-white px-4 py-3 shadow-sm ${styles[accent]}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-dispatch-muted">{label}</p>
      <p className={`mt-0.5 text-2xl font-extrabold tabular-nums ${valueColor[accent]}`}>
        {value}
      </p>
    </div>
  );
}
