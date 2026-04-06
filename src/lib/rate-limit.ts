/**
 * In-memory sliding window rate limiter.
 * Simple Map-based implementation — no Redis needed.
 * For production with multiple instances, swap with Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Check if a request is rate-limited.
 * @param key - Unique identifier (e.g., IP + endpoint)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= limit) {
    // Rate limited
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds,
    };
  }

  // Increment counter
  existing.count++;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
