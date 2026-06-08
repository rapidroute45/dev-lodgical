export function ModalSheet({ open, title, onClose, children, wide }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`max-h-[92vh] w-full overflow-hidden rounded-t-2xl bg-dispatch-surface shadow-2xl ring-1 ring-dispatch-border sm:rounded-2xl ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-dispatch-border px-4 py-3">
          <h3 className="text-base font-bold text-dispatch-text">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-medium text-dispatch-muted hover:bg-dispatch-bg"
          >
            Close
          </button>
        </div>
        <div className="max-h-[calc(92vh-52px)] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}
