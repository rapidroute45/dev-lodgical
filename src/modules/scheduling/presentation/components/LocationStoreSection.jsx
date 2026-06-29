import { useMemo, useState } from "react";
import {
  filterLocationsByAllowedCities,
  findLocationOption,
  storeLocationsFromStores,
  storesInLocation,
} from "@/modules/scheduling/utils/storeLocations.js";
import { ListPickerModal } from "./ListPickerModal.jsx";

function PickerField({ label, value, placeholder, disabled, onClick }) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="ops-field group flex w-full items-center gap-3 text-left text-sm disabled:opacity-50"
      >
        <span className="ops-field__icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        </span>
        <span className="flex-1 font-semibold" style={{ color: value ? "var(--text)" : "var(--text-dim)" }}>
          {value || placeholder}
        </span>
        <svg
          className="h-4 w-4 transition"
          style={{ color: "var(--text-muted)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

export function LocationStoreSection({
  stores,
  isLoadingStores,
  city,
  state,
  selectedStore,
  onSelectLocation,
  onSelectStore,
  onCreateStore,
  sectionTitle = "Location & store",
  cityLocked = false,
  allowedCities = null,
  canCreateStore = Boolean(onCreateStore),
}) {
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [storeModalOpen, setStoreModalOpen] = useState(false);

  const locations = useMemo(() => {
    const all = storeLocationsFromStores(stores);
    return filterLocationsByAllowedCities(all, allowedCities);
  }, [stores, allowedCities]);
  const selectedLocation = findLocationOption(locations, city, state);
  const storesInCity = useMemo(() => {
    if (!selectedLocation) return [];
    return storesInLocation(
      stores,
      selectedLocation.city,
      selectedLocation.state
    );
  }, [stores, selectedLocation]);

  const cityPickerItems = locations.map((loc) => ({
    id: loc.key,
    title: loc.label,
    subtitle: loc.storeCount === 1 ? "1 store" : `${loc.storeCount} stores`,
  }));

  const storePickerItems = storesInCity.map((store) => ({
    id: store.id,
    title: store.storeName,
    subtitle: `${store.storeId} · ${store.address ?? store.city}`,
  }));

  const cityDisplay = selectedLocation
    ? `${selectedLocation.label} (${selectedLocation.storeCount} store${selectedLocation.storeCount === 1 ? "" : "s"})`
    : "";

  const lockedCityDisplay = selectedLocation
    ? cityDisplay
    : state.trim()
      ? `${city}, ${state}`
      : city.trim();

  const hasCity = Boolean(selectedLocation);

  return (
    <section className="ops-panel ops-fade overflow-hidden">
      <div className="ops-panel__head px-5 py-4">
        <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>{sectionTitle}</h2>
        <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
          Choose where this schedule runs
        </p>
      </div>

      <div className="p-5">
        <PickerField
          label={cityLocked ? "City (assigned)" : "City"}
          value={cityLocked ? lockedCityDisplay : cityDisplay}
          placeholder={
            cityLocked
              ? city.trim()
                ? lockedCityDisplay || city.trim()
                : "Assigned city"
              : isLoadingStores
                ? "Loading cities…"
                : locations.length === 0
                  ? canCreateStore
                    ? "No stores yet — create one"
                    : "No stores in your assigned cities"
                  : "Select city"
          }
          disabled={cityLocked || isLoadingStores || locations.length === 0}
          onClick={() => setCityModalOpen(true)}
        />
        {cityLocked ? (
          <p className="-mt-1 mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
            This city is fixed for your account. Ask a manager to assign more cities if you need to
            work elsewhere.
          </p>
        ) : null}

        <PickerField
          label="Store"
          value={selectedStore?.storeName ?? ""}
          placeholder={
            !hasCity
              ? "Select a city first"
              : storesInCity.length === 0
                ? "No stores in this city"
                : "Select store"
          }
          disabled={!hasCity || storesInCity.length === 0}
          onClick={() => setStoreModalOpen(true)}
        />

        {selectedStore ? (
          <div className="ops-field mb-4 px-3 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="font-semibold" style={{ color: "var(--text)" }}>{selectedStore.storeId}</span>
            {" · "}
            {selectedStore.city}, {selectedStore.state}
            {selectedStore.address ? ` · ${selectedStore.address}` : ""}
          </div>
        ) : null}

        {onCreateStore ? (
          <button
            type="button"
            onClick={onCreateStore}
            className="ops-dashed inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold"
          >
            <span className="text-lg leading-none">+</span>
            Create new store
          </button>
        ) : null}
      </div>

      <ListPickerModal
        open={cityModalOpen}
        title="Select city"
        items={cityPickerItems}
        selectedId={selectedLocation?.key ?? null}
        isLoading={isLoadingStores}
        emptyMessage={
          canCreateStore
            ? "Create a store first to see cities here."
            : "No stores available. Ask your dispatch manager to add one."
        }
        onSelect={(key) => {
          const loc = locations.find((l) => l.key === key);
          if (loc) onSelectLocation(loc.city, loc.state);
        }}
        onClose={() => setCityModalOpen(false)}
        searchPlaceholder="Search cities…"
      />

      <ListPickerModal
        open={storeModalOpen}
        title={`Stores in ${selectedLocation?.label ?? "city"}`}
        items={storePickerItems}
        selectedId={selectedStore?.id ?? null}
        emptyMessage="No stores in this city."
        onSelect={(id) => {
          const store = storesInCity.find((s) => s.id === id);
          if (store) onSelectStore(store);
        }}
        onClose={() => setStoreModalOpen(false)}
        searchPlaceholder="Search stores…"
      />
    </section>
  );
}
