/** Labels aligned with DispatchMobile driver route screen. */
export const STOP_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Delivered" },
  { value: "returned", label: "Failure" },
];

export function formatStopStatusLabel(status) {
  switch (status) {
    case "completed":
      return "Delivered";
    case "returned":
      return "Failure";
    case "pending":
      return "Pending";
    default:
      return status ? String(status).replace(/_/g, " ") : "Pending";
  }
}

export function stopStatusTone(status) {
  switch (status) {
    case "completed":
      return "completed";
    case "returned":
      return "returned";
    default:
      return "pending";
  }
}

export function stopStatusClass(status) {
  return `route-stop-status route-stop-status--${stopStatusTone(status)}`;
}

export function returnReasonLabel(reasonId, options = []) {
  const match = options.find((opt) => opt.id === reasonId);
  return match?.label ?? reasonId?.replace(/_/g, " ") ?? "";
}
