type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown"
  }

  return request.headers.get("x-real-ip") ?? "local"
}

export function consumeRateLimit(input: {
  key: string
  limit: number
  windowMs: number
}) {
  const now = Date.now()
  const entry = rateLimitStore.get(input.key)

  if (!entry || entry.resetAt <= now) {
    const nextEntry = {
      count: 1,
      resetAt: now + input.windowMs,
    }
    rateLimitStore.set(input.key, nextEntry)
    return {
      allowed: true,
      remaining: input.limit - 1,
      resetAt: nextEntry.resetAt,
    }
  }

  if (entry.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count += 1
  rateLimitStore.set(input.key, entry)
  return {
    allowed: true,
    remaining: input.limit - entry.count,
    resetAt: entry.resetAt,
  }
}
