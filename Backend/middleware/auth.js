import jwt from 'jsonwebtoken'
import User from '../db/models/User.js'
import asyncHandler from './asyncHandler.js'

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401)
    throw new Error('Not authorized, no token')
  }

  let decoded
  try {
    decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
  } catch {
    res.status(401)
    throw new Error('Not authorized, token invalid or expired')
  }

  req.user = await User.findById(decoded.id).select('-password')
  if (!req.user) {
    res.status(401)
    throw new Error('Not authorized, user no longer exists')
  }
  next()
})

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    res.status(403)
    throw new Error('Forbidden: you do not have access to this resource')
  }
  next()
}