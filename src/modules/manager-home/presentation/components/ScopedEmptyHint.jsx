import { useOpsLocationScope } from "@/modules/manager-home/application/OpsLocationScopeProvider.jsx";

export function ScopedEmptyHint({ show = true }) {
  const { isScoped, scopeLabel, resetScope } = useOpsLocationScope();
  if (!show || !isScoped) return null;

  return (
    <p className="ops-scoped-empty mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
      No data for {scopeLabel}.{" "}
      <button type="button" onClick={resetScope} className="font-semibold underline">
        Show all locations
      </button>{" "}
      or pick a different state or city in the header.
    </p>
  );
}
