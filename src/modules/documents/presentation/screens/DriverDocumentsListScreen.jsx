import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { todayIsoDate } from "@/shared/utils/time.js";
import { useDriverDocumentsListQuery } from "@/modules/documents/infrastructure/api/documents.queries.js";

export function DriverDocumentsListScreen() {
  const { data: drivers = [], isLoading, refetch, isFetching } = useDriverDocumentsListQuery(true);

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              Driver documents
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Review uploads and compliance
            </p>
          </div>
          <Link to="/driver-documents/requirements" className="ops-btn px-4 py-2 text-sm font-semibold">
            Manage requirements
          </Link>
        </div>

        <Link
          to="/driver-documents/requirements"
          className="ops-card ops-card--hover ops-fade flex items-center justify-between p-4"
        >
          <div>
            <p className="font-bold" style={{ color: "var(--text)" }}>Manage required documents</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Add, edit, or remove document types</p>
          </div>
          <span style={{ color: "var(--text-muted)" }}>→</span>
        </Link>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-20 rounded-2xl" />
            ))}
          </div>
        ) : drivers.length === 0 ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <div className="ops-stat__icon mx-auto mb-4 flex h-14 w-14 items-center justify-center">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>No active drivers found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drivers.map((driver) => (
              <Link
                key={driver.id}
                to={`/driver-documents/${driver.id}`}
                className="ops-card ops-card--hover ops-fade flex items-center gap-4 p-4"
              >
                <div
                  className="ops-avatar flex h-11 w-11 shrink-0 items-center justify-center text-lg font-extrabold"
                  style={{ color: "var(--accent)" }}
                >
                  {driver.displayName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold" style={{ color: "var(--text)" }}>{driver.displayName}</p>
                  <p className="truncate text-sm" style={{ color: "var(--text-muted)" }}>{driver.email}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
                    {driver.stats.completed} verified · {driver.pendingReview} pending review
                  </p>
                </div>
                {driver.pendingReview > 0 ? (
                  <span className="ops-badge ops-badge--pending">
                    {driver.pendingReview}
                  </span>
                ) : null}
                <span style={{ color: "var(--text-muted)" }}>→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
