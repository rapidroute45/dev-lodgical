import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth.js";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import {
  useAllUsersQuery,
  useDeleteUserMutation,
} from "@/modules/users/infrastructure/api/users.queries.js";
import { formatRoleLabel, formatStatusLabel } from "@/modules/users/utils/editableRoles.js";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
];

function statusBadgeClass(status) {
  if (status === "active") return "bg-emerald-100 text-emerald-800";
  if (status === "suspended") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

export function UsersListScreen() {
  const { user: currentUser } = useAuth();
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
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div className="flex flex-1 items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-dispatch-text">Users</h1>
            <p className="text-sm text-dispatch-muted">
              {users.length} user{users.length === 1 ? "" : "s"}
            </p>
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
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-dispatch-red">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="flex items-center gap-3 rounded-2xl border border-dispatch-border bg-dispatch-surface px-4 py-3 shadow-sm">
          <svg className="h-5 w-5 shrink-0 text-dispatch-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-dispatch-light"
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
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                filter === key
                  ? "bg-dispatch-indigo text-white"
                  : "bg-dispatch-surface text-dispatch-muted ring-1 ring-dispatch-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-dispatch-muted">Loading users…</p>
        ) : isError ? (
          <p className="py-12 text-center text-sm text-dispatch-red">Could not load users</p>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface px-6 py-12 text-center">
            <p className="font-semibold text-dispatch-text">No users found</p>
            <p className="mt-1 text-sm text-dispatch-muted">Try a different search or filter</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-dispatch-border bg-dispatch-surface shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dispatch-border bg-dispatch-bg text-xs font-bold uppercase tracking-wide text-dispatch-muted">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell">Team / City</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dispatch-border">
                {users.map((u) => {
                  const displayName = u.displayName ?? resolveDisplayName(u.fullName, u.email);
                  const canDelete = u.id !== currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-dispatch-bg/60">
                      <td className="px-4 py-3">
                        <Link to={`/users/${u.id}`} className="font-semibold text-dispatch-text hover:text-dispatch-primary">
                          {displayName}
                        </Link>
                        <p className="text-xs text-dispatch-muted">{u.email}</p>
                      </td>
                      <td className="hidden px-4 py-3 capitalize text-dispatch-muted sm:table-cell">
                        {u.role ? formatRoleLabel(u.role) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-lg px-2 py-1 text-xs font-bold ${statusBadgeClass(u.status)}`}>
                          {formatStatusLabel(u.status)}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-dispatch-muted md:table-cell">
                        {u.team?.name ?? u.assignedCity ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/users/${u.id}`}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-dispatch-primary hover:bg-dispatch-primary-soft"
                          >
                            Edit
                          </Link>
                          {canDelete ? (
                            <button
                              type="button"
                              disabled={deleteMutation.isPending}
                              onClick={() => handleDelete(u.id, displayName)}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-dispatch-red hover:bg-red-50 disabled:opacity-50"
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
              <p className="border-t border-dispatch-border px-4 py-2 text-xs text-dispatch-muted">Refreshing…</p>
            ) : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
