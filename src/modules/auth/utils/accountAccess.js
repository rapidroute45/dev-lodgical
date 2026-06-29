import { UserStatus } from "@/shared/utils/constants.js";

export function isAccountLoginAllowed(user) {
  if (!user) return false;
  return user.status === UserStatus.ACTIVE && user.role != null;
}

export function getAccountBlockedMessage(user) {
  if (user?.status === UserStatus.SUSPENDED) {
    return "Your account has been suspended. Contact your administrator.";
  }
  return "Your account is not active yet. Please wait for an administrator to approve your account before signing in.";
}
