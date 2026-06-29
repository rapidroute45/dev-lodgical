import { ROUTE_CATEGORY_LABELS } from "@/modules/scheduling/constants.js";
import { StatusBadge } from "./StatusBadge.jsx";
import { DeliveryPhoto } from "./DeliveryPhoto.jsx";
import {
  formatRouteStatus,
  routeStatusClass,
} from "@/modules/scheduling/utils/scheduleStatus.js";
import { formatStatusLabel } from "@/modules/manager-home/utils/routeStatus.js";
import { RouteOpsVerification } from "./RouteOpsVerification.jsx";

export function RouteDetailCard({ route, index, scheduleId }) {
  const title = route.routeName || `Route ${index}`;
  const driver =
    route.driverName ??
    route.driverEmail ??
    (route.driverId ? "Offer sent" : "Unassigned");
  const dropoffs = route.dropoffs ?? [];
  const stopCount = dropoffs.length || route.stops || 0;
  const status = route.status ?? "pending";

  return (
    <article className={`ops-card ops-fade ops-route-detail ops-route-detail--${status} overflow-hidden`}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="ops-route__idx flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold">
            {index}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{title}</h2>
              <StatusBadge
                label={formatRouteStatus(status)}
                className={routeStatusClass(status)}
              />
              {route.routeCategory ? (
                <span className="ops-badge ops-badge--category">
                  {ROUTE_CATEGORY_LABELS[route.routeCategory] ?? route.routeCategory}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {route.location || "No location set"}
            </p>
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-dim)" }}>
              {route.teamName ?? "Team"}
              {route.teamCode ? ` (${route.teamCode})` : ""}
              {" · "}
              {route.arrivalTime} – {route.departureTime}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailCell label="Driver" value={driver} highlight={!route.driverId} />
          <DetailCell label="Vehicle" value={route.vehicleType ?? "—"} />
          <DetailCell
            label="Mileage"
            value={route.mileage != null && route.mileage !== "" ? `${route.mileage} mi` : "—"}
          />
          <DetailCell label="Dropoffs" value={String(stopCount)} />
          {route.overtimeHours > 0 ? (
            <DetailCell label="Overtime" value={`${route.overtimeHours} hr`} />
          ) : null}
        </div>
      </div>

      {route.pickup ? (
        <div className="ops-route-detail__pickup mx-5 mb-5 sm:mx-6 sm:mb-6">
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
            Pickup
          </p>
          <p className="mt-1.5 text-sm font-semibold" style={{ color: "var(--text)" }}>
            {route.pickup.name}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {route.pickup.address}
          </p>
        </div>
      ) : null}

      {scheduleId ? (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <RouteOpsVerification route={route} scheduleId={scheduleId} />
        </div>
      ) : null}

      {dropoffs.length > 0 ? (
        <div className="border-t px-5 py-5 sm:px-6" style={{ borderColor: "var(--border)" }}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>
              Stops
            </h3>
            <span className="ops-teamtag">{dropoffs.length} stop{dropoffs.length === 1 ? "" : "s"}</span>
          </div>
          <ul className="space-y-3">
            {dropoffs.map((stop, i) => (
              <li
                key={stop.id ?? i}
                className={`ops-listcard ops-listcard--${stop.status ?? "pending"} p-4`}
              >
                <div className="flex gap-3">
                  <span className="ops-route__idx flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold">
                    {stop.sequence ?? i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {stop.name}
                      </p>
                      {stop.status ? (
                        <span className="ops-badge ops-badge--muted">
                          {formatStatusLabel(stop.status)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {stop.address}
                    </p>
                    {stop.accessCode ? (
                      <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
                        Code: {stop.accessCode}
                      </p>
                    ) : null}
                    {stop.returnReason ? (
                      <p className="mt-1.5 text-xs" style={{ color: "var(--amber)" }}>
                        Return: {stop.returnReason}
                        {stop.returnReasonCustom ? ` — ${stop.returnReasonCustom}` : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
                {stop.deliveryPhotoUrl ? (
                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                      Delivery photo
                    </p>
                    <DeliveryPhoto
                      photoPath={stop.deliveryPhotoUrl}
                      alt={`Delivery proof for ${stop.name}`}
                    />
                  </div>
                ) : stop.status === "completed" ? (
                  <p className="mt-3 text-xs italic" style={{ color: "var(--text-dim)" }}>
                    No delivery photo on file for this stop.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : stopCount === 0 ? (
        <div className="border-t px-5 py-8 text-center sm:px-6" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No dropoff stops on this route yet.</p>
        </div>
      ) : null}

      {route.notes ? (
        <div className="border-t px-5 py-4 sm:px-6" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.02)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
            Notes
          </p>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {route.notes}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function DetailCell({ label, value, highlight = false }) {
  return (
    <div className="ops-field px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
        {label}
      </p>
      <p
        className="mt-1 text-sm font-semibold"
        style={{ color: highlight ? "var(--amber)" : "var(--text)" }}
      >
        {value}
      </p>
    </div>
  );
}
