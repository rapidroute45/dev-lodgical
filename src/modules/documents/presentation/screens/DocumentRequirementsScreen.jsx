import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { OpsTopBar } from "@/modules/manager-home/presentation/components/OpsTopBar.jsx";
import { PAGE_CONTENT } from "@/shared/layout/pageLayout.js";
import { todayIsoDate } from "@/shared/utils/time.js";
import {
  useCreateRequirementMutation,
  useDeleteRequirementMutation,
  useDocumentRequirementsQuery,
  useUpdateRequirementMutation,
} from "@/modules/documents/infrastructure/api/documents.queries.js";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "general",
  requiresExpiry: false,
  requiresReferenceNumber: false,
  referenceLabel: "",
};

const FIELD_STYLE = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid var(--border)",
  color: "var(--text)",
};

export function DocumentRequirementsScreen() {
  const { data: requirements = [], isLoading, refetch, isFetching } = useDocumentRequirementsQuery(true);
  const createMutation = useCreateRequirementMutation();
  const updateMutation = useUpdateRequirementMutation();
  const deleteMutation = useDeleteRequirementMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(req) {
    setEditingId(req.id);
    setForm({
      title: req.title ?? "",
      description: req.description ?? "",
      category: req.category ?? "general",
      requiresExpiry: Boolean(req.requiresExpiry),
      requiresReferenceNumber: Boolean(req.requiresReferenceNumber),
      referenceLabel: req.referenceLabel ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    const title = form.title.trim();
    if (title.length < 2) {
      setError("Title is required.");
      return;
    }

    const body = {
      title,
      description: form.description.trim() || undefined,
      category: form.category.trim() || "general",
      requiresExpiry: form.requiresExpiry,
      requiresReferenceNumber: form.requiresReferenceNumber,
      referenceLabel: form.requiresReferenceNumber
        ? form.referenceLabel.trim() || "Reference number"
        : undefined,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ requirementId: editingId, ...body });
        setMessage("Requirement updated.");
      } else {
        await createMutation.mutateAsync(body);
        setMessage("Requirement created.");
      }
      setModalOpen(false);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Save failed");
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Remove "${title}"? Drivers will no longer need to upload it.`)) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteMutation.mutateAsync(id);
      setMessage("Requirement removed.");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Delete failed");
    } finally {
      setDeletingId(null);
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
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                Required documents
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                {requirements.length} active requirement{requirements.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="ops-btn ops-btn--accent px-5 py-2.5 font-bold"
          >
            + Add requirement
          </button>
        </div>

        {error && !modalOpen ? (
          <div className="ops-banner ops-banner--error">{error}</div>
        ) : null}
        {message ? (
          <div className="ops-banner ops-banner--success">{message}</div>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ops-skel h-20 rounded-2xl" />
            ))}
          </div>
        ) : requirements.length === 0 ? (
          <div className="ops-panel ops-fade px-8 py-14 text-center">
            <div className="ops-stat__icon mx-auto mb-4 flex h-14 w-14 items-center justify-center">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>No requirements yet</p>
            <button
              type="button"
              onClick={openCreate}
              className="ops-btn ops-btn--accent mt-6 inline-flex px-6 py-2.5 font-bold"
            >
              Add the first requirement
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requirements.map((req) => (
              <div key={req.id} className="ops-card ops-fade flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold" style={{ color: "var(--text)" }}>{req.title}</p>
                  {req.description ? (
                    <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{req.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
                    {req.requiresExpiry ? "Expiry · " : ""}
                    {req.requiresReferenceNumber ? "Reference #" : "File only"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(req)}
                  className="ops-btn px-3 py-1.5 text-xs font-semibold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(req.id, req.title)}
                  disabled={deletingId === req.id}
                  className="ops-btn px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                  style={{ color: "var(--rose)", borderColor: "color-mix(in srgb, var(--rose) 35%, transparent)" }}
                >
                  {deletingId === req.id ? "…" : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
        >
          <form
            className="ops-panel w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              {editingId ? "Edit requirement" : "Add requirement"}
            </h3>
            {error ? (
              <p className="mt-2 text-sm" style={{ color: "var(--rose)" }}>{error}</p>
            ) : null}
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={FIELD_STYLE}
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
              <textarea
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={FIELD_STYLE}
                placeholder="Description (optional)"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <input
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={FIELD_STYLE}
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
                <input
                  type="checkbox"
                  checked={form.requiresExpiry}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, requiresExpiry: e.target.checked }))
                  }
                />
                Requires expiry date
              </label>
              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
                <input
                  type="checkbox"
                  checked={form.requiresReferenceNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, requiresReferenceNumber: e.target.checked }))
                  }
                />
                Requires reference number
              </label>
              {form.requiresReferenceNumber ? (
                <input
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={FIELD_STYLE}
                  placeholder="Reference label"
                  value={form.referenceLabel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, referenceLabel: e.target.value }))
                  }
                />
              ) : null}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="ops-btn flex-1 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="ops-btn ops-btn--accent flex-1 px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
