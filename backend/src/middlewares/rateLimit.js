const hits = new Map();

export function RateLimitMiddleware(req, res, next) {
  const key = req.ip ?? "unknown";
  const count = hits.get(key) ?? 0;
  if (count > 100) {
    return res.status(429).json({ error: "Too many requests" });
  }
  hits.set(key, count + 1);
  return next();
}
