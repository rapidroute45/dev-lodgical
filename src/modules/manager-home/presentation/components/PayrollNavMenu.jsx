import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  MenuPanel,
  MenuRow,
  MenuTrigger,
  useMenuDismiss,
} from "@/modules/manager-home/presentation/components/opsNavShared.jsx";

const PAYROLL_ICON = (
  <svg className="h-4 w-4" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const OPTIONS = [
  {
    key: "team",
    label: "Team payroll",
    hint: "Bills, route rates, and team payouts",
    path: "/payroll",
  },
  {
    key: "store",
    label: "Store payroll",
    hint: "Store-level payroll and billing",
    path: "/payroll/store-payroll",
  },
];

export function PayrollNavMenu({ open, onToggle, onClose }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const panelRef = useRef(null);

  useMenuDismiss(open, close, rootRef, panelRef);

  function close() {
    onClose();
  }

  function go(path) {
    navigate(path);
    close();
  }

  return (
    <div className="ops-menu" ref={rootRef}>
      <MenuTrigger label="Payroll" icon={PAYROLL_ICON} open={open} onToggle={onToggle} />

      <MenuPanel
        ref={panelRef}
        anchorRef={rootRef}
        open={open}
        maxWidth={380}
        className="ops-menu__panel--single"
      >
          <div className="ops-menu__pane ops-menu__pane--full ops-menu__pane--compact">
            <div className="ops-menu__list">
              {OPTIONS.map((opt) => (
                <MenuRow key={opt.key} onClick={() => go(opt.path)}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{opt.label}</span>
                    <span className="block truncate text-xs" style={{ color: "var(--text-dim)" }}>
                      {opt.hint}
                    </span>
                  </span>
                  <ChevronRight />
                </MenuRow>
              ))}
            </div>
          </div>
        </MenuPanel>
    </div>
  );
}
