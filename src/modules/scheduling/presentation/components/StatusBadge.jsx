export function StatusBadge({ label, className = "" }) {
  if (className.includes("ops-badge")) {
    return <span className={className}>{label}</span>;
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
