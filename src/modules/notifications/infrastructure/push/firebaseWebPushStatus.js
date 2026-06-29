/** @typedef {Object} FirebaseWebClientStatus
 * @property {boolean} connected
 * @property {boolean} configured
 * @property {boolean} supported
 * @property {boolean} permissionGranted
 * @property {boolean} hasFcmToken
 * @property {boolean} registeredWithBackend
 * @property {string} message
 * @property {string} [projectId]
 * @property {string} [appId]
 * @property {string} [tokenPreview]
 */

/**
 * @param {FirebaseWebClientStatus} status
 */
export function logFirebaseWebClientStatus(status) {
  const line = status.connected ? "CONNECTED" : "NOT CONNECTED";
  console.log("[Firebase] ─── web push status ───");
  console.log(`[Firebase] status: ${line}`);
  console.log(`[Firebase] ${status.message}`);
  console.log("[Firebase] details:", {
    configured: status.configured,
    supported: status.supported,
    permissionGranted: status.permissionGranted,
    hasFcmToken: status.hasFcmToken,
    registeredWithBackend: status.registeredWithBackend,
    projectId: status.projectId ?? null,
    appId: status.appId ?? null,
    tokenPreview: status.tokenPreview ?? null,
  });
  console.log("[Firebase] ───────────────────────────");
}

/**
 * @param {string} token
 * @returns {string}
 */
export function previewFcmToken(token) {
  if (!token || token.length < 16) return token ? `${token.slice(0, 8)}…` : "";
  return `${token.slice(0, 8)}…${token.slice(-6)}`;
}
