export function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  loading,
  comingSoon,
  onClick,
}) {
  const inner = (
    <div
      className={`relative overflow-hidden rounded-2xl border border-dispatch-border/80 bg-dispatch-surface p-5 shadow-sm shadow-dispatch-border/50 transition ${
        onClick && !comingSoon ? "hover:border-brand-200 hover:shadow-md" : ""
      } ${comingSoon ? "opacity-90" : ""}`}
    >
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      {loading ? (
        <div className="h-8 w-16 animate-pulse rounded-lg bg-dispatch-bg" />
      ) : (
        <p
          className={`text-3xl font-extrabold tracking-tight ${
            comingSoon ? "text-dispatch-light" : "text-dispatch-text"
          }`}
        >
          {value}
        </p>
      )}
      <p
        className={`mt-1 text-sm font-medium ${
          comingSoon ? "text-dispatch-light" : "text-dispatch-muted"
        }`}
      >
        {label}
      </p>
      {comingSoon ? (
        <div className="absolute inset-0 flex items-center justify-center bg-dispatch-surface/75 backdrop-blur-[1px]">
          <span className="rounded-lg border border-dispatch-border bg-dispatch-surface px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-dispatch-primary">
            Coming soon
          </span>
        </div>
      ) : null}
    </div>
  );

  if (onClick && !comingSoon) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {inner}
      </button>
    );
  }
  return inner;
}
