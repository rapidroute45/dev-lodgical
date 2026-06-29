import { useCitiesQuery } from "@/modules/payroll/infrastructure/api/payroll.queries.js";
import { ListPickerModal } from "@/modules/scheduling/presentation/components/ListPickerModal.jsx";
import { useState } from "react";

export function CityFilterRow({ selectedCity, lockedCity, onSelect }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: cities = [], isLoading } = useCitiesQuery(true);

  const label = lockedCity ?? selectedCity ?? "All cities";
  const locked = Boolean(lockedCity);

  const cityList = Array.isArray(cities) ? cities : [];

  const items = [
    { id: "", title: "All cities", subtitle: "Show every city" },
    ...cityList.map((c) => ({
      id: c.name,
      title: c.name,
      subtitle: c.assignedDispatchTeam
        ? `Dispatch: ${c.assignedDispatchTeam.fullName?.trim() || c.assignedDispatchTeam.email}`
        : null,
    })),
  ];

  return (
    <>
      <button
        type="button"
        disabled={locked}
        onClick={() => !locked && setPickerOpen(true)}
        className={`ops-field flex w-full items-center justify-between text-sm ${
          locked ? "cursor-default opacity-80" : ""
        }`}
      >
        <span className="font-medium" style={{ color: "var(--text)" }}>{label}</span>
        {!locked ? (
          <svg className="h-4 w-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : null}
      </button>

      <ListPickerModal
        open={pickerOpen}
        title="Filter by city"
        items={items}
        selectedId={selectedCity ?? ""}
        isLoading={isLoading}
        emptyMessage="No cities found"
        onSelect={(id) => onSelect(id || null)}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
