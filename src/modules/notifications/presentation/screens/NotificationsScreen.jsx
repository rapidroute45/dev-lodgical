import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import { formatTimestamp } from "@/shared/utils/time.js";
import { useNotificationsQuery } from "../../infrastructure/api/notifications.queries.js";

function NotificationRow({ item }) {
  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border bg-dispatch-surface p-4 transition ${
        item.read
          ? "border-dispatch-border"
          : "border-dispatch-primary/30 bg-dispatch-primary-soft/20"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dispatch-primary-soft text-dispatch-primary">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-bold ${
            item.read ? "text-dispatch-text" : "text-dispatch-primary"
          }`}
        >
          {item.title}
        </p>
        <p className="mt-1 text-sm text-dispatch-muted">{item.message}</p>
        {item.createdAt ? (
          <p className="mt-2 text-xs text-dispatch-light">{formatTimestamp(item.createdAt)}</p>
        ) : null}
      </div>
      {!item.read ? (
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-dispatch-primary" />
      ) : null}
    </div>
  );
}

export function NotificationsScreen() {
  const { data = [], isLoading, isFetching, refetch } = useNotificationsQuery();
  const unreadCount = data.filter((n) => !n.read).length;

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-dispatch-text">Notifications</h1>
          <p className="text-sm text-dispatch-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="rounded-xl border border-dispatch-border px-4 py-2.5 text-sm font-medium text-dispatch-muted transition hover:bg-dispatch-bg disabled:opacity-50"
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-dispatch-muted">
            Loading notifications…
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dispatch-border bg-dispatch-surface px-8 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-dispatch-primary-soft text-2xl text-dispatch-primary">
              🔔
            </div>
            <h2 className="text-lg font-bold text-dispatch-text">No notifications yet</h2>
            <p className="mt-2 text-sm text-dispatch-muted">
              Updates about routes, documents, and operations will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
