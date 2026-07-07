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

/**
 * @typedef {'top'|'needs_improvement'|null} PerformanceBadge
 */

/**
 * @typedef {Object} PerformanceSummary
 * @property {string} userId
 * @property {string} displayName
 * @property {string} email
 * @property {string|null} [teamName]
 * @property {number} completedRoutes
 * @property {number|null} podRate
 * @property {number|null} onTimePct
 * @property {number|null} returnRate
 * @property {number} lateCompletions
 * @property {PerformanceBadge} badge
 */

/**
 * @typedef {Object} PerformanceWindow
 * @property {string} from
 * @property {string} to
 * @property {number} days
 */

/**
 * @typedef {Object} DriverPerformanceResponse
 * @property {PerformanceWindow} window
 * @property {PerformanceSummary[]} drivers
 * @property {PerformanceSummary[]} topPerformers
 * @property {PerformanceSummary[]} needsImprovement
 */

/**
 * @typedef {Object} DispatchPerformanceResponse
 * @property {PerformanceWindow} window
 * @property {PerformanceSummary[]} members
 * @property {PerformanceSummary[]} topPerformers
 * @property {PerformanceSummary[]} needsImprovement
 */

/**
 * @typedef {Object} TeamPerformanceSummary
 * @property {string} teamId
 * @property {string} teamName
 * @property {string} teamCode
 * @property {string|null} teamLeadName
 * @property {number} memberCount
 * @property {number} driverCount
 * @property {number} completedRoutes
 * @property {number|null} podRate
 * @property {number|null} onTimePct
 * @property {number|null} returnRate
 * @property {number} lateCompletions
 * @property {PerformanceBadge} badge
 */

/**
 * @typedef {Object} TeamPerformanceResponse
 * @property {PerformanceWindow} window
 * @property {TeamPerformanceSummary[]} teams
 * @property {TeamPerformanceSummary[]} topPerformers
 * @property {TeamPerformanceSummary[]} needsImprovement
 */
