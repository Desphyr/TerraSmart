import Farm from '../db/models/Farm.js'
import asyncHandler from '../middleware/asyncHandler.js'
import pick from "../utils/pick.js";
import { getOwnedFarm } from '../utils/ownedFarm.js'

const FIELDS = ['name', 'area', 'cropType', 'latitude', 'longitude', 'locationName']

export const createFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.create({ ...pick(req.body, FIELDS), owner: req.user._id })
  res.status(201).json(farm)
})

export const getFarms = asyncHandler(async (req, res) => {
  const farms = await Farm.find({ owner: req.user._id }).sort('-createdAt')
  res.json(farms)
})

export const getFarmById = asyncHandler(async (req, res) => {
  res.json(await getOwnedFarm(req.params.id, req.user._id, res))
})

export const updateFarm = asyncHandler(async (req, res) => {
  const farm = await getOwnedFarm(req.params.id, req.user._id, res)
  Object.assign(farm, pick(req.body, FIELDS))
  await farm.save()
  res.json(farm)
})

export const deleteFarm = asyncHandler(async (req, res) => {
  const farm = await getOwnedFarm(req.params.id, req.user._id, res)
  await farm.deleteOne()
  res.json({ message: 'Farm deleted' })
})