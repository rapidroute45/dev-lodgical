import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/modules/manager-home/presentation/layout/DashboardLayout.jsx";
import { PAGE_CONTENT, PAGE_HEADER_INNER } from "@/shared/layout/pageLayout.js";
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

export function DocumentRequirementsScreen() {
  const { data: requirements = [], isLoading } = useDocumentRequirementsQuery(true);
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
            <h1 className="text-xl font-bold text-dispatch-text">Required documents</h1>
            <p className="text-sm text-dispatch-muted">
              {requirements.length} active requirement{requirements.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-dispatch-indigo px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-dispatch-primary/25 hover:bg-dispatch-indigo-pressed"
        >
          + Add requirement
        </button>
      </div>
    </header>
  );

  return (
    <DashboardLayout topBar={topBar}>
      <div className={PAGE_CONTENT}>
        {error && !modalOpen ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-dispatch-red">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <p className="py-12 text-center text-sm text-dispatch-muted">Loading…</p>
        ) : requirements.length === 0 ? (
          <div className="rounded-2xl border border-dispatch-border bg-dispatch-surface px-6 py-12 text-center">
            <p className="font-semibold text-dispatch-text">No requirements yet</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-3 text-sm font-bold text-dispatch-primary hover:underline"
            >
              Add the first requirement
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requirements.map((req) => (
              <div
                key={req.id}
                className="flex items-start gap-3 rounded-2xl border border-dispatch-border bg-dispatch-surface p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-dispatch-text">{req.title}</p>
                  {req.description ? (
                    <p className="mt-1 text-sm text-dispatch-muted">{req.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-dispatch-light">
                    {req.requiresExpiry ? "Expiry · " : ""}
                    {req.requiresReferenceNumber ? "Reference #" : "File only"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(req)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-dispatch-primary hover:bg-dispatch-primary-soft"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(req.id, req.title)}
                  disabled={deletingId === req.id}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-dispatch-red hover:bg-red-50 disabled:opacity-50"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
        >
          <form
            className="w-full max-w-md rounded-2xl bg-dispatch-surface p-5 shadow-2xl ring-1 ring-dispatch-border"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <h3 className="text-lg font-bold text-dispatch-text">
              {editingId ? "Edit requirement" : "Add requirement"}
            </h3>
            {error ? (
              <p className="mt-2 text-sm text-dispatch-red">{error}</p>
            ) : null}
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-dispatch-primary/30"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
              <textarea
                className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-dispatch-primary/30"
                placeholder="Description (optional)"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-dispatch-primary/30"
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-dispatch-text">
                <input
                  type="checkbox"
                  checked={form.requiresExpiry}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, requiresExpiry: e.target.checked }))
                  }
                />
                Requires expiry date
              </label>
              <label className="flex items-center gap-2 text-sm text-dispatch-text">
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
                  className="w-full rounded-xl border border-dispatch-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-dispatch-primary/30"
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
                className="flex-1 rounded-xl border border-dispatch-border px-3 py-2.5 text-sm font-semibold text-dispatch-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 rounded-xl bg-dispatch-indigo px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
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
