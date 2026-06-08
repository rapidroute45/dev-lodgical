import { useMemo, useState } from "react";
import {
  findLocationOption,
  storeLocationsFromStores,
  storesInLocation,
} from "@/modules/scheduling/utils/storeLocations.js";
import { ListPickerModal } from "./ListPickerModal.jsx";

function PickerField({ label, value, placeholder, disabled, onClick }) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dispatch-muted">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="group flex w-full items-center gap-3 rounded-xl border border-dispatch-border bg-[#FAFBFC] px-4 py-3 text-left text-sm transition hover:border-dispatch-primary/40 hover:bg-white disabled:opacity-50"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dispatch-primary-soft text-dispatch-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        </span>
        <span className={`flex-1 font-semibold ${value ? "text-dispatch-text" : "text-dispatch-light"}`}>
          {value || placeholder}
        </span>
        <svg
          className="h-4 w-4 text-dispatch-muted transition group-hover:text-dispatch-primary"
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
}) {
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [storeModalOpen, setStoreModalOpen] = useState(false);

  const locations = useMemo(() => storeLocationsFromStores(stores), [stores]);
  const selectedLocation = findLocationOption(locations, city, state);
  const storesInCity = useMemo(
    () => (selectedLocation ? storesInLocation(stores, city, state) : []),
    [stores, city, state, selectedLocation]
  );

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

  const hasCity = Boolean(selectedLocation);

  return (
    <section className="overflow-hidden rounded-2xl border border-dispatch-border/80 bg-dispatch-surface shadow-sm">
      <div className="border-b border-dispatch-border/60 bg-gradient-to-r from-dispatch-primary-soft/50 to-transparent px-5 py-4">
        <h2 className="text-base font-bold text-dispatch-text">{sectionTitle}</h2>
        <p className="mt-0.5 text-sm text-dispatch-muted">
          Choose where this schedule runs
        </p>
      </div>

      <div className="p-5">
        <PickerField
          label="City"
          value={cityLocked && city.trim() ? `${city}, ${state}` : cityDisplay}
          placeholder={
            cityLocked
              ? city.trim()
                ? `${city}, ${state}`
                : "Assigned city"
              : isLoadingStores
                ? "Loading cities…"
                : locations.length === 0
                  ? "No stores yet — create one"
                  : "Select city"
          }
          disabled={cityLocked || isLoadingStores || locations.length === 0}
          onClick={() => setCityModalOpen(true)}
        />

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
          <div className="mb-4 rounded-xl border border-dispatch-border bg-dispatch-bg px-3 py-2.5 text-xs text-dispatch-muted">
            <span className="font-semibold text-dispatch-text">{selectedStore.storeId}</span>
            {" · "}
            {selectedStore.city}, {selectedStore.state}
            {selectedStore.address ? ` · ${selectedStore.address}` : ""}
          </div>
        ) : null}

        {onCreateStore ? (
          <button
            type="button"
            onClick={onCreateStore}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-dispatch-primary/50 bg-dispatch-primary-soft/30 px-4 py-2.5 text-sm font-bold text-dispatch-primary transition hover:bg-dispatch-primary-soft"
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
        emptyMessage="Create a store first to see cities here."
        onSelect={(key) => {
          const loc = locations.find((l) => l.key === key);
          if (loc) onSelectLocation(loc.city, loc.state);
        }}
        onClose={() => setCityModalOpen(false)}
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
      />
    </section>
  );
}
