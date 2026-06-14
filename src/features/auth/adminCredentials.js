/**
 * Admin credentials for EventLayer admin dashboard.
 *
 * SECURITY: Set the following environment variables in .env.local:
 * - ADMIN_SECRET_PASSWORD: A strong password for admin login
 * - ADMIN_EMAILS: Comma-separated list of admin email addresses
 *
 * Never commit hardcoded credentials to source control.
 */

function getAdminPassword() {
  const fromEnv = process.env.ADMIN_SECRET_PASSWORD;
  if (fromEnv && fromEnv !== "changeme") {
    return fromEnv;
  }
  if (!fromEnv) {
    console.warn(
      "[EventLayer] ADMIN_SECRET_PASSWORD env var is not set. " +
      "For production security, set ADMIN_SECRET_PASSWORD in your .env.local " +
      "to a strong password. Using development fallback.",
    );
  }
  // Development-only fallback - will not work in production without env var
  return process.env.NODE_ENV === "production" ? "" : "dev-only-password";
}

function getAdminEmail() {
  const emails = process.env.ADMIN_EMAILS;
  if (emails) {
    return emails.split(",")[0].trim();
  }
  return "";
}

export const HARDCODED_ADMIN_EMAIL = getAdminEmail();
export const HARDCODED_ADMIN_PASSWORD = getAdminPassword();
