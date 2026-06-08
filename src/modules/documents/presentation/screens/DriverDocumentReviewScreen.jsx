import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
import { mediaUrl } from "@/shared/utils/mediaUrl.js";
import {
  useDriverDocumentsDetailQuery,
  useRejectDocumentMutation,
  useVerifyDocumentMutation,
} from "@/modules/documents/infrastructure/api/documents.queries.js";

function statusLabel(status) {
  if (status === "verified") return { text: "Verified", className: "bg-emerald-100 text-emerald-800" };
  if (status === "pending") return { text: "Pending review", className: "bg-amber-100 text-amber-800" };
  if (status === "rejected") return { text: "Rejected", className: "bg-red-100 text-red-800" };
  if (status === "missing") return { text: "Missing", className: "bg-slate-100 text-slate-600" };
  return { text: status, className: "bg-dispatch-bg text-dispatch-muted" };
}

export function DriverDocumentReviewScreen() {
  const { driverId } = useParams();
  const { data, isLoading } = useDriverDocumentsDetailQuery(driverId, Boolean(driverId));
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
    <header className="sticky top-0 z-10 border-b border-dispatch-border bg-dispatch-surface/95 backdrop-blur-md">
      <div className={PAGE_HEADER_INNER}>
        <div className="flex items-center gap-3">
          <Link
            to="/driver-documents"
            className="text-sm font-semibold text-dispatch-primary hover:underline"
          >
            ← Driver documents
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dispatch-text">
              {data?.driver.displayName ?? "Driver"}
            </h1>
            {data?.driver.email ? (
              <p className="text-sm text-dispatch-muted">{data.driver.email}</p>
            ) : null}
          </div>
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

        {isLoading || !data ? (
          <p className="py-12 text-center text-sm text-dispatch-muted">Loading…</p>
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
                <div
                  key={label}
                  className="rounded-xl border border-dispatch-border bg-dispatch-surface px-3 py-2 text-center"
                >
                  <p className="text-lg font-extrabold text-dispatch-text">{count}</p>
                  <p className="text-xs text-dispatch-muted">{label}</p>
                </div>
              ))}
            </div>

            {data.vehicle?.plateNumber || data.vehicle?.vehiclePhotoUrl ? (
              <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-4">
                <p className="text-sm font-bold text-dispatch-text">Vehicle</p>
                {data.vehicle.plateNumber ? (
                  <p className="mt-1 text-sm text-dispatch-muted">
                    Plate: {data.vehicle.plateNumber}
                  </p>
                ) : null}
                {data.vehicle.vehiclePhotoUrl ? (
                  <a
                    href={mediaUrl(data.vehicle.vehiclePhotoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-dispatch-primary hover:underline"
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
                  <div
                    key={requirement.id}
                    className="rounded-2xl border border-dispatch-border bg-dispatch-surface p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-dispatch-text">{requirement.title}</p>
                        {requirement.description ? (
                          <p className="mt-1 text-sm text-dispatch-muted">{requirement.description}</p>
                        ) : null}
                      </div>
                      <span className={`rounded-lg px-2 py-1 text-xs font-bold ${badge.className}`}>
                        {badge.text}
                      </span>
                    </div>

                    {submission.referenceNumber ? (
                      <p className="mt-2 text-sm text-dispatch-muted">
                        Reference: {submission.referenceNumber}
                      </p>
                    ) : null}
                    {submission.expiryDate ? (
                      <p className="text-sm text-dispatch-muted">
                        Expires: {submission.expiryDate}
                      </p>
                    ) : null}
                    {submission.rejectionReason ? (
                      <p className="mt-1 text-sm text-dispatch-red">
                        Rejection: {submission.rejectionReason}
                      </p>
                    ) : null}

                    {fileUrl ? (
                      <div className="mt-3 space-y-2">
                        {isImage ? (
                          <img
                            src={fileUrl}
                            alt={requirement.title}
                            className="max-h-48 w-full rounded-xl border border-dispatch-border object-contain bg-dispatch-bg"
                          />
                        ) : null}
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-dispatch-primary bg-dispatch-primary-soft px-4 py-2 text-sm font-bold text-dispatch-primary hover:bg-dispatch-primary/10"
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
                          className="flex-1 rounded-xl border border-dispatch-red px-4 py-2 text-sm font-bold text-dispatch-red hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerify(requirement.id)}
                          disabled={busyId === requirement.id}
                          className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
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
