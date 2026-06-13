/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding window approach: tracks request timestamps per IP,
 * rejects if the count exceeds the limit within the window.
 *
 * NOTE: This is not suitable for multi-instance deployments (e.g., multiple
 * Vercel functions). For production scale, use Vercel WAF or Redis-based
 * rate limiting.
 */

const store = new Map();

/**
 * Rate limit a request based on IP + route identifier.
 *
 * @param {string} id - Unique identifier (e.g., `ip::route`)
 * @param {object} options
 * @param {number} options.limit - Max requests allowed in the window
 * @param {number} options.windowMs - Window duration in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetInMs: number }}
 */
export function checkRateLimit(id, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();

  let entry = store.get(id);
  if (!entry || now - entry.windowStart > windowMs) {
    // Start a new window
    entry = { windowStart: now, timestamps: [] };
    store.set(id, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  // Enforce max store size to prevent memory leaks (10k entries)
  if (store.size > 10_000) {
    // Evict oldest entries
    const keysToDelete = [...store.entries()]
      .sort(([, a], [, b]) => a.windowStart - b.windowStart)
      .slice(0, store.size - 7_500)
      .map(([key]) => key);
    for (const key of keysToDelete) {
      store.delete(key);
    }
  }

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetInMs: windowMs - (now - oldest),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetInMs: windowMs - (now - entry.windowStart),
  };
}

/**
 * Extract a client identifier from the request (IP-based).
 */
export function getClientId(request) {
  // Try Vercel's forwarded-for header first, then fallback to IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Higher-order function to wrap an API route handler with rate limiting.
 * Returns a 429 response if rate limited.
 *
 * @param {function} handler - The route handler function
 * @param {object} options - Rate limit options
 * @param {string} options.routeName - Unique name for this route (for the rate limit key)
 * @param {number} options.limit - Max requests in the window
 * @param {number} options.windowMs - Window duration in ms
 */
export function withRateLimit(handler, { routeName, limit = 10, windowMs = 60_000 } = {}) {
  return async (request, context) => {
    const clientId = getClientId(request);
    const rateLimitId = `${clientId}::${routeName}`;
    const result = checkRateLimit(rateLimitId, { limit, windowMs });

    if (!result.allowed) {
      return Response.json(
        { data: null, error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(result.resetInMs / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    return handler(request, context);
  };
}