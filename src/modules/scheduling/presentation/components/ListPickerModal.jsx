export function ListPickerModal({
  open,
  title,
  items,
  selectedId,
  isLoading,
  emptyMessage,
  onSelect,
  onClose,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[70vh] w-full max-w-md overflow-hidden rounded-2xl bg-dispatch-surface shadow-2xl ring-1 ring-dispatch-border"
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
        <ul className="max-h-[50vh] overflow-auto p-2">
          {isLoading ? (
            <li className="px-3 py-6 text-center text-sm text-dispatch-muted">Loading…</li>
          ) : items.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-dispatch-muted">
              {emptyMessage}
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  className={`w-full rounded-xl px-3 py-3 text-left transition hover:bg-dispatch-bg ${
                    selectedId === item.id ? "bg-dispatch-primary-soft" : ""
                  }`}
                >
                  <p className="font-semibold text-dispatch-text">{item.title}</p>
                  {item.subtitle ? (
                    <p className="mt-0.5 text-xs text-dispatch-muted">{item.subtitle}</p>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
