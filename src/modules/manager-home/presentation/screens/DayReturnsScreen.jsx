import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useOpsDateScope } from "@/modules/manager-home/application/OpsDateScopeProvider.jsx";
import { useDayReturnsQuery } from "@/modules/manager-home/infrastructure/api/dashboard.queries.js";
import { useCreateConversationMutation } from "@/modules/chat/infrastructure/api/chat.queries.js";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { OpsEmpty, OpsPanel, OpsStatusBadge } from "@/modules/manager-home/presentation/components/OpsWidgets.jsx";
import { formatStatusLabel } from "@/modules/manager-home/utils/routeStatus.js";
import { formatDisplayDate, todayIsoDate } from "@/shared/utils/time.js";
import { mediaUrl } from "@/shared/utils/mediaUrl.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

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
          <button
            type="button"
            className="ops-btn px-3 py-1.5 text-xs font-bold"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex max-h-[75vh] items-center justify-center bg-black/40 p-4">
          <img
            src={current}
            alt={`Store return ${active + 1}`}
            className="max-h-[68vh] w-full rounded-xl object-contain"
            decoding="async"
            fetchPriority="high"
          />
        </div>

        {photos.length > 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-2 border-t p-3" style={{ borderColor: "var(--border)" }}>
            {photos.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setActive(index)}
                className="overflow-hidden rounded-lg border-2 transition"
                style={{
                  borderColor: index === active ? "var(--blue)" : "var(--border)",
                }}
              >
                <img
                  src={mediaUrl(stop.photoUrls?.[index], { width: 112, quality: 65 }) ?? src}
                  alt=""
                  className="h-14 w-14 object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ReturnedStopCard({ stop, index, onOpenPhotos }) {
  const hasPhotos = Boolean(stop.hasPhotos && stop.photoUrls?.length);
  const photoCount = stop.photoUrls?.length ?? 0;

  return (
    <li
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: hasPhotos ? "rgba(37, 99, 235, 0.35)" : "rgba(245, 158, 11, 0.35)",
        background: hasPhotos
          ? "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(255,255,255,0.03))"
          : "linear-gradient(135deg, rgba(245,158,11,0.14), rgba(255,255,255,0.03))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      }}
    >
      <div className="flex items-stretch gap-3 p-3.5 sm:p-4">
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
          {stop.completedAt ? (
            <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-dim)" }}>
              {new Date(stop.completedAt).toLocaleString()}
            </p>
          ) : null}
          <p
            className="mt-2 text-[11px] font-bold uppercase tracking-wide"
            style={{ color: hasPhotos ? "var(--blue)" : "var(--rose)" }}
          >
            {hasPhotos ? "Photos uploaded" : "Photos not uploaded"}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-2">
          {hasPhotos ? (
            <button
              type="button"
              onClick={() => onOpenPhotos(stop)}
              className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border transition hover:opacity-95 sm:h-[72px] sm:w-[72px]"
              style={{
                borderColor: "rgba(37,99,235,0.45)",
                background: "rgba(37,99,235,0.12)",
                color: "var(--blue)",
              }}
              title="View uploaded photos"
            >
              <PhotoIcon />
              <span className="text-[10px] font-extrabold uppercase tracking-wide">
                View{photoCount > 1 ? ` ${photoCount}` : ""}
              </span>
            </button>
          ) : (
            <div
              className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-dashed sm:h-[72px] sm:w-[72px]"
              style={{ borderColor: "rgba(225,29,72,0.4)", color: "var(--rose)" }}
              title="No photos uploaded"
            >
              <PhotoIcon />
              <span className="mt-1 text-[9px] font-bold uppercase">None</span>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function PhotoIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function ReturnRouteCard({ route, expanded, onToggle }) {
  const navigate = useNavigate();
  const createChat = useCreateConversationMutation();
  const [photoStop, setPhotoStop] = useState(null);
  const driverLabel = route.driverName || route.driverEmail || "Unassigned";
  const teamLabel = [route.teamName, route.teamCode].filter(Boolean).join(" · ") || "No team";
  const windowLabel =
    route.arrivalTime && route.departureTime
      ? `${route.arrivalTime}–${route.departureTime}`
      : "—";
  const canChat = Boolean(route.driverId);

  async function handleChat(event) {
    event.stopPropagation();
    if (!route.driverId || createChat.isPending) return;
    const conv = await createChat.mutateAsync(route.driverId);
    if (conv?.id) navigate(`/chat/${conv.id}`);
  }

  return (
    <article className="ops-card overflow-hidden">
      <button
        type="button"
        className="ops-row flex w-full flex-wrap items-start gap-3 px-5 py-4 text-left"
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
              {route.routeName}
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: "rgba(245,158,11,0.16)", color: "var(--amber)" }}
            >
              {route.returnsCount} return{route.returnsCount === 1 ? "" : "s"}
            </span>
            {route.status ? (
              <OpsStatusBadge status={route.status} label={formatStatusLabel(route.status)} />
            ) : null}
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {[route.storeName, route.location, windowLabel].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
            Driver: {driverLabel}
            {route.driverEmail && route.driverName ? ` · ${route.driverEmail}` : ""}
            {" · "}
            Team: {teamLabel}
            {route.vehicleType ? ` · ${route.vehicleType}` : ""}
          </p>
        </div>
        <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
          {expanded ? "Hide details" : "Show details"}
        </span>
      </button>

      {expanded ? (
        <div className="border-t px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Driver" value={driverLabel} />
            <Detail label="Team" value={teamLabel} />
            <Detail label="Store" value={route.storeName || "—"} />
            <Detail label="Vehicle" value={route.vehicleType || "—"} />
          </div>

          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
            Returned stops
          </p>
          <ul className="space-y-3">
            {route.returns.map((stop, index) => (
              <ReturnedStopCard
                key={stop.id}
                stop={stop}
                index={index}
                onOpenPhotos={setPhotoStop}
              />
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            {canChat ? (
              <button
                type="button"
                className="ops-btn ops-btn--accent px-3 py-1.5 text-xs font-bold"
                disabled={createChat.isPending}
                onClick={handleChat}
              >
                {createChat.isPending ? "Opening chat…" : "Chat with driver"}
              </button>
            ) : null}
            {route.scheduleId ? (
              <button
                type="button"
                className="ops-btn px-3 py-1.5 text-xs font-semibold"
                onClick={() => navigate(`/schedules/${route.scheduleId}/routes`)}
              >
                Open schedule routes
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {photoStop ? (
        <StoreReturnPhotosModal stop={photoStop} onClose={() => setPhotoStop(null)} />
      ) : null}
    </article>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
        {value}
      </p>
    </div>
  );
}

export function DayReturnsScreen() {
  const { date } = useOpsDateScope();
  const [searchParams] = useSearchParams();
  const isToday = date === todayIsoDate();
  const { data, isLoading, isFetching, refetch } = useDayReturnsQuery(date, true);
  const initialRouteId = searchParams.get("routeId");
  const [expandedId, setExpandedId] = useState(initialRouteId);

  useEffect(() => {
    if (initialRouteId) setExpandedId(initialRouteId);
  }, [initialRouteId]);

  const routes = data?.routes ?? [];
  const totalReturns = data?.totalReturns ?? 0;

  const subtitle = useMemo(() => {
    if (isLoading) return "Loading…";
    return `${totalReturns} return${totalReturns === 1 ? "" : "s"} · ${routes.length} route${
      routes.length === 1 ? "" : "s"
    } · ${isToday ? "today" : formatDisplayDate(date)}`;
  }, [isLoading, totalReturns, routes.length, isToday, date]);

  return (
    <DashboardLayout
      topBar={<OpsTopBar onRefresh={() => void refetch()} refreshing={isFetching} />}
    >
      <div className={`${PAGE_CONTENT} flex min-h-[calc(100svh-7.5rem)] flex-col space-y-5 pb-6`}>
        <section className="ops-fade flex shrink-0 flex-col gap-2 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Returns
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              {isToday ? "Today's returns" : `Returns · ${formatDisplayDate(date)}`}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          </div>
          <Link to="/dashboard" className="text-xs font-bold" style={{ color: "var(--accent)" }}>
            Back to dashboard
          </Link>
        </section>

        <OpsPanel title="Routes with returns" subtitle={subtitle} fill>
          {isLoading ? (
            <OpsEmpty>Loading returns…</OpsEmpty>
          ) : routes.length === 0 ? (
            <OpsEmpty>No returns for this date.</OpsEmpty>
          ) : (
            <div className="space-y-3 p-4">
              {routes.map((route) => (
                <ReturnRouteCard
                  key={route.routeId}
                  route={route}
                  expanded={expandedId === route.routeId}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === route.routeId ? null : route.routeId
                    )
                  }
                />
              ))}
            </div>
          )}
        </OpsPanel>
      </div>
    </DashboardLayout>
  );
}
