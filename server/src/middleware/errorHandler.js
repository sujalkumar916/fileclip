/**
 * src/middleware/errorHandler.js
 * Centralised error-handling middleware for Express.
 * Must be registered AFTER all routes.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.stack || err.message}`);

  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error"
      : err.message || "Something went wrong";

  res.status(statusCode).json({ success: false, error: message });
};

/**
 * Wraps an async route handler so unhandled promise rejections
 * are automatically forwarded to the error handler.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };

