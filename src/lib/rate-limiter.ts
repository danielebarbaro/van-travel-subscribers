interface RateLimitEntry {
  count: number;
  resetTime: number;
}


const rateLimitMap = new Map<string, RateLimitEntry>();


const WINDOW_SIZE_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);


  if (!entry || now > entry.resetTime) {
    const newEntry = {
      count: 1,
      resetTime: now + WINDOW_SIZE_MS
    };
    rateLimitMap.set(ip, newEntry);

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetTime: newEntry.resetTime
    };
  }


  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }


  entry.count += 1;
  rateLimitMap.set(ip, entry);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, WINDOW_SIZE_MS);

export function getRateLimitHeaders(rateLimitResult: ReturnType<typeof checkRateLimit>) {
  return {
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
  };
}
