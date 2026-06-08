import { useState } from "react";
import { useCitiesQuery } from "@/modules/users/infrastructure/api/users.queries.js";

function isCityAvailable(city, excludeUserId) {
  if (!city.assignedDispatchTeam) return true;
  if (excludeUserId && city.assignedDispatchTeam.userId === excludeUserId) {
    return true;
  }
  return false;
}

export function CityPickerModal({
  open,
  selectedCity,
  excludeUserId,
  onSelect,
  onClose,
  enforceDispatchTeamUniqueness = true,
}) {
  const [customCity, setCustomCity] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const { data: cities = [], isLoading, isError, refetch } = useCitiesQuery(open);

  if (!open) return null;

  function handleCustomSelect() {
    const city = customCity.trim();
    if (city.length < 2) return;
    onSelect(city);
    setCustomCity("");
    setShowCustom(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[70vh] w-full max-w-md overflow-hidden rounded-2xl bg-dispatch-surface shadow-2xl ring-1 ring-dispatch-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-dispatch-border px-4 py-3">
          <h3 className="text-base font-bold text-dispatch-text">Assign city</h3>
          <p className="mt-1 text-xs text-dispatch-muted">
            Each dispatch team member controls one city. Taken cities cannot be selected.
          </p>
        </div>
        <ul className="max-h-[50vh] overflow-auto p-2">
          {isLoading ? (
            <li className="px-3 py-6 text-center text-sm text-dispatch-muted">Loading…</li>
          ) : isError ? (
            <li className="px-3 py-6 text-center text-sm text-dispatch-muted">
              Could not load cities.{" "}
              <button type="button" onClick={() => refetch()} className="font-semibold text-dispatch-primary">
                Retry
              </button>
            </li>
          ) : (
            cities.map((city) => {
              const available =
                !enforceDispatchTeamUniqueness ||
                isCityAvailable(city, excludeUserId);
              const selected = selectedCity?.toLowerCase() === city.name.toLowerCase();
              const takenBy = city.assignedDispatchTeam;
              return (
                <li key={city.name}>
                  <button
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      onSelect(city.name);
                      onClose();
                    }}
                    className={`w-full rounded-xl px-3 py-3 text-left transition ${
                      !available ? "cursor-not-allowed opacity-50" : "hover:bg-dispatch-bg"
                    } ${selected ? "bg-dispatch-primary-soft ring-1 ring-dispatch-primary" : ""}`}
                  >
                    <p className="font-semibold text-dispatch-text">{city.name}</p>
                    {takenBy && !available ? (
                      <p className="text-xs text-dispatch-red">
                        Assigned to {takenBy.fullName?.trim() || takenBy.email}
                      </p>
                    ) : (
                      <p className="text-xs text-dispatch-muted">Available</p>
                    )}
                  </button>
                </li>
              );
            })
          )}
          {cities.length === 0 && !isLoading ? (
            <li className="px-3 py-2 text-center text-xs text-dispatch-muted">
              No cities from stores or schedules yet.
            </li>
          ) : null}
        </ul>
        <div className="space-y-2 border-t border-dispatch-border p-3">
          {showCustom ? (
            <div className="space-y-2">
              <input
                className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-dispatch-primary/30"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="City name"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  className="flex-1 rounded-xl border border-dispatch-border px-3 py-2 text-sm font-semibold text-dispatch-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCustomSelect}
                  className="flex-1 rounded-xl bg-dispatch-indigo px-3 py-2 text-sm font-bold text-white"
                >
                  Use city
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="w-full rounded-xl border border-dashed border-dispatch-primary px-3 py-2.5 text-sm font-bold text-dispatch-primary"
            >
              Add new city
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm font-semibold text-dispatch-muted hover:bg-dispatch-bg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
