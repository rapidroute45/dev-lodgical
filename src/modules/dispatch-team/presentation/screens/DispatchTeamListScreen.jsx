import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import { UserRole, UserStatus } from "@/shared/utils/constants.js";
import { useAllUsersQuery } from "@/modules/users/infrastructure/api/users.queries.js";

export function DispatchTeamListScreen() {
  const { data: users = [], isLoading, isError, refetch, isFetching } =
    useAllUsersQuery(
      { role: UserRole.DISPATCH_TEAM, status: UserStatus.ACTIVE },
      true
    );

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div>
          <h1 className="text-xl font-bold text-dispatch-text">Dispatch team</h1>
          <p className="text-sm text-dispatch-muted">
            View each member&apos;s schedules and routes by city
          </p>
        </div>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {isLoading ? (
          <p className="py-12 text-center text-sm text-dispatch-muted">Loading team…</p>
        ) : isError ? (
          <p className="py-12 text-center text-sm text-dispatch-red">Could not load dispatch team</p>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface px-6 py-12 text-center">
            <p className="font-semibold text-dispatch-text">No dispatch team members</p>
            <p className="mt-1 text-sm text-dispatch-muted">
              Create accounts with the dispatch team role and assign a city.
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
            {users.map((member) => {
              const displayName =
                member.displayName ?? resolveDisplayName(member.fullName, member.email);
              const city = member.assignedCity?.trim();

              return (
                <Link
                  key={member.id}
                  to={`/dispatch-team/${member.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-dispatch-border bg-dispatch-surface p-4 shadow-sm transition hover:border-dispatch-primary/40 hover:bg-dispatch-primary-soft/20"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dispatch-primary-soft text-lg font-extrabold text-dispatch-primary">
                    {displayName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-dispatch-text">{displayName}</p>
                    <p className="truncate text-sm text-dispatch-muted">{member.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {city ? (
                        <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-800">
                          {city}
                        </span>
                      ) : (
                        <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                          No city assigned
                        </span>
                      )}
                      <span className="text-xs text-dispatch-muted capitalize">
                        {member.status}
                      </span>
                    </div>
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
