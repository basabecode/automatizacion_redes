/**
 * In-memory rate limiter. Adequate for single-instance local deployments.
 * Uses a sliding-window counter keyed by an arbitrary string (e.g. user email or IP).
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

/**
 * Returns true if the request is allowed, false if the rate limit is exceeded.
 * @param key      Unique identifier (e.g. `generate:user@email.com`)
 * @param max      Max allowed requests within the window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false

  entry.count++
  return true
}
