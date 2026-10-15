import mongoose from 'mongoose'
import Farm from '../db/models/Farm.js'

export const getOwnedFarm = async (farmId, userId, res) => {
  if (!mongoose.isValidObjectId(farmId)) {
    res.status(400)
    throw new Error('Invalid farm ID')
  }
  const farm = await Farm.findOne({ _id: farmId, owner: userId })
  if (!farm) {
    res.status(404)
    throw new Error('Farm not found')
  }
  return farm
}