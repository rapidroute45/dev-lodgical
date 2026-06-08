import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import {
  UserRole,
  UserStatus,
  roleRequiresCity,
  roleRequiresTeam,
} from "@/shared/utils/constants.js";
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
    if (needsCity && !selectedCity?.trim()) {
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
          assignedCity: needsCity ? selectedCity?.trim() ?? null : null,
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
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div className="flex items-center gap-3">
          <Link to="/users" className="text-sm font-semibold text-dispatch-primary hover:underline">
            ← Users
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dispatch-text">Edit user</h1>
            {user ? <p className="text-sm text-dispatch-muted">{displayName}</p> : null}
          </div>
        </div>
      </div>
    </header>
  );

  if (isLoading) {
    return (
      <DashboardLayout topBar={topBar}>
        <p className="py-12 text-center text-sm text-dispatch-muted">Loading…</p>
      </DashboardLayout>
    );
  }

  if (isError || !user) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="py-12 text-center">
          <p className="text-sm text-dispatch-muted">User not found</p>
          <Link to="/users" className="mt-2 inline-block text-sm font-semibold text-dispatch-primary">
            Back to users
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const showTeamSection = selectedRole && roleRequiresTeam(selectedRole);

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-dispatch-red">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="flex items-center gap-4 rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dispatch-primary-soft text-xl font-extrabold text-dispatch-primary">
            {displayName.charAt(0)}
          </div>
          <div>
            <p className="text-lg font-bold text-dispatch-text">{displayName}</p>
            <p className="text-sm text-dispatch-muted">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-dispatch-text">Full name</label>
            <input
              className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-dispatch-primary/30"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-dispatch-text">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold ${
                    selectedStatus === status
                      ? "bg-dispatch-indigo text-white"
                      : "bg-dispatch-bg text-dispatch-muted ring-1 ring-dispatch-border"
                  }`}
                >
                  {formatStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>

          {showTeamSection ? (
            <div>
              <label className="mb-2 block text-sm font-bold text-dispatch-text">Team</label>
              <button
                type="button"
                onClick={() => setTeamModalOpen(true)}
                className="flex w-full items-center justify-between rounded-xl bg-dispatch-primary-soft px-4 py-3 text-left text-sm font-semibold text-dispatch-primary"
              >
                {selectedTeam
                  ? `${selectedTeam.name} (${selectedTeam.code})`
                  : "Select team"}
                <span>→</span>
              </button>
            </div>
          ) : null}

          {selectedRole && roleRequiresCity(selectedRole) ? (
            <div>
              <label className="mb-2 block text-sm font-bold text-dispatch-text">Assigned city</label>
              <button
                type="button"
                onClick={() => setCityModalOpen(true)}
                className="flex w-full items-center justify-between rounded-xl bg-dispatch-primary-soft px-4 py-3 text-left text-sm font-semibold text-dispatch-primary"
              >
                {selectedCity?.trim() || "Select city"}
                <span>→</span>
              </button>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-bold text-dispatch-text">Role</label>
            {!selectedRole ? (
              <p className="mb-2 text-xs text-dispatch-muted">No role assigned — select one below</p>
            ) : null}
            <div className="space-y-2">
              {adminRoleCards.map((role) => {
                const selected = selectedRole === role.role;
                return (
                  <button
                    key={role.role}
                    type="button"
                    onClick={() => handleRoleSelect(role.role)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-dispatch-primary bg-dispatch-primary-soft"
                        : "border-dispatch-border bg-dispatch-bg hover:bg-dispatch-surface"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-dispatch-text">{role.title}</p>
                      <p className="text-xs text-dispatch-muted">{role.description}</p>
                    </div>
                    <span className="text-dispatch-primary">{selected ? "✓" : "○"}</span>
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
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-dispatch-primary bg-dispatch-primary-soft"
                        : "border-dispatch-border bg-dispatch-bg hover:bg-dispatch-surface"
                    }`}
                  >
                    <p className="font-bold text-dispatch-text">{role.title}</p>
                    <p className="mt-1 text-xs text-dispatch-muted">{role.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={userId === currentUser?.id || deleteMutation.isPending}
            className="rounded-xl border border-dispatch-red px-5 py-2.5 text-sm font-bold text-dispatch-red hover:bg-red-50 disabled:opacity-50"
          >
            Delete user
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-xl bg-dispatch-indigo px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-dispatch-primary/25 hover:bg-dispatch-indigo-pressed disabled:opacity-50"
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
        excludeUserId={userId}
        onSelect={setSelectedCity}
        onClose={() => setCityModalOpen(false)}
        enforceDispatchTeamUniqueness={selectedRole === UserRole.DISPATCH_TEAM}
      />
    </DashboardLayout>
  );
}
