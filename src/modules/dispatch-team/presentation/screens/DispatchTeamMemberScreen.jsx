import { useEffect, useState } from "react";
import { getUserAssignedCities } from "@/shared/utils/assignedCities.js";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
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
  const [viewCity, setViewCity] = useState("");
  const { data: member, isLoading, isError } = useUserQuery(userId, true);

  const displayName = member
    ? member.displayName ?? resolveDisplayName(member.fullName, member.email)
    : "";

  const assignedCities = member ? getUserAssignedCities(member) : [];

  useEffect(() => {
    if (!assignedCities.length) {
      setViewCity("");
      return;
    }
    if (!viewCity || !assignedCities.some((city) => city.toLowerCase() === viewCity.toLowerCase())) {
      setViewCity(assignedCities[0]);
    }
  }, [assignedCities, viewCity]);

  const topBar = (
    <OpsTopBar showDate={false} />
  );

  if (isLoading) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          <div className="ops-skel h-32 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !member) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>Member not found</p>
            <Link
              to="/dispatch-team"
              className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold"
            >
              Back to list
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link to="/dispatch-team" className="ops-btn p-2.5" aria-label="Back to dispatch team">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                {displayName || "Team member"}
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                {assignedCities.length
                  ? `Cities: ${assignedCities.join(", ")}`
                  : "No cities assigned"}
              </p>
            </div>
          </div>
        </div>

        <div className="ops-panel ops-fade flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="ops-avatar flex h-14 w-14 shrink-0 items-center justify-center text-xl">
              {displayName.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{displayName}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{member.email}</p>
              {member.phone ? (
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>{member.phone}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {assignedCities.length > 1 ? (
              assignedCities.map((city) => (
                <span key={city} className="ops-citychip">
                  {city}
                </span>
              ))
            ) : assignedCities.length === 1 ? (
              <span className="ops-citychip">{assignedCities[0]}</span>
            ) : (
              <Link
                to={`/users/${member.id}`}
                className="ops-badge ops-badge--pending"
              >
                Assign city
              </Link>
            )}
            <Link
              to={`/users/${member.id}`}
              className="ops-btn px-4 py-2 text-sm font-semibold"
            >
              Edit user
            </Link>
          </div>
        </div>

        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Same city-scoped view this member sees in the app. Open any schedule or route to review or
          edit.
        </p>

        <div className="flex flex-wrap gap-2">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`ops-chip ${tab === key ? "ops-chip--active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {assignedCities.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {assignedCities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setViewCity(city)}
                className={`ops-chip ${viewCity === city ? "ops-chip--active" : ""}`}
              >
                {city}
              </button>
            ))}
          </div>
        ) : null}

        {tab === "schedules" ? (
          <DispatchTeamSchedulesPanel city={viewCity || assignedCities[0]} />
        ) : (
          <DispatchTeamRoutesPanel city={viewCity || assignedCities[0]} />
        )}
      </div>
    </DashboardLayout>
  );
}
