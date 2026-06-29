import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { UserRole } from "@/shared/utils/constants.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { todayIsoDate } from "@/shared/utils/time.js";
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
    <OpsTopBar showDate={false} refreshing={false} />
  );

  const tabButton = (key, label) => {
    const active = tab === key;
    return (
      <button
        type="button"
        onClick={() => setTab(key)}
        className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition"
        style={
          active
            ? { background: "rgba(34,211,238,0.12)", color: "var(--accent)" }
            : { background: "transparent", color: "var(--text-muted)" }
        }
      >
        {label}
      </button>
    );
  };

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
                New chat
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                Select a contact to message
              </p>
            </div>
          </div>
        </div>

        {isDispatchTeam ? (
          <div className="ops-panel ops-fade flex p-1">
            {tabButton("drivers", "Drivers")}
            {tabButton("ops", "Dispatch manager")}
          </div>
        ) : null}

        <div className="ops-panel ops-fade overflow-hidden">
          <div className="ops-menu__search">
            <svg
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--text-dim)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
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
            />
          </div>

          {isLoading ? (
            <div className="space-y-4 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="ops-skel h-16 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No contacts found.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filtered.map((item) => {
                const name = resolveDisplayName(item.fullName, item.email);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void (tab === "drivers" ? startDriverChat(item) : startOpsChat(item))
                      }
                      className="flex w-full items-center gap-4 px-4 py-4 text-left transition disabled:opacity-50 sm:px-6"
                      style={{ background: "transparent" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div className="ops-avatar flex h-11 w-11 shrink-0 items-center justify-center text-base font-bold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold" style={{ color: "var(--text)" }}>
                          {name}
                        </p>
                        <p className="truncate text-sm" style={{ color: "var(--text-muted)" }}>
                          {item.role ? `${item.role} · ` : ""}
                          {item.email}
                        </p>
                      </div>
                      <svg
                        className="h-5 w-5 shrink-0"
                        style={{ color: "var(--text-dim)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
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
