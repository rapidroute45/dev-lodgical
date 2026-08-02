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
export function logFirebaseWebClientStatus(_status) {
  // Intentionally quiet — status is used by callers; avoid console noise.
}

/**
 * @param {string} token
 * @returns {string}
 */
export function previewFcmToken(token) {
  if (!token || token.length < 16) return token ? `${token.slice(0, 8)}…` : "";
  return `${token.slice(0, 8)}…${token.slice(-6)}`;
}
