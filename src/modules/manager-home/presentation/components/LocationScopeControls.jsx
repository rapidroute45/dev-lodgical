import { useState } from "react";
import { ListPickerModal } from "@/modules/scheduling/presentation/components/ListPickerModal.jsx";
import { useOpsLocationScope } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";

export function LocationScopeControls() {
  const {
    canManageScope,
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

  if (!canManageScope) return null;

  const stateItems = [
    { id: "", title: "All states", subtitle: "Every state" },
    ...allowedStates.map((s) => ({ id: s, title: s })),
  ];

  const cityItems = [
    { id: "", title: "All cities", subtitle: state ? `In ${state}` : "Every city" },
    ...citiesForSelectedState.map((c) => ({ id: c, title: c })),
  ];

  return (
    <>
      <div
        className={`ops-scope-seg flex items-center gap-1 ${isScoped ? "ops-scope-seg--active" : ""}`}
        role="group"
        aria-label="Location scope"
      >
        <button
          type="button"
          onClick={() => setStatePickerOpen(true)}
          className="ops-scope-seg__btn px-2.5 py-1.5 text-xs font-semibold"
        >
          {state ?? "All states"}
        </button>
        <span className="ops-scope-seg__divider" aria-hidden="true">
          /
        </span>
        <button
          type="button"
          onClick={() => setCityPickerOpen(true)}
          className="ops-scope-seg__btn px-2.5 py-1.5 text-xs font-semibold"
        >
          {city ?? "All cities"}
        </button>
        {isScoped ? (
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
