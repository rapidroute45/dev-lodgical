import { useMemo, useState } from "react";
import { ModalSheet } from "./ModalSheet.jsx";
import { PayrollStoreRatesModal } from "./PayrollStoreRatesModal.jsx";
import { useStoresQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";

export function PayrollStoreRatesPickerModal({ open, onClose }) {
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);

  const { data: stores = [], isLoading, isError } = useStoresQuery(open);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(
      (s) =>
        s.storeName?.toLowerCase().includes(q) ||
        s.storeId?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q)
    );
  }, [stores, search]);

  function handleClose() {
    setSearch("");
    setSelectedStore(null);
    onClose();
  }

  return (
    <>
      <ModalSheet open={open && !selectedStore} title="Per-store driver rates" onClose={handleClose} wide>
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-dispatch-border bg-dispatch-surface px-3 py-2">
          <svg className="h-4 w-4 text-dispatch-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores"
            className="w-full border-0 bg-transparent text-sm outline-none"
          />
        </div>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-dispatch-muted">Loading…</p>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red-600">Could not load stores.</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-dispatch-muted">No stores found.</p>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-auto">
            {filtered.map((store) => (
              <li key={store.id}>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedStore({ id: store.id, name: store.storeName ?? store.storeId })
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-dispatch-border px-3 py-3 text-left hover:bg-dispatch-bg"
                >
                  <div>
                    <p className="text-sm font-semibold text-dispatch-text">{store.storeName}</p>
                    <p className="text-xs text-dispatch-muted">
                      {store.storeId} · {store.city}, {store.state}
                    </p>
                  </div>
                  <span className="text-dispatch-muted">→</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ModalSheet>
      <PayrollStoreRatesModal
        open={Boolean(selectedStore)}
        storeId={selectedStore?.id ?? null}
        storeName={selectedStore?.name ?? ""}
        onClose={() => setSelectedStore(null)}
      />
    </>
  );
}
