import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { UserRole } from "@/shared/utils/constants.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import {
  useChatDriversQuery,
  useChatOpsPeersQuery,
  useCreateConversationMutation,
  useCreateInternalConversationMutation,
} from "../../infrastructure/api/chat.queries.js";

export function NewChatScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDispatchTeam = user?.role === UserRole.DISPATCH_TEAM;
  const [tab, setTab] = useState("drivers");
  const [search, setSearch] = useState("");

  const { data: drivers = [], isLoading: driversLoading } = useChatDriversQuery(tab === "drivers");
  const { data: peers = [], isLoading: peersLoading } = useChatOpsPeersQuery(
    tab === "ops" && isDispatchTeam
  );
  const createChat = useCreateConversationMutation();
  const createInternal = useCreateInternalConversationMutation();

  const list = tab === "drivers" ? drivers : peers;
  const isLoading = tab === "drivers" ? driversLoading : peersLoading;
  const busy = createChat.isPending || createInternal.isPending;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((d) => {
      if (!q) return true;
      const name = (d.fullName ?? d.email).toLowerCase();
      return name.includes(q) || d.email.toLowerCase().includes(q);
    });
  }, [list, search]);

  const startDriverChat = async (driver) => {
    const conv = await createChat.mutateAsync(driver.id);
    if (conv?.id) navigate(`/chat/${conv.id}`, { replace: true });
  };

  const startOpsChat = async (peer) => {
    const conv = await createInternal.mutateAsync(peer.id);
    if (conv?.id) navigate(`/chat/${conv.id}`, { replace: true });
  };

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div className="flex items-center gap-3">
          <Link
            to="/chat"
            className="rounded-lg border border-dispatch-border px-3 py-2 text-sm font-medium text-dispatch-muted transition hover:bg-dispatch-bg"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-dispatch-text">New chat</h1>
            <p className="text-sm text-dispatch-muted">Select a contact to message</p>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {isDispatchTeam ? (
          <div className="flex rounded-xl border border-dispatch-border bg-dispatch-surface p-1">
            <button
              type="button"
              onClick={() => setTab("drivers")}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                tab === "drivers"
                  ? "bg-dispatch-primary-soft text-dispatch-primary"
                  : "text-dispatch-muted hover:bg-dispatch-bg"
              }`}
            >
              Drivers
            </button>
            <button
              type="button"
              onClick={() => setTab("ops")}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                tab === "ops"
                  ? "bg-dispatch-primary-soft text-dispatch-primary"
                  : "text-dispatch-muted hover:bg-dispatch-bg"
              }`}
            >
              Dispatch manager
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-3 rounded-xl border border-dispatch-border bg-dispatch-surface px-4 py-3">
          <svg
            className="h-5 w-5 shrink-0 text-dispatch-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "drivers" ? "Search drivers" : "Search dispatch managers"}
            className="w-full bg-transparent text-sm text-dispatch-text outline-none placeholder:text-dispatch-light"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-dispatch-muted">
            Loading contacts…
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-dispatch-muted">No contacts found.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-dispatch-border bg-dispatch-surface">
            {filtered.map((item) => {
              const name = resolveDisplayName(item.fullName, item.email);
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void (tab === "drivers" ? startDriverChat(item) : startOpsChat(item))
                  }
                  className="flex w-full items-center gap-4 border-b border-dispatch-border px-4 py-4 text-left transition last:border-b-0 hover:bg-dispatch-bg disabled:opacity-50 sm:px-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-dispatch-primary-soft text-base font-bold text-dispatch-primary">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-dispatch-text">{name}</p>
                    <p className="truncate text-sm text-dispatch-muted">
                      {item.role ? `${item.role} · ` : ""}
                      {item.email}
                    </p>
                  </div>
                  <svg
                    className="h-5 w-5 shrink-0 text-dispatch-light"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
