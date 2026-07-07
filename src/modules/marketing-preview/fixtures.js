/** Static fixture data for marketing screenshots — mirrors real dispatch app shapes. */

export const PREVIEW_DATE = "2026-07-07";

export const PREVIEW_DRIVERS = [
  {
    id: "drv-1",
    displayName: "Ahmed K.",
    email: "ahmed.k@example.com",
    teamName: "Team Alpha",
  },
  {
    id: "drv-2",
    displayName: "Sara M.",
    email: "sara.m@example.com",
    teamName: "Team Beta",
  },
  {
    id: "drv-3",
    displayName: "Omar R.",
    email: "omar.r@example.com",
    teamName: "Team Gamma",
  },
];

export const PREVIEW_PERFORMANCE = {
  "drv-1": {
    badge: "gold",
    onTimePct: 97,
    podRate: 99,
    returnRate: 2,
    lateCompletions: 1,
    completedRoutes: 42,
  },
  "drv-2": {
    badge: "silver",
    onTimePct: 94,
    podRate: 98,
    returnRate: 3,
    lateCompletions: 2,
    completedRoutes: 38,
  },
  "drv-3": {
    badge: "bronze",
    onTimePct: 91,
    podRate: 96,
    returnRate: 4,
    lateCompletions: 3,
    completedRoutes: 31,
  },
};

export const PREVIEW_ROUTES = [
  {
    id: "route-1",
    routeName: "North Loop A",
    driverName: "Ahmed K.",
    driverEmail: "ahmed.k@example.com",
    teamName: "Team Alpha",
    teamCode: "TA",
    status: "in_progress",
    arrivalTime: "6:30 AM",
    departureTime: "2:30 PM",
    location: "Chicago, IL",
    schedule: {
      date: PREVIEW_DATE,
      city: "Chicago",
      state: "IL",
      store: { storeName: "Metro Retail Hub", storeId: "STR-1042" },
      dispatchTeam: "Team Alpha",
      createdByName: "Jordan P.",
    },
  },
  {
    id: "route-2",
    routeName: "Downtown Express",
    driverName: "Sara M.",
    driverEmail: "sara.m@example.com",
    teamName: "Team Beta",
    teamCode: "TB",
    status: "active",
    arrivalTime: "7:00 AM",
    departureTime: "3:00 PM",
    location: "Chicago, IL",
    schedule: {
      date: PREVIEW_DATE,
      city: "Chicago",
      state: "IL",
      store: { storeName: "Metro Retail Hub", storeId: "STR-1042" },
      dispatchTeam: "Team Beta",
      createdByName: "Jordan P.",
    },
  },
  {
    id: "route-3",
    routeName: "West Side Run",
    driverName: null,
    driverId: null,
    teamName: "Team Gamma",
    teamCode: "TG",
    status: "pending",
    arrivalTime: "8:00 AM",
    departureTime: "4:00 PM",
    location: "Chicago, IL",
    schedule: {
      date: PREVIEW_DATE,
      city: "Chicago",
      state: "IL",
      store: { storeName: "Fresh Foods Co", storeId: "STR-2088" },
      dispatchTeam: "Team Gamma",
      createdByName: "Morgan L.",
    },
  },
  {
    id: "route-4",
    routeName: "South Shore",
    driverName: "Omar R.",
    driverEmail: "omar.r@example.com",
    teamName: "Team Gamma",
    teamCode: "TG",
    status: "completed",
    arrivalTime: "5:45 AM",
    departureTime: "1:45 PM",
    location: "Chicago, IL",
    schedule: {
      date: PREVIEW_DATE,
      city: "Chicago",
      state: "IL",
      store: { storeName: "Fresh Foods Co", storeId: "STR-2088" },
      dispatchTeam: "Team Gamma",
      createdByName: "Morgan L.",
    },
  },
];

export const PREVIEW_LIVE_DRIVERS = [
  {
    id: "route-1",
    routeName: "North Loop A",
    driverName: "Ahmed K.",
    status: "in_progress",
    driverLocation: {
      lat: 41.8781,
      lng: -87.6298,
      updatedAt: new Date().toISOString(),
    },
    progress: { completedDropoffs: 8, returnedDropoffs: 0, totalDropoffs: 14 },
    schedule: { city: "Chicago", state: "IL", storeName: "Metro Retail Hub" },
  },
  {
    id: "route-2",
    routeName: "Downtown Express",
    driverName: "Sara M.",
    status: "active",
    driverLocation: {
      lat: 41.8819,
      lng: -87.6231,
      updatedAt: new Date().toISOString(),
    },
    progress: { completedDropoffs: 5, returnedDropoffs: 0, totalDropoffs: 12 },
    schedule: { city: "Chicago", state: "IL", storeName: "Metro Retail Hub" },
  },
  {
    id: "route-4",
    routeName: "South Shore",
    driverName: "Omar R.",
    status: "in_progress",
    driverLocation: {
      lat: 41.8681,
      lng: -87.6412,
      updatedAt: new Date().toISOString(),
    },
    progress: { completedDropoffs: 3, returnedDropoffs: 0, totalDropoffs: 10 },
    schedule: { city: "Chicago", state: "IL", storeName: "Fresh Foods Co" },
  },
];

export const PREVIEW_STORES = [
  { id: "store-1", storeName: "Metro Retail Hub", storeId: "STR-1042", city: "Chicago", state: "IL" },
  { id: "store-2", storeName: "Fresh Foods Co", storeId: "STR-2088", city: "Chicago", state: "IL" },
];
