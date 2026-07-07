const PersonIcon = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export function ScheduleAttribution({
  dispatchTeam,
  createdByName,
  showDispatchTeam = false,
}) {
  const showCreator = Boolean(createdByName?.trim());

  if (!showDispatchTeam && !showCreator) return null;

  return (
    <div className="mt-2 space-y-1">
      {showDispatchTeam && dispatchTeam ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--accent)" }}>
          <PersonIcon />
          <span className="truncate">Dispatch team: {dispatchTeam.displayName}</span>
        </p>
      ) : showDispatchTeam ? (
        <p className="text-xs italic" style={{ color: "var(--text-dim)" }}>
          No dispatch team assigned for this city
        </p>
      ) : null}
      {showCreator ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          <PersonIcon />
          <span className="truncate">Created by: {createdByName}</span>
        </p>
      ) : null}
    </div>
  );
}
