const OPTIONS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "assigned", label: "Awaiting" },
  { key: "active", label: "Active" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export function RouteStatusFilter({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`ops-chip ${value === opt.key ? "ops-chip--active" : ""}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export { OPTIONS as ROUTE_STATUS_FILTER_OPTIONS };
