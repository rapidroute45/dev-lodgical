import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import {
  useCreateGroupMutation,
  useGroupCandidatesQuery,
} from "../../infrastructure/api/chat.queries.js";

export function NewGroupScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  const { data: candidates = [], isLoading } = useGroupCandidatesQuery(true);
  const createGroup = useCreateGroupMutation();

  const selectedMap = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((c) => {
      if (!q) return true;
      const name = resolveDisplayName(c.fullName, c.email).toLowerCase();
      return name.includes(q) || (c.email ?? "").toLowerCase().includes(q);
    });
  }, [candidates, search]);

  const toggle = (candidate) => {
    setSelected((prev) =>
      prev.some((s) => s.id === candidate.id)
        ? prev.filter((s) => s.id !== candidate.id)
        : [...prev, candidate]
    );
  };

  const canCreate = title.trim().length > 0 && selected.length > 0 && !createGroup.isPending;

  const handleCreate = async () => {
    if (!canCreate) return;
    try {
      const conv = await createGroup.mutateAsync({
        title: title.trim(),
        memberIds: selected.map((s) => s.id),
      });
      if (conv?.id) navigate(`/chat/${conv.id}`, { replace: true });
    } catch {
      /* surfaced by mutation */
    }
  };

  const topBar = <OpsTopBar showDate={false} refreshing={false} />;

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link to="/chat" className="ops-btn p-2.5" aria-label="Back to messages">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                New group
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                Name your group and add members
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => void handleCreate()}
            className="ops-btn ops-btn--accent px-5 py-2.5 font-bold disabled:opacity-50"
          >
            {createGroup.isPending ? "Creating…" : "Create group"}
          </button>
        </div>

        <div className="ops-panel ops-fade p-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
            Group name
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Route RR crew"
            maxLength={60}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
        </div>

        {selected.length > 0 ? (
          <div className="ops-panel ops-fade p-3">
            <div className="flex flex-wrap gap-2">
              {selected.map((s) => (
                <span
                  key={s.id}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
                  style={{ background: "rgba(34,211,238,0.12)", color: "var(--text)" }}
                >
                  {resolveDisplayName(s.fullName, s.email)}
                  <button
                    type="button"
                    onClick={() => toggle(s)}
                    className="text-xs"
                    style={{ color: "var(--text-dim)" }}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="ops-panel ops-fade overflow-hidden">
          <div className="ops-menu__search">
            <svg className="h-4 w-4 shrink-0" style={{ color: "var(--text-dim)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people to add"
            />
          </div>

          {isLoading ? (
            <div className="space-y-4 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="ops-skel h-14 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No people available to add.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filtered.map((item) => {
                const name = resolveDisplayName(item.fullName, item.email);
                const checked = selectedMap.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggle(item)}
                      className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition sm:px-6"
                      style={{ background: checked ? "rgba(34,211,238,0.06)" : "transparent" }}
                    >
                      <div className="ops-avatar flex h-11 w-11 shrink-0 items-center justify-center text-base font-bold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold" style={{ color: "var(--text)" }}>
                          {name}
                        </p>
                        <p className="truncate text-sm capitalize" style={{ color: "var(--text-muted)" }}>
                          {item.role ? `${item.role} · ` : ""}
                          {item.email}
                        </p>
                      </div>
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border"
                        style={{
                          borderColor: checked ? "var(--accent)" : "var(--border)",
                          background: checked ? "var(--accent)" : "transparent",
                        }}
                      >
                        {checked ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="#04141a" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
