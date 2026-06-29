import { forwardRef, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { formatStatusLabel } from "@/modules/manager-home/utils/routeStatus.js";
import { useAnchoredPanelPosition } from "@/modules/manager-home/presentation/hooks/useAnchoredPanelPosition.js";
import { useOpsTheme } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";

const IN_PROGRESS = new Set(["active", "in_progress"]);

export function ChevronRight() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ChevronDown({ open }) {
  return (
    <svg
      className={`ops-menu__chev h-4 w-4 ${open ? "rotate-180" : ""}`}
      style={{ color: "var(--text-muted)", transition: "transform 0.2s ease" }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" style={{ color: "var(--text-dim)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  );
}

export function StatusDot({ status }) {
  const live = IN_PROGRESS.has(status);
  return (
    <span
      className={live ? "ops-dot" : ""}
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: live ? "var(--green)" : "var(--text-dim)",
        flexShrink: 0,
      }}
    />
  );
}

export function MenuTrigger({ label, icon, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`ops-menu__trigger ${open ? "ops-menu__trigger--open" : ""}`}
    >
      {icon}
      {label}
      <ChevronDown open={open} />
    </button>
  );
}

export const MenuPanel = forwardRef(function MenuPanel(
  {
    children,
    className = "",
    anchorRef,
    open = false,
    maxWidth = 560,
    positionDeps = [],
  },
  ref
) {
  const internalRef = useRef(null);
  const panelRef = ref ?? internalRef;
  const { theme } = useOpsTheme();
  const fixedStyle = useAnchoredPanelPosition(anchorRef, panelRef, open, {
    maxWidth,
    deps: positionDeps,
  });

  if (!open) return null;

  const shellClass = theme === "light" ? " ops-shell--light" : "";

  return createPortal(
    <div
      ref={panelRef}
      className={`ops-shell ops-menu__panel ops-menu__panel--floating${shellClass} ${className}`.trim()}
      style={fixedStyle ?? undefined}
    >
      {children}
    </div>,
    document.body
  );
});

export function MenuRail({ categories, activeKey, onSelect }) {
  return (
    <div className="ops-menu__rail">
      {categories.map((cat) => (
        <button
          key={cat.key}
          type="button"
          onClick={() => onSelect(cat.key)}
          className={`ops-menu__cat ${activeKey === cat.key ? "ops-menu__cat--active" : ""}`}
        >
          {cat.label}
          <ChevronRight />
        </button>
      ))}
    </div>
  );
}

export function MenuSearch({ value, onChange, placeholder, autoFocus = true }) {
  return (
    <div className="ops-menu__search">
      <SearchIcon />
      <input
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function MenuBack({ label, onClick }) {
  return (
    <button type="button" className="ops-menu__back" onClick={onClick}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}

export function MenuEmpty({ children }) {
  return <p className="ops-menu__empty">{children}</p>;
}

export function MenuRow({ onClick, children, className = "", trailing = null }) {
  return (
    <button type="button" className={`ops-menu__row ${className}`} onClick={onClick}>
      {children}
      {trailing}
    </button>
  );
}

export function ActivityBadge({ count, title = "Completed routes" }) {
  if (!count || count <= 0) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
      style={{ background: "rgba(52, 211, 153, 0.18)", color: "var(--green)" }}
      title={title}
    >
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function RouteRow({ route, onClick }) {
  return (
    <MenuRow onClick={onClick}>
      <span className="flex min-w-0 items-center gap-2">
        <StatusDot status={route.status} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{route.routeName || "Route"}</span>
          <span className="block truncate text-xs" style={{ color: "var(--text-dim)" }}>
            {route.driverName || route.driverEmail || route.location || "—"}
          </span>
        </span>
      </span>
      <span className="shrink-0 text-xs" style={{ color: "var(--text-dim)" }}>
        {formatStatusLabel(route.status)}
      </span>
    </MenuRow>
  );
}

export function ScheduleRow({ schedule, onClick }) {
  return (
    <MenuRow onClick={onClick}>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{schedule.storeName ?? "Schedule"}</span>
        <span className="block truncate text-xs" style={{ color: "var(--text-dim)" }}>
          {schedule.routeCount ?? 0} route{(schedule.routeCount ?? 0) === 1 ? "" : "s"}
          {schedule.status ? ` · ${schedule.status}` : ""}
        </span>
      </span>
      <ChevronRight />
    </MenuRow>
  );
}

export function MenuSectionLabel({ children }) {
  return (
    <p className="ops-menu__section-label px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
      {children}
    </p>
  );
}

export function schedulesFromRoutes(routes) {
  const byId = new Map();
  for (const route of routes) {
    const id = route.scheduleId ?? route.schedule?.id;
    if (!id) continue;
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        storeName: route.schedule?.store?.storeName ?? route.location ?? "Store",
        status: route.schedule?.status ?? null,
        routeCount: 0,
      });
    }
    byId.get(id).routeCount += 1;
  }
  return [...byId.values()];
}

export function MemberDetailPane({ title, subtitle, rows, actions }) {
  return (
    <div className="ops-menu__detail">
      <div className="ops-menu__detail-head">
        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
          {title}
        </p>
        {subtitle ? (
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {rows?.length ? (
        <div className="ops-menu__detail-rows">
          {rows.map((row) => (
            <div key={row.label} className="ops-menu__detail-row">
              <span style={{ color: "var(--text-dim)" }}>{row.label}</span>
              <span className="font-medium" style={{ color: "var(--text)" }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {actions}
    </div>
  );
}

export function useMenuDismiss(open, onClose, anchorRef, panelRef) {
  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      const target = e.target;
      if (anchorRef?.current?.contains(target)) return;
      if (panelRef?.current?.contains(target)) return;
      onClose();
    }
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef, panelRef]);
}

export function filterByQuery(items, query, getText) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => getText(item).toLowerCase().includes(q));
}
