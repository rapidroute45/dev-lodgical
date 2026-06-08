import {
  DEFAULT_ROUTE_CATEGORY,
  ROUTE_CATEGORIES,
  ROUTE_CATEGORY_LABELS,
  VEHICLE_TYPES,
} from "@/modules/scheduling/constants.js";
import { defaultDepartureFromArrival } from "@/shared/utils/time.js";
import { RouteStopsEditor } from "./RouteStopsEditor.jsx";
import { ListPickerModal } from "./ListPickerModal.jsx";
import { DriverOfferField } from "./DriverOfferField.jsx";
import { useState } from "react";

export function RouteDraftCard({
  index,
  route,
  teams,
  store,
  scheduleDate,
  onChange,
  onRemove,
}) {
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const dropoffCount = route.dropoffs.length;
  const teamLabel =
    teams.find((t) => t.id === route.teamId)?.name ??
    route.teamName ??
    "Select team";

  const teamItems = teams.map((t) => ({
    id: t.id,
    title: t.name,
    subtitle: t.code ? `Code ${t.code}` : undefined,
  }));

  return (
    <article className="mb-4 rounded-2xl border border-dispatch-border/80 bg-[#FAFBFC] p-5 shadow-sm ring-1 ring-dispatch-border/40">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-dispatch-primary-soft text-sm font-extrabold text-dispatch-primary">
          {index}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-dispatch-muted">
              Route name
            </label>
            <input
              className="w-full rounded-lg border border-dispatch-border bg-white px-3 py-2 text-sm font-bold text-dispatch-text outline-none focus:ring-2 focus:ring-dispatch-primary/30"
              value={route.routeName}
              onChange={(e) => onChange({ routeName: e.target.value })}
              placeholder="Route name"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-dispatch-muted">
              Store address
            </label>
            <input
              className="w-full rounded-lg border border-dispatch-border bg-white px-3 py-2 text-sm text-dispatch-text outline-none focus:ring-2 focus:ring-dispatch-primary/30"
              value={route.location}
              onChange={(e) => onChange({ location: e.target.value })}
              placeholder="Store address"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-xs font-semibold text-dispatch-red"
        >
          Remove
        </button>
      </div>

      <div className="mb-2">
        <label className="mb-1 block text-xs font-semibold text-dispatch-muted">Team</label>
        <button
          type="button"
          onClick={() => setTeamModalOpen(true)}
          className="flex w-full items-center justify-between rounded-lg border border-dispatch-border bg-[#FAFBFC] px-3 py-2.5 text-sm font-semibold text-dispatch-text"
        >
          {teamLabel}
          <svg className="h-4 w-4 text-dispatch-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-semibold text-dispatch-muted">
          Route category
        </label>
        <div className="flex flex-wrap gap-1">
          {ROUTE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onChange({ routeCategory: cat })}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                (route.routeCategory ?? DEFAULT_ROUTE_CATEGORY) === cat
                  ? "bg-dispatch-primary text-white"
                  : "bg-dispatch-bg text-dispatch-muted ring-1 ring-dispatch-border"
              }`}
            >
              {ROUTE_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {scheduleDate ? (
        <DriverOfferField
          teamId={route.teamId}
          scheduleDate={scheduleDate}
          arrivalTime={route.arrivalTime}
          departureTime={route.departureTime}
          excludeRouteId={route.serverId}
          driverId={route.driverId}
          driverName={route.driverName}
          onSelect={(driverId, driverName) => onChange({ driverId, driverName })}
          onClear={() => onChange({ driverId: null, driverName: "" })}
        />
      ) : null}

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-dispatch-muted">
            Arrival
          </label>
          <input
            type="time"
            className="w-full rounded-lg border border-dispatch-border bg-[#FAFBFC] px-3 py-2 text-sm"
            value={route.arrivalTime}
            onChange={(e) =>
              onChange({
                arrivalTime: e.target.value,
                departureTime: defaultDepartureFromArrival(e.target.value),
              })
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-dispatch-muted">
            Departure
          </label>
          <input
            type="time"
            className="w-full rounded-lg border border-dispatch-border bg-[#FAFBFC] px-3 py-2 text-sm"
            value={route.departureTime}
            onChange={(e) => onChange({ departureTime: e.target.value })}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-semibold text-dispatch-muted">
          Vehicle
        </label>
        <div className="flex flex-wrap gap-1">
          {VEHICLE_TYPES.slice(0, 3).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ vehicleType: v })}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                route.vehicleType === v
                  ? "bg-dispatch-primary text-white"
                  : "bg-dispatch-bg text-dispatch-muted"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-dispatch-muted">
            Mileage (mi)
          </label>
          <input
            type="number"
            className="w-full rounded-lg border border-dispatch-border bg-[#FAFBFC] px-3 py-2 text-sm"
            value={route.mileage}
            onChange={(e) => onChange({ mileage: e.target.value })}
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-dispatch-muted">
            Dropoff stops
          </label>
          <p className="py-2 text-lg font-extrabold text-dispatch-text">{dropoffCount}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange({ stopsExpanded: !route.stopsExpanded })}
        className="mb-2 text-sm font-bold text-dispatch-primary"
      >
        {route.stopsExpanded ? "Hide stops" : "Add stops"}
        {dropoffCount > 0 ? ` (${dropoffCount})` : ""}
      </button>

      {route.stopsExpanded ? (
        <RouteStopsEditor
          store={store}
          dropoffs={route.dropoffs}
          onChangeDropoffs={(dropoffs) => onChange({ dropoffs })}
        />
      ) : null}

      <label className="mb-1 mt-2 block text-xs font-semibold text-dispatch-muted">
        Notes
      </label>
      <textarea
        className="w-full rounded-lg border border-dispatch-border bg-[#FAFBFC] px-3 py-2 text-sm"
        rows={2}
        value={route.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder="Route notes"
      />

      <ListPickerModal
        open={teamModalOpen}
        title="Select team"
        items={teamItems}
        selectedId={route.teamId || null}
        emptyMessage="No teams available."
        onSelect={(id) => {
          const team = teams.find((t) => t.id === id);
          onChange({
            teamId: id,
            teamName: team?.name ?? "",
            driverId: null,
            driverName: "",
          });
        }}
        onClose={() => setTeamModalOpen(false)}
      />
    </article>
  );
}
