import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { useChatDriversQuery } from "@/modules/chat/infrastructure/api/chat.queries.js";
import {
  useRoutesQuery,
  useTeamQuery,
  useTeamsQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { useAllUsersQuery } from "@/modules/users/infrastructure/api/users.queries.js";
import { MANAGER_ROLES, UserRole, UserStatus } from "@/shared/utils/constants.js";
import { getUserAssignedCities } from "@/shared/utils/assignedCities.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import {
  ActivityBadge,
  ChevronRight,
  MemberDetailPane,
  MenuBack,
  MenuEmpty,
  MenuPanel,
  MenuRail,
  MenuRow,
  MenuSearch,
  MenuSectionLabel,
  MenuTrigger,
  RouteRow,
  ScheduleRow,
  filterByQuery,
  schedulesFromRoutes,
  useMenuDismiss,
} from "@/modules/manager-home/presentation/components/opsNavShared.jsx";
import { useOpsNavScope } from "@/modules/manager-home/presentation/hooks/useOpsNavScope.js";
import { filterRoutesByScope } from "@/modules/manager-home/utils/opsNavScope.js";
import {
  buildRouteActivityMaps,
  filterRoutesForNavViewer,
} from "@/modules/manager-home/utils/opsNavRouteActivity.js";

const USER_ICON = (
  <svg className="h-4 w-4" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ALL_CATEGORIES = [
  { key: "dispatch_team", label: "Dispatch team" },
  { key: "driver", label: "Driver" },
  { key: "team", label: "Team" },
];

const DISPATCH_TEAM_CATEGORIES = [
  { key: "driver", label: "Driver" },
  { key: "team", label: "Team" },
];

const DRIVER_ROLES = new Set([UserRole.DRIVER, UserRole.TEAM_DRIVER]);

function memberName(user) {
  return user.displayName ?? resolveDisplayName(user.fullName, user.email);
}

function formatRoleLabel(role) {
  if (!role) return "—";
  return role.replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeDriverRecord(user, teamHint) {
  return {
    id: user.id,
    email: user.email ?? null,
    fullName: user.fullName ?? null,
    displayName: user.displayName ?? resolveDisplayName(user.fullName, user.email),
    role: user.role ?? UserRole.DRIVER,
    teamId: user.teamId ?? teamHint?.teamId ?? null,
    teamName: user.teamName ?? teamHint?.teamName ?? null,
  };
}

function teamMembersFromDetail(detail) {
  if (!detail) return [];
  const byId = new Map();
  const add = (member) => {
    if (!member?.id || byId.has(member.id)) return;
    byId.set(member.id, {
      id: member.id,
      email: member.email ?? null,
      fullName: member.fullName ?? null,
      displayName: member.displayName ?? resolveDisplayName(member.fullName, member.email),
      role: member.role ?? UserRole.DRIVER,
      teamId: detail.id,
      teamName: detail.name,
    });
  };
  if (detail.teamLead) add(detail.teamLead);
  for (const member of detail.drivers ?? []) add(member);
  for (const member of detail.members ?? []) add(member);
  return [...byId.values()];
}

export function UserNavMenu({ date, open, onToggle, onClose }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const { user } = useAuth();
  const { assignedCities, isDispatchTeam, routesQueryCity, routesQueryState, globalState } = useOpsNavScope();

  const [category, setCategory] = useState("driver");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamPane, setTeamPane] = useState("overview");
  const [selectedMember, setSelectedMember] = useState(null);
  const [search, setSearch] = useState("");

  useMenuDismiss(open, close, rootRef, panelRef);

  function resetDrill() {
    setSelectedTeam(null);
    setTeamPane("overview");
    setSelectedMember(null);
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

  const usersQuery = useAllUsersQuery({ status: UserStatus.ACTIVE }, open && !isDispatchTeam);
  const chatDriversQuery = useChatDriversQuery(open && isDispatchTeam);
  const teamsQuery = useTeamsQuery(open);
  const teamDetailQuery = useTeamQuery(
    selectedTeam?.id,
    open && Boolean(selectedTeam?.id)
  );
  const routesQuery = useRoutesQuery(
    { date, city: routesQueryCity, state: routesQueryState, limit: 300 },
    open
  );

  const allUsers = usersQuery.data ?? [];
  const chatDrivers = chatDriversQuery.data ?? [];
  const scopedRoutes = useMemo(
    () => filterRoutesByScope(routesQuery.data?.items ?? [], assignedCities, globalState),
    [routesQuery.data, assignedCities, globalState]
  );
  const viewerRoutes = useMemo(
    () => filterRoutesForNavViewer(scopedRoutes, user),
    [scopedRoutes, user]
  );
  const { byDriver, byTeam } = useMemo(
    () => buildRouteActivityMaps(scopedRoutes, user),
    [scopedRoutes, user]
  );

  const categories = isDispatchTeam ? DISPATCH_TEAM_CATEGORIES : ALL_CATEGORIES;

  const driverTeamHints = useMemo(() => {
    const hints = new Map();
    for (const route of scopedRoutes) {
      if (!route.driverId) continue;
      const key = String(route.driverId);
      if (hints.has(key)) continue;
      hints.set(key, {
        teamId: route.teamId ?? null,
        teamName: route.teamName ?? route.teamCode ?? null,
      });
    }
    return hints;
  }, [scopedRoutes]);

  const dispatchMembers = useMemo(
    () => allUsers.filter((u) => u.role === UserRole.DISPATCH_TEAM),
    [allUsers]
  );
  const drivers = useMemo(() => {
    if (isDispatchTeam) {
      return chatDrivers.map((driver) =>
        normalizeDriverRecord(driver, driverTeamHints.get(String(driver.id)))
      );
    }
    return allUsers
      .filter((u) => DRIVER_ROLES.has(u.role))
      .map((driver) => normalizeDriverRecord(driver, driverTeamHints.get(String(driver.id))));
  }, [isDispatchTeam, chatDrivers, allUsers, driverTeamHints]);

  const driversLoading = isDispatchTeam ? chatDriversQuery.isLoading : usersQuery.isLoading;
  const filteredDispatch = useMemo(
    () => filterByQuery(dispatchMembers, search, (u) => `${memberName(u)} ${u.email ?? ""}`),
    [dispatchMembers, search]
  );
  const filteredDrivers = useMemo(
    () => filterByQuery(drivers, search, (u) => `${memberName(u)} ${u.email ?? ""}`),
    [drivers, search]
  );
  const filteredTeams = useMemo(() => {
    const teams = teamsQuery.data ?? [];
    return filterByQuery(teams, search, (t) => `${t.name ?? ""} ${t.code ?? ""}`);
  }, [teamsQuery.data, search]);

  const scopedTeamRoutes = useMemo(() => {
    if (!selectedTeam?.id) return [];
    return viewerRoutes.filter((route) => String(route.teamId) === String(selectedTeam.id));
  }, [viewerRoutes, selectedTeam]);

  const teamMembers = useMemo(() => {
    if (!selectedTeam) return [];
    if (teamDetailQuery.data) {
      return teamMembersFromDetail(teamDetailQuery.data);
    }
    return allUsers.filter((u) => String(u.teamId ?? "") === String(selectedTeam.id));
  }, [allUsers, selectedTeam, teamDetailQuery.data]);

  const filteredTeamMembers = useMemo(
    () => filterByQuery(teamMembers, search, (u) => `${memberName(u)} ${u.email ?? ""}`),
    [teamMembers, search]
  );

  const memberRoutes = useMemo(() => {
    if (!selectedMember) return [];
    if (DRIVER_ROLES.has(selectedMember.role)) {
      return viewerRoutes.filter((route) => route.driverId === selectedMember.id);
    }
    if (selectedMember.role === UserRole.TEAM_LEAD && selectedMember.teamId) {
      return viewerRoutes.filter((route) => route.teamId === selectedMember.teamId);
    }
    if (MANAGER_ROLES.includes(selectedMember.role)) {
      return viewerRoutes;
    }
    if (selectedMember.role === UserRole.DISPATCH_TEAM) {
      const cities = getUserAssignedCities(selectedMember).map((c) => c.toLowerCase());
      if (!cities.length) return [];
      return viewerRoutes.filter((route) => {
        const city = (route.schedule?.city ?? route.location ?? route.city ?? "").toLowerCase();
        return cities.some((c) => city.includes(c) || c.includes(city));
      });
    }
    return viewerRoutes.filter(
      (route) =>
        route.driverId === selectedMember.id || route.teamId === selectedMember.teamId
    );
  }, [viewerRoutes, selectedMember]);

  const memberSchedules = useMemo(
    () => schedulesFromRoutes(memberRoutes),
    [memberRoutes]
  );

  const teamSchedules = useMemo(
    () => schedulesFromRoutes(scopedTeamRoutes),
    [scopedTeamRoutes]
  );

  function openMember(user) {
    setSelectedMember(user);
    setSearch("");
  }

  function openTeam(team) {
    setSelectedTeam({
      id: team.id,
      name: team.name,
      code: team.code,
      memberCount: team.memberCount,
    });
    setTeamPane("overview");
    setSearch("");
  }

  function gotoRoute(id) {
    navigate(`/routes/${id}`);
    close();
  }

  function gotoSchedule(id) {
    navigate(`/schedules/${id}`);
    close();
  }

  const detailRows = selectedMember
    ? [
        { label: "Email", value: selectedMember.email ?? "—" },
        { label: "Role", value: formatRoleLabel(selectedMember.role) },
        ...(selectedMember.role === UserRole.DISPATCH_TEAM
          ? [
              {
                label: "Cities",
                value: getUserAssignedCities(selectedMember).join(", ") || "None assigned",
              },
            ]
          : []),
        ...(selectedMember.teamName || selectedMember.teamId
          ? [{ label: "Team", value: selectedMember.teamName ?? "Assigned" }]
          : []),
        { label: "Schedules", value: String(memberSchedules.length) },
        { label: "Routes", value: String(memberRoutes.length) },
      ]
    : [];

  const profileLink =
    selectedMember?.role === UserRole.DISPATCH_TEAM
      ? `/dispatch-team/${selectedMember.id}`
      : `/users/${selectedMember?.id}`;

  const teamDetailRows = selectedTeam
    ? [
        { label: "Code", value: selectedTeam.code ?? "—" },
        {
          label: "Members",
          value: String(
            teamDetailQuery.data?.memberCount ??
              selectedTeam.memberCount ??
              teamMembers.length
          ),
        },
        { label: "Schedules", value: String(teamSchedules.length) },
        { label: "Routes", value: String(scopedTeamRoutes.length) },
      ]
    : [];

  return (
    <div className="ops-menu" ref={rootRef}>
      <MenuTrigger label="Users" icon={USER_ICON} open={open} onToggle={onToggle} />

      <MenuPanel
        ref={panelRef}
        anchorRef={rootRef}
        open={open}
        positionDeps={[category, selectedTeam, selectedMember, teamPane, search]}
      >
          <MenuRail categories={categories} activeKey={category} onSelect={switchCategory} />
          <div className="ops-menu__pane">
            {selectedMember ? (
              <>
                <MenuBack label={memberName(selectedMember)} onClick={() => setSelectedMember(null)} />
                <div className="ops-menu__scroll">
                  <MemberDetailPane
                    title={memberName(selectedMember)}
                    subtitle={`${formatRoleLabel(selectedMember.role)} · ${formatDisplayDateLabel(date)}`}
                    rows={detailRows}
                    actions={
                      <div className="ops-menu__detail-actions">
                        <Link to={profileLink} className="ops-menu__detail-link" onClick={close}>
                          View full profile →
                        </Link>
                      </div>
                    }
                  />
                  <MenuSectionLabel>Schedules</MenuSectionLabel>
                  <div className="ops-menu__list ops-menu__list--nested">
                    {routesQuery.isLoading ? (
                      <MenuEmpty>Loading schedules…</MenuEmpty>
                    ) : memberSchedules.length === 0 ? (
                      <MenuEmpty>No schedules on selected date.</MenuEmpty>
                    ) : (
                      memberSchedules.map((schedule) => (
                        <ScheduleRow
                          key={schedule.id}
                          schedule={schedule}
                          onClick={() => gotoSchedule(schedule.id)}
                        />
                      ))
                    )}
                  </div>
                  <MenuSectionLabel>Routes</MenuSectionLabel>
                  <div className="ops-menu__list ops-menu__list--nested">
                    {routesQuery.isLoading ? (
                      <MenuEmpty>Loading routes…</MenuEmpty>
                    ) : memberRoutes.length === 0 ? (
                      <MenuEmpty>No routes on selected date.</MenuEmpty>
                    ) : (
                      memberRoutes.map((route) => (
                        <RouteRow key={route.id} route={route} onClick={() => gotoRoute(route.id)} />
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {!selectedMember && category === "dispatch_team" && !isDispatchTeam ? (
              <>
                <MenuSearch value={search} onChange={setSearch} placeholder="Search dispatch team…" />
                <div className="ops-menu__list">
                  {usersQuery.isLoading ? (
                    <MenuEmpty>Loading members…</MenuEmpty>
                  ) : filteredDispatch.length === 0 ? (
                    <MenuEmpty>No dispatch team members.</MenuEmpty>
                  ) : (
                    filteredDispatch.map((u) => (
                      <MenuRow key={u.id} onClick={() => openMember(u)}>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{memberName(u)}</span>
                          <span className="block truncate text-xs" style={{ color: "var(--text-dim)" }}>
                            {getUserAssignedCities(u).join(", ") || "No cities"}
                          </span>
                        </span>
                        <ChevronRight />
                      </MenuRow>
                    ))
                  )}
                </div>
              </>
            ) : null}

            {!selectedMember && category === "driver" ? (
              <>
                <MenuSearch value={search} onChange={setSearch} placeholder="Search drivers…" />
                <div className="ops-menu__list">
                  {driversLoading ? (
                    <MenuEmpty>Loading drivers…</MenuEmpty>
                  ) : filteredDrivers.length === 0 ? (
                    <MenuEmpty>No drivers found.</MenuEmpty>
                  ) : (
                    filteredDrivers.map((u) => (
                      <MenuRow key={u.id} onClick={() => openMember(u)}>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{memberName(u)}</span>
                          <span className="block truncate text-xs" style={{ color: "var(--text-dim)" }}>
                            {u.teamName ?? u.email ?? "Driver"}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <ActivityBadge
                            count={byDriver.get(String(u.id))}
                            title={
                              isDispatchTeam
                                ? "Completed routes you created"
                                : "Completed routes on selected date"
                            }
                          />
                          <ChevronRight />
                        </span>
                      </MenuRow>
                    ))
                  )}
                </div>
              </>
            ) : null}

            {!selectedMember && category === "team" && !selectedTeam ? (
              <>
                <MenuSearch value={search} onChange={setSearch} placeholder="Search teams…" />
                <div className="ops-menu__list">
                  {teamsQuery.isLoading ? (
                    <MenuEmpty>Loading teams…</MenuEmpty>
                  ) : filteredTeams.length === 0 ? (
                    <MenuEmpty>No teams found.</MenuEmpty>
                  ) : (
                    filteredTeams.map((t) => (
                      <MenuRow key={t.id} onClick={() => openTeam(t)}>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{t.name}</span>
                          {t.code ? (
                            <span className="block truncate text-xs" style={{ color: "var(--text-dim)" }}>
                              {t.code}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <ActivityBadge
                            count={byTeam.get(String(t.id))}
                            title={
                              isDispatchTeam
                                ? "Completed routes you created for this team"
                                : "Completed routes on selected date"
                            }
                          />
                          <ChevronRight />
                        </span>
                      </MenuRow>
                    ))
                  )}
                </div>
              </>
            ) : null}

            {!selectedMember && category === "team" && selectedTeam && teamPane === "overview" ? (
              <>
                <MenuBack label="Teams" onClick={() => setSelectedTeam(null)} />
                <div className="ops-menu__scroll">
                  <MemberDetailPane
                    title={selectedTeam.name}
                    subtitle={selectedTeam.code ? `Team ${selectedTeam.code}` : "Team overview"}
                    rows={teamDetailRows}
                    actions={
                      <div className="ops-menu__detail-actions">
                        <button
                          type="button"
                          className="ops-menu__detail-link"
                          onClick={() => {
                            setTeamPane("members");
                            setSearch("");
                          }}
                        >
                          View team members →
                        </button>
                      </div>
                    }
                  />
                  <MenuSectionLabel>Schedules</MenuSectionLabel>
                  <div className="ops-menu__list ops-menu__list--nested">
                    {routesQuery.isLoading ? (
                      <MenuEmpty>Loading schedules…</MenuEmpty>
                    ) : teamSchedules.length === 0 ? (
                      <MenuEmpty>No schedules on selected date.</MenuEmpty>
                    ) : (
                      teamSchedules.map((schedule) => (
                        <ScheduleRow
                          key={schedule.id}
                          schedule={schedule}
                          onClick={() => gotoSchedule(schedule.id)}
                        />
                      ))
                    )}
                  </div>
                  <MenuSectionLabel>Routes</MenuSectionLabel>
                  <div className="ops-menu__list ops-menu__list--nested">
                    {routesQuery.isLoading ? (
                      <MenuEmpty>Loading routes…</MenuEmpty>
                    ) : scopedTeamRoutes.length === 0 ? (
                      <MenuEmpty>No routes on selected date.</MenuEmpty>
                    ) : (
                      scopedTeamRoutes.map((route) => (
                        <RouteRow key={route.id} route={route} onClick={() => gotoRoute(route.id)} />
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {!selectedMember && category === "team" && selectedTeam && teamPane === "members" ? (
              <>
                <MenuBack
                  label={`Members · ${selectedTeam.name}`}
                  onClick={() => {
                    setTeamPane("overview");
                    setSearch("");
                  }}
                />
                <MenuSearch value={search} onChange={setSearch} placeholder="Search members…" />
                <div className="ops-menu__list">
                  {teamDetailQuery.isLoading && filteredTeamMembers.length === 0 ? (
                    <MenuEmpty>Loading members…</MenuEmpty>
                  ) : filteredTeamMembers.length === 0 ? (
                    <MenuEmpty>No members in this team.</MenuEmpty>
                  ) : (
                    filteredTeamMembers.map((u) => (
                      <MenuRow key={u.id} onClick={() => openMember(u)}>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{memberName(u)}</span>
                          <span className="block truncate text-xs capitalize" style={{ color: "var(--text-dim)" }}>
                            {formatRoleLabel(u.role)}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {DRIVER_ROLES.has(u.role) ? (
                            <ActivityBadge
                              count={byDriver.get(String(u.id))}
                              title={
                                isDispatchTeam
                                  ? "Completed routes you created"
                                  : "Completed routes on selected date"
                              }
                            />
                          ) : null}
                          <ChevronRight />
                        </span>
                      </MenuRow>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </div>
        </MenuPanel>
    </div>
  );
}

function formatDisplayDateLabel(isoDate) {
  if (!isoDate) return "selected date";
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
