import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { todayIsoDate } from "@/shared/utils/time.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import {
  UserRole,
  UserStatus,
  roleRequiresCity,
  roleRequiresTeam,
} from "@/shared/utils/constants.js";
import { getUserAssignedCities, roleUsesMultipleCities } from "@/shared/utils/assignedCities.js";
import { ROLE_DEFINITIONS } from "@/modules/role-assignment/constants/roleDefinitions.js";
import { TeamPickerModal } from "@/modules/role-assignment/presentation/components/TeamPickerModal.jsx";
import { CityPickerModal } from "@/modules/role-assignment/presentation/components/CityPickerModal.jsx";
import {
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUserQuery,
} from "@/modules/users/infrastructure/api/users.queries.js";
import {
  formatRoleLabel,
  formatStatusLabel,
  getEditableRoles,
} from "@/modules/users/utils/editableRoles.js";

const STATUS_OPTIONS = [UserStatus.PENDING, UserStatus.ACTIVE, UserStatus.SUSPENDED];

export function EditUserScreen() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { data: user, isLoading, isError } = useUserQuery(userId, true);
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();

  const editableRoles = getEditableRoles(currentUser?.role);
  const roleOptions = useMemo(
    () => ROLE_DEFINITIONS.filter((r) => editableRoles.includes(r.role)),
    [editableRoles]
  );

  const adminRoleCards = useMemo(() => {
    const extra = [];
    if (editableRoles.includes(UserRole.ADMIN)) extra.push(UserRole.ADMIN);
    if (editableRoles.includes(UserRole.DISPATCH_MANAGER)) {
      extra.push(UserRole.DISPATCH_MANAGER);
    }
    return extra.map((role) => ({
      role,
      title: formatRoleLabel(role),
      description:
        role === UserRole.ADMIN
          ? "Full system access"
          : "Dispatch operations & user management",
    }));
  }, [editableRoles]);

  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(UserStatus.PENDING);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCities, setSelectedCities] = useState([]);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? "");
    setSelectedRole(user.role);
    setSelectedStatus(user.status);
    if (user.team) {
      setSelectedTeam({
        id: user.team.id,
        name: user.team.name,
        code: user.team.code,
        teamLeadId: user.team.teamLeadId,
      });
    } else {
      setSelectedTeam(null);
    }
    setSelectedCity(user.assignedCity ?? null);
    setSelectedCities(getUserAssignedCities(user));
  }, [user]);

  const displayName = user
    ? user.displayName ?? resolveDisplayName(user.fullName, user.email)
    : "";

  function handleRoleSelect(role) {
    setSelectedRole(role);
    const needsTeam = roleRequiresTeam(role);
    const needsCity = roleRequiresCity(role);

    if (needsTeam && needsCity) {
      setTeamModalOpen(true);
    } else if (needsTeam) {
      setCityModalOpen(false);
      setSelectedCity(null);
      setTeamModalOpen(true);
    } else if (needsCity) {
      setTeamModalOpen(false);
      setSelectedTeam(null);
      setCityModalOpen(true);
    } else {
      setSelectedTeam(null);
      setSelectedCity(null);
    }
  }

  async function handleSave() {
    setError(null);
    setMessage(null);

    if (!user || !selectedRole) {
      setError("Select a role before saving.");
      return;
    }

    const needsTeam = roleRequiresTeam(selectedRole);
    const needsCity = roleRequiresCity(selectedRole);
    if (needsTeam && !selectedTeam) {
      setTeamModalOpen(true);
      setError("Select a team for this role.");
      return;
    }
    if (needsCity && roleUsesMultipleCities(selectedRole) && selectedCities.length === 0) {
      setCityModalOpen(true);
      setError("Assign at least one city for dispatch team.");
      return;
    }
    if (needsCity && !roleUsesMultipleCities(selectedRole) && !selectedCity?.trim()) {
      setCityModalOpen(true);
      setError("Assign a city for this role.");
      return;
    }

    try {
      const result = await updateMutation.mutateAsync({
        userId,
        payload: {
          fullName: fullName.trim() || null,
          role: selectedRole,
          status: selectedStatus,
          teamId: needsTeam ? (selectedTeam?.id ?? null) : null,
          assignedCity: needsCity && !roleUsesMultipleCities(selectedRole) ? selectedCity?.trim() ?? null : null,
          assignedCities: needsCity && roleUsesMultipleCities(selectedRole) ? selectedCities : null,
        },
      });
      setMessage(result?.message ?? "User updated.");
      navigate("/users");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to update user");
    }
  }

  async function handleDelete() {
    if (userId === currentUser?.id) {
      setError("You cannot delete your own account.");
      return;
    }
    if (!window.confirm(`Remove ${displayName}? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(userId);
      navigate("/users");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to delete user");
    }
  }

  const topBar = (
    <OpsTopBar showDate={false} />
  );

  const titleRow = (
    <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <Link to="/users" className="ops-btn p-2.5" aria-label="Back to users">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            Edit user
          </h1>
          {user ? <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{displayName}</p> : null}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          {titleRow}
          <div className="space-y-4">
            <div className="ops-skel h-20 rounded-2xl" />
            <div className="ops-skel h-64 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !user) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          {titleRow}
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>User not found</p>
            <Link to="/users" className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold">
              Back to users
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const showTeamSection = selectedRole && roleRequiresTeam(selectedRole);

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {titleRow}

        {error ? <div className="ops-banner ops-banner--error">{error}</div> : null}
        {message ? <div className="ops-banner ops-banner--success">{message}</div> : null}

        <div className="ops-card ops-fade flex items-center gap-4 p-5">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-extrabold"
            style={{ background: "color-mix(in srgb, var(--accent) 16%, transparent)", color: "var(--accent)" }}
          >
            {displayName.charAt(0)}
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{displayName}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{user.email}</p>
          </div>
        </div>

        <section className="ops-panel ops-fade overflow-hidden">
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Full name</label>
              <input
                className="ops-field w-full text-sm outline-none"
                style={{ color: "var(--text)" }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`ops-chip${selectedStatus === status ? " ops-chip--active" : ""}`}
                  >
                    {formatStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>

            {showTeamSection ? (
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Team</label>
                <button
                  type="button"
                  onClick={() => setTeamModalOpen(true)}
                  className="ops-field flex w-full items-center justify-between text-left text-sm font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {selectedTeam
                    ? `${selectedTeam.name} (${selectedTeam.code})`
                    : "Select team"}
                  <span style={{ color: "var(--accent)" }}>→</span>
                </button>
              </div>
            ) : null}

            {selectedRole && roleRequiresCity(selectedRole) ? (
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                  {roleUsesMultipleCities(selectedRole) ? "Assigned cities" : "Assigned city"}
                </label>
                {roleUsesMultipleCities(selectedRole) ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedCities.length ? (
                        selectedCities.map((city) => (
                          <span key={city} className="ops-chip ops-chip--active">
                            {city}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>No cities assigned</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCityModalOpen(true)}
                      className="ops-field flex w-full items-center justify-between text-left text-sm font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      Manage cities
                      <span style={{ color: "var(--accent)" }}>→</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCityModalOpen(true)}
                    className="ops-field flex w-full items-center justify-between text-left text-sm font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {selectedCity?.trim() || "Select city"}
                    <span style={{ color: "var(--accent)" }}>→</span>
                  </button>
                )}
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Role</label>
              {!selectedRole ? (
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>No role assigned — select one below</p>
              ) : null}
              <div className="space-y-2">
                {adminRoleCards.map((role) => {
                  const selected = selectedRole === role.role;
                  return (
                    <button
                      key={role.role}
                      type="button"
                      onClick={() => handleRoleSelect(role.role)}
                      className="ops-card flex w-full items-center justify-between p-4 text-left transition"
                      style={selected ? { borderColor: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)" } : undefined}
                    >
                      <div>
                        <p className="font-bold" style={{ color: "var(--text)" }}>{role.title}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{role.description}</p>
                      </div>
                      <span style={{ color: "var(--accent)" }}>{selected ? "✓" : "○"}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {roleOptions.map((role) => {
                  const selected = selectedRole === role.role;
                  return (
                    <button
                      key={role.role}
                      type="button"
                      onClick={() => handleRoleSelect(role.role)}
                      className="ops-card p-4 text-left transition"
                      style={selected ? { borderColor: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)" } : undefined}
                    >
                      <p className="font-bold" style={{ color: "var(--text)" }}>{role.title}</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{role.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={userId === currentUser?.id || deleteMutation.isPending}
            className="ops-btn px-5 py-2.5 text-sm font-bold disabled:opacity-50"
            style={{ color: "var(--rose)", borderColor: "color-mix(in srgb, var(--rose) 35%, transparent)" }}
          >
            Delete user
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="ops-btn ops-btn--accent px-5 py-2.5 font-bold disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <TeamPickerModal
        open={teamModalOpen}
        selectedTeamId={selectedTeam?.id ?? null}
        onSelect={setSelectedTeam}
        onClose={() => setTeamModalOpen(false)}
        forDriver={selectedRole === UserRole.DRIVER}
      />
      <CityPickerModal
        open={cityModalOpen}
        selectedCity={selectedCity}
        selectedCities={selectedCities}
        multi={roleUsesMultipleCities(selectedRole)}
        excludeUserId={userId}
        onSelect={setSelectedCity}
        onSelectMultiple={setSelectedCities}
        onClose={() => setCityModalOpen(false)}
        enforceDispatchTeamUniqueness={selectedRole === UserRole.DISPATCH_TEAM}
      />
    </DashboardLayout>
  );
}
