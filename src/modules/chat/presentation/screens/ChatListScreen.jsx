import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OPS_ROLES } from "@/shared/utils/constants.js";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
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
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-dispatch-text">Messages</h1>
          <p className="text-sm text-dispatch-muted">Chat with drivers and dispatch team</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-xl border border-dispatch-border px-4 py-2.5 text-sm font-medium text-dispatch-muted transition hover:bg-dispatch-bg disabled:opacity-50"
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
          {isOps ? (
            <Link
              to="/chat/new"
              className="inline-flex items-center gap-2 rounded-xl bg-dispatch-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-dispatch-primary/25 transition hover:bg-dispatch-indigo-pressed"
            >
              <span className="text-lg leading-none">+</span>
              New chat
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-dispatch-muted">
            Loading conversations…
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dispatch-border bg-dispatch-surface px-8 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-dispatch-primary-soft text-2xl text-dispatch-primary">
              💬
            </div>
            <h2 className="text-lg font-bold text-dispatch-text">No conversations yet</h2>
            <p className="mt-2 max-w-sm text-sm text-dispatch-muted">
              {isOps
                ? "Start a chat using the compose button above."
                : "Your conversations will appear here."}
            </p>
            {isOps ? (
              <Link
                to="/chat/new"
                className="mt-6 inline-flex rounded-xl bg-dispatch-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dispatch-indigo-pressed"
              >
                Start a conversation
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-dispatch-border bg-dispatch-surface">
            {sorted.map((item) => {
              const unread = item.lastSenderId && item.lastSenderId !== user?.id;
              const initial = (item.otherName || "?").charAt(0).toUpperCase();
              return (
                <Link
                  key={item.id}
                  to={`/chat/${item.id}`}
                  className="flex items-center gap-4 border-b border-dispatch-border px-4 py-4 transition last:border-b-0 hover:bg-dispatch-bg sm:px-6"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-dispatch-primary-soft text-lg font-bold text-dispatch-primary">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-base font-bold text-dispatch-text">
                        {item.otherName}
                      </p>
                      <span className="shrink-0 text-xs text-dispatch-muted">
                        {formatTime(item.lastMessageAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="truncate text-sm text-dispatch-muted">
                        {item.lastMessagePreview || "No messages yet"}
                      </p>
                      {unread ? (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-dispatch-primary" />
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
