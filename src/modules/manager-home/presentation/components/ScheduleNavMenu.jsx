import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCitiesQuery,
  useTeamsQuery,
  useRoutesQuery,
  useSchedulesQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import {
  ChevronRight,
  MenuBack,
  MenuEmpty,
  MenuPanel,
  MenuRail,
  MenuRow,
  MenuSearch,
  MenuTrigger,
  RouteRow,
  filterByQuery,
  useMenuDismiss,
} from "@/modules/manager-home/presentation/components/opsNavShared.jsx";
import { useOpsNavScope } from "@/modules/manager-home/presentation/hooks/useOpsNavScope.js";
import {
  filterCitiesByScope,
  filterRoutesByScope,
} from "@/modules/manager-home/utils/opsNavScope.js";

const CATEGORIES = [
  { key: "cities", label: "Cities" },
  { key: "teams", label: "Teams" },
  { key: "routes", label: "Routes" },
];

const SCHEDULE_ICON = (
  <svg className="h-4 w-4" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export function ScheduleNavMenu({ date, open, onToggle, onClose }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const { assignedCities, isCityScoped, routesQueryCity, routesQueryState, globalState } = useOpsNavScope();

  const [category, setCategory] = useState("cities");
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [search, setSearch] = useState("");

  useMenuDismiss(open, close, rootRef);

  function resetDrill() {
    setSelectedCity(null);
    setSelectedTeam(null);
    setSearch("");
  }

  function close() {
    resetDrill();
    onClose();
  }

  function switchCategory(key) {
    setCategory(key);
    resetDrill();
  }

  const citiesQuery = useCitiesQuery(open);
  const teamsQuery = useTeamsQuery(open);
  const allRoutesQuery = useRoutesQuery(
    { date, city: routesQueryCity, state: routesQueryState, limit: 200 },
    open && (category === "routes" || category === "teams")
  );
  const citySchedulesQuery = useSchedulesQuery(
    { date, city: selectedCity ?? routesQueryCity ?? undefined, state: routesQueryState },
    Boolean(open && selectedCity)
  );
  const teamRoutesQuery = useRoutesQuery(
    { date, city: routesQueryCity, state: routesQueryState, teamId: selectedTeam?.id, limit: 200 },
    Boolean(open && selectedTeam?.id)
  );

  const scopedCities = useMemo(
    () => filterCitiesByScope(citiesQuery.data ?? [], assignedCities, globalState),
    [citiesQuery.data, assignedCities, globalState]
  );

  const filteredCities = useMemo(
    () => filterByQuery(scopedCities, search, (c) => c.name ?? ""),
    [scopedCities, search]
  );
  const filteredTeams = useMemo(() => {
    let teams = teamsQuery.data ?? [];
    if (isCityScoped) {
      const scopedRoutes = filterRoutesByScope(allRoutesQuery.data?.items ?? [], assignedCities, globalState);
      const teamIds = new Set(scopedRoutes.map((route) => route.teamId).filter(Boolean));
      teams = teams.filter((team) => teamIds.has(team.id));
    }
    return filterByQuery(teams, search, (t) => `${t.name ?? ""} ${t.code ?? ""}`);
  }, [teamsQuery.data, allRoutesQuery.data, assignedCities, globalState, isCityScoped, search]);
  const filteredRoutes = useMemo(() => {
    const items = filterRoutesByScope(allRoutesQuery.data?.items ?? [], assignedCities, globalState);
    return filterByQuery(items, search, (r) => r.routeName ?? "Route");
  }, [allRoutesQuery.data, assignedCities, globalState, search]);

  function gotoRoute(id) {
    if (!id) return;
    navigate(`/routes/${id}`);
    close();
  }
  function gotoSchedule(id) {
    if (!id) return;
    navigate(`/schedules/${id}`);
    close();
  }

  return (
    <div className="ops-menu" ref={rootRef}>
      <MenuTrigger label="Schedule" icon={SCHEDULE_ICON} open={open} onToggle={onToggle} />

      {open ? (
        <MenuPanel>
          <MenuRail categories={CATEGORIES} activeKey={category} onSelect={switchCategory} />
          <div className="ops-menu__pane">
            {category === "cities" && !selectedCity ? (
              <>
                <MenuSearch value={search} onChange={setSearch} placeholder="Search cities…" />
                <div className="ops-menu__list">
                  {citiesQuery.isLoading ? (
                    <MenuEmpty>Loading cities…</MenuEmpty>
                  ) : filteredCities.length === 0 ? (
                    <MenuEmpty>No cities found.</MenuEmpty>
                  ) : (
                    filteredCities.map((c) => (
                      <MenuRow
                        key={c.name}
                        onClick={() => {
                          setSelectedCity(c.name);
                          setSearch("");
                        }}
                      >
                        <span className="truncate text-sm font-medium">{c.name}</span>
                        <ChevronRight />
                      </MenuRow>
                    ))
                  )}
                </div>
              </>
            ) : null}

            {category === "cities" && selectedCity ? (
              <>
                <MenuBack label={`Schedules in ${selectedCity}`} onClick={() => setSelectedCity(null)} />
                <div className="ops-menu__list">
                  {citySchedulesQuery.isLoading ? (
                    <MenuEmpty>Loading schedules…</MenuEmpty>
                  ) : (citySchedulesQuery.data?.items ?? []).length === 0 ? (
                    <MenuEmpty>
                      {isCityScoped
                        ? `No schedules for this date in your assigned cities.`
                        : `No schedules for this date in ${selectedCity}.`}
                    </MenuEmpty>
                  ) : (
                    (citySchedulesQuery.data?.items ?? []).map((s) => (
                      <MenuRow key={s.id} onClick={() => gotoSchedule(s.id)}>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{s.store?.storeName ?? "Store"}</span>
                          <span className="block truncate text-xs" style={{ color: "var(--text-dim)" }}>
                            {s.routeCount ?? 0} routes · {s.status ?? "—"}
                          </span>
                        </span>
                        <ChevronRight />
                      </MenuRow>
                    ))
                  )}
                </div>
              </>
            ) : null}

            {category === "teams" && !selectedTeam ? (
              <>
                <MenuSearch value={search} onChange={setSearch} placeholder="Search teams…" />
                <div className="ops-menu__list">
                  {teamsQuery.isLoading ? (
                    <MenuEmpty>Loading teams…</MenuEmpty>
                  ) : filteredTeams.length === 0 ? (
                    <MenuEmpty>No teams found.</MenuEmpty>
                  ) : (
                    filteredTeams.map((t) => (
                      <MenuRow
                        key={t.id}
                        onClick={() => {
                          setSelectedTeam({ id: t.id, name: t.name });
                          setSearch("");
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{t.name}</span>
                          {t.code ? (
                            <span className="block truncate text-xs" style={{ color: "var(--text-dim)" }}>
                              {t.code}
                            </span>
                          ) : null}
                        </span>
                        <ChevronRight />
                      </MenuRow>
                    ))
                  )}
                </div>
              </>
            ) : null}

            {category === "teams" && selectedTeam ? (
              <>
                <MenuBack label={`Routes · ${selectedTeam.name}`} onClick={() => setSelectedTeam(null)} />
                <div className="ops-menu__list">
                  {teamRoutesQuery.isLoading ? (
                    <MenuEmpty>Loading routes…</MenuEmpty>
                  ) : filterRoutesByScope(teamRoutesQuery.data?.items ?? [], assignedCities, globalState).length === 0 ? (
                    <MenuEmpty>No routes for this team on selected date.</MenuEmpty>
                  ) : (
                    filterRoutesByScope(teamRoutesQuery.data?.items ?? [], assignedCities, globalState).map((r) => (
                      <RouteRow key={r.id} route={r} onClick={() => gotoRoute(r.id)} />
                    ))
                  )}
                </div>
              </>
            ) : null}

            {category === "routes" ? (
              <>
                <MenuSearch value={search} onChange={setSearch} placeholder="Search routes…" />
                <div className="ops-menu__list">
                  {allRoutesQuery.isLoading ? (
                    <MenuEmpty>Loading routes…</MenuEmpty>
                  ) : filteredRoutes.length === 0 ? (
                    <MenuEmpty>No routes on selected date.</MenuEmpty>
                  ) : (
                    filteredRoutes.map((r) => <RouteRow key={r.id} route={r} onClick={() => gotoRoute(r.id)} />)
                  )}
                </div>
              </>
            ) : null}
          </div>
        </MenuPanel>
      ) : null}
    </div>
  );
}
