export function ErrorHandlerMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  if (err?.code === 11000) {
    return res.status(409).json({ error: "Duplicate key", fields: err.keyValue ?? {} });
  }
  if (err?.name === "ValidationError") {
    return res.status(400).json({ error: "Validation error", details: err.errors ?? {} });
  }
  if (err?.status) {
    return res.status(err.status).json({ error: err.message });
  }
  return res.status(500).json({ error: "Server error" });
}
