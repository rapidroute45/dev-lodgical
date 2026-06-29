import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useMenuDismiss } from "@/modules/manager-home/presentation/components/opsNavShared.jsx";
import { formatTimestamp } from "@/shared/utils/time.js";
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/modules/notifications/infrastructure/api/notifications.queries.js";
import {
  notificationPayloadToPushData,
  navigateFromNotification,
} from "@/modules/notifications/infrastructure/push/navigateFromNotification.js";

export function NotificationBellDropdown() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { data: items = [], isLoading, refetch, isFetching } = useNotificationsQuery(true, {
    opsFastPoll: true,
  });
  const markReadMutation = useMarkNotificationReadMutation();

  useMenuDismiss(open, () => setOpen(false), rootRef);

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next) void refetch();
      return next;
    });
  }

  async function handleItemClick(item) {
    const data = notificationPayloadToPushData(item.type, item.payload ?? {});

    if (!item.read && item.id) {
      try {
        await markReadMutation.mutateAsync(item.id);
      } catch {
        // Still navigate even if mark-read fails.
      }
    }

    navigateFromNotification(navigate, data);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
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
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl shadow-2xl"
          style={{
            border: "1px solid var(--border-strong)",
            background: "var(--bg-card-solid)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
          }}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
              {t("nav.notifications")}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No notifications yet.
              </p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handleItemClick(item)}
                  disabled={markReadMutation.isPending}
                  className="ops-row block w-full px-4 py-3 text-left"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: item.read ? "transparent" : "rgba(56,189,248,0.06)",
                    opacity: item.read ? 0.72 : 1,
                  }}
                >
                  <span
                    className="block text-sm font-semibold"
                    style={{ color: item.read ? "var(--text-muted)" : "var(--text)" }}
                  >
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-snug" style={{ color: "var(--text-muted)" }}>
                    {item.message}
                  </span>
                  {item.createdAt ? (
                    <span className="mt-1 block text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatTimestamp(item.createdAt)}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>

          {isFetching && !isLoading ? (
            <p
              className="border-t px-4 py-2 text-center text-xs"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              Updating…
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
