const OPTIONS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export function ScheduleStatusFilter({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
            value === opt.key
              ? "bg-dispatch-indigo text-white shadow-md shadow-dispatch-primary/20"
              : "bg-dispatch-surface text-dispatch-muted ring-1 ring-dispatch-border hover:bg-dispatch-bg"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
