import { OpsThemeProvider } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";
import "@/modules/manager-home/presentation/ops.css";
import "./marketing-preview.css";
import { formatDisplayDate } from "@/shared/utils/time.js";
import { PREVIEW_DATE } from "./fixtures.js";

const NAV = [
  { label: "Dashboard", icon: "grid", active: false },
  { label: "Live tracking", icon: "tracking", active: false },
  { label: "Schedules", icon: "calendar", active: false },
  { label: "All routes", icon: "routes", active: false },
  { label: "Stores", icon: "store", active: false },
];

const ICONS = {
  grid: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  tracking: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  routes: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3",
  store: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3m2-16h14M9 7h6m-6 4h6",
};

function NavIcon({ name }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[name]} />
    </svg>
  );
}

export function MarketingPreviewLayout({ children, activeNav = "Dashboard" }) {
  return (
    <OpsThemeProvider defaultTheme="light">
      <div className="ops-shell ops-shell--light flex min-h-svh" data-marketing-preview="true">
        <div className="ops-shell__mesh" aria-hidden="true" />

        <aside className="ops-sidebar flex h-svh w-64 shrink-0 flex-col">
          <div className="flex items-center gap-3 border-b px-6 py-5" style={{ borderColor: "var(--border)" }}>
            <img
              src="/logo-light.png"
              alt="GBeyes"
              className="ops-sidebar__logo h-10 w-10 rounded-xl object-cover"
            />
            <div>
              <p className="ops-sidebar__brand text-sm">GBeyes</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Operations hub
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV.map((item) => (
              <div
                key={item.label}
                className={`ops-navlink ${item.label === activeNav ? "ops-navlink--active" : ""}`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </div>
            ))}
          </nav>

          <div className="border-t px-5 py-4" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Jordan P.
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Dispatch Manager
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="ops-topbar flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="ops-btn px-3 py-1.5 text-xs font-bold">{formatDisplayDate(PREVIEW_DATE)}</span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Chicago, IL
              </span>
            </div>
            <div className="ops-themeseg flex items-center">
              <span className="ops-themeseg__btn text-xs">Dark</span>
              <span className="ops-themeseg__btn ops-themeseg__btn--active text-xs">Light</span>
            </div>
          </header>

          <main className="marketing-preview-main min-h-0 flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </OpsThemeProvider>
  );
}
