// server/utils/resetTokenStore.js
// Simple in-memory token store for password reset.
// Uses a Map where key is the token string and value is an object containing expiration timestamp.
// Exported helpers: setToken(email, token, ttlMs), verifyToken(token), deleteToken(token).

const tokenMap = new Map();

/**
 * Store a reset token.
 * @param {string} email - User email (or identifier) associated with the token.
 * @param {string} token - Secure random token.
 * @param {number} ttlMs - Time‑to‑live in milliseconds.
 */
export function setToken(email, token, ttlMs = 15 * 60 * 1000) {
  const expires = Date.now() + ttlMs;
  tokenMap.set(token, { email, expires });
}

/**
 * Verify a token and return the associated email if valid.
 * Returns null if token missing, expired, or not found.
 */
export function verifyToken(token) {
  const record = tokenMap.get(token);
  if (!record) return null;
  if (Date.now() > record.expires) {
    tokenMap.delete(token);
    return null;
  }
  return record.email;
}

/** Remove a token (e.g., after successful reset). */
export function deleteToken(token) {
  tokenMap.delete(token);
}

/** Cleanup expired tokens (optional periodic call). */
export function cleanup() {
  const now = Date.now();
  for (const [tok, rec] of tokenMap.entries()) {
    if (now > rec.expires) tokenMap.delete(tok);
  }
}

// Export for occasional manual cleanup (not currently scheduled).
export default {
  setToken,
  verifyToken,
  deleteToken,
  cleanup,
};
