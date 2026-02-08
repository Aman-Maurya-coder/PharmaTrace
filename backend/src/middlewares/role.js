export function RoleMiddleware(role) {
  return (req, res, next) => {
    if (!req.user || (role && req.user.role !== role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}
