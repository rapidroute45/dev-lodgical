import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { todayIsoDate } from "@/shared/utils/time.js";
import {
  UserRole,
  UserStatus,
  roleRequiresCity,
  roleRequiresTeam,
} from "@/shared/utils/constants.js";
import { ROLE_DEFINITIONS } from "@/modules/role-assignment/constants/roleDefinitions.js";
import { TeamPickerModal } from "@/modules/role-assignment/presentation/components/TeamPickerModal.jsx";
import { CityPickerModal } from "@/modules/role-assignment/presentation/components/CityPickerModal.jsx";
import { useCreateUserMutation } from "@/modules/users/infrastructure/api/users.queries.js";
import {
  formatRoleLabel,
  getEditableRoles,
} from "@/modules/users/utils/editableRoles.js";

export function CreateUserScreen() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const createMutation = useCreateUserMutation();

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

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [error, setError] = useState(null);

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

  function validate() {
    if (!fullName.trim()) return "Full name is required.";
    if (!email.trim()) return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email.";
    if (!phone.trim()) return "Phone number is required.";
    if (phone.trim().length < 7) return "Enter a valid phone number.";
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!selectedRole) return "Select a role for this account.";
    if (roleRequiresTeam(selectedRole) && !selectedTeam) {
      return "Select a team for this role.";
    }
    if (roleRequiresCity(selectedRole) && !selectedCity?.trim()) {
      return "Assign a city for this role.";
    }
    return null;
  }

  async function handleCreate() {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      if (validationError.includes("team")) setTeamModalOpen(true);
      if (validationError.includes("city")) setCityModalOpen(true);
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        role: selectedRole,
        status: UserStatus.ACTIVE,
        teamId: roleRequiresTeam(selectedRole) ? selectedTeam?.id : undefined,
        assignedCity: roleRequiresCity(selectedRole)
          ? selectedCity?.trim()
          : undefined,
      });
      const createdId = result?.data?.id;
      navigate(createdId ? `/users/${createdId}` : "/users", {
        replace: true,
        state: { message: result?.message ?? "Account created." },
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err.message ||
          "Failed to create account"
      );
    }
  }

  const topBar = (
    <OpsTopBar showDate={false} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link to="/users" className="ops-btn p-2.5" aria-label="Back to users">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                Create account
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Set up a user with role and login credentials
              </p>
            </div>
          </div>
        </div>

        {error ? <div className="ops-banner ops-banner--error">{error}</div> : null}

        <section className="ops-panel ops-fade overflow-hidden">
          <div className="ops-panel__head px-5 py-4">
            <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>Account details</h2>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Full name</label>
              <input
                className="ops-field w-full text-sm outline-none"
                style={{ color: "var(--text)" }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Email</label>
              <input
                type="email"
                className="ops-field w-full text-sm outline-none"
                style={{ color: "var(--text)" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.com"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Phone</label>
              <input
                type="tel"
                className="ops-field w-full text-sm outline-none"
                style={{ color: "var(--text)" }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Temporary password
              </label>
              <input
                type="password"
                className="ops-field w-full text-sm outline-none"
                style={{ color: "var(--text)" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Share this with the user so they can sign in immediately.
              </p>
            </div>
          </div>
        </section>

        <section className="ops-panel ops-fade overflow-hidden">
          <div className="ops-panel__head px-5 py-4">
            <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>Role & access</h2>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              Account is created as active — no pending approval step.
            </p>
          </div>
          <div className="space-y-4 p-5">
            {selectedRole && roleRequiresTeam(selectedRole) ? (
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
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Assigned city</label>
                <button
                  type="button"
                  onClick={() => setCityModalOpen(true)}
                  className="ops-field flex w-full items-center justify-between text-left text-sm font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {selectedCity?.trim() || "Select city"}
                  <span style={{ color: "var(--accent)" }}>→</span>
                </button>
              </div>
            ) : null}

            {adminRoleCards.length > 0 ? (
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
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
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
        </section>

        <div className="flex flex-wrap gap-3">
          <Link to="/users" className="ops-btn px-4 py-2 text-sm font-semibold">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="ops-btn ops-btn--accent px-5 py-2.5 font-bold disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating…" : "Create account"}
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
        onSelect={setSelectedCity}
        onClose={() => setCityModalOpen(false)}
        enforceDispatchTeamUniqueness={selectedRole === UserRole.DISPATCH_TEAM}
      />
    </DashboardLayout>
  );
}
