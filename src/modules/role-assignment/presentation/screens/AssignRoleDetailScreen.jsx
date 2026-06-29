import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { todayIsoDate } from "@/shared/utils/time.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import {
  UserRole,
  UserStatus,
  roleRequiresCity,
  roleRequiresTeam,
} from "@/shared/utils/constants.js";
import { roleUsesMultipleCities } from "@/shared/utils/assignedCities.js";
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
  const [selectedCities, setSelectedCities] = useState([]);
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
      await updateMutation.mutateAsync({
        userId,
        payload: {
          role: selectedRole,
          status: UserStatus.ACTIVE,
          teamId: needsTeam ? (selectedTeam?.id ?? null) : null,
          assignedCity: needsCity && !roleUsesMultipleCities(selectedRole) ? selectedCity?.trim() ?? null : null,
          assignedCities: needsCity && roleUsesMultipleCities(selectedRole) ? selectedCities : null,
        },
      });
      navigate("/assign-role");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to assign role");
    }
  }

  const topBar = (
    <OpsTopBar showDate={false} />
  );

  const titleRow = (
    <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <Link to="/assign-role" className="ops-btn p-2.5" aria-label="Back to assign role">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            Assign user role
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
            <div className="ops-skel h-48 rounded-2xl" />
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
            <Link to="/assign-role" className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold">
              Back to list
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {titleRow}

        {error ? <div className="ops-banner ops-banner--error">{error}</div> : null}

        <div className="ops-card ops-fade flex items-center gap-4 p-5">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-extrabold"
            style={{ background: "color-mix(in srgb, var(--accent) 16%, transparent)", color: "var(--accent)" }}
          >
            {displayName.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{displayName}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{user.email}</p>
            <span className="ops-badge ops-badge--pending mt-1 inline-block">
              Pending approval
            </span>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Select role</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLE_DEFINITIONS.map((role) => {
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

        {selectedRole && roleRequiresCity(selectedRole) ? (
          <button
            type="button"
            onClick={() => setCityModalOpen(true)}
            className="ops-field flex w-full items-center justify-between text-left"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                {roleUsesMultipleCities(selectedRole) ? "Assigned cities" : "Assigned city"}
              </p>
              <p className="font-bold" style={{ color: "var(--text)" }}>
                {roleUsesMultipleCities(selectedRole)
                  ? selectedCities.length
                    ? selectedCities.join(", ")
                    : "Tap to select cities"
                  : selectedCity?.trim() || "Tap to select a city"}
              </p>
            </div>
            <span style={{ color: "var(--accent)" }}>→</span>
          </button>
        ) : null}

        {selectedRole && roleRequiresTeam(selectedRole) ? (
          <button
            type="button"
            onClick={() => setTeamModalOpen(true)}
            className="ops-field flex w-full items-center justify-between text-left"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Team</p>
              <p className="font-bold" style={{ color: "var(--text)" }}>
                {selectedTeam
                  ? `${selectedTeam.name} (${selectedTeam.code})`
                  : "Tap to select a team"}
              </p>
            </div>
            <span style={{ color: "var(--accent)" }}>→</span>
          </button>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link to="/assign-role" className="ops-btn px-4 py-2 text-sm font-semibold">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="ops-btn ops-btn--accent px-5 py-2.5 font-bold disabled:opacity-50"
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
