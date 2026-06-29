import { createPortal } from "react-dom";
import { useOpsTheme } from "@/modules/manager-home/presentation/context/OpsThemeContext.jsx";

export function ModalSheet({ open, title, onClose, children, wide }) {
  const { theme } = useOpsTheme();
  if (!open) return null;

  return createPortal(
    <div
      className={`ops-shell z-[100] flex items-end justify-center sm:items-center sm:p-4${
        theme === "light" ? " ops-shell--light" : ""
      }`}
      style={{
        position: "fixed",
        inset: 0,
        minHeight: 0,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
      }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`max-h-[92vh] w-full overflow-hidden rounded-t-2xl sm:rounded-2xl ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
        style={{
          background: "var(--bg-card-solid)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="ops-btn px-3 py-1.5 text-sm font-semibold"
          >
            Close
          </button>
        </div>
        <div className="max-h-[calc(92vh-52px)] overflow-auto p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
