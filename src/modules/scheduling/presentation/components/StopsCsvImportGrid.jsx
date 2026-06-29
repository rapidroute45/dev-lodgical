import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./stopsCsvImportGrid.css";

ModuleRegistry.registerModules([AllCommunityModule]);

const COLUMN_DEFS = [
  {
    field: "stopNumber",
    headerName: "#",
    width: 72,
    pinned: "left",
    valueFormatter: ({ value }) => value || "—",
  },
  {
    field: "pickupBusinessName",
    headerName: "Pickup business",
    minWidth: 200,
    flex: 1,
  },
  {
    field: "dropoffCustomerName",
    headerName: "Customer",
    minWidth: 160,
    flex: 0.9,
  },
  {
    field: "dropoffAddress",
    headerName: "Dropoff address",
    minWidth: 240,
    flex: 1.2,
  },
  {
    field: "dropoffEndTime",
    headerName: "Dropoff end time",
    width: 168,
  },
  {
    field: "pickupAddress",
    headerName: "Pickup address",
    minWidth: 240,
    flex: 1.2,
  },
  {
    field: "driverName",
    headerName: "Driver",
    minWidth: 160,
    flex: 0.8,
  },
];

const DEFAULT_COL_DEF = {
  sortable: true,
  filter: true,
  resizable: true,
  suppressHeaderMenuButton: true,
};

export function StopsCsvImportGrid({ rows, fileName }) {
  const rowData = useMemo(() => rows, [rows]);

  if (!rows.length) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-3 py-3">
        <p className="text-sm font-semibold text-slate-700">Imported CSV preview</p>
        {fileName ? (
          <span className="truncate text-xs text-slate-500">{fileName}</span>
        ) : null}
        <span className="text-sm text-slate-500 sm:ml-auto">{rows.length} stops</span>
      </div>

      <div className="stops-csv-grid-wrap px-2 py-3 sm:px-3">
        <div className="ag-theme-quartz stops-csv-grid">
          <AgGridReact
            theme="legacy"
            rowData={rowData}
            columnDefs={COLUMN_DEFS}
            defaultColDef={DEFAULT_COL_DEF}
            getRowId={({ data }) => data.id}
            suppressCellFocus
            animateRows={false}
          />
        </div>
      </div>
    </div>
  );
}
