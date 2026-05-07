import jwt from "jsonwebtoken";
import { asyncHandler } from "./error.middleware.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized — no token");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
});

// Role-based access: pass allowed roles as arguments
// Usage: router.get("/admin", protect, authorize("admin"), handler)
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    res.status(403);
    throw new Error(`Role '${req.user?.role}' is not authorized for this route`);
  }
  next();
};
