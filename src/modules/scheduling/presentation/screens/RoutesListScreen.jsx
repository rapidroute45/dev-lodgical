import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { ScopedEmptyHint } from "@/modules/manager-home/presentation/components/ScopedEmptyHint.jsx";
import { OpsStatCard } from "@/modules/manager-home/presentation/components/OpsWidgets.jsx";
import {
  useRoutesQuery,
  useStoresQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { todayIsoDate } from "@/shared/utils/time.js";
import { StoreFilterSection } from "../components/StoreFilterSection.jsx";
import { RouteStatusFilter } from "../components/RouteStatusFilter.jsx";
import { RouteSummaryRow } from "../components/RouteSummaryRow.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

function groupRoutesByStore(routes) {
  const groups = new Map();
  for (const route of routes) {
    const store = route.schedule?.store;
    const key = store?.id ?? `${route.schedule?.city}-${route.schedule?.state}-unknown`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        storeName: store?.storeName ?? "Unknown store",
        storeMeta: [
          route.schedule?.city && route.schedule?.state
            ? `${route.schedule.city}, ${route.schedule.state}`
            : null,
          store?.storeId ?? null,
        ]
          .filter(Boolean)
          .join(" · "),
        routes: [],
      });
    }
    groups.get(key).routes.push(route);
  }
  return Array.from(groups.values());
}

function summarizeRoutes(routes) {
  let pending = 0;
  let inProgress = 0;
  let unassigned = 0;
  for (const route of routes) {
    const status = route.status ?? "pending";
    if (status === "pending" || status === "assigned") pending += 1;
    if (status === "active" || status === "in_progress") inProgress += 1;
    if (!route.driverId) unassigned += 1;
  }
  return { total: routes.length, pending, inProgress, unassigned };
}

export function RoutesListScreen() {
  const [date, setDate] = useState(todayIsoDate());
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStore, setSelectedStore] = useState(null);
  const [search, setSearch] = useState("");

  const { data: allStores = [], isLoading: storesLoading } = useStoresQuery(true);

  useEffect(() => {
    setSearch("");
  }, [date]);

  const listFilters = useMemo(
    () => ({
      date,
      storeId: selectedStore?.id,
      status: statusFilter === "all" ? undefined : statusFilter,
      page: 1,
      limit: 100,
    }),
    [date, selectedStore, statusFilter]
  );

  const { data, isLoading, refetch, isFetching } = useRoutesQuery(listFilters);
  const routes = data?.items ?? [];
  const total = data?.total ?? 0;
  const count = data?.count ?? routes.length;

  const summary = useMemo(() => summarizeRoutes(routes), [routes]);

  const filteredRoutes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter((route) => {
      const haystack = [
        route.routeName,
        route.driverName,
        route.driverEmail,
        route.teamName,
        route.teamCode,
        route.schedule?.store?.storeName,
        route.schedule?.store?.storeId,
        route.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [routes, search]);

  const groupedRoutes = useMemo(() => groupRoutesByStore(filteredRoutes), [filteredRoutes]);

  const topBar = (
    <OpsTopBar date={date} setDate={setDate} onRefresh={refetch} refreshing={isFetching} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Routes
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Browse routes by date and location
            </p>
          </div>
          <Link to="/schedules" className="ops-btn px-5 py-2.5 font-bold">
            Schedules
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OpsStatCard icon="routes" label="Total routes" value={summary.total} loading={isLoading} delay={0} />
          <OpsStatCard
            icon="clock"
            label="Pending / awaiting"
            value={summary.pending}
            barColor="var(--amber)"
            loading={isLoading}
            delay={60}
          />
          <OpsStatCard
            icon="active"
            label="In progress"
            value={summary.inProgress}
            barColor="var(--accent)"
            loading={isLoading}
            delay={120}
          />
          <OpsStatCard
            icon="drivers"
            label="Unassigned"
            value={summary.unassigned}
            barColor="var(--rose)"
            percent={summary.total ? (summary.unassigned / summary.total) * 100 : 0}
            loading={isLoading}
            delay={180}
          />
        </div>

        <div className="grid w-full gap-6 xl:grid-cols-[minmax(300px,380px)_1fr] xl:items-start">
          <div className="space-y-5">
            <StoreFilterSection
              sectionTitle="Filter by store"
              stores={allStores}
              isLoadingStores={storesLoading}
              selectedStore={selectedStore}
              onSelectStore={setSelectedStore}
            />

            <div className="ops-panel ops-fade p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Route status
              </p>
              <RouteStatusFilter value={statusFilter} onChange={setStatusFilter} />
            </div>

            {selectedStore ? (
              <button
                type="button"
                onClick={() => setSelectedStore(null)}
                className="text-sm font-semibold hover:underline"
                style={{ color: "var(--accent)" }}
              >
                Clear store filter
              </button>
            ) : null}
          </div>

          <div className="min-w-0 space-y-4">
            <div className="ops-panel ops-fade overflow-hidden">
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
                  Results
                  {!isLoading && total > 0 ? (
                    <span className="ml-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                      {search.trim() ? `${filteredRoutes.length} shown · ` : ""}
                      {count} of {total}
                    </span>
                  ) : null}
                </h2>
              </div>

              {!isLoading && routes.length > 0 ? (
                <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="ops-menu__search">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search routes, drivers, teams…"
                    />
                  </div>
                </div>
              ) : null}

              {isLoading ? (
                <div className="space-y-4 p-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="ops-skel h-28 rounded-2xl" />
                  ))}
                </div>
              ) : routes.length === 0 ? (
                <div className="px-8 py-14 text-center">
                  <div className="ops-stat__icon mx-auto mb-4 flex h-14 w-14 items-center justify-center">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold" style={{ color: "var(--text)" }}>No routes found</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
                    Adjust the date, store, or status — or add routes from a schedule.
                  </p>
                  <ScopedEmptyHint show={!isLoading} />
                  <Link to="/schedules" className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold">
                    View schedules
                  </Link>
                </div>
              ) : filteredRoutes.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  No routes match your search.
                </p>
              ) : (
                <div className="space-y-4 p-5">
                  {groupedRoutes.map((group) => (
                    <section key={group.key} className="ops-card ops-fade overflow-hidden">
                      <div
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}
                      >
                        <span className="ops-avatar flex h-9 w-9 shrink-0 items-center justify-center">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>
                            {group.storeName}
                          </p>
                          {group.storeMeta ? (
                            <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                              {group.storeMeta}
                            </p>
                          ) : null}
                        </div>
                        <span className="ops-teamtag">{group.routes.length} route{group.routes.length === 1 ? "" : "s"}</span>
                      </div>
                      <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                        {group.routes.map((route, index) => (
                          <li key={route.id}>
                            <RouteSummaryRow
                              route={route}
                              index={index + 1}
                              nested
                              to={`/routes/${route.id}`}
                            />
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
