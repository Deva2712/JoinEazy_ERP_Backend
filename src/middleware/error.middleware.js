import logger from "../utils/logger.js";

// Central error handler — must have 4 params for Express to treat it as error middleware
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`${req.method} ${req.originalUrl} — ${message}`, { stack: err.stack });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Wrap async route handlers to avoid try/catch boilerplate
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
