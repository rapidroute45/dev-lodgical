import { useState } from "react";
import { ListPickerModal } from "@/modules/scheduling/presentation/components/ListPickerModal.jsx";
import { useOpsLocationScope } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";

export function LocationScopeControls() {
  const {
    canPickScope,
    isGlobalScope,
    isLocked,
    state,
    city,
    setState,
    setCity,
    resetScope,
    isScoped,
    allowedStates,
    citiesForSelectedState,
  } = useOpsLocationScope();

  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  if (!canPickScope) return null;

  const allStatesLabel = isGlobalScope ? "All states" : "All my states";
  const allCitiesLabel = isGlobalScope ? "All cities" : "All my cities";
  const allStatesSubtitle = isGlobalScope ? "Every state" : "Every state you can access";
  const allCitiesSubtitle = state
    ? `In ${state}`
    : isGlobalScope
      ? "Every city"
      : "Every city you can access";

  const stateItems = [
    { id: "", title: allStatesLabel, subtitle: allStatesSubtitle },
    ...allowedStates.map((s) => ({ id: s, title: s })),
  ];

  const cityItems = [
    { id: "", title: allCitiesLabel, subtitle: allCitiesSubtitle },
    ...citiesForSelectedState.map((c) => ({ id: c, title: c })),
  ];

  return (
    <>
      <div
        className={`ops-scope-seg flex items-center gap-1 ${isScoped ? "ops-scope-seg--active" : ""} ${isLocked ? "ops-scope-seg--locked" : ""}`}
        role="group"
        aria-label="Location scope"
      >
        <button
          type="button"
          onClick={() => !isLocked && setStatePickerOpen(true)}
          disabled={isLocked}
          className="ops-scope-seg__btn px-2.5 py-1.5 text-xs font-semibold"
        >
          {state ?? allStatesLabel}
        </button>
        <span className="ops-scope-seg__divider" aria-hidden="true">
          /
        </span>
        <button
          type="button"
          onClick={() => !isLocked && setCityPickerOpen(true)}
          disabled={isLocked}
          className="ops-scope-seg__btn px-2.5 py-1.5 text-xs font-semibold"
        >
          {city ?? allCitiesLabel}
        </button>
        {isScoped && !isLocked ? (
          <button
            type="button"
            onClick={resetScope}
            className="ops-scope-seg__clear px-1.5 py-1.5"
            aria-label="Clear location filter"
            title="Clear filter"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <ListPickerModal
        open={statePickerOpen}
        title="Filter by state"
        items={stateItems}
        selectedId={state ?? ""}
        emptyMessage="No states found"
        onSelect={(id) => {
          setState(id || null);
          setStatePickerOpen(false);
        }}
        onClose={() => setStatePickerOpen(false)}
      />

      <ListPickerModal
        open={cityPickerOpen}
        title="Filter by city"
        items={cityItems}
        selectedId={city ?? ""}
        emptyMessage="No cities found"
        onSelect={(id) => {
          setCity(id || null);
          setCityPickerOpen(false);
        }}
        onClose={() => setCityPickerOpen(false)}
      />
    </>
  );
}
