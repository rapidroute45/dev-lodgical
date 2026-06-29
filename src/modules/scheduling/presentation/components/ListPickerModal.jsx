import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useOpsTheme } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";

export function ListPickerModal({
  open,
  title,
  items,
  selectedId,
  isLoading,
  emptyMessage,
  onSelect,
  onClose,
  searchPlaceholder = "Search…",
}) {
  const { theme } = useOpsTheme();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  if (!open) return null;

  return createPortal(
    <div
      className={`ops-shell ops-picker-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4${
        theme === "light" ? " ops-shell--light" : ""
      }`}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="ops-picker" onClick={(e) => e.stopPropagation()}>
        <div className="ops-picker__head">
          <div>
            <h3 className="ops-picker__title">{title}</h3>
            {!isLoading && items.length > 0 ? (
              <p className="ops-picker__sub">{items.length} option{items.length === 1 ? "" : "s"}</p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="ops-picker__close" aria-label="Close">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isLoading && items.length > 3 ? (
          <div className="ops-picker__search-wrap">
            <div className="ops-picker__search">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
              />
            </div>
          </div>
        ) : null}

        <div className="ops-picker__body">
          <ul className="ops-picker__list">
          {isLoading ? (
            <li className="ops-picker__empty">Loading…</li>
          ) : filtered.length === 0 ? (
            <li className="ops-picker__empty">
              {search.trim() ? "No matches found." : emptyMessage}
            </li>
          ) : (
            filtered.map((item) => {
              const selected = selectedId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                    className={`ops-picker__item${selected ? " ops-picker__item--selected" : ""}`}
                  >
                    <span className="ops-picker__icon">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate font-semibold">{item.title}</span>
                      {item.subtitle ? (
                        <span className="mt-0.5 block truncate text-xs opacity-70">{item.subtitle}</span>
                      ) : null}
                    </span>
                    {selected ? (
                      <svg className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}
