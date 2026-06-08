import { UserRole } from "@/shared/utils/constants.js";

export const ROLE_DEFINITIONS = [
  {
    role: UserRole.DRIVER,
    title: "Driver",
    description: "Mobile App access only",
  },
  {
    role: UserRole.TEAM_LEAD,
    title: "Team Lead",
    description: "Web + Mobile access",
  },
  {
    role: UserRole.TEAM_DRIVER,
    title: "Team Driver",
    description: "Field driver on a team",
  },
  {
    role: UserRole.DISPATCH_TEAM,
    title: "Dispatch Team",
    description: "City-scoped operations",
  },
  {
    role: UserRole.ACCOUNTANT,
    title: "Accountant",
    description: "Finance & payroll access",
  },
];
