import { useState } from "react";
import { createPortal } from "react-dom";
import { useOpsTheme } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { useOpsElevation } from "@/modules/auth/presentation/context/OpsElevationContext.jsx";
import { OpsPinModal } from "@/modules/auth/presentation/components/OpsPinModal.jsx";
import {
  useCreateTeamMutation,
  useTeamsQuery,
} from "@/modules/users/infrastructure/api/users.queries.js";
import {
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

export function TeamPickerModal({ open, selectedTeamId, onSelect, onClose, forDriver = true }) {
  const { theme } = useOpsTheme();
  const { user } = useAuth();
  const { dispatchUnlocked, verifyPin } = useOpsElevation();
  const [newTeamName, setNewTeamName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingCreateName, setPendingCreateName] = useState(null);

  const { data: teams = [], isLoading, isError, refetch } = useTeamsQuery(open);
  const createTeam = useCreateTeamMutation();

  const allowCreateTeam = canManageTeams(user?.role, dispatchUnlocked);

  if (!open) return null;

  const title = forDriver ? "Assign driver to team" : "Select team";
  const subtitle = forDriver
    ? "Choose a team for this driver, or create one."
    : "Select a team for this role. Create one if none exist.";

  async function runCreate(name) {
    const team = await createTeam.mutateAsync(name);
    setNewTeamName("");
    setShowCreate(false);
    setCreateError(null);
    setPendingCreateName(null);
    onSelect(team);
    onClose();
  }

  async function handleCreate() {
    const name = newTeamName.trim();
    if (name.length < 2) {
      setCreateError("Team name must be at least 2 characters.");
      return;
    }
    if (!allowCreateTeam) {
      if (adminNeedsDispatchElevation(user?.role) && !dispatchUnlocked) {
        setPendingCreateName(name);
        setPinOpen(true);
        return;
      }
      setCreateError("You do not have permission to create teams.");
      return;
    }
    setCreateError(null);
    try {
      await runCreate(name);
    } catch (err) {
      if (isElevationRequiredError(err)) {
        setPendingCreateName(name);
        setPinOpen(true);
        return;
      }
      setCreateError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err.message ||
          "Could not create team"
      );
    }
  }

  function handleStartCreate() {
    setCreateError(null);
    if (adminNeedsDispatchElevation(user?.role) && !dispatchUnlocked) {
      setPinOpen(true);
      setPendingCreateName("");
      return;
    }
    if (!canManageTeams(user?.role, dispatchUnlocked)) {
      setCreateError("Only dispatch managers (or admins in dispatch mode) can create teams.");
      return;
    }
    setShowCreate(true);
  }

  async function handlePinVerified(scope, pin) {
    await verifyPin(scope, pin);
    setPinOpen(false);
    if (pendingCreateName === "") {
      setShowCreate(true);
      setPendingCreateName(null);
      return;
    }
    if (pendingCreateName) {
      const name = pendingCreateName;
      setPendingCreateName(null);
      try {
        await runCreate(name);
      } catch (err) {
        setShowCreate(true);
        setNewTeamName(name);
        setCreateError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err.message ||
            "Could not create team"
        );
      }
    }
  }

  function handleClose() {
    setShowCreate(false);
    setNewTeamName("");
    setCreateError(null);
    setPendingCreateName(null);
    setPinOpen(false);
    onClose();
  }

  return createPortal(
    <>
      <div
        className={`ops-shell ops-picker-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4${
          theme === "light" ? " ops-shell--light" : ""
        }`}
        role="dialog"
        aria-modal="true"
        onClick={handleClose}
      >
        <div className="ops-picker" onClick={(e) => e.stopPropagation()}>
          <div className="ops-picker__head">
            <div>
              <h3 className="ops-picker__title">{title}</h3>
              <p className="ops-picker__sub">{subtitle}</p>
            </div>
            <button type="button" onClick={handleClose} className="ops-picker__close" aria-label="Close">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="ops-picker__body">
            <ul className="ops-picker__list">
              {isLoading ? (
                <li className="ops-picker__empty">Loading…</li>
              ) : isError ? (
                <li className="ops-picker__empty">
                  Could not load teams.{" "}
                  <button type="button" onClick={() => refetch()} className="font-semibold" style={{ color: "var(--accent)" }}>
                    Retry
                  </button>
                </li>
              ) : teams.length === 0 && !showCreate ? (
                <li className="ops-picker__empty">
                  <p className="font-semibold" style={{ color: "var(--text)" }}>No teams yet</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
                    {allowCreateTeam
                      ? "Create a team to assign this user"
                      : "Ask a dispatch manager to create a team"}
                  </p>
                </li>
              ) : (
                teams.map((team) => {
                  const selected = team.id === selectedTeamId;
                  const leadLabel = team.teamLeadName
                    ? `Team lead: ${team.teamLeadName}`
                    : "No team lead assigned";
                  return (
                    <li key={team.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(team);
                          handleClose();
                        }}
                        className={`ops-picker__item${selected ? " ops-picker__item--selected" : ""}`}
                      >
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block truncate font-semibold" style={{ color: "var(--text)" }}>{team.name}</span>
                          <span className="mt-0.5 block truncate text-xs font-medium" style={{ color: "var(--accent)" }}>{team.code}</span>
                          <span className="mt-1 block truncate text-xs" style={{ color: "var(--text-muted)" }}>{leadLabel}</span>
                        </span>
                        {selected ? (
                          <svg className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {showCreate ? (
            <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
              {createError ? (
                <p className="mb-2 text-xs" style={{ color: "var(--rose)" }}>{createError}</p>
              ) : null}
              <input
                className="ops-field w-full text-sm outline-none"
                style={{ color: "var(--text)" }}
                placeholder="Team name (e.g. ABC)"
                value={newTeamName}
                onChange={(e) => {
                  setNewTeamName(e.target.value);
                  if (createError) setCreateError(null);
                }}
                autoFocus
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setNewTeamName("");
                    setCreateError(null);
                  }}
                  className="ops-btn flex-1 px-3 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createTeam.isPending || newTeamName.trim().length < 2}
                  className="ops-btn ops-btn--accent flex-[1.4] px-3 py-2.5 text-sm font-bold disabled:opacity-50"
                >
                  {createTeam.isPending ? "Creating…" : "Create team"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-3" style={{ borderTop: "1px solid var(--border)" }}>
              {createError ? (
                <p className="text-xs" style={{ color: "var(--rose)" }}>{createError}</p>
              ) : null}
              {(allowCreateTeam || adminNeedsDispatchElevation(user?.role)) ? (
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="ops-dashed flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold"
                >
                  <span className="text-lg leading-none">+</span>
                  Create new team
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleClose}
                className="ops-btn w-full px-3 py-2.5 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      <OpsPinModal
        open={pinOpen}
        scope="dispatch"
        onClose={() => {
          setPinOpen(false);
          setPendingCreateName(null);
        }}
        onVerified={handlePinVerified}
      />
    </>,
    document.body
  );
}
