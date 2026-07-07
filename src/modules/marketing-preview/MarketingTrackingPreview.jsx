import { MarketingPreviewLayout } from "./MarketingPreviewLayout.jsx";
import { LiveTrackingMap } from "@/modules/tracking/presentation/components/LiveTrackingMap.jsx";
import { formatRouteStatus, routeStatusClass } from "@/modules/scheduling/utils/scheduleStatus.js";
import { formatDisplayDate } from "@/shared/utils/time.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { PREVIEW_DATE, PREVIEW_LIVE_DRIVERS, PREVIEW_ROUTES } from "./fixtures.js";
import "@/modules/tracking/presentation/components/liveTracking.css";

const STATUS_TABS = [
  { key: "all", label: "All", count: 4 },
  { key: "in_progress", label: "In progress", count: 2 },
  { key: "pending", label: "Pending", count: 1 },
  { key: "completed", label: "Completed", count: 1 },
];

export function MarketingTrackingPreview() {
  const scopeCenter = { lat: 41.8781, lng: -87.6298, zoom: 12 };

  return (
    <MarketingPreviewLayout activeNav="Live tracking">
      <div className={`${PAGE_CONTENT} space-y-4 overflow-y-auto py-6`}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Live tracking
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
              Live drivers on map · all routes in panel · {formatDisplayDate(PREVIEW_DATE)} · Live
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="ops-panel ops-fade p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
              Live drivers ({PREVIEW_LIVE_DRIVERS.length})
            </p>
            <LiveTrackingMap
              drivers={PREVIEW_LIVE_DRIVERS}
              scopeCenter={scopeCenter}
              className="live-tracking-map"
            />
          </div>

          <aside className="ops-panel ops-fade live-tracking-sidebar overflow-hidden">
            <div className="ops-panel__head px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Route maps ({PREVIEW_ROUTES.length})
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {STATUS_TABS.map((tab) => (
                  <span
                    key={tab.key}
                    className={`ops-chip text-xs ${tab.key === "all" ? "ops-chip--active" : ""}`}
                  >
                    {tab.label} ({tab.count})
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5">
              <ul className="space-y-2">
                {PREVIEW_ROUTES.map((route) => {
                  const live = PREVIEW_LIVE_DRIVERS.find((d) => d.id === route.id);
                  const progress = live?.progress;
                  const finished =
                    progress != null ? progress.completedDropoffs + progress.returnedDropoffs : null;
                  const total = progress?.totalDropoffs ?? null;

                  return (
                    <li key={route.id}>
                      <div className="ops-card live-tracking-card w-full p-3 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>
                            {route.driverName ?? "Unassigned"}
                          </p>
                          <span className={`ops-badge shrink-0 ${routeStatusClass(route.status)}`}>
                            {formatRouteStatus(route.status)}
                          </span>
                        </div>
                        <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                          {route.routeName}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                          {route.schedule?.store?.storeName} · {route.schedule?.city}, {route.schedule?.state}
                        </p>
                        {live ? (
                          <p className="mt-2 text-xs font-semibold" style={{ color: "var(--accent)" }}>
                            {total > 0 ? `${finished}/${total} stops` : "In progress"} · Location shared
                          </p>
                        ) : (
                          <p className="mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
                            Click to view stops map
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </MarketingPreviewLayout>
  );
}
