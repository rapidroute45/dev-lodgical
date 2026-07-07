import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { useRoutesSearchQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { RouteSummaryRow } from "@/modules/scheduling/presentation/components/RouteSummaryRow.jsx";
import { ScheduleAttribution } from "@/modules/scheduling/presentation/components/ScheduleAttribution.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { isFullManager } from "@/shared/utils/constants.js";
import { addDaysToIsoDate, todayIsoDate } from "@/shared/utils/time.js";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_WINDOW_DAYS = 30;

export function AllRoutesSearchScreen() {
  const { user } = useAuth();
  const showDispatchTeam = isFullManager(user?.role);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const dateRange = useMemo(() => {
    const toDate = todayIsoDate();
    return { fromDate: addDaysToIsoDate(toDate, -(SEARCH_WINDOW_DAYS - 1)), toDate };
  }, []);

  const { data, isLoading, isError, refetch, isFetching } = useRoutesSearchQuery(
    {
      q: debouncedSearch,
      fromDate: dateRange.fromDate,
      toDate: dateRange.toDate,
      limit: 100,
    },
    true
  );

  const routes = data?.items ?? [];
  const total = data?.total ?? 0;

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              All routes
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Search by team, driver, dispatch team, route name, city, or state
            </p>
          </div>
          <Link to="/routes" className="ops-btn px-5 py-2.5 font-bold">
            Browse by date
          </Link>
        </div>

        <div className="ops-panel ops-fade p-5">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
            Search routes
          </label>
          <div className="ops-menu__search">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Team, driver, dispatch, route name, city, state…"
              autoFocus
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-24 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="ops-banner ops-banner--error">Could not search routes</div>
        ) : routes.length === 0 ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>No routes found</p>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
              {debouncedSearch
                ? `No routes match "${debouncedSearch}". Try another search term.`
                : "No routes in the last 30 days."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              {total > routes.length ? `${routes.length} shown · ${total} total` : `${routes.length} route${routes.length === 1 ? "" : "s"}`}
            </p>
            {routes.map((route, index) => {
              const schedule = route.schedule;
              const cityState = [schedule?.city, schedule?.state].filter(Boolean).join(", ");
              const storeName = schedule?.store?.storeName;

              return (
                <div key={route.id} className="ops-card ops-fade overflow-hidden">
                  <RouteSummaryRow route={route} index={index + 1} nested to={`/routes/${route.id}`} />
                  <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pl-[4.25rem] text-xs" style={{ color: "var(--text-muted)" }}>
                    {cityState ? <span className="ops-citychip">{cityState}</span> : null}
                    {storeName ? <span>{storeName}</span> : null}
                    <ScheduleAttribution
                      dispatchTeam={schedule?.dispatchTeam ?? null}
                      createdByName={schedule?.createdByName ?? route.assignedByName ?? null}
                      showDispatchTeam={showDispatchTeam}
                    />
                  </div>
                </div>
              );
            })}
            {isFetching && !isLoading ? (
              <p className="text-center text-xs" style={{ color: "var(--text-dim)" }}>Refreshing…</p>
            ) : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
