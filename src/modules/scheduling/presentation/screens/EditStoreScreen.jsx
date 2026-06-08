import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import {
  useStoreQuery,
  useUpdateStoreMutation,
} from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { TextField } from "@/modules/auth/presentation/components/TextField.jsx";
import { Button } from "@/modules/auth/presentation/components/Button.jsx";
import { SectionCard } from "../components/SectionCard.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";

export function EditStoreScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: store, isLoading, isError } = useStoreQuery(id, Boolean(id));
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
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={`${PAGE_HEADER_INNER} items-center`}>
        <Link
          to="/stores"
          className="rounded-xl border border-dispatch-border p-2.5 text-dispatch-muted hover:bg-dispatch-bg"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-dispatch-text">Edit store</h1>
          {store?.storeId ? (
            <p className="text-xs text-dispatch-muted">{store.storeId}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={updateStore.isPending || !hydrated}
          className="rounded-xl bg-dispatch-indigo px-4 py-2 text-sm font-semibold text-white hover:bg-dispatch-indigo-pressed disabled:opacity-50"
        >
          {updateStore.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </header>
  );

  if (isLoading || !hydrated) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          <div className="h-64 animate-pulse rounded-2xl bg-dispatch-border/30" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !store) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-12 text-center">
            <p className="text-lg font-bold text-dispatch-text">Store not found</p>
            <Link to="/stores" className="mt-4 inline-block text-sm font-bold text-dispatch-primary">
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
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-dispatch-red">
            {error}
          </div>
        ) : null}

        <SectionCard title="Store details" subtitle="Update pickup location information">
          <dl className="mb-4">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-dispatch-light">
              Store ID
            </dt>
            <dd className="mt-1 text-sm font-semibold text-dispatch-text">{store.storeId}</dd>
          </dl>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="space-y-4"
          >
            <TextField
              label="Store name *"
              placeholder="Walmart Downtown"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="City *"
                placeholder="Austin"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <TextField
                label="State *"
                placeholder="TX"
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value.toUpperCase().slice(0, 2))}
                maxLength={2}
              />
            </div>

            <TextField
              label="Address *"
              placeholder="123 Main St"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div>
              <p className="mb-1.5 text-sm font-medium text-dispatch-text">Status</p>
              <p className="mb-3 text-xs text-dispatch-muted">
                Inactive stores are hidden from schedule store pickers.
              </p>
              <div className="flex gap-3">
                {["active", "inactive"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setActiveStatus(status)}
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition ${
                      activeStatus === status
                        ? "border-dispatch-indigo bg-dispatch-indigo text-white"
                        : "border-dispatch-border bg-[#FAFBFC] text-dispatch-muted hover:bg-dispatch-bg"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" loading={updateStore.isPending} className="max-w-xs">
              Save changes
            </Button>
          </form>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
