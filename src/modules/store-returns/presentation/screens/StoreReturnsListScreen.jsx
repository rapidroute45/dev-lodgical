import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { OpsEmpty, OpsPanel, OpsStatusBadge } from "@/modules/manager-home/presentation/components/OpsWidgets.jsx";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
import { useDayReturnsQuery } from "@/modules/manager-home/infrastructure/api/dashboard.queries.js";
import { formatStatusLabel } from "@/modules/manager-home/utils/routeStatus.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { formatDisplayDate, todayIsoDate } from "@/shared/utils/time.js";
import { mediaUrl } from "@/shared/utils/mediaUrl.js";
import { useOpsStoreReturnsQuery } from "../../infrastructure/api/storeReturns.queries.js";

function reasonLabel(stop) {
  if (stop.returnReasonCustom?.trim()) return stop.returnReasonCustom.trim();
  if (stop.returnReason?.trim()) {
    return stop.returnReason.trim().replace(/_/g, " ");
  }
  return "No reason given";
}

function StoreReturnPhotosModal({ stop, onClose }) {
  const photos = (stop.photoUrls ?? [])
    .map((path) => mediaUrl(path, { width: 1600, quality: 78 }))
    .filter(Boolean);
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];

  if (!photos.length) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border shadow-2xl"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold" style={{ color: "var(--text)" }}>
              {stop.returnNumber ? `${stop.returnNumber} · ` : ""}
              {stop.name}
            </p>
            <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
              Store return photos · {photos.length} image{photos.length === 1 ? "" : "s"}
            </p>
          </div>
          <button type="button" className="ops-btn px-3 py-1.5 text-xs font-bold" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="flex max-h-[75vh] items-center justify-center bg-black/40 p-4">
          <img
            src={current}
            alt={`Store return ${active + 1}`}
            className="max-h-[68vh] w-full rounded-xl object-contain"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}

function ReturnedStopRow({ stop, index, onOpenPhotos }) {
  const navigate = useNavigate();
  const hasPhotos = Boolean(stop.hasPhotos && stop.photoUrls?.length);

  return (
    <li
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: hasPhotos ? "rgba(37, 99, 235, 0.35)" : "rgba(245, 158, 11, 0.35)",
        background: hasPhotos
          ? "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(255,255,255,0.03))"
          : "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(255,255,255,0.03))",
      }}
    >
      <button
        type="button"
        className="flex w-full items-stretch gap-3 p-3.5 text-left sm:p-4"
        onClick={() => {
          if (stop.storeReturnId) {
            navigate(`/store-returns/${stop.storeReturnId}`);
            return;
          }
          if (hasPhotos) onOpenPhotos(stop);
        }}
      >
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold"
          style={{
            background: hasPhotos ? "rgba(37,99,235,0.2)" : "rgba(245,158,11,0.2)",
            color: hasPhotos ? "var(--blue)" : "var(--amber)",
          }}
        >
          {stop.sequence ?? index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              {stop.name}
            </p>
            {stop.returnNumber ? (
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}
              >
                {stop.returnNumber}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {stop.address}
          </p>
          <p className="mt-2 text-sm font-bold" style={{ color: "var(--amber)" }}>
            Reason: {reasonLabel(stop)}
          </p>
          <p
            className="mt-2 text-[11px] font-bold uppercase tracking-wide"
            style={{ color: hasPhotos ? "var(--blue)" : "var(--rose)" }}
          >
            {hasPhotos ? "Photos uploaded" : "Photos not uploaded · Defaulter"}
          </p>
        </div>
      </button>
    </li>
  );
}

function ReturnRouteCard({ route, expanded, onToggle, onOpenPhotos }) {
  return (
    <article className="ops-panel overflow-hidden">
      <button
        type="button"
        className="ops-row flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left sm:px-5"
        onClick={onToggle}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
          style={{ background: "rgba(245,158,11,0.16)", color: "var(--amber)" }}
        >
          {route.returnsCount}
        </span>
        <div className="min-w-0 flex-1 basis-[140px]">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
            {route.routeName}
          </p>
          <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
            {route.driverName || route.driverEmail || "Unassigned"}
            {route.storeName ? ` · ${route.storeName}` : ""}
          </p>
        </div>
        <span className="ops-teamtag shrink-0">{route.teamName || route.teamCode || "No team"}</span>
        {route.status ? <OpsStatusBadge status={route.status} label={formatStatusLabel(route.status)} /> : null}
      </button>
      {expanded ? (
        <ul className="space-y-2 border-t px-4 py-3 sm:px-5" style={{ borderColor: "var(--border)" }}>
          {(route.returns ?? []).map((stop, index) => (
            <ReturnedStopRow
              key={stop.id}
              stop={stop}
              index={index}
              onOpenPhotos={onOpenPhotos}
            />
          ))}
        </ul>
      ) : null}
    </article>
  );
}

/** Flat pending list used from payroll warning deep-links. */
function PendingStoreReturnsList({ filtered, isLoading, isError }) {
  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="ops-skel h-20 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <div className="ops-banner ops-banner--error mt-4">Could not load returns.</div>;
  }
  if (filtered.length === 0) {
    return (
      <div className="ops-panel ops-fade mt-4 px-8 py-14 text-center">
        <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
          No store returns
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          No matching store returns for this filter.
        </p>
      </div>
    );
  }
  return (
    <ul className="mt-4 space-y-2">
      {filtered.map((item) => {
        const pending = item.status === "pending_store_return";
        const mark = item.hasPhotos ? "var(--blue)" : "var(--rose)";
        return (
          <li key={item.id}>
            <Link
              to={`/store-returns/${item.id}`}
              className="ops-panel ops-fade flex items-stretch overflow-hidden transition hover:opacity-95"
            >
              <span className="w-1.5 shrink-0" style={{ background: mark }} />
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold" style={{ color: "var(--text)" }}>
                    {item.returnNumber}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--text)" }}>
                    Stop #{item.stopSequence} · {item.stopName || "Stop"}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {[item.routeName, item.storeName, item.scheduleDate ? formatDisplayDate(item.scheduleDate) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p
                    className="mt-1 text-xs font-semibold"
                    style={{ color: item.isDefaulter ? "var(--rose)" : "var(--text-muted)" }}
                  >
                    {(item.driverMemberNumber ? `${item.driverMemberNumber} · ` : "") +
                      (item.driverName || "Driver")}
                    {item.isDefaulter ? " · Defaulter" : ""}
                  </p>
                </div>
                <span
                  className="rounded-lg px-2.5 py-1 text-[11px] font-bold"
                  style={{
                    color: pending ? "var(--rose)" : "var(--blue)",
                    background: pending ? "rgba(225, 29, 72, 0.12)" : "rgba(37, 99, 235, 0.12)",
                  }}
                >
                  {pending ? "Pending store return" : "Returned to store"}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function StoreReturnsListScreen() {
  const [searchParams] = useSearchParams();
  const { date } = useOpsDateScope();
  const statusFilter = searchParams.get("status") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const initialRouteId = searchParams.get("routeId");
  const useDateRange = Boolean(from || to || statusFilter === "pending_store_return");
  const isToday = date === todayIsoDate();
  const [expandedId, setExpandedId] = useState(initialRouteId);
  const [photoStop, setPhotoStop] = useState(null);

  useEffect(() => {
    if (initialRouteId) setExpandedId(initialRouteId);
  }, [initialRouteId]);

  const queryParams = useMemo(() => {
    if (useDateRange) {
      return {
        ...(statusFilter ? { status: statusFilter } : {}),
      };
    }
    return {
      date,
      ...(statusFilter ? { status: statusFilter } : {}),
    };
  }, [useDateRange, date, statusFilter]);

  // Always hit store-returns API so missing docs are backfilled for the ops date.
  const storeQuery = useOpsStoreReturnsQuery(true, queryParams);
  const dayQuery = useDayReturnsQuery(date, !useDateRange);

  useEffect(() => {
    if (!useDateRange) void storeQuery.refetch();
  }, [date, useDateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let rows = storeQuery.data ?? [];
    if (from || to) {
      rows = rows.filter((item) => {
        const d = item.scheduleDate;
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    if (statusFilter === "pending_store_return") {
      rows = rows.filter((item) => item.status === "pending_store_return" || !item.hasPhotos);
    }
    return rows;
  }, [storeQuery.data, from, to, statusFilter]);

  const routes = dayQuery.data?.routes ?? [];
  const totalReturns = dayQuery.data?.totalReturns ?? 0;

  const title = useDateRange
    ? statusFilter === "pending_store_return"
      ? "Pending store returns"
      : "Store returns"
    : isToday
      ? "Store returns"
      : `Store returns · ${formatDisplayDate(date)}`;

  const subtitle = useDateRange
    ? [
        statusFilter === "pending_store_return"
          ? "Showing returns still missing store photos (defaulters)."
          : "Showing store returns.",
        from || to
          ? `Period ${from ? formatDisplayDate(from) : "…"} – ${to ? formatDisplayDate(to) : "…"}.`
          : null,
        "Red = photos not uploaded. Blue = returned to store with photos.",
      ]
        .filter(Boolean)
        .join(" ")
    : dayQuery.isLoading
      ? "Loading…"
      : `${totalReturns} return${totalReturns === 1 ? "" : "s"} · ${routes.length} route${
          routes.length === 1 ? "" : "s"
        } · ${isToday ? "today" : formatDisplayDate(date)}. Same list as the dashboard Returns panel.`;

  const refreshing = useDateRange ? storeQuery.isFetching : dayQuery.isFetching || storeQuery.isFetching;
  const onRefresh = () => {
    if (useDateRange) void storeQuery.refetch();
    else {
      void dayQuery.refetch();
      void storeQuery.refetch();
    }
  };

  return (
    <DashboardLayout topBar={<OpsTopBar onRefresh={onRefresh} refreshing={refreshing} />}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            {title}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
          {useDateRange ? (
            <Link
              to="/store-returns"
              className="mt-2 inline-block text-xs font-bold"
              style={{ color: "var(--accent)" }}
            >
              Clear filter · view by ops date
            </Link>
          ) : null}
        </div>

        {useDateRange ? (
          <PendingStoreReturnsList
            filtered={filtered}
            isLoading={storeQuery.isLoading}
            isError={storeQuery.isError}
          />
        ) : dayQuery.isLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-20 rounded-2xl" />
            ))}
          </div>
        ) : routes.length === 0 ? (
          <div className="ops-panel ops-fade mt-4 px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
              No store returns
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              No returns for {formatDisplayDate(date)}.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {routes.map((route) => (
              <ReturnRouteCard
                key={route.routeId}
                route={route}
                expanded={expandedId === route.routeId || routes.length === 1}
                onToggle={() =>
                  setExpandedId((current) => (current === route.routeId ? null : route.routeId))
                }
                onOpenPhotos={setPhotoStop}
              />
            ))}
          </div>
        )}
      </div>

      {photoStop ? (
        <StoreReturnPhotosModal stop={photoStop} onClose={() => setPhotoStop(null)} />
      ) : null}
    </DashboardLayout>
  );
}
