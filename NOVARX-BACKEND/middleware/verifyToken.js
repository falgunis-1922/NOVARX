// middleware/verifyToken.js
// This function runs BEFORE any protected route handler.
// It checks the JWT token sent by the frontend and rejects
// requests that have no token or an invalid/expired one.

const jwt = require('jsonwebtoken')

function verifyToken(req, res, next) {
  // The frontend sends the token like this in every request:
  // Authorization: Bearer eyJhbGci...
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({
      error: 'Access denied. No token provided. Please sign in.'
    })
  }

  // Split "Bearer eyJhbGci..." → take the second part
  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token format invalid.' })
  }

  try {
    // jwt.verify checks the token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach user info to the request so route handlers can use it
    // e.g. req.user.userId, req.user.role
    req.user = decoded

    next()   // token is valid → continue to the route handler

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' })
    }
    return res.status(401).json({ error: 'Invalid token. Please sign in again.' })
  }
}

module.exports = verifyToken
