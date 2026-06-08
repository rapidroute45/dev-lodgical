import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import { useUserQuery } from "@/modules/users/infrastructure/api/users.queries.js";
import { DispatchTeamSchedulesPanel } from "@/modules/dispatch-team/presentation/components/DispatchTeamSchedulesPanel.jsx";
import { DispatchTeamRoutesPanel } from "@/modules/dispatch-team/presentation/components/DispatchTeamRoutesPanel.jsx";

const TABS = [
  { key: "schedules", label: "Schedules" },
  { key: "routes", label: "Routes" },
];

export function DispatchTeamMemberScreen() {
  const { userId } = useParams();
  const [tab, setTab] = useState("schedules");
  const { data: member, isLoading, isError } = useUserQuery(userId, true);

  const displayName = member
    ? member.displayName ?? resolveDisplayName(member.fullName, member.email)
    : "";

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div className="flex items-center gap-3">
          <Link
            to="/dispatch-team"
            className="text-sm font-semibold text-dispatch-primary hover:underline"
          >
            ← Dispatch team
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dispatch-text">
              {displayName || "Team member"}
            </h1>
            {member ? (
              <p className="text-sm text-dispatch-muted">
                {member.assignedCity?.trim()
                  ? `City: ${member.assignedCity}`
                  : "No city assigned"}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );

  if (isLoading) {
    return (
      <DashboardLayout topBar={topBar}>
        <p className="py-12 text-center text-sm text-dispatch-muted">Loading…</p>
      </DashboardLayout>
    );
  }

  if (isError || !member) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="py-12 text-center">
          <p className="text-sm text-dispatch-muted">Member not found</p>
          <Link
            to="/dispatch-team"
            className="mt-2 inline-block text-sm font-semibold text-dispatch-primary"
          >
            Back to list
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="flex flex-col gap-4 rounded-2xl border border-dispatch-border bg-dispatch-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dispatch-primary-soft text-xl font-extrabold text-dispatch-primary">
              {displayName.charAt(0)}
            </div>
            <div>
              <p className="text-lg font-bold text-dispatch-text">{displayName}</p>
              <p className="text-sm text-dispatch-muted">{member.email}</p>
              {member.phone ? (
                <p className="text-xs text-dispatch-muted">{member.phone}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {member.assignedCity?.trim() ? (
              <span className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">
                {member.assignedCity}
              </span>
            ) : (
              <Link
                to={`/users/${member.id}`}
                className="rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-200"
              >
                Assign city
              </Link>
            )}
            <Link
              to={`/users/${member.id}`}
              className="rounded-xl border border-dispatch-border px-3 py-1.5 text-xs font-bold text-dispatch-muted hover:bg-dispatch-bg"
            >
              Edit user
            </Link>
          </div>
        </div>

        <p className="text-sm text-dispatch-muted">
          Same city-scoped view this member sees in the app. Open any schedule or route to review or
          edit.
        </p>

        <div className="flex flex-wrap gap-2">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                tab === key
                  ? "bg-dispatch-indigo text-white"
                  : "bg-dispatch-surface text-dispatch-muted ring-1 ring-dispatch-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "schedules" ? (
          <DispatchTeamSchedulesPanel city={member.assignedCity} />
        ) : (
          <DispatchTeamRoutesPanel city={member.assignedCity} />
        )}
      </div>
    </DashboardLayout>
  );
}
