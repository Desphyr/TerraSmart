import jwt from 'jsonwebtoken'
import User from '../db/models/User.js'
import asyncHandler from '../middleware/asyncHandler.js'

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  token: generateToken(user._id),
})

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body

  if (!name || !password || (!email && !phone)) {
    res.status(400)
    throw new Error('Name, password, and email or phone number are required')
  }

  const conditions = []
  if (email) conditions.push({ email: email.toLowerCase() })
  if (phone) conditions.push({ phone })
  if (await User.findOne({ $or: conditions })) {
    res.status(400)
    throw new Error('User already exists')
  }

  const user = await User.create({ name, email, phone, password })
  res.status(201).json(userResponse(user))
})

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body // email atau nomor telepon

  if (!identifier || !password) {
    res.status(400)
    throw new Error('Identifier (email or phone) and password are required')
  }

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  }).select('+password')

  if (!user || !(await user.matchPassword(password))) {
    res.status(401)
    throw new Error('Invalid credentials')
  }

  res.json(userResponse(user))
})

export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user)
})