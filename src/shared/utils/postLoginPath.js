import { MOBILE_ONLY_ROLES, OPS_ROLES, UserRole } from "./constants.js";

/** Where to send the user right after login. */
export function postLoginPath(role) {
  if (!role) return "/dashboard";
  if (MOBILE_ONLY_ROLES.includes(role)) return "/mobile-only";
  if (role === UserRole.DISPATCH_TEAM) return "/dashboard";
  if (role === UserRole.ACCOUNTANT) return "/payroll";
  return "/dashboard";
}

export function canAccessWebOps(role) {
  return role != null && OPS_ROLES.includes(role);
}
