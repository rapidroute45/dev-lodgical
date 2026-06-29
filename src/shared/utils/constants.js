/** API origin — use Vite proxy in dev (`/api/v1`) or full URL in production. */
import {
  getActiveApiEnvironmentConfig,
  getStoredApiEnvironment,
} from "./apiEnvironment.js";

const activeApi = getActiveApiEnvironmentConfig(getStoredApiEnvironment());

/** Google Maps Platform — set VITE_GOOGLE_MAPS_API_KEY in .env.local (see .env.example). */
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || "";
/** Vector map ID for Advanced Markers — create in Google Cloud → Map Management. */
const GOOGLE_MAPS_MAP_ID =
  import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || "DEMO_MAP_ID";

export const CONFIG = {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  get API_BASE_URL() {
    return getActiveApiEnvironmentConfig().apiBaseUrl;
  },
  get SOCKET_URL() {
    return getActiveApiEnvironmentConfig().socketUrl;
  },
  get UPLOADS_BASE_URL() {
    return getActiveApiEnvironmentConfig().uploadsBaseUrl;
  },
  TOKEN_STORAGE_KEY: "dispatch_session_token",
  OPS_ELEVATION_STORAGE_KEY: "ops_elevation",
};

/** Snapshot used at module init (e.g. axios default baseURL). Prefer CONFIG getters at runtime. */
export const INITIAL_API_CONFIG = {
  API_BASE_URL: activeApi.apiBaseUrl,
  SOCKET_URL: activeApi.socketUrl,
  UPLOADS_BASE_URL: activeApi.uploadsBaseUrl,
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

export const ROLES_REQUIRING_CITY = [UserRole.DISPATCH_TEAM];

export function roleRequiresTeam(role) {
  return ROLES_REQUIRING_TEAM.includes(role);
}

export function roleRequiresCity(role) {
  return ROLES_REQUIRING_CITY.includes(role);
}

export function canManageStores(role) {
  return MANAGER_ROLES.includes(role);
}

/** Admin and dispatch manager may use global state/city scope in the ops header. */
export function canManageLocationScope(role) {
  return MANAGER_ROLES.includes(role);
}

export function isAdmin(role) {
  return role === UserRole.ADMIN;
}

export function isDispatchManager(role) {
  return role === UserRole.DISPATCH_MANAGER;
}

export function isFullManager(role) {
  return isAdmin(role) || isDispatchManager(role);
}

export function isDispatchTeam(role) {
  return role === UserRole.DISPATCH_TEAM;
}

export function isDispatchOps(role) {
  return isFullManager(role) || isDispatchTeam(role);
}

/** Admin must unlock dispatch ops via PIN before create/edit mutations. */
export function adminNeedsDispatchElevation(role) {
  return isAdmin(role);
}

/** Admin and dispatch manager must unlock payroll via PIN before payroll mutations. */
export function roleNeedsPayrollElevation(role) {
  return isAdmin(role) || isDispatchManager(role);
}

export const UserStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  SUSPENDED: "suspended",
};
