import { MarketingPreviewLayout } from "./MarketingPreviewLayout.jsx";
import { OpsStatCard } from "@/modules/manager-home/presentation/components/OpsWidgets.jsx";
import { RouteStatusFilter } from "@/modules/scheduling/presentation/components/RouteStatusFilter.jsx";
import { RouteSummaryRow } from "@/modules/scheduling/presentation/components/RouteSummaryRow.jsx";
import { ScheduleAttribution } from "@/modules/scheduling/presentation/components/ScheduleAttribution.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { PREVIEW_ROUTES, PREVIEW_STORES } from "./fixtures.js";

function groupRoutesByStore(routes) {
  const groups = new Map();
  for (const route of routes) {
    const store = route.schedule?.store;
    const key = store?.storeId ?? "unknown";
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        storeName: store?.storeName ?? "Unknown store",
        storeMeta: [route.schedule?.city, route.schedule?.state, store?.storeId].filter(Boolean).join(" · "),
        dispatchTeam: route.schedule?.dispatchTeam ?? null,
        createdByName: route.schedule?.createdByName ?? null,
        routes: [],
      });
    }
    groups.get(key).routes.push(route);
  }
  return Array.from(groups.values());
}

export function MarketingRoutesPreview() {
  const grouped = groupRoutesByStore(PREVIEW_ROUTES);
  const summary = {
    total: PREVIEW_ROUTES.length,
    pending: 1,
    inProgress: 2,
    unassigned: 1,
  };

  return (
    <MarketingPreviewLayout activeNav="All routes">
      <div className={`${PAGE_CONTENT} space-y-5 overflow-y-auto py-6`}>
        <div className="ops-fade flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Routes
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Browse routes by date and location
            </p>
          </div>
          <span className="ops-btn px-5 py-2.5 font-bold">Schedules</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OpsStatCard icon="routes" label="Total routes" value={summary.total} delay={0} />
          <OpsStatCard icon="clock" label="Pending / awaiting" value={summary.pending} barColor="var(--amber)" delay={60} />
          <OpsStatCard icon="active" label="In progress" value={summary.inProgress} barColor="var(--accent)" delay={120} />
          <OpsStatCard
            icon="drivers"
            label="Unassigned"
            value={summary.unassigned}
            barColor="var(--rose)"
            percent={25}
            delay={180}
          />
        </div>

        <div className="grid w-full gap-6 xl:grid-cols-[minmax(300px,380px)_1fr] xl:items-start">
          <div className="space-y-5">
            <div className="ops-panel ops-fade p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Filter by store
              </p>
              <ul className="space-y-2">
                {PREVIEW_STORES.map((store) => (
                  <li
                    key={store.id}
                    className="ops-card flex cursor-pointer items-center gap-3 p-3 ops-card--hover"
                  >
                    <span className="ops-avatar flex h-9 w-9 shrink-0 items-center justify-center">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>
                        {store.storeName}
                      </p>
                      <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                        {store.city}, {store.state} · {store.storeId}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ops-panel ops-fade p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Route status
              </p>
              <RouteStatusFilter value="all" onChange={() => {}} />
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="ops-panel ops-fade overflow-hidden">
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
                  Results
                  <span className="ml-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                    {PREVIEW_ROUTES.length} of {PREVIEW_ROUTES.length}
                  </span>
                </h2>
              </div>

              <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="ops-menu__search">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="search" readOnly placeholder="Search routes, drivers, teams…" defaultValue="" />
                </div>
              </div>

              <div className="space-y-4 p-5">
                {grouped.map((group) => (
                  <section key={group.key} className="ops-card ops-fade overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}
                    >
                      <span className="ops-avatar flex h-9 w-9 shrink-0 items-center justify-center">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>
                          {group.storeName}
                        </p>
                        <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                          {group.storeMeta}
                        </p>
                        <ScheduleAttribution
                          dispatchTeam={group.dispatchTeam}
                          createdByName={group.createdByName}
                          showDispatchTeam
                        />
                      </div>
                      <span className="ops-teamtag">
                        {group.routes.length} route{group.routes.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {group.routes.map((route, index) => (
                        <li key={route.id}>
                          <RouteSummaryRow route={route} index={index + 1} nested to={`#${route.id}`} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingPreviewLayout>
  );
}
