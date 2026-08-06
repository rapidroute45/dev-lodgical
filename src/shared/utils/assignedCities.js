import { UserRole } from "./constants.js";

/** Profile / admin display — OM may still have cities on record. */
export function getUserAssignedCities(user) {
  if (!user) return [];
  if (user.role === UserRole.DISPATCH_TEAM || user.role === UserRole.ONSITE_MANAGER) {
    const fromArray = (user.assignedCities ?? [])
      .map((city) => city?.trim())
      .filter(Boolean);
    if (fromArray.length > 0) return fromArray;
    const legacy = user.assignedCity?.trim();
    return legacy ? [legacy] : [];
  }
  return [];
}

/** Dispatch team and onsite manager may have multiple assigned cities. */
export function roleUsesMultipleCities(role) {
  return role === UserRole.DISPATCH_TEAM || role === UserRole.ONSITE_MANAGER;
}
