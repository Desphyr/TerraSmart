import mongoose from 'mongoose'
import Activity from '../db/models/Activity.js'
import asyncHandler from '../middleware/asyncHandler.js'
import pick from '../utils/pick.js'
import { getOwnedFarm } from '../utils/ownedFarm.js'

const FIELDS = ['type', 'date', 'notes']

const findOwned = async (id, userId, res) => {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400)
    throw new Error('Invalid ID')
  }
  const item = await Activity.findOne({ _id: id, owner: userId })
  if (!item) {
    res.status(404)
    throw new Error('Activity not found')
  }
  return item
}

export const createActivity = asyncHandler(async (req, res) => {
  await getOwnedFarm(req.body.farm, req.user._id, res)
  const activity = await Activity.create({
    ...pick(req.body, FIELDS),
    farm: req.body.farm,
    owner: req.user._id,
  })
  res.status(201).json(activity)
})

export const getActivities = asyncHandler(async (req, res) => {
  const filter = { owner: req.user._id }
  if (req.query.farm) {
    await getOwnedFarm(req.query.farm, req.user._id, res)
    filter.farm = req.query.farm
  }
  if (req.query.type) filter.type = req.query.type
  res.json(await Activity.find(filter).populate('farm', 'name cropType').sort('-date'))
})

export const updateActivity = asyncHandler(async (req, res) => {
  const activity = await findOwned(req.params.id, req.user._id, res)
  Object.assign(activity, pick(req.body, FIELDS))
  await activity.save()
  res.json(activity)
})

export const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await findOwned(req.params.id, req.user._id, res)
  await activity.deleteOne()
  res.json({ message: 'Activity deleted' })
})