/** Display name from profile or email local-part. */
export function resolveDisplayName(fullName, email) {
  const name = fullName?.trim();
  if (name) return name;
  if (email) return email.split("@")[0];
  return "User";
}
