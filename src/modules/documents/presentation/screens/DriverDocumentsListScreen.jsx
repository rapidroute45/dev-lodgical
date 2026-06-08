import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import { useDriverDocumentsListQuery } from "@/modules/documents/infrastructure/api/documents.queries.js";

export function DriverDocumentsListScreen() {
  const { data: drivers = [], isLoading } = useDriverDocumentsListQuery(true);

  const topBar = (
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div>
          <h1 className="text-xl font-bold text-dispatch-text">Driver documents</h1>
          <p className="text-sm text-dispatch-muted">Review uploads and compliance</p>
        </div>
        <Link
          to="/driver-documents/requirements"
          className="inline-flex items-center gap-2 rounded-xl border border-dispatch-border px-4 py-2.5 text-sm font-bold text-dispatch-text hover:bg-dispatch-bg"
        >
          Manage requirements
        </Link>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <Link
          to="/driver-documents/requirements"
          className="flex items-center justify-between rounded-2xl border border-dispatch-border bg-dispatch-surface p-4 shadow-sm transition hover:border-dispatch-primary/40"
        >
          <div>
            <p className="font-bold text-dispatch-text">Manage required documents</p>
            <p className="text-sm text-dispatch-muted">Add, edit, or remove document types</p>
          </div>
          <span className="text-dispatch-muted">→</span>
        </Link>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-dispatch-muted">Loading drivers…</p>
        ) : drivers.length === 0 ? (
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface px-6 py-12 text-center">
            <p className="font-semibold text-dispatch-text">No active drivers found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drivers.map((driver) => (
              <Link
                key={driver.id}
                to={`/driver-documents/${driver.id}`}
                className="flex items-center gap-4 rounded-2xl border border-dispatch-border bg-dispatch-surface p-4 shadow-sm transition hover:border-dispatch-primary/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-dispatch-primary-soft text-lg font-extrabold text-dispatch-primary">
                  {driver.displayName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-dispatch-text">{driver.displayName}</p>
                  <p className="truncate text-sm text-dispatch-muted">{driver.email}</p>
                  <p className="mt-1 text-xs text-dispatch-light">
                    {driver.stats.completed} verified · {driver.pendingReview} pending review
                  </p>
                </div>
                {driver.pendingReview > 0 ? (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-2 text-xs font-extrabold text-white">
                    {driver.pendingReview}
                  </span>
                ) : null}
                <span className="text-dispatch-muted">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
