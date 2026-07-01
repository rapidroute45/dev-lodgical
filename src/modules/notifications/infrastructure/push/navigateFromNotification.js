/**
 * Map FCM data payload to dev-lodgical React Router paths.
 * Mirrors DispatchMobile navigateFromNotification rules.
 */
export function buildNotificationRoute(data) {
  const deepLink = data?.deepLink?.trim();
  if (deepLink) {
    const fromDeepLink = mapDeepLinkToRoute(deepLink);
    if (fromDeepLink) return fromDeepLink;
  }
  return mapTypeToRoute(data?.type, data);
}

function mapDeepLinkToRoute(deepLink) {
  if (deepLink === "/route-offers") return null;

  const payrollMatch = deepLink.match(/^\/payroll\/([^/]+)$/);
  if (payrollMatch) return `/payroll/${payrollMatch[1]}`;

  const scheduleMatch = deepLink.match(/^\/schedules\/([^/]+)$/);
  if (scheduleMatch) return `/schedules/${scheduleMatch[1]}`;

  if (/^\/routes\/tracking\/.+/.test(deepLink)) return "/routes";

  const dispatchTeamMatch = deepLink.match(/^\/dispatch-team\/([^/]+)$/);
  if (dispatchTeamMatch) return `/dispatch-team/${dispatchTeamMatch[1]}`;

  if (deepLink.startsWith("/driver-documents")) return "/driver-documents";
  if (deepLink.startsWith("/documents")) return "/driver-documents";

  const chatMatch = deepLink.match(/^\/chat\/([^/]+)$/);
  if (chatMatch) return `/chat/${chatMatch[1]}`;
  if (deepLink === "/chat") return "/chat";

  if (deepLink.startsWith("/") && !deepLink.includes("://")) {
    return deepLink;
  }

  return null;
}

function mapTypeToRoute(type, data) {
  switch (type) {
    case "route_offer":
      return null;
    case "route_assigned":
    case "route_needs_driver":
    case "route_ops_review":
    case "schedule_created":
    case "schedule_updated":
    case "route_created":
    case "route_updated":
      return data?.scheduleId ? `/schedules/${data.scheduleId}` : "/schedules";
    case "payroll_generated":
    case "payroll_sent":
    case "payroll_approved":
      return data?.billId ? `/payroll/${data.billId}` : "/payroll";
    case "driver_dwelling":
    case "driver_break_started":
    case "driver_break_movement":
    case "driver_break_ended":
    case "stop_auto_completed":
    case "stop_completed":
    case "driver_off_route":
    case "driver_location_stale":
      return data?.routeId ? `/routes/tracking/${data.routeId}` : "/routes";
    case "chat_message":
      return data?.conversationId ? `/chat/${data.conversationId}` : "/chat";
    case "document_required":
    case "document_updated":
    case "document_verified":
    case "document_rejected":
      return "/driver-documents";
    case "dispatch_team_updated":
      return data?.userId ? `/dispatch-team/${data.userId}` : "/dispatch-team";
    default:
      return null;
  }
}

export function notificationPayloadToPushData(type, payload) {
  const data = { type };
  if (!payload || typeof payload !== "object") return data;
  for (const [key, value] of Object.entries(payload)) {
    if (value == null) continue;
    data[key] = typeof value === "string" ? value : String(value);
  }
  return data;
}

export function navigateFromNotification(navigate, data) {
  const route = buildNotificationRoute(data);
  if (!route) return false;
  navigate(route);
  return true;
}

export function extractNotificationData(payload) {
  if (!payload || typeof payload !== "object") return {};
  const data = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value == null) continue;
    data[key] = typeof value === "string" ? value : String(value);
  }
  return data;
}
