import { Redis } from "@upstash/redis";

/**
 * Optimized Rate Limiting Utility.
 * Supports Upstash Redis for distributed scaling, or In-Memory fallback for local development.
 * Edge-compatible (no setInterval).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory fallback (limited lifetime in Edge runtime)
const memoryStore = new Map<string, RateLimitEntry>();

function getRedisClient() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

const redis = getRedisClient();

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
 * @param windowMs - Time window in milliseconds (default 1 minute)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): Promise<RateLimitResult> {
  const now = Date.now();
  const fullKey = `ratelimit:${key}`;

  // 1. DISTRIBUTED REDIS FLOW (Primary)
  if (redis) {
    try {
      // Use a single pipeline for atomic-ish increment and TTL retrieval
      const [count, pttl] = await redis
        .pipeline()
        .incr(fullKey)
        .pttl(fullKey)
        .exec() as [number, number];

      // If this is the first request in the window, set the expiration
      if (count === 1 || pttl < 0) {
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
      console.warn("RateLimit: Upstash connection failed, falling back to In-Memory.", error);
    }
  }

  // 2. IN-MEMORY FALLBACK (For Local Dev or Redis Outage)
  const existing = memoryStore.get(key);

  // Simple cleanup: if memory storage exceeds 1000 items, clear oldest entries
  if (memoryStore.size > 1000) {
    const firstKey = memoryStore.keys().next().value;
    if (firstKey) memoryStore.delete(firstKey);
  }

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
 * Extracts client IP from request headers correctly.
 */
export function getClientIp(request: Request | NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "127.0.0.1";
}

// Support NextRequest type without explicit dependency if possible, or just cast
type NextRequest = any;
