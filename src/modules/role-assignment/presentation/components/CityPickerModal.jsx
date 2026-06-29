import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useOpsTheme } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";
import { useCitiesQuery } from "@/modules/users/infrastructure/api/users.queries.js";

function isCityAvailable(city, excludeUserId) {
  if (!city.assignedDispatchTeam) return true;
  if (excludeUserId && city.assignedDispatchTeam.userId === excludeUserId) {
    return true;
  }
  return false;
}

function citiesMatch(a, b) {
  return a?.trim().toLowerCase() === b?.trim().toLowerCase();
}

export function CityPickerModal({
  open,
  selectedCity,
  selectedCities = [],
  multi = false,
  excludeUserId,
  onSelect,
  onSelectMultiple,
  onClose,
  enforceDispatchTeamUniqueness = true,
}) {
  const { theme } = useOpsTheme();
  const [customCity, setCustomCity] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [draftCities, setDraftCities] = useState(selectedCities);
  const { data: cities = [], isLoading, isError, refetch, isFetching } =
    useCitiesQuery(false);

  useEffect(() => {
    if (!open) return;
    setDraftCities(selectedCities);
    void refetch();
  }, [open, refetch, selectedCities]);

  if (!open) return null;

  function handleCustomSelect() {
    const city = customCity.trim();
    if (city.length < 2) return;
    if (multi) {
      setDraftCities((prev) =>
        prev.some((item) => citiesMatch(item, city)) ? prev : [...prev, city]
      );
    } else {
      onSelect(city);
      onClose();
    }
    setCustomCity("");
    setShowCustom(false);
  }

  function toggleCity(cityName) {
    setDraftCities((prev) => {
      if (prev.some((item) => citiesMatch(item, cityName))) {
        return prev.filter((item) => !citiesMatch(item, cityName));
      }
      return [...prev, cityName];
    });
  }

  function handleDone() {
    onSelectMultiple?.(draftCities);
    onClose();
  }

  return createPortal(
    <div
      className={`ops-shell ops-picker-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4${
        theme === "light" ? " ops-shell--light" : ""
      }`}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="ops-picker" onClick={(e) => e.stopPropagation()}>
        <div className="ops-picker__head">
          <div>
            <h3 className="ops-picker__title">
              {multi ? "Assign cities" : "Assign city"}
            </h3>
            <p className="ops-picker__sub">
              {multi
                ? "Select every city this dispatch team member can operate in. Each city can only belong to one member."
                : "Each dispatch team member controls one city. Taken cities cannot be selected."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="ops-picker__close" aria-label="Close">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="ops-picker__body">
          <ul className="ops-picker__list">
            {isLoading || (open && isFetching && cities.length === 0) ? (
              <li className="ops-picker__empty">Loading…</li>
            ) : isError ? (
              <li className="ops-picker__empty">
                Could not load cities.{" "}
                <button type="button" onClick={() => refetch()} className="font-semibold" style={{ color: "var(--accent)" }}>
                  Retry
                </button>
              </li>
            ) : (
              cities.map((city) => {
                const available =
                  !enforceDispatchTeamUniqueness ||
                  isCityAvailable(city, excludeUserId);
                const selected = multi
                  ? draftCities.some((item) => citiesMatch(item, city.name))
                  : selectedCity?.toLowerCase() === city.name.toLowerCase();
                const takenBy = city.assignedDispatchTeam;
                return (
                  <li key={city.name}>
                    <button
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        if (multi) {
                          toggleCity(city.name);
                          return;
                        }
                        onSelect(city.name);
                        onClose();
                      }}
                      className={`ops-picker__item${selected ? " ops-picker__item--selected" : ""}`}
                      style={!available ? { cursor: "not-allowed", opacity: 0.5 } : undefined}
                    >
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate font-semibold" style={{ color: "var(--text)" }}>{city.name}</span>
                        {takenBy && !available ? (
                          <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--rose)" }}>
                            Assigned to {takenBy.fullName?.trim() || takenBy.email}
                          </span>
                        ) : (
                          <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--text-muted)" }}>
                            {multi ? (selected ? "Selected" : "Tap to select") : "Available"}
                          </span>
                        )}
                      </span>
                      {selected ? (
                        <svg className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
            {cities.length === 0 && !isLoading ? (
              <li className="ops-picker__empty text-xs">
                No cities from stores or schedules yet.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="space-y-2 p-3" style={{ borderTop: "1px solid var(--border)" }}>
          {showCustom ? (
            <div className="space-y-2">
              <input
                className="ops-field w-full text-sm outline-none"
                style={{ color: "var(--text)" }}
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="City name"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  className="ops-btn flex-1 px-3 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCustomSelect}
                  className="ops-btn ops-btn--accent flex-1 px-3 py-2 text-sm font-bold"
                >
                  Use city
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="ops-dashed w-full px-3 py-2.5 text-sm font-bold"
            >
              Add new city
            </button>
          )}
          {multi ? (
            <button
              type="button"
              disabled={draftCities.length === 0}
              onClick={handleDone}
              className="ops-btn ops-btn--accent w-full px-3 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              Save {draftCities.length} {draftCities.length === 1 ? "city" : "cities"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="ops-btn w-full px-3 py-2.5 text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
