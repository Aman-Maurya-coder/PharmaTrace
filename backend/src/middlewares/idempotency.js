const store = new Map();

export function IdempotencyMiddleware(req, res, next) {
  const key = req.headers["idempotency-key"];
  if (!key) {
    return next();
  }

  if (store.has(key)) {
    return res.status(409).json({ error: "Duplicate request" });
  }

  store.set(key, true);
  return next();
}
