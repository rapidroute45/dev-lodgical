import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { todayIsoDate } from "@/shared/utils/time.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import { usePendingUsersQuery } from "@/modules/users/infrastructure/api/users.queries.js";

export function AssignRoleListScreen() {
  const { data: users = [], isLoading, isError, refetch, isFetching } =
    usePendingUsersQuery(true);

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Assign role
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Users awaiting approval</p>
          </div>
          <Link to="/users/new" className="ops-btn ops-btn--accent px-5 py-2.5 font-bold">
            + Create account
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-20 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="py-12 text-center text-sm" style={{ color: "var(--rose)" }}>Could not load users</p>
        ) : users.length === 0 ? (
          <div className="ops-panel ops-fade px-6 py-12 text-center">
            <p className="font-semibold" style={{ color: "var(--text)" }}>All caught up</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              No pending sign-ups — create an account directly with role and password
            </p>
            <Link to="/users/new" className="ops-btn ops-btn--accent mt-4 inline-flex px-5 py-2.5 font-bold">
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
                  className="ops-card ops-card--hover flex items-center gap-4 p-4"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-extrabold"
                    style={{ background: "color-mix(in srgb, var(--accent) 16%, transparent)", color: "var(--accent)" }}
                  >
                    {displayName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold" style={{ color: "var(--text)" }}>{displayName}</p>
                    <p className="truncate text-sm" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                    <span className="ops-badge ops-badge--pending mt-1 inline-block">
                      Pending
                    </span>
                  </div>
                  <span style={{ color: "var(--text-muted)" }}>→</span>
                </Link>
              );
            })}
            {isFetching && !isLoading ? (
              <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>Refreshing…</p>
            ) : null}
          </div>
        )}
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm font-semibold hover:underline"
          style={{ color: "var(--accent)" }}
        >
          Refresh list
        </button>
      </div>
    </DashboardLayout>
  );
}
