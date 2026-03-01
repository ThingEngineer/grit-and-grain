/**
 * In-memory sliding window rate limiter.
 *
 * Works per-user (by user ID) within a single warm serverless instance.
 * On Vercel, each warm instance enforces its own window — not globally
 * coordinated, but sufficient to prevent rapid burst abuse without
 * requiring Redis or any external service.
 *
 * Limits are intentionally generous to avoid blocking legitimate usage
 * during demos and testing.
 */

// Map of `${userId}:${endpoint}` → array of request timestamps (ms)
const requestLog = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** Approximate seconds until the window resets (only set when blocked) */
  retryAfter?: number;
}

/**
 * Check and record a request for a given user + endpoint.
 *
 * @param userId   Supabase user ID (unique per authenticated user)
 * @param endpoint Short label, e.g. "chat", "embed", "extract", "weekly-review"
 * @param limit    Max requests allowed within the window
 * @param windowMs Sliding window in milliseconds (default: 1 hour)
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number,
  windowMs = 60 * 60 * 1000,
): RateLimitResult {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  // Retrieve and prune stale timestamps
  const timestamps = (requestLog.get(key) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= limit) {
    const oldestInWindow = timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Record this request
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return { allowed: true };
}
