import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { useOpsElevation } from "@/modules/auth/presentation/context/OpsElevationContext.jsx";
import { OpsPinModal } from "@/modules/auth/presentation/components/OpsPinModal.jsx";
import { CityPickerModal } from "@/modules/role-assignment/presentation/components/CityPickerModal.jsx";
import {
  useAllUsersQuery,
  useTeamDetailQuery,
  useUpdateTeamMutation,
} from "@/modules/users/infrastructure/api/users.queries.js";
import {
  UserRole,
  adminNeedsDispatchElevation,
  canManageTeams,
} from "@/shared/utils/constants.js";

function isElevationRequiredError(err) {
  const message =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "";
  return /ops elevation required|elevation token/i.test(String(message));
}

function displayName(user) {
  return user?.displayName || user?.fullName || user?.email || "Unknown";
}

export function DriverTeamDetailScreen() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dispatchUnlocked, verifyPin } = useOpsElevation();
  const allowEdit = canManageTeams(user?.role, dispatchUnlocked);

  const {
    data: team,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useTeamDetailQuery(teamId, Boolean(teamId));

  const { data: allUsers = [] } = useAllUsersQuery({}, Boolean(teamId));
  const updateTeam = useUpdateTeamMutation();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [teamLeadId, setTeamLeadId] = useState("");
  const [driverIds, setDriverIds] = useState([]);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const [saveError, setSaveError] = useState(null);
  const [saveOk, setSaveOk] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);

  useEffect(() => {
    if (!team) return;
    setName(team.name || "");
    setCity(team.city || "");
    setTeamLeadId(team.teamLeadId || team.teamLead?.id || "");
    setDriverIds((team.drivers ?? []).map((d) => d.id).filter(Boolean));
    setSaveError(null);
    setSaveOk(false);
  }, [team]);

  const teamLeads = useMemo(
    () =>
      (allUsers ?? []).filter(
        (u) => u.role === UserRole.TEAM_LEAD || u.role === "team lead"
      ),
    [allUsers]
  );

  const driversById = useMemo(() => {
    const map = new Map();
    for (const d of team?.drivers ?? []) {
      if (d.id) map.set(d.id, d);
    }
    for (const u of allUsers ?? []) {
      if (
        (u.role === UserRole.DRIVER || u.role === "driver" || u.role === "team driver") &&
        u.id &&
        !u.teamId
      ) {
        if (!map.has(u.id)) {
          map.set(u.id, {
            id: u.id,
            email: u.email,
            displayName: displayName(u),
            role: u.role,
            status: u.status,
          });
        }
      }
    }
    return map;
  }, [allUsers, team?.drivers]);

  const selectedDrivers = useMemo(
    () => driverIds.map((id) => driversById.get(id)).filter(Boolean),
    [driverIds, driversById]
  );

  const availableDrivers = useMemo(() => {
    const q = driverSearch.trim().toLowerCase();
    return [...driversById.values()]
      .filter((d) => !driverIds.includes(d.id))
      .filter((d) => {
        if (!q) return true;
        return (
          displayName(d).toLowerCase().includes(q) ||
          String(d.email || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => displayName(a).localeCompare(displayName(b)));
  }, [driversById, driverIds, driverSearch]);

  const topBar = (
    <OpsTopBar
      showDate={false}
      onRefresh={() => {
        void refetch();
      }}
      refreshing={isFetching}
    />
  );

  async function runSave(payload) {
    await updateTeam.mutateAsync({ teamId, body: payload });
    setSaveOk(true);
    setSaveError(null);
    setPendingSave(null);
    void refetch();
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setSaveError("Team name must be at least 2 characters.");
      return;
    }
    const payload = {
      name: trimmedName,
      city: city.trim() || null,
      teamLeadId: teamLeadId || null,
      driverIds,
    };

    if (!allowEdit) {
      if (adminNeedsDispatchElevation(user?.role) && !dispatchUnlocked) {
        setPendingSave(payload);
        setPinOpen(true);
        return;
      }
      setSaveError("You do not have permission to edit teams.");
      return;
    }

    setSaveError(null);
    setSaveOk(false);
    try {
      await runSave(payload);
    } catch (err) {
      if (isElevationRequiredError(err)) {
        setPendingSave(payload);
        setPinOpen(true);
        return;
      }
      setSaveError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err.message ||
          "Could not save team"
      );
    }
  }

  async function handlePinVerified(scope, pin) {
    await verifyPin(scope, pin);
    setPinOpen(false);
    if (!pendingSave) return;
    const payload = pendingSave;
    setPendingSave(null);
    try {
      await runSave(payload);
    } catch (err) {
      setSaveError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err.message ||
          "Could not save team"
      );
    }
  }

  function removeDriver(id) {
    setDriverIds((prev) => prev.filter((item) => item !== id));
    setSaveOk(false);
  }

  function addDriver(id) {
    setDriverIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setAddDriverOpen(false);
    setDriverSearch("");
    setSaveOk(false);
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade mb-4">
          <button
            type="button"
            onClick={() => navigate("/driver-teams")}
            className="mb-3 text-sm font-semibold"
            style={{ color: "var(--accent)" }}
          >
            ← Back to driver teams
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            {team?.name || "Edit team"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Change city, team lead, and drivers
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-24 rounded-2xl" />
            ))}
          </div>
        ) : isError || !team ? (
          <div className="ops-banner ops-banner--error">
            Could not load team.{" "}
            <button type="button" onClick={() => refetch()} className="font-semibold underline">
              Retry
            </button>
          </div>
        ) : (
          <div className="ops-fade space-y-4">
            <section className="ops-card space-y-3 p-4">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Team details
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  Name
                </span>
                <input
                  className="ops-field w-full text-sm outline-none"
                  style={{ color: "var(--text)" }}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSaveOk(false);
                  }}
                  disabled={!allowEdit && !adminNeedsDispatchElevation(user?.role)}
                />
              </label>
              <div>
                <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  Code
                </span>
                <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                  {team.code}
                </p>
              </div>
              <div>
                <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  City
                </span>
                <button
                  type="button"
                  onClick={() => setCityPickerOpen(true)}
                  className="ops-field flex w-full items-center justify-between px-3 py-2.5 text-left text-sm"
                >
                  <span style={{ color: city ? "var(--text)" : "var(--text-muted)" }}>
                    {city || "No city assigned"}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    {city ? "Change" : "Assign"}
                  </span>
                </button>
                {city ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCity("");
                      setSaveOk(false);
                    }}
                    className="mt-1 text-xs font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Clear city
                  </button>
                ) : null}
              </div>
            </section>

            <section className="ops-card space-y-3 p-4">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Team lead
              </p>
              <select
                className="ops-field w-full text-sm outline-none"
                style={{ color: "var(--text)" }}
                value={teamLeadId}
                onChange={(e) => {
                  setTeamLeadId(e.target.value);
                  setSaveOk(false);
                }}
              >
                <option value="">No team lead</option>
                {teamLeads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {displayName(lead)} ({lead.email})
                  </option>
                ))}
              </select>
              {teamLeads.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  No users with the team lead role yet.{" "}
                  <Link to="/assign-role" className="font-semibold" style={{ color: "var(--accent)" }}>
                    Assign a lead role
                  </Link>
                </p>
              ) : null}
            </section>

            <section className="ops-card space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                  Drivers ({selectedDrivers.length})
                </p>
                <button
                  type="button"
                  onClick={() => setAddDriverOpen((v) => !v)}
                  className="ops-btn ops-btn--accent px-3 py-1.5 text-xs font-bold"
                >
                  {addDriverOpen ? "Close" : "+ Add driver"}
                </button>
              </div>

              {addDriverOpen ? (
                <div className="space-y-2 rounded-xl p-3" style={{ background: "var(--surface-2, rgba(255,255,255,0.04))" }}>
                  <input
                    className="ops-field w-full text-sm outline-none"
                    style={{ color: "var(--text)" }}
                    placeholder="Search drivers…"
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    autoFocus
                  />
                  <ul className="max-h-48 space-y-1 overflow-y-auto">
                    {availableDrivers.length === 0 ? (
                      <li className="px-1 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        No drivers available to add
                      </li>
                    ) : (
                      availableDrivers.map((driver) => (
                        <li key={driver.id}>
                          <button
                            type="button"
                            onClick={() => addDriver(driver.id)}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:opacity-90"
                            style={{ color: "var(--text)" }}
                          >
                            <span className="min-w-0 truncate">
                              <span className="block truncate font-semibold">{displayName(driver)}</span>
                              <span className="block truncate text-xs" style={{ color: "var(--text-muted)" }}>
                                {driver.email}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-bold" style={{ color: "var(--accent)" }}>
                              Add
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ) : null}

              {selectedDrivers.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No drivers on this team yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedDrivers.map((driver) => (
                    <li
                      key={driver.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                      style={{ background: "var(--surface-2, rgba(255,255,255,0.04))" }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {displayName(driver)}
                        </p>
                        <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                          {driver.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDriver(driver.id)}
                        className="shrink-0 text-xs font-bold"
                        style={{ color: "var(--rose)" }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {saveError ? <div className="ops-banner ops-banner--error">{saveError}</div> : null}
            {saveOk ? (
              <div className="ops-banner" style={{ color: "var(--accent)" }}>
                Team saved.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateTeam.isPending}
                className="ops-btn ops-btn--accent px-5 py-2.5 text-sm font-bold disabled:opacity-50"
              >
                {updateTeam.isPending ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/driver-teams")}
                className="ops-btn px-5 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <CityPickerModal
        open={cityPickerOpen}
        selectedCity={city || null}
        enforceDispatchTeamUniqueness={false}
        onSelect={(nextCity) => {
          setCity(nextCity);
          setCityPickerOpen(false);
          setSaveOk(false);
        }}
        onClose={() => setCityPickerOpen(false)}
      />

      <OpsPinModal
        open={pinOpen}
        scope="dispatch"
        onClose={() => {
          setPinOpen(false);
          setPendingSave(null);
        }}
        onVerified={handlePinVerified}
      />
    </DashboardLayout>
  );
}
