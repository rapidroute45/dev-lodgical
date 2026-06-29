import { useCallback, useState } from "react";

import {
  allocateStopsForRow,
  allocateStopsToRoutes,
  formatStopsAllocationMessage,
  groupRowsByDriverName,
} from "@/modules/scheduling/utils/allocateStopsByDriver.js";
import { parseNashReportCsv } from "@/modules/scheduling/utils/parseNashReportCsv.js";

/**
 * CSV upload + driver-name matching for route spreadsheet screens.
 */
export function useDriverStopsCsvUpload({ setRows, setDirtyIds, setMessage, setError }) {
  const [driverStopGroups, setDriverStopGroups] = useState([]);
  const [uploadingStopsCsv, setUploadingStopsCsv] = useState(false);

  const handleUploadStopsCsv = useCallback(
    (file) => {
      setUploadingStopsCsv(true);
      setError(null);
      setMessage(null);

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const { rows: csvRows, errors } = parseNashReportCsv(String(reader.result ?? ""));
          if (errors.length > 0) {
            setError(errors[0]);
            return;
          }

          const groups = groupRowsByDriverName(csvRows);
          setDriverStopGroups(groups);

          setRows((prev) => {
            const { rows: nextRows, matched, unmatchedDrivers } = allocateStopsToRoutes(
              prev,
              groups
            );

            setDirtyIds((dirty) => {
              const nextDirty = new Set(dirty);
              for (const item of matched) nextDirty.add(item.routeId);
              return nextDirty;
            });

            setMessage(formatStopsAllocationMessage(matched, unmatchedDrivers));
            return nextRows;
          });
        } finally {
          setUploadingStopsCsv(false);
        }
      };
      reader.onerror = () => {
        setError("Could not read the CSV file.");
        setUploadingStopsCsv(false);
      };
      reader.readAsText(file);
    },
    [setRows, setDirtyIds, setMessage, setError]
  );

  const applyDriverStopsToRow = useCallback(
    (row) => {
      if (driverStopGroups.length === 0 || !row.driverName?.trim()) return row;
      return allocateStopsForRow(row, driverStopGroups);
    },
    [driverStopGroups]
  );

  return {
    driverStopGroups,
    uploadingStopsCsv,
    handleUploadStopsCsv,
    applyDriverStopsToRow,
  };
}
