/** API origin — use Vite proxy in dev (`/api/v1`) or full URL in production. */
const RAILWAY_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "https://dev-co-production.up.railway.app";

export const CONFIG = {
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "/api/v1" : `${RAILWAY_ORIGIN}/api/v1`),
  /** Static uploads are served at /uploads on the API host (not under /api/v1). */
  UPLOADS_BASE_URL:
    import.meta.env.VITE_UPLOADS_BASE_URL ||
    (import.meta.env.DEV ? "" : RAILWAY_ORIGIN),
  TOKEN_STORAGE_KEY: "dispatch_session_token",
};

export const UserRole = {
  ADMIN: "admin",
  DISPATCH_MANAGER: "dispatch manager",
  DISPATCH_TEAM: "dispatch team",
  TEAM_LEAD: "team lead",
  TEAM_DRIVER: "team driver",
  DRIVER: "driver",
  ACCOUNTANT: "accountant",
};

export const MANAGER_ROLES = [UserRole.ADMIN, UserRole.DISPATCH_MANAGER];

export const OPS_ROLES = [
  UserRole.ADMIN,
  UserRole.DISPATCH_MANAGER,
  UserRole.DISPATCH_TEAM,
];

export const MOBILE_ONLY_ROLES = [
  UserRole.DRIVER,
  UserRole.TEAM_DRIVER,
  UserRole.TEAM_LEAD,
];

export const PAYROLL_VIEWER_ROLES = [
  UserRole.ADMIN,
  UserRole.DISPATCH_MANAGER,
  UserRole.ACCOUNTANT,
  UserRole.TEAM_LEAD,
];

/** Roles assignable by managers (excludes admin / dispatch manager). */
export const ASSIGNABLE_ROLES = [
  UserRole.DISPATCH_TEAM,
  UserRole.DRIVER,
  UserRole.TEAM_LEAD,
  UserRole.TEAM_DRIVER,
  UserRole.ACCOUNTANT,
];

export const ROLES_REQUIRING_TEAM = [
  UserRole.TEAM_LEAD,
  UserRole.TEAM_DRIVER,
  UserRole.DRIVER,
];

export const ROLES_REQUIRING_CITY = [UserRole.DISPATCH_TEAM, UserRole.TEAM_LEAD];

export function roleRequiresTeam(role) {
  return ROLES_REQUIRING_TEAM.includes(role);
}

export function roleRequiresCity(role) {
  return ROLES_REQUIRING_CITY.includes(role);
}

export const UserStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  SUSPENDED: "suspended",
};
