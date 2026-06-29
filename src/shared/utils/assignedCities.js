import { UserRole } from "./constants.js";

export function getUserAssignedCities(user) {
  if (!user) return [];
  if (user.role === UserRole.DISPATCH_TEAM) {
    const fromArray = (user.assignedCities ?? [])
      .map((city) => city?.trim())
      .filter(Boolean);
    if (fromArray.length > 0) return fromArray;
    const legacy = user.assignedCity?.trim();
    return legacy ? [legacy] : [];
  }
  return [];
}

export function roleUsesMultipleCities(role) {
  return role === UserRole.DISPATCH_TEAM;
}
