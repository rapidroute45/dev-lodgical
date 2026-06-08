import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
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
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div className="flex items-center gap-3">
          <Link to="/users" className="text-sm font-semibold text-dispatch-primary hover:underline">
            ← Users
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dispatch-text">Create account</h1>
            <p className="text-sm text-dispatch-muted">
              Set up a user with role and login credentials
            </p>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-dispatch-red">
            {error}
          </div>
        ) : null}

        <div className="space-y-4 rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
          <h2 className="text-sm font-bold text-dispatch-text">Account details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-dispatch-text">Full name</label>
              <input
                className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-dispatch-primary/30"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-dispatch-text">Email</label>
              <input
                type="email"
                className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-dispatch-primary/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.com"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-dispatch-text">Phone</label>
              <input
                type="tel"
                className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-dispatch-primary/30"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-dispatch-text">
                Temporary password
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-dispatch-primary/30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-dispatch-muted">
                Share this with the user so they can sign in immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
          <h2 className="text-sm font-bold text-dispatch-text">Role & access</h2>
          <p className="text-xs text-dispatch-muted">
            Account is created as active — no pending approval step.
          </p>

          {selectedRole && roleRequiresTeam(selectedRole) ? (
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

          {adminRoleCards.length > 0 ? (
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
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
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

        <div className="flex flex-wrap gap-3">
          <Link
            to="/users"
            className="rounded-xl border border-dispatch-border px-5 py-2.5 text-sm font-semibold text-dispatch-muted hover:bg-dispatch-surface"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="rounded-xl bg-dispatch-indigo px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-dispatch-primary/25 hover:bg-dispatch-indigo-pressed disabled:opacity-50"
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
