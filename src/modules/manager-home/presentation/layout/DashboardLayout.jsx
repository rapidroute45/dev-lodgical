import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import {
  MANAGER_ROLES,
  OPS_ROLES,
  PAYROLL_VIEWER_ROLES,
  UserRole,
} from "@/shared/utils/constants.js";

function buildNav(user) {
  const role = user?.role;
  if (!role) return [];

  if (role === UserRole.ACCOUNTANT) {
    return [
      { to: "/payroll", label: "Payroll", icon: "payroll", end: true },
      { to: "/payroll/store-payroll", label: "Store payroll", icon: "receipt" },
      { to: "/notifications", label: "Notifications", icon: "bell" },
      { to: "/profile", label: "Profile", icon: "profile" },
    ];
  }

  if (role === UserRole.DISPATCH_TEAM) {
    return [
      { to: "/schedules", label: "Schedules", icon: "calendar", end: true },
      { to: "/schedules/create", label: "Create schedule", icon: "map" },
      { to: "/routes", label: "Routes", icon: "routes" },
      { to: "/stores", label: "Stores", icon: "store" },
      { to: "/chat", label: "Chat", icon: "chat" },
      { to: "/notifications", label: "Notifications", icon: "bell" },
      { to: "/profile", label: "Profile", icon: "profile" },
    ];
  }

  const items = [
    { to: "/dashboard", label: "Dashboard", icon: "grid", end: true },
    { to: "/schedules", label: "Schedules", icon: "calendar" },
    { to: "/schedules/create", label: "Create schedule", icon: "map" },
    { to: "/routes", label: "Routes", icon: "routes" },
    { to: "/stores", label: "Stores", icon: "store" },
  ];

  if (MANAGER_ROLES.includes(role)) {
    items.push(
      { to: "/dispatch-team", label: "Dispatch team", icon: "dispatchTeam" },
      { to: "/available-drivers", label: "Available drivers", icon: "drivers" },
      { to: "/users", label: "Users", icon: "users" },
      { to: "/assign-role", label: "Assign role", icon: "shield" },
      { to: "/driver-documents", label: "Driver docs", icon: "document" }
    );
  }

  items.push(
    { to: "/chat", label: "Chat", icon: "chat" },
    { to: "/notifications", label: "Notifications", icon: "bell" }
  );

  if (PAYROLL_VIEWER_ROLES.includes(role)) {
    items.push({ to: "/payroll", label: "Payroll", icon: "payroll" });
  }
  if (OPS_ROLES.includes(role)) {
    items.push({ to: "/payroll/store-payroll", label: "Store payroll", icon: "receipt" });
  }

  items.push({ to: "/profile", label: "Profile", icon: "profile" });
  return items;
}

function NavIcon({ name }) {
  const cls = "h-5 w-5 shrink-0";
  const paths = {
    grid: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    map: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    routes: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3",
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
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  };
  const d = paths[name] ?? paths.users;
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function SidebarNav({ nav, onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-dispatch-primary-soft text-dispatch-primary"
                : "text-dispatch-muted hover:bg-dispatch-bg"
            }`
          }
        >
          <NavIcon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function DashboardLayout({ children, topBar }) {
  const { user, logout } = useAuth();
  const nav = useMemo(() => buildNav(user), [user]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName =
    user?.fullName?.trim() ||
    (user?.email ? user.email.split("@")[0] : "User");

  return (
    <div className="flex min-h-svh bg-dispatch-bg">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-dispatch-border bg-dispatch-surface lg:flex">
        <div className="flex items-center gap-3 border-b border-dispatch-border px-6 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-dispatch-primary text-sm font-bold text-white shadow-md shadow-dispatch-primary/25">
            D
          </span>
          <div>
            <p className="text-sm font-bold text-dispatch-text">Dispatch</p>
            <p className="text-xs text-dispatch-muted">Operations hub</p>
          </div>
        </div>
        <SidebarNav nav={nav} />
        <div className="border-t border-dispatch-border p-4">
          <NavLink
            to="/profile"
            className="block rounded-xl bg-dispatch-bg px-3 py-3 transition hover:ring-1 hover:ring-dispatch-border"
          >
            <p className="truncate text-sm font-semibold text-dispatch-text">{displayName}</p>
            <p className="truncate text-xs text-dispatch-muted">{user?.email}</p>
            <p className="mt-1 text-xs font-medium capitalize text-dispatch-primary">
              {user?.role ?? "—"}
            </p>
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-lg border border-dispatch-border px-3 py-2 text-sm font-medium text-dispatch-muted transition hover:bg-dispatch-surface"
          >
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-dispatch-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-dispatch-border px-4 py-4">
              <p className="font-bold text-dispatch-text">Menu</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-dispatch-muted hover:bg-dispatch-bg"
              >
                ✕
              </button>
            </div>
            <SidebarNav nav={nav} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-dispatch-border bg-dispatch-surface px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-dispatch-border p-2 text-dispatch-muted"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-dispatch-text">Dispatch</span>
        </div>
        {topBar}
        <main className="flex-1 overflow-auto bg-dispatch-bg px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
