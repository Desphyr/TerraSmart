import Activity from '../db/models/Activity.js'
import Farm from '../db/models/Farm.js'
import User from '../db/models/User.js'
import asyncHandler from '../middleware/asyncHandler.js'

export const getAdminStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalFarmers, totalFarms, totalActivities] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'farmer' }),
    Farm.countDocuments(),
    Activity.countDocuments(),
  ])

  res.json({ totalUsers, totalFarmers, totalFarms, totalActivities })
})

export const getAdminUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('name email phone role createdAt')
    .sort({ createdAt: -1 })
    .lean()

  res.json(users)
})

export const getAdminFarms = asyncHandler(async (req, res) => {
  const farms = await Farm.find()
    .populate('owner', 'name email phone role')
    .sort({ createdAt: -1 })
    .lean()

  res.json(farms)
})

export const getAdminActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find()
    .populate('owner', 'name email phone')
    .populate('farm', 'name cropType locationName latitude longitude')
    .sort({ date: -1, createdAt: -1 })
    .lean()

  res.json(activities)
})
