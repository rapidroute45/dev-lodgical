import { useEffect, useMemo, useState } from "react";
import { useAssignedCityScope } from "@/modules/scheduling/presentation/hooks/useAssignedCityScope.js";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { todayIsoDate } from "@/shared/utils/time.js";
import {
  useSchedulesQuery,
  useStoresQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { DateNavigator } from "../components/DateNavigator.jsx";
import { LocationStoreSection } from "../components/LocationStoreSection.jsx";
import { ScheduleStatusFilter } from "../components/ScheduleStatusFilter.jsx";
import { ScheduleCard } from "../components/ScheduleCard.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";

export function SchedulesListScreen() {
  const { assignedCity, isCityLocked } = useAssignedCityScope();
  const [date, setDate] = useState(todayIsoDate());
  const [city, setCity] = useState(assignedCity ?? "");
  const [state, setState] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStore, setSelectedStore] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { data: allStores = [], isLoading: storesLoading } = useStoresQuery(true);

  useEffect(() => {
    if (assignedCity) setCity(assignedCity);
  }, [assignedCity]);

  const listFilters = useMemo(
    () => ({
      date,
      city: (isCityLocked ? assignedCity : city.trim()) || undefined,
      state: state.trim() || undefined,
      storeId: selectedStore?.id,
      status: statusFilter,
    }),
    [date, city, state, selectedStore, statusFilter, isCityLocked, assignedCity]
  );

  const { data, isLoading, refetch, isFetching } = useSchedulesQuery(listFilters);
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

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-dispatch-text">Schedules</h1>
          <p className="text-sm text-dispatch-muted">
            Plan and review daily operations
          </p>
        </div>
        <Link
          to="/schedules/create"
          className="inline-flex items-center gap-2 rounded-xl bg-dispatch-indigo px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-dispatch-primary/25 transition hover:bg-dispatch-indigo-pressed"
        >
          <span className="text-lg leading-none">+</span>
          Create schedule
        </Link>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <DateNavigator date={date} onDateChange={(d) => { setDate(d); setExpandedId(null); }} />

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-3">
          <SummaryPill label="Schedules" value={summary.schedules} accent="primary" />
          <SummaryPill label="Routes" value={summary.routes} accent="blue" />
          <SummaryPill label="Pending acceptance" value={summary.pending} accent="orange" />
        </div>

        <div className="grid w-full gap-6 xl:grid-cols-[minmax(300px,380px)_1fr] xl:items-start">
        <div className="space-y-6">
        <LocationStoreSection
          stores={allStores}
          isLoadingStores={storesLoading}
          city={city}
          state={state}
          selectedStore={selectedStore}
          onSelectLocation={(c, s) => {
            setCity(c);
            setState(s);
            setSelectedStore(null);
            setExpandedId(null);
          }}
          onSelectStore={(store) => {
            setSelectedStore(store);
            if (store) {
              setCity(store.city);
              setState(store.state);
            }
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

        {(selectedStore || city.trim()) && (
          <button
            type="button"
            onClick={() => {
              if (selectedStore) setSelectedStore(null);
              else {
                setCity("");
                setState("");
              }
              setExpandedId(null);
            }}
            className="text-sm font-semibold text-dispatch-primary hover:underline"
          >
            {selectedStore ? "Clear store filter" : "Clear location filter"}
          </button>
        )}
        </div>

        <div className="min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-dispatch-text">
            Results
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
          <div className="rounded-2xl border border-dashed border-dispatch-border bg-dispatch-surface px-8 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-dispatch-primary-soft text-dispatch-primary">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-dispatch-text">No schedules found</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-dispatch-muted">
              Adjust the date, location, store, or status — or create a new schedule for this day.
            </p>
            <Link
              to="/schedules/create"
              className="mt-6 inline-flex rounded-xl bg-dispatch-indigo px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-dispatch-indigo-pressed"
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
      <p className="text-[10px] font-bold uppercase tracking-wide text-dispatch-muted">
        {label}
      </p>
      <p className={`mt-0.5 text-2xl font-extrabold tabular-nums ${valueColor[accent]}`}>
        {value}
      </p>
    </div>
  );
}
