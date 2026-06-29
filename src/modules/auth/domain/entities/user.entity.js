/**
 * Domain entity: User (mirrors mobile UserProfile / User entity).
 */
export class User {
  constructor({
    id,
    email,
    fullName = null,
    role = null,
    status,
    teamId = null,
    assignedCity = null,
    assignedCities = [],
    phone = null,
    team = null,
    displayName = null,
    createdAt = null,
    updatedAt = null,
    pendingRoleAssignment = false,
  }) {
    this.id = id;
    this.email = email;
    this.fullName = fullName;
    this.role = role;
    this.status = status;
    this.teamId = teamId;
    this.assignedCity = assignedCity;
    this.assignedCities = assignedCities;
    this.phone = phone;
    this.team = team;
    this.displayName = displayName;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.pendingRoleAssignment = pendingRoleAssignment;
  }

  static fromApi(raw) {
    if (!raw) return null;
    return new User({
      id: raw.id,
      email: raw.email,
      fullName: raw.fullName ?? raw.full_name ?? null,
      role: raw.role ?? null,
      status: raw.status,
      teamId: raw.teamId ?? null,
      assignedCity: raw.assignedCity ?? null,
      assignedCities: raw.assignedCities ?? [],
      phone: raw.phone ?? null,
      team: raw.team ?? null,
      displayName: raw.displayName ?? null,
      createdAt: raw.createdAt ?? null,
      updatedAt: raw.updatedAt ?? null,
      pendingRoleAssignment: raw.pendingRoleAssignment ?? false,
    });
  }

  isActive() {
    return this.status === "active";
  }

  isPending() {
    return this.status === "pending";
  }
}
