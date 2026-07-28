import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { DriverPerformanceCard } from "@/modules/manager-home/presentation/components/DriverPerformanceCard.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { resolveDisplayName } from "@/shared/utils/displayName.js";
import { useUserQuery } from "@/modules/users/infrastructure/api/users.queries.js";
import { useTeamQuery } from "@/modules/scheduling/infrastructure/api/scheduling.queries.js";
import { useDriverPerformanceQuery } from "@/modules/manager-home/infrastructure/api/dashboard.queries.js";
import { useCreateConversationMutation } from "@/modules/chat/infrastructure/api/chat.queries.js";

export function DriverProfileScreen() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from ?? "/available-drivers";

  const { data: driver, isLoading, isError } = useUserQuery(driverId, true);
  const { data: team } = useTeamQuery(driver?.teamId, Boolean(driver?.teamId));
  const { data: performanceData, isLoading: performanceLoading } = useDriverPerformanceQuery(7, !!driverId);
  const createChat = useCreateConversationMutation();

  const driverPerformance = useMemo(() => {
    if (!driverId) return null;
    return (performanceData?.drivers ?? []).find((entry) => entry.userId === driverId) ?? null;
  }, [performanceData?.drivers, driverId]);

  const displayName = driver
    ? driver.displayName ?? resolveDisplayName(driver.fullName, driver.email)
    : "";

  const teamName = team?.name ?? driverPerformance?.teamName ?? null;

  async function handleChat() {
    if (!driverId || createChat.isPending) return;
    const conv = await createChat.mutateAsync(driverId);
    if (conv?.id) navigate(`/chat/${conv.id}`);
  }

  const topBar = <OpsTopBar showDate={false} />;

  if (isLoading) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          <div className="ops-skel h-32 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !driver) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className={PAGE_CONTENT}>
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
              Driver not found
            </p>
            <Link
              to={backTo}
              className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold"
            >
              Back
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
            <Link to={backTo} className="ops-btn p-2.5" aria-label="Back">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                {displayName || "Driver"}
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                {teamName ? `Team: ${teamName}` : "No team assigned"}
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
              <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
                {displayName}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {driver.email}
              </p>
              {driver.phone ? (
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {driver.phone}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-2 m-2">
            {teamName ? <span className="ops-teamtag">{teamName}</span> : null}
            <button
              type="button"
              disabled={createChat.isPending}
              onClick={() => void handleChat()}
              className="ops-btn ops-btn--accent inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {createChat.isPending ? "Opening chat…" : "Chat"}
            </button>
            <Link to={`/driver-documents/${driver.id}`} className="ops-btn px-4 py-2 text-sm font-semibold">
              Documents
            </Link>
          </div>
        </div>

        <DriverPerformanceCard
          performance={driverPerformance}
          loading={performanceLoading}
          days={performanceData?.window?.days ?? 7}
        />
      </div>
    </DashboardLayout>
  );
}
