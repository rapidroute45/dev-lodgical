import { nashReportRowsToDropoffs } from "./parseNashReportCsv.js";

export function normalizeDriverKey(name) {
  return String(name ?? "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

/** Match route driver labels to CSV names (handles truncated UI text). */
export function driverNamesMatch(a, b) {
  const left = normalizeDriverKey(a);
  const right = normalizeDriverKey(b);
  if (!left || !right) return false;
  if (left === right) return true;

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;
  if (shorter.length >= 8 && longer.startsWith(shorter)) return true;
  return longer.includes(shorter) && shorter.length >= 6;
}

export function groupRowsByDriverName(csvRows) {
  const groups = [];

  for (const row of csvRows) {
    const name = row.driverName?.trim();
    if (!name) continue;

    let group = groups.find((item) => driverNamesMatch(item.driverName, name));
    if (!group) {
      group = { driverName: name, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }

  return groups.map((group) => ({
    driverName: group.driverName,
    dropoffs: nashReportRowsToDropoffs(group.rows),
  }));
}

export function findDriverStopGroup(driverName, driverStopGroups) {
  if (!driverName?.trim()) return null;
  return driverStopGroups.find((group) => driverNamesMatch(group.driverName, driverName)) ?? null;
}

export function allocateStopsForRow(row, driverStopGroups, usedDriverKeys = null) {
  const group = findDriverStopGroup(row.driverName, driverStopGroups);
  if (!group || group.dropoffs.length === 0) return row;

  const groupKey = normalizeDriverKey(group.driverName);
  if (usedDriverKeys?.has(groupKey)) return row;

  usedDriverKeys?.add(groupKey);
  return {
    ...row,
    dropoffs: group.dropoffs,
    stopCount: group.dropoffs.length,
  };
}

/**
 * Match CSV stop groups to routes by driver name.
 * Each driver group is assigned to the first route with a matching driver.
 */
export function allocateStopsToRoutes(rows, driverStopGroups) {
  const usedDriverKeys = new Set();
  const matched = [];

  const updatedRows = rows.map((row) => {
    if (!row.driverName?.trim()) return row;

    const group = findDriverStopGroup(row.driverName, driverStopGroups);
    if (!group || group.dropoffs.length === 0) return row;

    const groupKey = normalizeDriverKey(group.driverName);
    if (usedDriverKeys.has(groupKey)) return row;

    usedDriverKeys.add(groupKey);
    matched.push({
      routeId: row.id,
      routeName: row.routeName,
      driverName: row.driverName,
      stopCount: group.dropoffs.length,
    });

    return {
      ...row,
      dropoffs: group.dropoffs,
      stopCount: group.dropoffs.length,
    };
  });

  const unmatchedDrivers = driverStopGroups
    .filter((group) => !usedDriverKeys.has(normalizeDriverKey(group.driverName)))
    .map((group) => ({
      driverName: group.driverName,
      stopCount: group.dropoffs.length,
    }));

  return { rows: updatedRows, matched, unmatchedDrivers };
}

export function formatStopsAllocationMessage(matched, unmatchedDrivers) {
  if (matched.length === 0 && unmatchedDrivers.length === 0) {
    return "No routes with assigned drivers matched the CSV.";
  }

  const parts = [];
  if (matched.length > 0) {
    const stopTotal = matched.reduce((sum, item) => sum + item.stopCount, 0);
    parts.push(
      `Allocated ${stopTotal} stop${stopTotal === 1 ? "" : "s"} across ${matched.length} route${matched.length === 1 ? "" : "s"}.`
    );
  }
  if (unmatchedDrivers.length > 0) {
    const pending = unmatchedDrivers
      .map((item) => `${item.driverName} (${item.stopCount})`)
      .join(", ");
    parts.push(`No matching route for: ${pending}.`);
  }
  return parts.join(" ");
}
