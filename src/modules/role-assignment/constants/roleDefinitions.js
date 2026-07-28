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
    description: "Mobile App access only",
  },
  {
    role: UserRole.DISPATCH_TEAM,
    title: "Dispatch Team",
    description: "City-scoped operations",
  },
  {
    role: UserRole.ONSITE_MANAGER,
    title: "Onsite Manager",
    description: "Route management & payroll confirmation",
  },
  {
    role: UserRole.ACCOUNTANT,
    title: "Accountant",
    description: "Finance & payroll access",
  },
];
