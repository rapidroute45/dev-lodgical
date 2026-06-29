import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useMenuDismiss } from "@/modules/manager-home/presentation/components/opsNavShared.jsx";
import { useAnchoredPanelPosition } from "@/modules/manager-home/presentation/hooks/useAnchoredPanelPosition.js";
import { useOpsTheme } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";
import { formatTimestamp } from "@/shared/utils/time.js";
import { navigateFromNotification } from "@/modules/notifications/infrastructure/push/navigateFromNotification.js";
import { usePushNotificationInbox } from "@/modules/notifications/presentation/context/PushNotificationInboxProvider.jsx";

const NOTIFICATION_PANEL_MAX_WIDTH = 352;

export function NotificationBellDropdown() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const anchorRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { items, unreadCount, removeItem } = usePushNotificationInbox();
  const { theme } = useOpsTheme();

  useMenuDismiss(open, () => setOpen(false), anchorRef, panelRef);

  const fixedStyle = useAnchoredPanelPosition(anchorRef, panelRef, open, {
    align: "end",
    maxWidth: NOTIFICATION_PANEL_MAX_WIDTH,
    defaultHeight: 320,
    deps: [items.length],
  });

  function handleItemClick(item) {
    if (item.id) {
      removeItem(item.id);
    }
    navigateFromNotification(navigate, item.data ?? {});
    setOpen(false);
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
                className="flex items-center justify-between border-b px-4 py-3"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                  {t("nav.notifications")}
                </p>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    No push notifications yet.
                  </p>
                ) : (
                  items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className="ops-row block w-full px-4 py-3 text-left"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: "rgba(56,189,248,0.06)",
                      }}
                    >
                      <span
                        className="block text-sm font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-sm leading-snug" style={{ color: "var(--text-muted)" }}>
                        {item.message}
                      </span>
                      {item.receivedAt ? (
                        <span className="mt-1 block text-xs" style={{ color: "var(--text-muted)" }}>
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
