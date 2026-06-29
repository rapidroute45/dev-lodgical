import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { ScopedEmptyHint } from "@/modules/manager-home/presentation/components/ScopedEmptyHint.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OPS_ROLES } from "@/shared/utils/constants.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { todayIsoDate } from "@/shared/utils/time.js";
import { useConversationsQuery } from "../../infrastructure/api/chat.queries.js";

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ChatListScreen() {
  const { user } = useAuth();
  const isOps = user?.role != null && OPS_ROLES.includes(user.role);
  const { data = [], isLoading, isFetching, refetch } = useConversationsQuery();

  const sorted = useMemo(
    () =>
      [...data].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      ),
    [data]
  );

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Messages
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Chat with drivers and dispatch team
            </p>
          </div>
          {isOps ? (
            <div className="flex items-center gap-2">
              <Link to="/chat/new-group" className="ops-btn px-4 py-2.5 font-bold">
                <span className="text-lg leading-none">⊕</span>
                New group
              </Link>
              <Link to="/chat/new" className="ops-btn ops-btn--accent px-5 py-2.5 font-bold">
                <span className="text-lg leading-none">+</span>
                New chat
              </Link>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-16 rounded-2xl" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="ops-panel ops-fade px-8 py-16 text-center">
            <div className="ops-stat__icon mx-auto mb-4 flex h-14 w-14 items-center justify-center text-2xl">
              💬
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              No conversations yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
              {isOps
                ? "Start a chat using the compose button above."
                : "Your conversations will appear here."}
            </p>
            <ScopedEmptyHint show={!isLoading} />
            {isOps ? (
              <Link to="/chat/new" className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold">
                Start a conversation
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="ops-panel ops-fade overflow-hidden">
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {sorted.map((item) => {
                const unread = item.lastSenderId && item.lastSenderId !== user?.id;
                const initial = (item.otherName || "?").charAt(0).toUpperCase();
                const isGroup = Boolean(item.isGroup);
                return (
                  <li key={item.id}>
                    <Link
                      to={`/chat/${item.id}`}
                      className="flex items-center gap-4 px-4 py-4 transition sm:px-6"
                      style={{ background: "transparent" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div className="ops-avatar flex h-12 w-12 shrink-0 items-center justify-center text-lg font-bold">
                        {isGroup ? (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-bold" style={{ color: "var(--text)" }}>
                            {item.otherName}
                          </p>
                          {isGroup ? (
                            <span className="shrink-0 text-xs" style={{ color: "var(--text-dim)" }}>
                              · {item.memberCount} members
                            </span>
                          ) : null}
                          <span className="ml-auto shrink-0 text-xs" style={{ color: "var(--text-dim)" }}>
                            {formatTime(item.lastMessageAt)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="truncate text-sm" style={{ color: "var(--text-muted)" }}>
                            {item.lastMessagePreview || "No messages yet"}
                          </p>
                          {unread ? (
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: "var(--accent)" }}
                            />
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
