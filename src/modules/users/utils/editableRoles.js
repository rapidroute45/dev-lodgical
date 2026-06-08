import { ASSIGNABLE_ROLES, UserRole } from "@/shared/utils/constants.js";

const ADMIN_ONLY_ROLES = [UserRole.ADMIN, UserRole.DISPATCH_MANAGER];

export function getEditableRoles(actorRole) {
  if (actorRole === UserRole.ADMIN) {
    return [...ADMIN_ONLY_ROLES, ...ASSIGNABLE_ROLES];
  }
  if (actorRole === UserRole.DISPATCH_MANAGER) {
    return [...ASSIGNABLE_ROLES];
  }
  return [];
}

export function formatRoleLabel(role) {
  return role
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatStatusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
