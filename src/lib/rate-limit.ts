type Entry = { count: number; resetAt: number };

// Module-level store survives across requests on warm function instances.
const store = new Map<string, Entry>();

/** Prune expired entries to prevent unbounded memory growth. */
function prune() {
  if (store.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of store) {
    if (now > v.resetAt) store.delete(k);
  }
}

/**
 * Returns true if the request is allowed, false if it should be blocked.
 * @param key     Unique identifier — typically "route:ip"
 * @param limit   Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  prune();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

/** Extract the caller IP from the request headers. */
export function getIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
