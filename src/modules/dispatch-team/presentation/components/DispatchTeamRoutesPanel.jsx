import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { DateNavigator } from "@/modules/scheduling/presentation/components/DateNavigator.jsx";
import { LocationStoreSection } from "@/modules/scheduling/presentation/components/LocationStoreSection.jsx";
import { RouteStatusFilter } from "@/modules/scheduling/presentation/components/RouteStatusFilter.jsx";
import { StatusBadge } from "@/modules/scheduling/presentation/components/StatusBadge.jsx";

const FUTURE_DAYS = 365;

export function DispatchTeamRoutesPanel({ city }) {
  const navigate = useNavigate();
  const memberCity = city?.trim() ?? "";
  const [date, setDate] = useState(todayIsoDate());
  const [state, setState] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStore, setSelectedStore] = useState(null);

  const { data: allStores = [], isLoading: storesLoading } = useStoresQuery(true);

  const listFilters = useMemo(
    () => ({
      date,
      city: memberCity || undefined,
      state: state.trim() || undefined,
      storeId: selectedStore?.id,
      status: statusFilter === "all" ? undefined : statusFilter,
      page: 1,
      limit: 100,
    }),
    [date, memberCity, state, selectedStore, statusFilter]
  );

  const { data, isLoading, refetch, isFetching } = useRoutesQuery(
    listFilters,
    Boolean(memberCity)
  );
  const routes = data?.items ?? [];
  const total = data?.total ?? 0;
  const count = data?.count ?? routes.length;
  const maxDate = addDaysToIsoDate(todayIsoDate(), FUTURE_DAYS);

  if (!memberCity) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
        <p className="font-semibold text-amber-900">No city assigned</p>
        <p className="mt-1 text-sm text-amber-800">
          Assign a city to this dispatch team member to see their routes.
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
          setSelectedStore(null);
        }}
        maxDate={maxDate}
      />

      <div className="grid w-full gap-6 xl:grid-cols-[minmax(280px,340px)_1fr] xl:items-start">
        <div className="space-y-6">
          <LocationStoreSection
            sectionTitle="Filter by store"
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
            }}
          />

          <RouteStatusFilter
            value={statusFilter}
            onChange={(key) => {
              setStatusFilter(key);
              setSelectedStore(null);
            }}
          />

          {selectedStore ? (
            <button
              type="button"
              onClick={() => setSelectedStore(null)}
              className="text-sm font-semibold text-dispatch-primary hover:underline"
            >
              Clear store filter
            </button>
          ) : null}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-dispatch-text">
              Routes in {memberCity}
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
            <div className="rounded-2xl border border-dashed border-dispatch-border bg-dispatch-surface px-8 py-12 text-center">
              <p className="font-bold text-dispatch-text">No routes for this day</p>
              <p className="mt-1 text-sm text-dispatch-muted">
                No routes in {memberCity} on this date.
              </p>
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
                    <div className="rounded-2xl border border-dispatch-border/80 bg-dispatch-surface p-4 shadow-sm">
                      <button
                        type="button"
                        onClick={() => {
                          if (scheduleId) navigate(`/schedules/${scheduleId}`);
                        }}
                        disabled={!scheduleId}
                        className="w-full text-left disabled:cursor-default disabled:opacity-70"
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
                            </p>
                          </div>
                          <StatusBadge
                            label={formatRouteStatus(route.status)}
                            className={routeStatusClass(route.status)}
                          />
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dispatch-primary text-xs font-extrabold text-white">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-dispatch-text">
                              {route.routeName || `Route ${index + 1}`}
                            </p>
                            <p className="mt-1 text-xs text-dispatch-muted">
                              {route.teamName ?? "Team"}
                              {route.teamCode ? ` (${route.teamCode})` : ""} · {driver}
                            </p>
                            <p className="mt-1 text-xs text-dispatch-light">
                              {route.arrivalTime} – {route.departureTime}
                              {route.schedule?.date
                                ? ` · ${formatDisplayDate(route.schedule.date)}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </button>

                      {scheduleId ? (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-dispatch-border pt-3">
                          <Link
                            to={`/schedules/${scheduleId}`}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-dispatch-primary hover:bg-dispatch-primary-soft"
                          >
                            View schedule
                          </Link>
                          <Link
                            to={`/schedules/${scheduleId}/edit`}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-dispatch-muted hover:bg-dispatch-bg"
                          >
                            Edit schedule & routes
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
