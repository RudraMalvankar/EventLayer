/**
 * Admin credentials for EventLayer admin dashboard.
 *
 * SECURITY: For production, set the ADMIN_SECRET_PASSWORD env var
 * to a strong password. The hardcoded fallback here is only for
 * local development convenience and should NOT be relied on in production.
 *
 * The email can be configured via ADMIN_EMAILS env var (see src/shared/config/env.js).
 */

const FALLBACK_PASSWORD = "Admin@123";

function getAdminPassword() {
  const fromEnv = process.env.ADMIN_SECRET_PASSWORD;
  if (fromEnv && fromEnv !== FALLBACK_PASSWORD && fromEnv !== "changeme") {
    return fromEnv;
  }
  if (!fromEnv) {
    console.warn(
      "[EventLayer] ADMIN_SECRET_PASSWORD env var is not set. " +
      "For production security, set ADMIN_SECRET_PASSWORD in your .env.local " +
      "to a strong password. Using hardcoded fallback for development.",
    );
  }
  return FALLBACK_PASSWORD;
}

export const HARDCODED_ADMIN_EMAIL = "rudracmalvankar@gmail.com";
export const HARDCODED_ADMIN_PASSWORD = getAdminPassword();