import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useMenuDismiss } from "@/modules/manager-home/presentation/components/opsNavShared.jsx";
import { useAnchoredPanelPosition } from "@/modules/manager-home/presentation/hooks/useAnchoredPanelPosition.js";
import { useOpsTheme } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";
import { formatTimestamp } from "@/shared/utils/time.js";
import { navigateFromNotification } from "@/modules/notifications/infrastructure/push/navigateFromNotification.js";
import { usePushNotificationInbox } from "@/modules/notifications/presentation/context/PushNotificationInboxProvider.jsx";
import {
  useClearAllNotificationsMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/modules/notifications/infrastructure/api/notifications.queries.js";

const NOTIFICATION_PANEL_MAX_WIDTH = 352;

function toBellItemFromApi(notification) {
  return {
    id: `api:${notification.id}`,
    source: "api",
    apiId: notification.id,
    title: notification.title,
    message: notification.message,
    data: {
      type: notification.type,
      ...(notification.payload ?? {}),
    },
    receivedAt: notification.createdAt ?? null,
    read: Boolean(notification.read),
  };
}

function toBellItemFromPush(item) {
  return {
    id: `push:${item.id}`,
    source: "push",
    pushId: item.id,
    title: item.title,
    message: item.message,
    data: item.data ?? {},
    receivedAt: item.receivedAt ?? null,
    read: Boolean(item.read),
  };
}

function sortByNewest(a, b) {
  const aMs = a.receivedAt ? Date.parse(a.receivedAt) : 0;
  const bMs = b.receivedAt ? Date.parse(b.receivedAt) : 0;
  return bMs - aMs;
}

export function NotificationBellDropdown() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const anchorRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { items: pushItems, removeItem, clear: clearPushInbox } = usePushNotificationInbox();
  const { data: apiNotifications = [] } = useNotificationsQuery(true, { opsFastPoll: true });
  const markRead = useMarkNotificationReadMutation();
  const clearAllApi = useClearAllNotificationsMutation();
  const { theme } = useOpsTheme();

  const items = useMemo(() => {
    const apiItems = apiNotifications.map(toBellItemFromApi);
    const localPush = pushItems.map(toBellItemFromPush);

    // Prefer API rows when the same event also arrived as a push.
    const apiKeys = new Set(
      apiItems.map((item) => {
        const type = item.data?.type ?? "";
        const routeId = item.data?.routeId ?? "";
        const title = item.title ?? "";
        return `${type}|${routeId}|${title}`;
      })
    );

    const filteredPush = localPush.filter((item) => {
      const type = item.data?.type ?? "";
      const routeId = item.data?.routeId ?? "";
      const title = item.title ?? "";
      return !apiKeys.has(`${type}|${routeId}|${title}`);
    });

    return [...apiItems, ...filteredPush].sort(sortByNewest);
  }, [apiNotifications, pushItems]);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items]
  );

  useMenuDismiss(open, () => setOpen(false), anchorRef, panelRef);

  const fixedStyle = useAnchoredPanelPosition(anchorRef, panelRef, open, {
    align: "end",
    maxWidth: NOTIFICATION_PANEL_MAX_WIDTH,
    defaultHeight: 320,
    deps: [items.length],
  });

  async function handleItemClick(item) {
    if (item.source === "api" && item.apiId && !item.read) {
      try {
        await markRead.mutateAsync(item.apiId);
      } catch {
        // Still navigate.
      }
    }
    if (item.source === "push" && item.pushId) {
      removeItem(item.pushId);
    }
    navigateFromNotification(navigate, item.data ?? {});
    setOpen(false);
  }

  function handleClearAll(event) {
    event.stopPropagation();
    if (items.length === 0) return;
    const confirmed = window.confirm("Clear all notifications?");
    if (!confirmed) return;
    clearPushInbox();
    void clearAllApi.mutateAsync().catch(() => {
      // Push inbox already cleared; API clear can retry on next visit.
    });
  }

  return (
    <div ref={anchorRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`ops-btn relative p-2.5 ${open ? "ops-btn--accent" : ""}`}
        aria-label={t("nav.notifications")}
        aria-expanded={open}
        title={t("nav.notifications")}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 ? (
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{ background: "var(--rose)" }}
            aria-hidden
          />
        ) : null}
      </button>

      {open
        ? createPortal(
            <div
              ref={panelRef}
              className={`ops-shell ops-notifications-panel overflow-hidden rounded-xl shadow-2xl${
                theme === "light" ? " ops-shell--light" : ""
              }`}
              style={{
                ...fixedStyle,
                border: "1px solid var(--border-strong)",
                background: "var(--bg-card-solid)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
              }}
            >
              <div
                className="flex items-center justify-between gap-2 border-b px-4 py-3"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                  {t("nav.notifications")}
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={items.length === 0 || clearAllApi.isPending}
                  className="ops-btn p-2 disabled:opacity-40"
                  aria-label="Clear all notifications"
                  title="Clear all"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{
                      color:
                        items.length === 0 ? "var(--text-dim)" : "var(--rose)",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No notifications yet.
                  </p>
                ) : (
                  items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        void handleItemClick(item);
                      }}
                      className="ops-row block w-full px-4 py-3 text-left"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: item.read
                          ? "transparent"
                          : "rgba(56,189,248,0.06)",
                      }}
                    >
                      <span
                        className="block text-sm font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {item.title}
                      </span>
                      <span
                        className="mt-0.5 block text-sm leading-snug"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.message}
                      </span>
                      {item.receivedAt ? (
                        <span
                          className="mt-1 block text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {formatTimestamp(item.receivedAt)}
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
