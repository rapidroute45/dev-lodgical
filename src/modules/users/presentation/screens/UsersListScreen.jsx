import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { ScopedEmptyHint } from "@/modules/manager-home/presentation/components/ScopedEmptyHint.jsx";
import { PerformanceSummaryStrip } from "@/modules/manager-home/presentation/components/PerformanceSummaryStrip.jsx";
import { PerformanceMetricsRow } from "@/modules/manager-home/presentation/components/PerformanceMetricsRow.jsx";
import { PerformanceBadge } from "@/modules/manager-home/presentation/components/PerformanceBadge.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { useOpsElevation } from "@/modules/auth/presentation/context/OpsElevationContext.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import {
  useAllUsersQuery,
  useDeleteUserMutation,
} from "@/modules/users/infrastructure/api/users.queries.js";
import {
  isPerformanceEligibleUser,
  performanceForUser,
  useMergedStaffPerformanceQuery,
} from "@/modules/manager-home/infrastructure/api/dashboard.queries.js";
import { formatRoleLabel, formatStatusLabel } from "@/modules/users/utils/editableRoles.js";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
];

function statusBadgeVariant(status) {
  if (status === "active") return "done";
  if (status === "suspended") return "rose";
  return "pending";
}

export function UsersListScreen() {
  const { user: currentUser } = useAuth();
  const { canMutateOps } = useOpsElevation();
  const allowUserMutations = canMutateOps(currentUser?.role);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: filter === "all" ? undefined : filter,
    }),
    [search, filter]
  );

  const { data: users = [], isLoading, isError, refetch, isFetching } =
    useAllUsersQuery(queryParams, true);
  const {
    window: performanceWindow,
    performanceByUserId,
    topPerformers,
    needsImprovement,
    isLoading: performanceLoading,
    isFetching: performanceFetching,
    refetch: refetchPerformance,
  } = useMergedStaffPerformanceQuery(7, true);
  const deleteMutation = useDeleteUserMutation();

  async function handleDelete(userId, displayName) {
    if (!window.confirm(`Remove ${displayName}? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(userId);
      setMessage("User deleted.");
      void refetch();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Could not delete user");
    }
  }

  const topBar = (
    <OpsTopBar
      showDate={false}
      onRefresh={() => {
        void refetch();
        refetchPerformance();
      }}
      refreshing={isFetching || performanceFetching}
    />
  );

  function renderPerformanceCell(user, { mobile = false } = {}) {
    const eligible = isPerformanceEligibleUser(user);
    const performance = performanceForUser(user, performanceByUserId);

    if (!eligible) {
      return (
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          —
        </span>
      );
    }

    return (
      <div className={`flex flex-wrap items-center gap-2${mobile ? " mt-2 md:hidden" : " hidden md:flex"}`}>
        <PerformanceMetricsRow
          performance={performance}
          compact
          loading={performanceLoading}
        />
        <PerformanceBadge badge={performance?.badge ?? null} compact />
      </div>
    );
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Users
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {users.length} user{users.length === 1 ? "" : "s"}
            </p>
          </div>
          {allowUserMutations ? (
            <Link to="/users/new" className="ops-btn ops-btn--accent px-5 py-2.5 font-bold">
              + Create account
            </Link>
          ) : null}
        </div>

        {error ? <div className="ops-banner ops-banner--error">{error}</div> : null}
        {message ? <div className="ops-banner ops-banner--success">{message}</div> : null}

        <div className="ops-menu__search">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`ops-chip${filter === key ? " ops-chip--active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        <PerformanceSummaryStrip
          window={performanceWindow}
          topPerformers={topPerformers}
          needsImprovement={needsImprovement}
          loading={performanceLoading}
        />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="ops-skel h-16 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="py-12 text-center text-sm" style={{ color: "var(--rose)" }}>Could not load users</p>
        ) : users.length === 0 ? (
          <div className="ops-panel ops-fade px-6 py-12 text-center">
            <p className="font-semibold" style={{ color: "var(--text)" }}>No users found</p>
            <ScopedEmptyHint show={!isLoading} />
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Try a different search or filter</p>
          </div>
        ) : (
          <div className="ops-panel ops-fade overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead
                className="text-xs font-bold uppercase tracking-wide"
                style={{ borderBottom: "1px solid var(--border)", color: "var(--text-dim)", background: "rgba(255,255,255,0.02)" }}
              >
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell ops-users-perf-cell">Performance (7d)</th>
                  <th className="hidden px-4 py-3 md:table-cell">Team / City</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {users.map((u) => {
                  const displayName = u.displayName ?? resolveDisplayName(u.fullName, u.email);
                  const canDelete = allowUserMutations && u.id !== currentUser?.id;
                  return (
                    <tr key={u.id} className="transition hover:bg-[rgba(255,255,255,0.03)]">
                      <td className="px-4 py-3">
                        <Link to={`/users/${u.id}`} className="font-semibold" style={{ color: "var(--text)" }}>
                          {displayName}
                        </Link>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                        {renderPerformanceCell(u, { mobile: true })}
                      </td>
                      <td className="hidden px-4 py-3 capitalize sm:table-cell" style={{ color: "var(--text-muted)" }}>
                        {u.role ? formatRoleLabel(u.role) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`ops-badge ops-badge--${statusBadgeVariant(u.status)}`}>
                          {formatStatusLabel(u.status)}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell ops-users-perf-cell">
                        {renderPerformanceCell(u)}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell" style={{ color: "var(--text-muted)" }}>
                        {u.team?.name ?? u.assignedCity ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/users/${u.id}`}
                            className="ops-btn px-3 py-1.5 text-xs font-bold"
                          >
                            Edit
                          </Link>
                          {canDelete ? (
                            <button
                              type="button"
                              disabled={deleteMutation.isPending}
                              onClick={() => handleDelete(u.id, displayName)}
                              className="ops-btn px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                              style={{ color: "var(--rose)", borderColor: "color-mix(in srgb, var(--rose) 35%, transparent)" }}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {isFetching && !isLoading ? (
              <p className="px-4 py-2 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
                Refreshing…
              </p>
            ) : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
