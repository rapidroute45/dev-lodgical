export const VEHICLE_TYPES = ["Van", "Truck", "SUV", "Car", "Box Truck"];

export const ROUTE_CATEGORIES = ["SMALL", "MEDIUM", "FULL"];

export const DEFAULT_ROUTE_CATEGORY = "SMALL";

export const ROUTE_CATEGORY_LABELS = {
  SMALL: "Small",
  MEDIUM: "Medium",
  FULL: "Full",
};

export const ROUTE_CATEGORY_SLUG = {
  SMALL: "small",
  MEDIUM: "medium",
  FULL: "full",
};

/** Max routes per category in one bulk add. */
export const MAX_BULK_ROUTES_PER_CATEGORY = 20;

export const SCHEDULE_STATUSES = [
  "draft",
  "pending",
  "active",
  "completed",
  "cancelled",
];
