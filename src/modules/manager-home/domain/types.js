/**
 * @typedef {Object} ManagerDashboardStats
 * @property {string} date
 * @property {number} todayRoutes
 * @property {number} availableDrivers
 * @property {number} completedRoutes
 */

/**
 * @typedef {Object} AvailableDriverSummary
 * @property {string} id
 * @property {string} email
 * @property {string|null} fullName
 * @property {string} displayName
 * @property {string|null} role
 * @property {string|null} teamId
 * @property {string|null} teamName
 * @property {string|null} teamCode
 */

/**
 * @typedef {Object} AvailableDriversResponse
 * @property {string} date
 * @property {number} count
 * @property {AvailableDriverSummary[]} drivers
 */

/**
 * @typedef {Object} RouteSummary
 * @property {string} id
 * @property {string} scheduleDate
 * @property {string|null} teamName
 * @property {string|null} teamCode
 * @property {string|null} driverName
 * @property {string|null} driverEmail
 * @property {string|null} routeName
 * @property {string|null} location
 * @property {string} status
 * @property {string} arrivalTime
 * @property {string} departureTime
 */
