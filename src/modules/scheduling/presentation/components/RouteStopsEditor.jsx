import { formatStorePickupAddress } from "@/modules/scheduling/utils/routeDraft.js";

function newStop() {
  return {
    localId: `stop-${Date.now()}-${Math.random()}`,
    name: "",
    address: "",
    accessCode: "",
  };
}

export function RouteStopsEditor({ store, dropoffs, onChangeDropoffs }) {
  function updateStop(localId, patch) {
    onChangeDropoffs(
      dropoffs.map((s) => (s.localId === localId ? { ...s, ...patch } : s))
    );
  }

  function removeStop(localId) {
    onChangeDropoffs(dropoffs.filter((s) => s.localId !== localId));
  }

  return (
    <div className="mt-2 space-y-3">
      <div className="rounded-xl border border-dispatch-border bg-dispatch-primary-soft p-3">
        <p className="text-xs font-bold text-dispatch-primary">Pickup (store)</p>
        {store ? (
          <>
            <p className="mt-1 text-sm font-bold text-dispatch-text">{store.storeName}</p>
            <p className="mt-0.5 text-xs text-dispatch-muted">
              {formatStorePickupAddress(store)}
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs italic text-dispatch-muted">
            Select a store above to set pickup.
          </p>
        )}
      </div>

      <p className="text-xs font-bold text-dispatch-muted">Dropoff stops</p>

      {dropoffs.length === 0 ? (
        <p className="text-xs text-dispatch-light">No dropoffs yet. Add stops below.</p>
      ) : (
        dropoffs.map((stop, index) => (
          <div
            key={stop.localId}
            className="rounded-xl border border-dispatch-border bg-[#FAFBFC] p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-dispatch-green text-xs font-bold text-white">
                {index + 1}
              </span>
              <span className="flex-1 text-sm font-bold text-dispatch-text">
                Stop {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeStop(stop.localId)}
                className="text-xs font-semibold text-dispatch-red"
              >
                Remove
              </button>
            </div>
            <label className="mb-1 block text-xs font-semibold text-dispatch-muted">
              Name
            </label>
            <input
              className="mb-2 w-full rounded-lg border border-dispatch-border bg-dispatch-surface px-3 py-2 text-sm"
              value={stop.name}
              onChange={(e) => updateStop(stop.localId, { name: e.target.value })}
              placeholder="Customer or location name"
            />
            <label className="mb-1 block text-xs font-semibold text-dispatch-muted">
              Address
            </label>
            <textarea
              className="mb-2 w-full rounded-lg border border-dispatch-border bg-dispatch-surface px-3 py-2 text-sm"
              rows={2}
              value={stop.address}
              onChange={(e) => updateStop(stop.localId, { address: e.target.value })}
              placeholder="Full delivery address"
            />
            <label className="mb-1 block text-xs font-semibold text-dispatch-muted">
              Gate / apt code (optional)
            </label>
            <input
              className="w-full rounded-lg border border-dispatch-border bg-dispatch-surface px-3 py-2 text-sm"
              value={stop.accessCode ?? ""}
              onChange={(e) => updateStop(stop.localId, { accessCode: e.target.value })}
              placeholder="e.g. #4521"
            />
          </div>
        ))
      )}

      <button
        type="button"
        onClick={() => onChangeDropoffs([...dropoffs, newStop()])}
        className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-dispatch-primary py-2 text-sm font-bold text-dispatch-primary"
      >
        + Add stop
      </button>
    </div>
  );
}
