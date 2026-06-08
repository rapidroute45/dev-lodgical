import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
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
  useUpdateUserMutation,
  useUserQuery,
} from "@/modules/users/infrastructure/api/users.queries.js";

export function AssignRoleDetailScreen() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useUserQuery(userId, true);
  const updateMutation = useUpdateUserMutation();

  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [error, setError] = useState(null);

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
    if (!selectedRole) {
      setError("Choose a role before saving.");
      return;
    }

    const needsTeam = roleRequiresTeam(selectedRole);
    const needsCity = roleRequiresCity(selectedRole);
    if (needsTeam && !selectedTeam) {
      setTeamModalOpen(true);
      setError("Select or create a team for this role.");
      return;
    }
    if (needsCity && !selectedCity?.trim()) {
      setCityModalOpen(true);
      setError("Assign a city for this role.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        userId,
        payload: {
          role: selectedRole,
          status: UserStatus.ACTIVE,
          teamId: needsTeam ? (selectedTeam?.id ?? null) : null,
          assignedCity: needsCity ? selectedCity?.trim() ?? null : null,
        },
      });
      navigate("/assign-role");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to assign role");
    }
  }

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div className="flex items-center gap-3">
          <Link to="/assign-role" className="text-sm font-semibold text-dispatch-primary hover:underline">
            ← Assign role
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dispatch-text">Assign user role</h1>
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
          <Link to="/assign-role" className="mt-2 inline-block text-sm font-semibold text-dispatch-primary">
            Back to list
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-dispatch-red">
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-4 rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dispatch-primary-soft text-xl font-extrabold text-dispatch-primary">
            {displayName.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-dispatch-text">{displayName}</p>
            <p className="text-sm text-dispatch-muted">{user.email}</p>
            <span className="mt-1 inline-block rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              Pending approval
            </span>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-dispatch-text">Select role</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLE_DEFINITIONS.map((role) => {
              const selected = selectedRole === role.role;
              return (
                <button
                  key={role.role}
                  type="button"
                  onClick={() => handleRoleSelect(role.role)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    selected
                      ? "border-dispatch-primary bg-dispatch-primary-soft"
                      : "border-dispatch-border bg-dispatch-surface hover:bg-dispatch-bg"
                  }`}
                >
                  <p className="font-bold text-dispatch-text">{role.title}</p>
                  <p className="mt-1 text-xs text-dispatch-muted">{role.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {selectedRole && roleRequiresCity(selectedRole) ? (
          <button
            type="button"
            onClick={() => setCityModalOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-dispatch-border bg-dispatch-surface px-4 py-3 text-left"
          >
            <div>
              <p className="text-xs font-semibold text-dispatch-muted">Assigned city</p>
              <p className="font-bold text-dispatch-text">
                {selectedCity?.trim() || "Tap to select a city"}
              </p>
            </div>
            <span className="text-dispatch-muted">→</span>
          </button>
        ) : null}

        {selectedRole && roleRequiresTeam(selectedRole) ? (
          <button
            type="button"
            onClick={() => setTeamModalOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-dispatch-border bg-dispatch-surface px-4 py-3 text-left"
          >
            <div>
              <p className="text-xs font-semibold text-dispatch-muted">Team</p>
              <p className="font-bold text-dispatch-text">
                {selectedTeam
                  ? `${selectedTeam.name} (${selectedTeam.code})`
                  : "Tap to select a team"}
              </p>
            </div>
            <span className="text-dispatch-muted">→</span>
          </button>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link
            to="/assign-role"
            className="rounded-xl border border-dispatch-border px-5 py-2.5 text-sm font-semibold text-dispatch-muted hover:bg-dispatch-surface"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-xl bg-dispatch-indigo px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-dispatch-primary/25 hover:bg-dispatch-indigo-pressed disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving…" : "Save role"}
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
