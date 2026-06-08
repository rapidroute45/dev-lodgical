import { useEffect, useState } from "react";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import {
  useMeQuery,
  useUpdateProfileMutation,
} from "@/modules/auth/infrastructure/api/auth.queries.js";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { data: me, refetch } = useMeQuery(Boolean(user));
  const updateProfile = useUpdateProfileMutation();
  const profile = me ?? user;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setPhone(profile.phone ?? "");
  }, [profile]);

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await updateProfile.mutateAsync({
        fullName: fullName.trim() || null,
        phone: phone.trim() || null,
      });
      await refetch();
      setMessage("Profile updated.");
    } catch (err) {
      setError(err.message || "Update failed");
    }
  }

  const displayName = resolveDisplayName(profile?.fullName, profile?.email);

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={`${PAGE_HEADER_INNER} items-center`}>
        <h1 className="text-lg font-bold text-dispatch-text">Profile</h1>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={`${PAGE_CONTENT} max-w-lg`}>
        <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-6">
          <div className="mb-6 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-dispatch-primary text-xl font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-lg font-bold text-dispatch-text">{displayName}</p>
              <p className="text-sm text-dispatch-muted">{profile?.email}</p>
              <p className="mt-1 text-xs font-medium capitalize text-dispatch-primary">
                {profile?.role ?? "—"}
              </p>
              {profile?.assignedCity ? (
                <p className="text-xs text-dispatch-muted">City: {profile.assignedCity}</p>
              ) : null}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-dispatch-muted">Full name</span>
              <input
                className="mt-1 w-full rounded-lg border border-dispatch-border px-3 py-2 text-sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-dispatch-muted">Phone</span>
              <input
                className="mt-1 w-full rounded-lg border border-dispatch-border px-3 py-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            {message ? (
              <p className="text-sm font-medium text-emerald-700">{message}</p>
            ) : null}
            {error ? (
              <p className="text-sm font-medium text-dispatch-red">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="w-full rounded-lg bg-dispatch-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {updateProfile.isPending ? "Saving…" : "Save changes"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => void logout()}
            className="mt-4 w-full rounded-lg border border-dispatch-border px-4 py-2.5 text-sm font-semibold text-dispatch-muted hover:bg-dispatch-bg"
          >
            Sign out
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
