import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import {
  useCreateStoreMutation,
  useStoresQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { CreateStoreModal } from "../components/CreateStoreModal.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";

export function StoresListScreen() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [createModal, setCreateModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const { data: stores = [], isLoading, refetch, isFetching } = useStoresQuery(true);
  const createStore = useCreateStoreMutation();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stores.filter((s) => {
      if (filter === "active" && s.activeStatus !== "active") return false;
      if (filter === "inactive" && s.activeStatus === "active") return false;
      if (!q) return true;
      return (
        s.storeName?.toLowerCase().includes(q) ||
        s.storeId?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q)
      );
    });
  }, [stores, search, filter]);

  async function handleCreateStore(payload) {
    setError(null);
    try {
      await createStore.mutateAsync(payload);
      setCreateModal(false);
      setMessage("Store created.");
      void refetch();
    } catch (err) {
      setError(err.message || "Could not create store");
    }
  }

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div>
          <h1 className="text-xl font-bold text-dispatch-text">Stores</h1>
          <p className="text-sm text-dispatch-muted">Pickup locations for schedules</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-dispatch-indigo px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-dispatch-primary/25 hover:bg-dispatch-indigo-pressed"
        >
          + New store
        </button>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-dispatch-red">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="flex items-center gap-3 rounded-2xl border border-dispatch-border bg-dispatch-surface px-4 py-3 shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-dispatch-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-dispatch-light"
            placeholder="Search by name, ID, or city"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["all", "active", "inactive"].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${
                filter === key
                  ? "bg-dispatch-indigo text-white"
                  : "bg-dispatch-surface text-dispatch-muted ring-1 ring-dispatch-border"
              }`}
            >
              {key}
            </button>
          ))}
          <span className="ml-auto text-xs font-semibold text-dispatch-muted">
            {filtered.length} store{filtered.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs font-bold text-dispatch-primary"
          >
            {isFetching ? "…" : "Refresh"}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-dispatch-border/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-dispatch-border bg-dispatch-surface py-14 text-center">
            <p className="font-bold text-dispatch-text">No stores found</p>
            <button
              type="button"
              onClick={() => setCreateModal(true)}
              className="mt-4 text-sm font-bold text-dispatch-primary"
            >
              Create your first store
            </button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filtered.map((store) => (
              <li key={store.id}>
              <Link
                to={`/stores/${store.id}`}
                className="group block rounded-2xl border border-dispatch-border bg-dispatch-surface p-4 shadow-sm transition hover:border-dispatch-primary/30 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-dispatch-primary to-dispatch-indigo text-white shadow-md">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-dispatch-text group-hover:text-dispatch-primary">
                      {store.storeName}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-dispatch-muted">
                      {store.storeId}
                    </p>
                    <p className="mt-1 text-xs text-dispatch-light">
                      {store.city}, {store.state}
                    </p>
                    {store.address ? (
                      <p className="mt-1 line-clamp-2 text-xs text-dispatch-muted">
                        {store.address}
                      </p>
                    ) : null}
                    <span
                      className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        store.activeStatus === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-dispatch-bg text-dispatch-muted"
                      }`}
                    >
                      {store.activeStatus ?? "active"}
                    </span>
                  </div>
                </div>
              </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateStoreModal
        open={createModal}
        city=""
        state=""
        loading={createStore.isPending}
        onClose={() => setCreateModal(false)}
        onCreate={handleCreateStore}
      />
    </DashboardLayout>
  );
}
