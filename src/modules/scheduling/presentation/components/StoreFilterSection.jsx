import { useState } from "react";
import { useOpsLocationScope } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";
import { ListPickerModal } from "./ListPickerModal.jsx";

export function StoreFilterSection({
  stores,
  isLoadingStores,
  selectedStore,
  onSelectStore,
  sectionTitle = "Filter by store",
}) {
  const { scopeLabel, isScoped } = useOpsLocationScope();
  const [storeModalOpen, setStoreModalOpen] = useState(false);

  const storePickerItems = stores.map((store) => ({
    id: store.id,
    title: store.storeName,
    subtitle: `${store.storeId} · ${store.city}, ${store.state}`,
  }));

  return (
    <section className="ops-panel ops-fade overflow-hidden">
      <div className="ops-panel__head px-5 py-4">
        <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
          {sectionTitle}
        </h2>
        <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
          Location scope is set in the header
        </p>
        {isScoped ? (
          <div className="ops-scope-seg ops-scope-seg--active mt-3 inline-flex px-3 py-1.5 text-xs font-semibold">
            {scopeLabel}
          </div>
        ) : null}
      </div>

      <div className="p-5">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
          Store
        </label>
        <button
          type="button"
          disabled={isLoadingStores || stores.length === 0}
          onClick={() => setStoreModalOpen(true)}
          className="ops-field group flex w-full items-center gap-3 text-left text-sm disabled:opacity-50"
        >
          <span className="ops-field__icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          <span
            className="flex-1 font-semibold"
            style={{ color: selectedStore ? "var(--text)" : "var(--text-dim)" }}
          >
            {selectedStore?.storeName ?? (isLoadingStores ? "Loading stores…" : "All stores in scope")}
          </span>
        </button>

        {selectedStore ? (
          <div className="ops-field mt-3 px-3 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="font-semibold" style={{ color: "var(--text)" }}>
              {selectedStore.storeId}
            </span>
            {" · "}
            {selectedStore.city}, {selectedStore.state}
          </div>
        ) : null}
      </div>

      <ListPickerModal
        open={storeModalOpen}
        title="Select store"
        items={[{ id: "", title: "All stores", subtitle: "In current scope" }, ...storePickerItems]}
        selectedId={selectedStore?.id ?? ""}
        isLoading={isLoadingStores}
        emptyMessage="No stores in this scope."
        onSelect={(id) => {
          if (!id) onSelectStore(null);
          else {
            const store = stores.find((s) => s.id === id);
            if (store) onSelectStore(store);
          }
        }}
        onClose={() => setStoreModalOpen(false)}
        searchPlaceholder="Search stores…"
      />
    </section>
  );
}
