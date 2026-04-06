import { Redis } from "@upstash/redis";

/**
 * Optimized Rate Limiting Utility.
 * Supports Upstash Redis for distributed scaling, or In-Memory fallback for local development.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();
let redis: Redis | null = null;

// Initialize Redis only if keys are present
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log("RateLimit: Distributed Upstash Redis enabled.");
}

// Cleanup memory store every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt < now) {
      memoryStore.delete(key);
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
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const fullKey = `ratelimit:${key}`;

  // DISTRIBUTED REDIS FLOW
  if (redis) {
    try {
      const results = await redis
        .pipeline()
        .incr(fullKey)
        .pttl(fullKey)
        .exec();

      const count = results[0] as number;
      const pttl = results[1] as number;

      if (count === 1) {
        await redis.pexpire(fullKey, windowMs);
      }

      const resetAt = now + (pttl > 0 ? pttl : windowMs);
      const allowed = count <= limit;
      const retryAfterSeconds = allowed ? 0 : Math.ceil((resetAt - now) / 1000);

      return {
        allowed,
        remaining: Math.max(0, limit - count),
        resetAt,
        retryAfterSeconds,
      };
    } catch (error) {
      console.warn("RateLimit: Redis failure, falling back to Memory.", error);
    }
  }

  // IN-MEMORY FALLBACK
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Extracts client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "127.0.0.1"
  );
}
