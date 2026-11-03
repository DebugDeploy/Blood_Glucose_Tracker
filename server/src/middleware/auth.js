import jwt from 'jsonwebtoken';

// Get JWT secret from environment
const jwtSecret = process.env.JWT_SECRET;

/**
 * Middleware to require authentication
 * Checks if user has a valid JWT token
 * If valid, adds user data to req.user and continues
 * If invalid, returns 401 error
 */
export function requireAuth(req, res, next) {
  // Get token from Authorization header
  // Format: "Bearer <token>"
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      error: 'Please log in to continue.'
    });
  }

  // Verify token is valid
  try {
    // Decode token and attach user data to request
    req.user = jwt.verify(token, jwtSecret);

    // Continue to next middleware/route handler
    next();
  } catch {
    // Token is invalid or expired
    return res.status(401).json({
      error: 'Your session has expired. Please log in again.'
    });
  }
}
