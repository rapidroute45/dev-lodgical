import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PAGE_EDGE_X } from "@/shared/layout/pageLayout.js";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { OpsThemeProvider, useOpsTheme } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";
import "@/modules/manager-home/presentation/ops.css";
import {
  MANAGER_ROLES,
  OPS_ROLES,
  PAYROLL_VIEWER_ROLES,
  UserRole,
  isAdmin,
  isDispatchManager,
} from "@/shared/utils/constants.js";
import { useOpsElevation } from "@/modules/auth/presentation/context/OpsElevationContext.jsx";
import { OpsPinModal } from "@/modules/auth/presentation/components/OpsPinModal.jsx";

const HIDE_DELAY_MS = 280;

/** Active for /schedules and schedule detail/spreadsheet — not /schedules/create. */
function matchSchedulesNav(location) {
  const path = location.pathname;
  if (path === "/schedules/create") return false;
  return path === "/schedules" || path.startsWith("/schedules/");
}

/** Active for /payroll bills — not /payroll/store-payroll. */
function matchPayrollNav(location) {
  const path = location.pathname;
  if (path.startsWith("/payroll/store-payroll")) return false;
  return path === "/payroll" || path.startsWith("/payroll/");
}

function buildNav(user, t, elevation) {
  const role = user?.role;
  if (!role) return [];

  const { dispatchUnlocked = false, payrollUnlocked = false } = elevation ?? {};

  if (role === UserRole.ACCOUNTANT) {
    return [
      { to: "/payroll", label: t("nav.payroll"), icon: "payroll", end: true },
      { to: "/payroll/store-payroll", label: t("nav.storePayroll"), icon: "receipt" },
      { to: "/profile", label: t("nav.profile"), icon: "profile" },
    ];
  }

  if (role === UserRole.DISPATCH_TEAM) {
    return [
      { to: "/dashboard", label: t("nav.dashboard"), icon: "grid", end: true },
      { to: "/tracking", label: t("nav.liveTracking"), icon: "tracking" },
      {
        to: "/schedules",
        label: t("nav.schedules"),
        icon: "calendar",
        matchActive: matchSchedulesNav,
      },
      { to: "/schedules/create", label: t("nav.createSchedule"), icon: "map", end: true },
      { to: "/all-routes", label: t("nav.allRoutes"), icon: "routes" },
      { to: "/stores", label: t("nav.stores"), icon: "store" },
      { to: "/chat", label: t("nav.chat"), icon: "chat" },
      { to: "/profile", label: t("nav.profile"), icon: "profile" },
    ];
  }

  const baseOps = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: "grid", end: true },
    { to: "/tracking", label: t("nav.liveTracking"), icon: "tracking" },
    {
      to: "/schedules",
      label: t("nav.schedules"),
      icon: "calendar",
      matchActive: matchSchedulesNav,
    },
  ];

  const showCreateSchedule =
    isDispatchManager(role) || (isAdmin(role) && dispatchUnlocked);

  if (showCreateSchedule) {
    baseOps.push({
      to: "/schedules/create",
      label: t("nav.createSchedule"),
      icon: "map",
      end: true,
    });
  }

  baseOps.push(
    { to: "/all-routes", label: t("nav.allRoutes"), icon: "routes" },
    { to: "/stores", label: t("nav.stores"), icon: "store" }
  );

  const items = [...baseOps];

  if (MANAGER_ROLES.includes(role)) {
    items.push(
      { to: "/dispatch-team", label: t("nav.dispatchTeam"), icon: "dispatchTeam" },
      { to: "/driver-teams", label: t("nav.driverTeams"), icon: "driverTeams" },
      { to: "/available-drivers", label: t("nav.availableDrivers"), icon: "drivers" },
      { to: "/users", label: t("nav.users"), icon: "users" },
      { to: "/assign-role", label: t("nav.assignRole"), icon: "shield" },
      { to: "/driver-documents", label: t("nav.driverDocs"), icon: "document" }
    );
  }

  items.push({ to: "/chat", label: t("nav.chat"), icon: "chat" });

  const showPayrollNav =
    (isDispatchManager(role) || (isAdmin(role) && payrollUnlocked)) &&
    PAYROLL_VIEWER_ROLES.includes(role);

  if (showPayrollNav) {
    items.push({
      to: "/payroll",
      label: t("nav.payroll"),
      icon: "payroll",
      matchActive: matchPayrollNav,
    });
  }

  const showStorePayrollNav =
    showPayrollNav && OPS_ROLES.includes(role);

  if (showStorePayrollNav) {
    items.push({
      to: "/payroll/store-payroll",
      label: t("nav.storePayroll"),
      icon: "receipt",
      end: true,
    });
  }

  items.push({ to: "/profile", label: t("nav.profile"), icon: "profile" });
  return items;
}

function NavIcon({ name }) {
  const cls = "h-5 w-5 shrink-0";
  const paths = {
    grid: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    map: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    routes: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3",
    tracking: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    store: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3m2-16h14M9 7h6m-6 4h6",
    payroll: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    receipt: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
    shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    document: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    chat: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    drivers: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    dispatchTeam: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    driverTeams: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  };
  const d = paths[name] ?? paths.users;
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function SidebarElevationActions({ role, dispatchUnlocked, payrollUnlocked, onDispatchClick, onPayrollClick }) {
  const { t } = useTranslation();
  if (!isAdmin(role)) return null;

  return (
    <div className="space-y-1 border-t px-3 py-3" style={{ borderColor: "var(--border)" }}>
      <button
        type="button"
        className={`ops-navlink w-full text-left ${dispatchUnlocked ? "ops-navlink--active" : ""}`}
        onClick={onDispatchClick}
      >
        <NavIcon name="dispatchTeam" />
        {dispatchUnlocked ? t("nav.logoutDispatch") : t("nav.dispatchMode")}
      </button>
      <button
        type="button"
        className={`ops-navlink w-full text-left ${payrollUnlocked ? "ops-navlink--active" : ""}`}
        onClick={onPayrollClick}
      >
        <NavIcon name="payroll" />
        {payrollUnlocked ? t("nav.logoutPayroll") : t("nav.payrollMode")}
      </button>
    </div>
  );
}

function SidebarNav({ nav }) {
  const { pathname } = useLocation();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {nav.map((item) => {
        const active = isNavItemActive(item, pathname);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={`ops-navlink ${active ? "ops-navlink--active" : ""}`}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

/** RR v7 removed NavLink's isActive prop — resolve active state ourselves. */
function isNavItemActive(item, pathname) {
  if (item.matchActive) return item.matchActive({ pathname });
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function DashboardLayout({ children, topBar }) {
  return (
    <OpsThemeProvider>
      <DashboardLayoutShell topBar={topBar}>{children}</DashboardLayoutShell>
    </OpsThemeProvider>
  );
}

function DashboardLayoutShell({ children, topBar }) {
  const { theme } = useOpsTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { dispatchUnlocked, payrollUnlocked, verifyPin, clearScope } = useOpsElevation();
  const [pinModal, setPinModal] = useState(null);
  const nav = useMemo(
    () => buildNav(user, t, { dispatchUnlocked, payrollUnlocked }),
    [user, t, i18n.language, dispatchUnlocked, payrollUnlocked]
  );
  const displayName =
    user?.fullName?.trim() ||
    (user?.email ? user.email.split("@")[0] : t("common.user"));

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hideTimerRef = useRef(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const showSidebar = useCallback(() => {
    clearHideTimer();
    setSidebarOpen(true);
  }, [clearHideTimer]);

  const scheduleHideSidebar = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setSidebarOpen(false);
      hideTimerRef.current = null;
    }, HIDE_DELAY_MS);
  }, [clearHideTimer]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  return (
    <div className={`ops-shell flex min-h-svh${theme === "light" ? " ops-shell--light" : ""}`}>
      <div className="ops-shell__mesh" aria-hidden="true" />

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-[width] duration-200 ease-out ${
          sidebarOpen ? "w-64" : "w-3"
        }`}
        onMouseEnter={showSidebar}
        onMouseLeave={scheduleHideSidebar}
      >
        <aside
          className={`ops-sidebar flex h-full w-64 flex-col transition-transform duration-200 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-hidden={!sidebarOpen}
        >
          <div className="flex items-center gap-3 border-b px-6 py-5" style={{ borderColor: "var(--border)" }}>
            <img
              src={theme === "light" ? "/logo-light.png" : "/logo-dark.png"}
              alt="GBeyes"
              className="ops-sidebar__logo h-10 w-10 rounded-xl object-cover"
            />
            <div>
              <p className="ops-sidebar__brand text-sm">GBeyes</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("nav.operationsHub")}
              </p>
            </div>
          </div>

          <SidebarNav nav={nav} />

          <SidebarElevationActions
            role={user?.role}
            dispatchUnlocked={dispatchUnlocked}
            payrollUnlocked={payrollUnlocked}
            onDispatchClick={() => {
              if (dispatchUnlocked) {
                clearScope("dispatch");
                return;
              }
              setPinModal("dispatch");
            }}
            onPayrollClick={() => {
              if (payrollUnlocked) {
                clearScope("payroll");
                return;
              }
              setPinModal("payroll");
            }}
          />

          <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
            <NavLink to="/profile" className="ops-userchip block px-3 py-3">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                {displayName}
              </p>
              <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                {user?.email}
              </p>
              <p className="mt-1 text-xs font-semibold capitalize" style={{ color: "var(--accent)" }}>
                {user?.role ?? "—"}
              </p>
            </NavLink>
            <button
              type="button"
              onClick={logout}
              className="ops-signout mt-3 w-full rounded-lg px-3 py-2 text-sm font-medium"
            >
              {t("common.signOut")}
            </button>
          </div>
        </aside>
      </div>

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30"
          aria-label={t("nav.closeNavigation")}
          onClick={scheduleHideSidebar}
        />
      ) : null}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {topBar}
        <main className={`flex-1 overflow-auto py-4 sm:py-5 ${PAGE_EDGE_X}`}>{children}</main>
      </div>

      <OpsPinModal
        open={!!pinModal}
        scope={pinModal ?? "dispatch"}
        onClose={() => setPinModal(null)}
        onVerified={verifyPin}
      />
    </div>
  );
}
