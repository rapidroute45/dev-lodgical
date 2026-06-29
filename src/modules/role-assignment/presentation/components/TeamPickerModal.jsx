import { useState } from "react";
import { createPortal } from "react-dom";
import { useOpsTheme } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";
import {
  useCreateTeamMutation,
  useTeamsQuery,
} from "@/modules/users/infrastructure/api/users.queries.js";

export function TeamPickerModal({ open, selectedTeamId, onSelect, onClose, forDriver = true }) {
  const { theme } = useOpsTheme();
  const [newTeamName, setNewTeamName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState(null);

  const { data: teams = [], isLoading, isError, refetch } = useTeamsQuery(open);
  const createTeam = useCreateTeamMutation();

  if (!open) return null;

  const title = forDriver ? "Assign driver to team" : "Select team";
  const subtitle = forDriver
    ? "Choose a team for this driver, or create one."
    : "Select a team for this role. Create one if none exist.";

  async function handleCreate() {
    const name = newTeamName.trim();
    if (name.length < 2) {
      setCreateError("Team name must be at least 2 characters.");
      return;
    }
    setCreateError(null);
    try {
      const team = await createTeam.mutateAsync(name);
      setNewTeamName("");
      setShowCreate(false);
      onSelect(team);
      onClose();
    } catch (err) {
      setCreateError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err.message ||
          "Could not create team"
      );
    }
  }

  function handleClose() {
    setShowCreate(false);
    setNewTeamName("");
    setCreateError(null);
    onClose();
  }

  return createPortal(
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
                  Create a team to assign this user
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
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="ops-dashed flex w-full items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold"
            >
              <span className="text-lg leading-none">+</span>
              Create new team
            </button>
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
    </div>,
    document.body
  );
}
