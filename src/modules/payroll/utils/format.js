import { formatDisplayDate } from "@/shared/utils/time.js";
import { CONFIG } from "@/shared/utils/constants.js";

export function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPeriodRange(start, end) {
  if (!start || !end) return "—";
  if (start === end) return formatDisplayDate(start);
  return `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`;
}

export function payrollReceiptUrl(path) {
  if (!path) return null;
  const base = CONFIG.UPLOADS_BASE_URL || "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

const STATUS_META = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700" },
  pending_team_lead: { label: "With team lead", className: "bg-amber-100 text-amber-800" },
  team_lead_approved: { label: "Ready to pay", className: "bg-emerald-100 text-emerald-800" },
  team_lead_disputed: { label: "Disputed", className: "bg-red-100 text-red-800" },
  paid: { label: "Paid", className: "bg-dispatch-primary-soft text-dispatch-primary" },
};

export function statusMeta(status) {
  return STATUS_META[status] ?? { label: status ?? "—", className: "bg-slate-100 text-slate-600" };
}

export const ROUTE_CATEGORY_LABELS = {
  SMALL: "Small",
  MEDIUM: "Medium",
  FULL: "Full",
};
