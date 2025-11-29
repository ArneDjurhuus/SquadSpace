import { createClient } from "@/utils/supabase/server"
import { headers } from "next/headers"

export async function checkRateLimit(action: string, limit = 10, windowSeconds = 60) {
  const supabase = await createClient()
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for") || "unknown"
  
  const key = `rate_limit:${action}:${ip}`
  
  // Calculate refill rate (seconds per token)
  // e.g. 10 reqs / 60 sec => 1 token every 6 seconds
  const refillRate = Math.max(1, Math.floor(windowSeconds / limit))
  
  const { data, error } = await supabase.rpc('check_rate_limit', {
    limit_key: key,
    max_tokens: limit,
    refill_rate_seconds: refillRate
  })
  
  if (error) {
    console.error('Rate limit check failed:', error)
    // Fail open (allow request) if rate limit system fails
    return true 
  }
  
  return data as boolean
}
