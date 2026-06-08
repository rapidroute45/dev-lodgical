import { useState } from "react";
import {
  useCreateTeamMutation,
  useTeamsQuery,
} from "@/modules/users/infrastructure/api/users.queries.js";

export function TeamPickerModal({ open, selectedTeamId, onSelect, onClose, forDriver = true }) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl bg-dispatch-surface shadow-2xl ring-1 ring-dispatch-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-dispatch-border px-4 py-3">
          <h3 className="text-base font-bold text-dispatch-text">{title}</h3>
          <p className="mt-1 text-xs text-dispatch-muted">{subtitle}</p>
        </div>

        <ul className="max-h-[45vh] overflow-auto p-2">
          {isLoading ? (
            <li className="px-3 py-6 text-center text-sm text-dispatch-muted">Loading…</li>
          ) : isError ? (
            <li className="px-3 py-6 text-center text-sm text-dispatch-muted">
              Could not load teams.{" "}
              <button type="button" onClick={() => refetch()} className="font-semibold text-dispatch-primary">
                Retry
              </button>
            </li>
          ) : teams.length === 0 && !showCreate ? (
            <li className="px-3 py-8 text-center">
              <p className="text-sm font-semibold text-dispatch-text">No teams yet</p>
              <p className="mt-1 text-xs text-dispatch-muted">
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
                    className={`w-full rounded-xl px-3 py-3 text-left transition hover:bg-dispatch-bg ${
                      selected ? "bg-dispatch-primary-soft ring-1 ring-dispatch-primary" : ""
                    }`}
                  >
                    <p className="font-semibold text-dispatch-text">{team.name}</p>
                    <p className="text-xs font-medium text-dispatch-primary">{team.code}</p>
                    <p className="mt-1 text-xs text-dispatch-muted">{leadLabel}</p>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        {showCreate ? (
          <div className="border-t border-dispatch-border px-4 py-3">
            {createError ? (
              <p className="mb-2 text-xs text-dispatch-red">{createError}</p>
            ) : null}
            <input
              className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-dispatch-primary/30"
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
                className="flex-1 rounded-xl border border-dispatch-border px-3 py-2.5 text-sm font-semibold text-dispatch-muted hover:bg-dispatch-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={createTeam.isPending || newTeamName.trim().length < 2}
                className="flex-[1.4] rounded-xl bg-dispatch-indigo px-3 py-2.5 text-sm font-bold text-white hover:bg-dispatch-indigo-pressed disabled:opacity-50"
              >
                {createTeam.isPending ? "Creating…" : "Create team"}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-dispatch-border p-3">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-dispatch-primary bg-dispatch-primary-soft px-3 py-2.5 text-sm font-bold text-dispatch-primary hover:bg-dispatch-primary-soft/80"
            >
              <span className="text-lg leading-none">+</span>
              Create new team
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm font-semibold text-dispatch-muted hover:bg-dispatch-bg"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
