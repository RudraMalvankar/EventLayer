/**
 * Canonical site URL for auth redirects and emails.
 * Set NEXT_PUBLIC_SITE_URL on Vercel to https://eventlayer-dev.vercel.app
 */
export function getSiteOrigin() {
  const configured = String(
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "",
  ).replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const isLocal =
      origin.includes("localhost") || origin.includes("127.0.0.1");
    if (configured && !isLocal) return configured;
    if (configured && isLocal) return configured;
    return origin;
  }

  if (configured) return configured;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

export function authCallbackUrl(path = "/login") {
  const base = getSiteOrigin();
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${safePath}`;
}
