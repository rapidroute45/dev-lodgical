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
    phone = null,
  }) {
    this.id = id;
    this.email = email;
    this.fullName = fullName;
    this.role = role;
    this.status = status;
    this.teamId = teamId;
    this.assignedCity = assignedCity;
    this.phone = phone;
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
      phone: raw.phone ?? null,
    });
  }

  isActive() {
    return this.status === "active";
  }

  isPending() {
    return this.status === "pending";
  }
}
