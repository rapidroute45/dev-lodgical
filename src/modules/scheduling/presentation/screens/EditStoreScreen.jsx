import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import {
  useStoreQuery,
  useUpdateStoreMutation,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { SectionCard } from "../components/SectionCard.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";

export function EditStoreScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: store, isLoading, isError, refetch, isFetching } = useStoreQuery(
    id,
    Boolean(id)
  );
  const updateStore = useUpdateStoreMutation();

  const [storeName, setStoreName] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [address, setAddress] = useState("");
  const [activeStatus, setActiveStatus] = useState("active");
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!store || hydrated) return;
    setStoreName(store.storeName ?? "");
    setCity(store.city ?? "");
    setStateVal(store.state ?? "");
    setAddress(store.address ?? "");
    setActiveStatus(store.activeStatus === "inactive" ? "inactive" : "active");
    setHydrated(true);
  }, [store, hydrated]);

  async function save() {
    setError(null);
    if (!storeName.trim() || !city.trim() || !stateVal.trim() || !address.trim()) {
      setError("Fill in all required fields.");
      return;
    }

    try {
      await updateStore.mutateAsync({
        id,
        body: {
          storeName: storeName.trim(),
          city: city.trim(),
          state: stateVal.trim().toUpperCase(),
          address: address.trim(),
          activeStatus,
        },
      });
      navigate("/stores", { replace: true });
    } catch (err) {
      setError(err.message || "Save failed");
    }
  }

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />
  );

  const titleRow = (
    <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <Link to="/stores" className="ops-btn p-2.5" aria-label="Back to stores">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            Edit store
          </h1>
          {store?.storeId ? (
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>{store.storeId}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={updateStore.isPending || !hydrated}
        className="ops-btn ops-btn--accent shrink-0 px-5 py-2.5 font-bold disabled:opacity-50"
      >
        {updateStore.isPending ? "Saving…" : "Save"}
      </button>
    </div>
  );

  if (isLoading || (!hydrated && store)) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          <div className="ops-skel h-64 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !store) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>Store not found</p>
            <Link to="/stores" className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold">
              Back to stores
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {titleRow}

        {error ? (
          <div className="ops-banner ops-banner--error">{error}</div>
        ) : null}

        <SectionCard title="Store details" subtitle="Update pickup location information">
          <dl className="mb-4">
            <dt className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
              Store ID
            </dt>
            <dd className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>{store.storeId}</dd>
          </dl>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="space-y-4"
          >
            <OpsField
              label="Store name *"
              placeholder="Walmart Downtown"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <OpsField
                label="City *"
                placeholder="Austin"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <OpsField
                label="State *"
                placeholder="TX"
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value.toUpperCase().slice(0, 2))}
                maxLength={2}
              />
            </div>

            <OpsField
              label="Address *"
              placeholder="123 Main St"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div>
              <p className="mb-1.5 text-sm font-semibold" style={{ color: "var(--text)" }}>Status</p>
              <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
                Inactive stores are hidden from schedule store pickers.
              </p>
              <div className="flex gap-3">
                {["active", "inactive"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setActiveStatus(status)}
                    className={`ops-btn flex-1 px-4 py-3 text-sm font-semibold capitalize ${
                      activeStatus === status ? "ops-btn--accent" : ""
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={updateStore.isPending}
              className="ops-btn ops-btn--accent w-full max-w-xs px-5 py-2.5 font-bold disabled:opacity-50"
            >
              {updateStore.isPending ? "Saving…" : "Save changes"}
            </button>
          </form>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}

function OpsField({ label, ...inputProps }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
        {label}
      </label>
      <input
        className="ops-field w-full text-sm"
        style={{ color: "var(--text)" }}
        {...inputProps}
      />
    </div>
  );
}
