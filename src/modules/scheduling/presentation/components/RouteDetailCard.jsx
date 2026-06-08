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

  return (
    <article className="rounded-xl border border-dispatch-border bg-[#FAFBFC] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dispatch-primary text-sm font-extrabold text-white">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-dispatch-text">{title}</h4>
            <StatusBadge
              label={formatRouteStatus(route.status)}
              className={routeStatusClass(route.status)}
            />
            {route.routeCategory ? (
              <StatusBadge
                label={ROUTE_CATEGORY_LABELS[route.routeCategory] ?? route.routeCategory}
                className="bg-violet-50 text-violet-800 ring-violet-200"
              />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-dispatch-muted">
            {route.location || "No location set"}
          </p>
          <p className="mt-1 text-xs text-dispatch-light">
            {route.teamName ?? "Team"}
            {route.teamCode ? ` (${route.teamCode})` : ""} · {route.arrivalTime} –{" "}
            {route.departureTime}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DetailCell label="Driver" value={driver} />
        <DetailCell label="Vehicle" value={route.vehicleType ?? "—"} />
        <DetailCell
          label="Mileage"
          value={route.mileage != null ? `${route.mileage} mi` : "—"}
        />
        <DetailCell
          label="Dropoffs"
          value={String(dropoffs.length || route.stops || 0)}
        />
        {route.overtimeHours > 0 ? (
          <DetailCell label="Overtime" value={`${route.overtimeHours} hr`} />
        ) : null}
      </div>

      {scheduleId ? (
        <RouteOpsVerification route={route} scheduleId={scheduleId} />
      ) : null}

      {route.pickup ? (
        <div className="mt-3 rounded-lg border border-dispatch-primary/20 bg-dispatch-primary-soft/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-dispatch-primary">
            Pickup
          </p>
          <p className="mt-1 text-sm font-semibold text-dispatch-text">
            {route.pickup.name}
          </p>
          <p className="text-xs text-dispatch-muted">{route.pickup.address}</p>
        </div>
      ) : null}

      {dropoffs.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-dispatch-muted">
            Stops
          </p>
          <ul className="space-y-2">
            {dropoffs.map((stop, i) => (
              <li
                key={stop.id ?? i}
                className="rounded-xl border border-dispatch-border bg-dispatch-surface p-3"
              >
                <div className="flex gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dispatch-green text-xs font-bold text-white">
                    {stop.sequence ?? i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-dispatch-text">{stop.name}</p>
                      {stop.status ? (
                        <span className="rounded-md bg-dispatch-bg px-1.5 py-0.5 text-[10px] font-bold uppercase text-dispatch-muted">
                          {formatStatusLabel(stop.status)}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-dispatch-muted">{stop.address}</p>
                    {stop.accessCode ? (
                      <p className="text-xs text-dispatch-light">Code: {stop.accessCode}</p>
                    ) : null}
                    {stop.returnReason ? (
                      <p className="mt-1 text-xs text-orange-700">
                        Return: {stop.returnReason}
                        {stop.returnReasonCustom ? ` — ${stop.returnReasonCustom}` : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
                {stop.deliveryPhotoUrl ? (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-dispatch-muted">
                      Delivery photo
                    </p>
                    <DeliveryPhoto
                      photoPath={stop.deliveryPhotoUrl}
                      alt={`Delivery proof for ${stop.name}`}
                    />
                  </div>
                ) : stop.status === "completed" ? (
                  <p className="mt-2 text-xs italic text-dispatch-light">
                    No delivery photo on file for this stop.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {route.notes ? (
        <p className="mt-3 text-xs text-dispatch-muted">
          <span className="font-semibold text-dispatch-text">Notes:</span> {route.notes}
        </p>
      ) : null}
    </article>
  );
}

function DetailCell({ label, value }) {
  return (
    <div className="rounded-lg bg-dispatch-surface px-3 py-2 ring-1 ring-dispatch-border/60">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-dispatch-light">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-dispatch-text">{value}</p>
    </div>
  );
}
