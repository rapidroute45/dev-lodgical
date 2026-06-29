import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStoresQuery, useSchedulesQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { formatDisplayDate } from "@/shared/utils/time.js";
import {
  ChevronRight,
  MenuBack,
  MenuEmpty,
  MenuPanel,
  MenuSearch,
  MenuTrigger,
  MenuRow,
  filterByQuery,
  useMenuDismiss,
} from "@/modules/manager-home/presentation/components/opsNavShared.jsx";
import { useOpsNavScope } from "@/modules/manager-home/presentation/hooks/useOpsNavScope.js";
import { filterStoresByScope } from "@/modules/manager-home/utils/opsNavScope.js";

const STORE_ICON = (
  <svg className="h-4 w-4" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3m2 0h5M9 7h6m-6 4h6" />
  </svg>
);

export function StoreNavMenu({ date, open, onToggle, onClose }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const { assignedCities, globalState } = useOpsNavScope();
  const [selectedStore, setSelectedStore] = useState(null);
  const [search, setSearch] = useState("");

  useMenuDismiss(open, close, rootRef);

  function close() {
    setSelectedStore(null);
    setSearch("");
    onClose();
  }

  const storesQuery = useStoresQuery(open);
  const schedulesQuery = useSchedulesQuery(
    { date, storeId: selectedStore?.id },
    Boolean(open && selectedStore?.id)
  );

  const filteredStores = useMemo(() => {
    const scoped = filterStoresByScope(storesQuery.data ?? [], assignedCities, globalState);
    return filterByQuery(
      scoped,
      search,
      (s) => `${s.storeName ?? ""} ${s.storeId ?? ""} ${s.city ?? ""}`
    );
  }, [storesQuery.data, assignedCities, globalState, search]);

  function gotoSchedule(id) {
    navigate(`/schedules/${id}`);
    close();
  }

  return (
    <div className="ops-menu" ref={rootRef}>
      <MenuTrigger label="Store" icon={STORE_ICON} open={open} onToggle={onToggle} />

      {open ? (
        <MenuPanel className="ops-menu__panel--single">
          <div className="ops-menu__pane ops-menu__pane--full">
            {!selectedStore ? (
              <>
                <MenuSearch value={search} onChange={setSearch} placeholder="Search stores…" />
                <div className="ops-menu__list">
                  {storesQuery.isLoading ? (
                    <MenuEmpty>Loading stores…</MenuEmpty>
                  ) : filteredStores.length === 0 ? (
                    <MenuEmpty>No stores found.</MenuEmpty>
                  ) : (
                    filteredStores.map((store) => (
                      <MenuRow
                        key={store.id}
                        onClick={() => {
                          setSelectedStore({
                            id: store.id,
                            name: store.storeName,
                            city: store.city,
                          });
                          setSearch("");
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{store.storeName}</span>
                          <span className="block truncate text-xs" style={{ color: "var(--text-dim)" }}>
                            {store.storeId} · {store.city}, {store.state}
                          </span>
                        </span>
                        <ChevronRight />
                      </MenuRow>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <MenuBack label={`Schedules · ${selectedStore.name}`} onClick={() => setSelectedStore(null)} />
                <div className="ops-menu__list">
                  {schedulesQuery.isLoading ? (
                    <MenuEmpty>Loading schedules…</MenuEmpty>
                  ) : (schedulesQuery.data?.items ?? []).length === 0 ? (
                    <MenuEmpty>No schedules for this store on selected date.</MenuEmpty>
                  ) : (
                    (schedulesQuery.data?.items ?? []).map((s) => (
                      <MenuRow key={s.id} onClick={() => gotoSchedule(s.id)}>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            Schedule · {formatDisplayDate(s.date)}
                          </span>
                          <span className="block truncate text-xs" style={{ color: "var(--text-dim)" }}>
                            {s.routeCount ?? 0} routes · {s.status ?? "—"}
                            {selectedStore.city ? ` · ${selectedStore.city}` : ""}
                          </span>
                        </span>
                        <ChevronRight />
                      </MenuRow>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </MenuPanel>
      ) : null}
    </div>
  );
}
