import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAssignedCityScope } from "@/modules/scheduling/presentation/hooks/useAssignedCityScope.js";
import {
  useRoutesQuery,
  useStoresQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import {
  addDaysToIsoDate,
  formatDisplayDate,
  todayIsoDate,
} from "@/shared/utils/time.js";
import {
  formatRouteStatus,
  routeStatusClass,
} from "@/modules/scheduling/utils/scheduleStatus.js";
import { DateNavigator } from "../components/DateNavigator.jsx";
import { LocationStoreSection } from "../components/LocationStoreSection.jsx";
import { RouteStatusFilter } from "../components/RouteStatusFilter.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";

const FUTURE_DAYS = 365;

export function RoutesListScreen() {
  const navigate = useNavigate();
  const { assignedCity, isCityLocked } = useAssignedCityScope();
  const [date, setDate] = useState(todayIsoDate());
  const [city, setCity] = useState(assignedCity ?? "");
  const [state, setState] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStore, setSelectedStore] = useState(null);

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
      status: statusFilter === "all" ? undefined : statusFilter,
      page: 1,
      limit: 100,
    }),
    [date, city, state, selectedStore, statusFilter, isCityLocked, assignedCity]
  );

  const { data, isLoading, refetch, isFetching } = useRoutesQuery(listFilters);
  const routes = data?.items ?? [];
  const total = data?.total ?? 0;
  const count = data?.count ?? routes.length;
  const maxDate = addDaysToIsoDate(todayIsoDate(), FUTURE_DAYS);

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-dispatch-text">Routes</h1>
          <p className="text-sm text-dispatch-muted">Browse routes by date and location</p>
        </div>
        <Link
          to="/schedules"
          className="inline-flex items-center gap-2 rounded-xl border border-dispatch-border px-4 py-2.5 text-sm font-bold text-dispatch-muted transition hover:bg-dispatch-bg"
        >
          Schedules
        </Link>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <DateNavigator
          date={date}
          onDateChange={(d) => {
            setDate(d);
            setSelectedStore(null);
          }}
          maxDate={maxDate}
        />

        <div className="grid w-full gap-6 xl:grid-cols-[minmax(300px,380px)_1fr] xl:items-start">
          <div className="space-y-6">
            <LocationStoreSection
              sectionTitle="Filter by location & store"
              stores={allStores}
              isLoadingStores={storesLoading}
              city={city}
              state={state}
              selectedStore={selectedStore}
              cityLocked={isCityLocked}
              onSelectLocation={(c, s) => {
                if (isCityLocked) return;
                setCity(c);
                setState(s);
                setSelectedStore(null);
              }}
              onSelectStore={(store) => {
                setSelectedStore(store);
                if (store) {
                  setCity(store.city);
                  setState(store.state);
                }
              }}
            />

            <RouteStatusFilter
              value={statusFilter}
              onChange={(key) => {
                setStatusFilter(key);
                setSelectedStore(null);
              }}
            />

            {(selectedStore || (!isCityLocked && city.trim())) && (
              <button
                type="button"
                onClick={() => {
                  if (selectedStore) setSelectedStore(null);
                  else {
                    setCity("");
                    setState("");
                  }
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
                    {count} of {total}
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
            ) : routes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-dispatch-border bg-dispatch-surface px-8 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-dispatch-primary-soft text-dispatch-primary">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-dispatch-text">No routes found</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-dispatch-muted">
                  Adjust the date, location, store, or status — or add routes from a schedule.
                </p>
                <Link
                  to="/schedules"
                  className="mt-6 inline-flex rounded-xl bg-dispatch-indigo px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-dispatch-indigo-pressed"
                >
                  View schedules
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {routes.map((route, index) => {
                  const scheduleId = route.schedule?.id ?? route.scheduleId;
                  const storeName = route.schedule?.store?.storeName ?? "Unknown store";
                  const driver =
                    route.driverName ??
                    route.driverEmail ??
                    (route.driverId ? "Offer sent" : "Unassigned");

                  return (
                    <li key={route.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (scheduleId) navigate(`/schedules/${scheduleId}`);
                        }}
                        disabled={!scheduleId}
                        className="w-full rounded-2xl border border-dispatch-border/80 bg-dispatch-surface p-4 text-left shadow-sm transition hover:border-dispatch-primary/30 hover:shadow-md disabled:cursor-default disabled:opacity-70"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dispatch-primary-soft text-dispatch-primary">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-dispatch-text">{storeName}</p>
                            <p className="truncate text-xs text-dispatch-muted">
                              {route.schedule?.city}, {route.schedule?.state}
                              {route.schedule?.store?.storeId
                                ? ` · ${route.schedule.store.storeId}`
                                : ""}
                            </p>
                          </div>
                          <svg className="h-4 w-4 shrink-0 text-dispatch-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dispatch-primary text-xs font-extrabold text-white">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-dispatch-text">
                                {route.routeName || `Route ${index + 1}`}
                              </p>
                              <StatusBadge
                                label={formatRouteStatus(route.status)}
                                className={routeStatusClass(route.status)}
                              />
                            </div>
                            <p className="mt-1 text-xs text-dispatch-muted">
                              {route.teamName ?? "Team"}
                              {route.teamCode ? ` (${route.teamCode})` : ""} · {driver}
                            </p>
                            <p className="mt-1 text-xs text-dispatch-light">
                              {route.arrivalTime} – {route.departureTime}
                              {route.schedule?.date ? ` · ${formatDisplayDate(route.schedule.date)}` : ""}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
