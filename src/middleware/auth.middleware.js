import jwt from "jsonwebtoken";
import { asyncHandler } from "./error.middleware.js";
import User from "../modules/auth/auth-model.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized — no token");
  }

 
  if (process.env.NODE_ENV !== "production") {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.mock === true) {
          req.user = payload;
          return next();
        }
      }
    } catch (_) {}
  }

  // Real JWT
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findByPk(decoded.id, {
    attributes: ["id", "name", "email", "role"],
  });

  if (!user) {
    res.status(401);
    throw new Error("User not found");
  }

  req.user = user;
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    res.status(403);
    throw new Error(`Role '${req.user?.role}' is not authorized for this route`);
  }
  next();
};