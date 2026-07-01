import { useOpsLocationScope } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";

export function ScopedEmptyHint({ show = true }) {
  const { isScoped, scopeLabel, resetScope, isGlobalScope, isLocked } = useOpsLocationScope();
  if (!show || !isScoped) return null;

  const allLabel = isGlobalScope ? "Show all locations" : "Show all my locations";

  return (
    <p className="ops-scoped-empty mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
      No data for {scopeLabel}.{" "}
      {!isLocked ? (
        <>
          <button type="button" onClick={resetScope} className="font-semibold underline">
            {allLabel}
          </button>{" "}
          or pick a different state or city in the header.
        </>
      ) : (
        <>Pick a different date or check your assigned city.</>
      )}
    </p>
  );
}
