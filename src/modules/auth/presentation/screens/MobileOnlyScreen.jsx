import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { Button } from "@/modules/auth/presentation/components/Button.jsx";

export function MobileOnlyScreen() {
  const { user, logout } = useAuth();
  const roleLabel = user?.role ?? "your role";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-dispatch-bg px-6 text-center">
      <div className="max-w-md rounded-2xl border border-dispatch-border bg-dispatch-surface p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-dispatch-primary">
          Mobile app required
        </p>
        <h1 className="mt-3 text-2xl font-bold text-dispatch-text">
          Use the Dispatch mobile app
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-dispatch-muted">
          Web access is not available for <span className="capitalize">{roleLabel}</span> accounts.
          Sign in on your phone to manage routes, chat, and daily work.
        </p>
        <Button type="button" className="mt-6 w-full" onClick={() => void logout()}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
