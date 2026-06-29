import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { todayIsoDate } from "@/shared/utils/time.js";
import { mediaUrl } from "@/shared/utils/mediaUrl.js";
import {
  useDriverDocumentsDetailQuery,
  useRejectDocumentMutation,
  useVerifyDocumentMutation,
} from "@/modules/documents/infrastructure/api/documents.queries.js";

function statusLabel(status) {
  if (status === "verified") return { text: "Verified", variant: "done" };
  if (status === "pending") return { text: "Pending review", variant: "pending" };
  if (status === "rejected") return { text: "Rejected", variant: "rose" };
  if (status === "missing") return { text: "Missing", variant: "muted" };
  return { text: status, variant: "muted" };
}

export function DriverDocumentReviewScreen() {
  const { driverId } = useParams();
  const { data, isLoading, refetch, isFetching } = useDriverDocumentsDetailQuery(driverId, Boolean(driverId));
  const verify = useVerifyDocumentMutation();
  const reject = useRejectDocumentMutation();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  async function handleVerify(requirementId) {
    setError(null);
    setBusyId(requirementId);
    try {
      await verify.mutateAsync({ driverId, requirementId });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Verify failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(requirementId) {
    const reason =
      window.prompt("Rejection reason (optional):", "Please re-upload a clear, valid document.") ??
      undefined;
    if (reason === null) return;
    setError(null);
    setBusyId(requirementId);
    try {
      await reject.mutateAsync({ driverId, requirementId, reason });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  const topBar = (
    <OpsTopBar showDate={false} onRefresh={refetch} refreshing={isFetching} />
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        <div className="ops-fade flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Link to="/driver-documents" className="ops-btn p-2.5" aria-label="Back to driver documents">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                {data?.driver.displayName ?? "Driver"}
              </h1>
              {data?.driver.email ? (
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>{data.driver.email}</p>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <div className="ops-banner ops-banner--error">{error}</div>
        ) : null}

        {isLoading || !data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="ops-skel h-16 rounded-xl" />
              ))}
            </div>
            <div className="ops-skel h-40 rounded-2xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Verified", data.stats.completed],
                ["Pending", data.stats.pending],
                ["Missing", data.stats.missing],
                ["Rejected", data.stats.rejected],
                ["Expiring", data.stats.expiringSoon],
                ["Expired", data.stats.expired],
              ].map(([label, count]) => (
                <div key={label} className="ops-card ops-fade px-3 py-2 text-center">
                  <p className="text-lg font-extrabold" style={{ color: "var(--text)" }}>{count}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>

            {data.vehicle?.plateNumber || data.vehicle?.vehiclePhotoUrl ? (
              <div className="ops-panel ops-fade p-4">
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Vehicle</p>
                {data.vehicle.plateNumber ? (
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    Plate: {data.vehicle.plateNumber}
                  </p>
                ) : null}
                {data.vehicle.vehiclePhotoUrl ? (
                  <a
                    href={mediaUrl(data.vehicle.vehiclePhotoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-semibold hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    View vehicle photo
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-4">
              {data.documents.map(({ requirement, submission }) => {
                const badge = statusLabel(submission.status);
                const fileUrl = mediaUrl(submission.fileUrl);
                const isImage = submission.fileMimeType?.startsWith("image/");
                const canReview = submission.status === "pending" && Boolean(submission.fileUrl);

                return (
                  <div key={requirement.id} className="ops-panel ops-fade p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold" style={{ color: "var(--text)" }}>{requirement.title}</p>
                        {requirement.description ? (
                          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{requirement.description}</p>
                        ) : null}
                      </div>
                      <span className={`ops-badge ops-badge--${badge.variant}`}>
                        {badge.text}
                      </span>
                    </div>

                    {submission.referenceNumber ? (
                      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                        Reference: {submission.referenceNumber}
                      </p>
                    ) : null}
                    {submission.expiryDate ? (
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        Expires: {submission.expiryDate}
                      </p>
                    ) : null}
                    {submission.rejectionReason ? (
                      <p className="mt-1 text-sm" style={{ color: "var(--rose)" }}>
                        Rejection: {submission.rejectionReason}
                      </p>
                    ) : null}

                    {fileUrl ? (
                      <div className="mt-3 space-y-2">
                        {isImage ? (
                          <img
                            src={fileUrl}
                            alt={requirement.title}
                            className="max-h-48 w-full rounded-xl object-contain"
                            style={{ border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}
                          />
                        ) : null}
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ops-btn inline-flex px-4 py-2 text-sm font-semibold"
                        >
                          Open document
                        </a>
                      </div>
                    ) : null}

                    {canReview ? (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleReject(requirement.id)}
                          disabled={busyId === requirement.id}
                          className="ops-btn flex-1 px-4 py-2 text-sm font-bold disabled:opacity-50"
                          style={{ color: "var(--rose)", borderColor: "color-mix(in srgb, var(--rose) 35%, transparent)" }}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerify(requirement.id)}
                          disabled={busyId === requirement.id}
                          className="ops-btn ops-btn--accent flex-1 px-4 py-2 text-sm font-bold disabled:opacity-50"
                        >
                          {busyId === requirement.id ? "Working…" : "Verify"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
