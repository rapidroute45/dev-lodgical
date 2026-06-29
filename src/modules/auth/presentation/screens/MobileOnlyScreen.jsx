import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";

export function MobileOnlyScreen() {
  const { user, logout } = useAuth();
  const roleLabel = user?.role ?? "your role";

  return (
    <div className="ops-shell flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="ops-panel ops-fade max-w-md p-8">
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
          Mobile app required
        </p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
          Use the Dispatch mobile app
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Web access is not available for <span className="capitalize">{roleLabel}</span> accounts.
          Sign in on your phone to manage routes, chat, and daily work.
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="ops-btn mt-6 w-full justify-center px-4 py-2.5 text-sm font-semibold"
          style={{ color: "var(--rose)", borderColor: "color-mix(in srgb, var(--rose) 35%, transparent)" }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
