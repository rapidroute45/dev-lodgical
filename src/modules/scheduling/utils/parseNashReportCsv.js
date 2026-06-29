/** Columns extracted from Nash / delivery report CSV exports. */
export const NASH_REPORT_CSV_FIELDS = [
  "pickupBusinessName",
  "dropoffAddress",
  "dropoffEndTime",
  "pickupAddress",
  "driverName",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || (char === "\r" && text[i + 1] === "\n")) {
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      if (char === "\r") i += 1;
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);

  const headers = (rows[0] ?? []).map((header) => header.trim());
  return { headers, rows: rows.slice(1) };
}

function cellValue(row, index) {
  if (index < 0) return "";
  return String(row[index] ?? "").trim();
}

/**
 * Parse a delivery report CSV and extract stop rows for the stops import grid.
 * @param {string} text
 */
export function parseNashReportCsv(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { rows: [], errors: ["CSV file is empty."] };
  }

  const { headers, rows: rawRows } = parseCsv(trimmed);
  if (!headers.length) {
    return { rows: [], errors: ["CSV has no header row."] };
  }

  const missing = NASH_REPORT_CSV_FIELDS.filter((field) => !headers.includes(field));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [`Missing required columns: ${missing.join(", ")}`],
    };
  }

  const indices = Object.fromEntries(
    [...NASH_REPORT_CSV_FIELDS, "stopNumber", "dropoffCustomerName"].map((field) => [
      field,
      headers.indexOf(field),
    ])
  );

  const rows = rawRows
    .map((row, index) => ({
      id: `csv-row-${index}`,
      stopNumber: cellValue(row, indices.stopNumber),
      pickupBusinessName: cellValue(row, indices.pickupBusinessName),
      pickupAddress: cellValue(row, indices.pickupAddress),
      dropoffAddress: cellValue(row, indices.dropoffAddress),
      dropoffEndTime: cellValue(row, indices.dropoffEndTime),
      driverName: cellValue(row, indices.driverName),
      dropoffCustomerName: cellValue(row, indices.dropoffCustomerName),
    }))
    .filter((row) => row.dropoffAddress);

  if (rows.length === 0) {
    return { rows: [], errors: ["No rows with a dropoff address were found."] };
  }

  return { rows, errors: [] };
}

/** Map parsed CSV rows into route dropoff draft objects (customer name + address). */
export function nashReportRowsToDropoffs(rows) {
  const stamp = Date.now();
  return rows
    .map((row, index) => {
      const name =
        row.dropoffCustomerName?.trim() ||
        `Stop ${row.stopNumber?.trim() || index + 1}`;
      const address = row.dropoffAddress.trim();
      if (!name || !address) return null;
      return {
        localId: `stop-${stamp}-${index}-${Math.random()}`,
        name,
        address,
        accessCode: "",
      };
    })
    .filter(Boolean);
}
