import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import { usePendingUsersQuery } from "@/modules/users/infrastructure/api/users.queries.js";

export function AssignRoleListScreen() {
  const { data: users = [], isLoading, isError, refetch, isFetching } =
    usePendingUsersQuery(true);

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div className="flex flex-1 items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-dispatch-text">Assign role</h1>
            <p className="text-sm text-dispatch-muted">Users awaiting approval</p>
          </div>
          <Link
            to="/users/new"
            className="shrink-0 rounded-xl bg-dispatch-indigo px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-dispatch-primary/25 hover:bg-dispatch-indigo-pressed"
          >
            + Create account
          </Link>
        </div>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {isLoading ? (
          <p className="py-12 text-center text-sm text-dispatch-muted">Loading…</p>
        ) : isError ? (
          <p className="py-12 text-center text-sm text-dispatch-red">Could not load users</p>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface px-6 py-12 text-center">
            <p className="font-semibold text-dispatch-text">All caught up</p>
            <p className="mt-1 text-sm text-dispatch-muted">
              No pending sign-ups — create an account directly with role and password
            </p>
            <Link
              to="/users/new"
              className="mt-4 inline-block rounded-xl bg-dispatch-indigo px-5 py-2.5 text-sm font-bold text-white hover:bg-dispatch-indigo-pressed"
            >
              Create account
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => {
              const displayName = u.displayName ?? resolveDisplayName(u.fullName, u.email);
              return (
                <Link
                  key={u.id}
                  to={`/assign-role/${u.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-dispatch-border bg-dispatch-surface p-4 shadow-sm transition hover:border-dispatch-primary/40 hover:bg-dispatch-primary-soft/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dispatch-primary-soft text-lg font-extrabold text-dispatch-primary">
                    {displayName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-dispatch-text">{displayName}</p>
                    <p className="truncate text-sm text-dispatch-muted">{u.email}</p>
                    <span className="mt-1 inline-block rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                      Pending
                    </span>
                  </div>
                  <span className="text-dispatch-muted">→</span>
                </Link>
              );
            })}
            {isFetching && !isLoading ? (
              <p className="text-center text-xs text-dispatch-muted">Refreshing…</p>
            ) : null}
          </div>
        )}
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm font-semibold text-dispatch-primary hover:underline"
        >
          Refresh list
        </button>
      </div>
    </DashboardLayout>
  );
}
