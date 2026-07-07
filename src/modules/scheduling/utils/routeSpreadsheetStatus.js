/** UI status keys for the route spreadsheet STATUS column. */
export const SPREADSHEET_STATUS = {
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  VERIFIED: "verified",
  NOT_VERIFIED: "not_verified",
};

const SPREADSHEET_STATUS_LABELS = {
  [SPREADSHEET_STATUS.IN_PROGRESS]: "In Progress",
  [SPREADSHEET_STATUS.COMPLETED]: "Completed",
  [SPREADSHEET_STATUS.VERIFIED]: "Verified",
  [SPREADSHEET_STATUS.NOT_VERIFIED]: "Not Verified",
};

const LIVE_ROUTE_STATUSES = new Set(["active", "in_progress"]);

function isPersistedRoute(row) {
  return !row?.isNew && !String(row?.id ?? "").startsWith("new-");
}

export function getSpreadsheetStatusKey(row) {
  const status = row?.status ?? "pending";
  const verification = row?.deliveryVerification ?? null;

  if (status === "not_verified" || verification === "rejected") {
    return SPREADSHEET_STATUS.NOT_VERIFIED;
  }
  if (status === "completed" && verification === "verified") {
    return SPREADSHEET_STATUS.VERIFIED;
  }
  if (status === "completed") {
    return SPREADSHEET_STATUS.COMPLETED;
  }
  if (LIVE_ROUTE_STATUSES.has(status)) {
    return SPREADSHEET_STATUS.IN_PROGRESS;
  }
  return status;
}

export function formatSpreadsheetStatus(row) {
  const key = getSpreadsheetStatusKey(row);
  return SPREADSHEET_STATUS_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function canEditSpreadsheetStatus(row) {
  if (!isPersistedRoute(row) || !row?.driverId) return false;
  const key = getSpreadsheetStatusKey(row);
  return (
    key === SPREADSHEET_STATUS.IN_PROGRESS ||
    key === SPREADSHEET_STATUS.COMPLETED ||
    key === SPREADSHEET_STATUS.NOT_VERIFIED
  );
}

/** All selectable options for the STATUS dropdown (includes current value). */
export function getSpreadsheetStatusOptions(row) {
  const current = getSpreadsheetStatusKey(row);
  const options = [{ value: current, label: SPREADSHEET_STATUS_LABELS[current] ?? formatSpreadsheetStatus(row) }];

  if (!canEditSpreadsheetStatus(row)) return options;

  if (current === SPREADSHEET_STATUS.IN_PROGRESS) {
    options.push(
      { value: SPREADSHEET_STATUS.COMPLETED, label: SPREADSHEET_STATUS_LABELS[SPREADSHEET_STATUS.COMPLETED] },
      { value: SPREADSHEET_STATUS.VERIFIED, label: SPREADSHEET_STATUS_LABELS[SPREADSHEET_STATUS.VERIFIED] },
      { value: SPREADSHEET_STATUS.NOT_VERIFIED, label: SPREADSHEET_STATUS_LABELS[SPREADSHEET_STATUS.NOT_VERIFIED] }
    );
    return options;
  }

  if (current === SPREADSHEET_STATUS.COMPLETED) {
    options.push(
      { value: SPREADSHEET_STATUS.VERIFIED, label: SPREADSHEET_STATUS_LABELS[SPREADSHEET_STATUS.VERIFIED] },
      { value: SPREADSHEET_STATUS.NOT_VERIFIED, label: SPREADSHEET_STATUS_LABELS[SPREADSHEET_STATUS.NOT_VERIFIED] }
    );
    return options;
  }

  if (current === SPREADSHEET_STATUS.NOT_VERIFIED) {
    options.push({
      value: SPREADSHEET_STATUS.VERIFIED,
      label: SPREADSHEET_STATUS_LABELS[SPREADSHEET_STATUS.VERIFIED],
    });
    return options;
  }

  return options;
}

export function isLiveSpreadsheetRoute(row) {
  return LIVE_ROUTE_STATUSES.has(row?.status ?? "");
}
