import { headers } from "next/headers"

// In-memory rate limiter using a sliding window approach
// For production, consider using Redis/Upstash for distributed rate limiting
const rateLimitStore = new Map<string, { tokens: number; lastRefill: number }>()

// Clean up old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  
  lastCleanup = now
  const expireTime = now - 60 * 60 * 1000 // Remove entries older than 1 hour
  
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.lastRefill < expireTime) {
      rateLimitStore.delete(key)
    }
  }
}

export async function checkRateLimit(action: string, limit = 10, windowSeconds = 60): Promise<boolean> {
  cleanup()
  
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  
  const key = `rate_limit:${action}:${ip}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  
  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    // First request - allow and set initial tokens
    rateLimitStore.set(key, { tokens: limit - 1, lastRefill: now })
    return true
  }
  
  // Calculate token refill based on time passed
  const timePassed = now - entry.lastRefill
  const tokensToAdd = Math.floor((timePassed / windowMs) * limit)
  const newTokens = Math.min(limit, entry.tokens + tokensToAdd)
  
  if (newTokens > 0) {
    // Consume a token and allow the request
    rateLimitStore.set(key, { 
      tokens: newTokens - 1, 
      lastRefill: tokensToAdd > 0 ? now : entry.lastRefill 
    })
    return true
  }
  
  // No tokens left - rate limited
  return false
}
