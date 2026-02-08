export function AuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = { id: "clerk_user", role: "user", token };
  return next();
}
