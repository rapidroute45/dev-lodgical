import { useEffect, useState } from "react";
import { TextField } from "@/modules/auth/presentation/components/TextField.jsx";
import { Button } from "@/modules/auth/presentation/components/Button.jsx";

export function CreateStoreModal({
  open,
  city: initialCity,
  state: initialState,
  loading,
  onClose,
  onCreate,
}) {
  const [storeName, setStoreName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setCity(initialCity ?? "");
    setState(initialState ?? "");
    setStoreName("");
    setAddress("");
    setAddressError(null);
  }, [open, initialCity, initialState]);

  if (!open) return null;

  const canCreate =
    storeName.trim().length >= 2 &&
    city.trim().length > 0 &&
    state.trim().length > 0 &&
    address.trim().length > 0;

  function handleCreate(e) {
    e.preventDefault();
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setAddressError("Address is required");
      return;
    }
    setAddressError(null);
    onCreate({
      storeName: storeName.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      address: trimmedAddress,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="ops-modal max-h-[90vh] w-full max-w-lg overflow-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Create store</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Store ID is generated automatically. New stores are active.
        </p>

        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <TextField
            tone="dark"
            label="Store name *"
            placeholder="Walmart Downtown"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              tone="dark"
              label="City"
              placeholder="Austin"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <TextField
              tone="dark"
              label="State"
              placeholder="TX"
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
            />
          </div>
          <TextField
            tone="dark"
            label="Address"
            placeholder="123 Main St"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (addressError) setAddressError(null);
            }}
            error={addressError}
          />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="ops-btn flex-1 px-4 py-2.5 text-sm font-semibold">
              Cancel
            </button>
            <Button type="submit" tone="dark" loading={loading} disabled={!canCreate} className="flex-1">
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
