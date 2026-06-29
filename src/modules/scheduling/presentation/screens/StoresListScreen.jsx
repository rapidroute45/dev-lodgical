import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import {
  useCreateStoreMutation,
  useStoresQuery,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { CreateStoreModal } from "../components/CreateStoreModal.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { useOpsElevation } from "@/modules/auth/presentation/context/OpsElevationContext.jsx";
import { todayIsoDate } from "@/shared/utils/time.js";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

export function StoresListScreen() {
  const { user } = useAuth();
  const { canMutateOps } = useOpsElevation();
  const allowCreateStore = canMutateOps(user?.role);
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
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Stores
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
              Pickup locations for schedules
            </p>
          </div>
          {allowCreateStore ? (
            <button
              type="button"
              onClick={() => setCreateModal(true)}
              className="ops-btn ops-btn--accent px-5 py-2.5 font-bold"
            >
              + New store
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="ops-banner ops-banner--error">{error}</div>
        ) : null}
        {message ? (
          <div className="ops-banner ops-banner--success">{message}</div>
        ) : null}

        <div className="ops-panel ops-fade">
          <div className="ops-menu__search">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search by name, ID, or city"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["all", "active", "inactive"].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`ops-chip capitalize ${filter === key ? "ops-chip--active" : ""}`}
            >
              {key}
            </button>
          ))}
          <span className="ml-auto text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {filtered.length} store{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-24 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <div className="ops-stat__icon mx-auto mb-4 flex h-14 w-14 items-center justify-center">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>No stores found</p>
            {allowCreateStore ? (
              <button
                type="button"
                onClick={() => setCreateModal(true)}
                className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold"
              >
                Create your first store
              </button>
            ) : (
              <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
                Ask your dispatch manager to add a store for your city.
              </p>
            )}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filtered.map((store) => (
              <li key={store.id}>
              <Link
                to={`/stores/${store.id}`}
                className="ops-card ops-card--hover ops-fade group block p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="ops-stat__icon flex h-11 w-11 shrink-0 items-center justify-center">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold" style={{ color: "var(--text)" }}>
                      {store.storeName}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      {store.storeId}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
                      {store.city}, {store.state}
                    </p>
                    {store.address ? (
                      <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        {store.address}
                      </p>
                    ) : null}
                    <span
                      className={`mt-2 ops-badge ops-badge--${
                        store.activeStatus === "active" ? "done" : "muted"
                      } uppercase`}
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

      {allowCreateStore ? (
        <CreateStoreModal
          open={createModal}
          city=""
          state=""
          loading={createStore.isPending}
          onClose={() => setCreateModal(false)}
          onCreate={handleCreateStore}
        />
      ) : null}
    </DashboardLayout>
  );
}
