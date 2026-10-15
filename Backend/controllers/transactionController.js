import mongoose from 'mongoose'
import Transaction from '../db/models/Transaction.js'
import asyncHandler from '../middleware/asyncHandler.js'
import pick from '../utils/pick.js'
import { getOwnedFarm } from '../utils/ownedFarm.js'

const FIELDS = ['type', 'category', 'amount', 'date', 'season', 'description']

const findOwned = async (id, userId, res) => {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400)
    throw new Error('Invalid ID')
  }
  const item = await Transaction.findOne({ _id: id, owner: userId })
  if (!item) {
    res.status(404)
    throw new Error('Transaction not found')
  }
  return item
}

export const createTransaction = asyncHandler(async (req, res) => {
  await getOwnedFarm(req.body.farm, req.user._id, res)
  const tx = await Transaction.create({
    ...pick(req.body, FIELDS),
    farm: req.body.farm,
    owner: req.user._id,
  })
  res.status(201).json(tx)
})

export const getTransactions = asyncHandler(async (req, res) => {
  const filter = { owner: req.user._id }
  if (req.query.farm) {
    await getOwnedFarm(req.query.farm, req.user._id, res)
    filter.farm = req.query.farm
  }
  if (req.query.type) filter.type = req.query.type
  if (req.query.season) filter.season = req.query.season
  res.json(await Transaction.find(filter).populate('farm', 'name').sort('-date'))
})

export const updateTransaction = asyncHandler(async (req, res) => {
  const tx = await findOwned(req.params.id, req.user._id, res)
  Object.assign(tx, pick(req.body, FIELDS))
  await tx.save()
  res.json(tx)
})

export const deleteTransaction = asyncHandler(async (req, res) => {
  const tx = await findOwned(req.params.id, req.user._id, res)
  await tx.deleteOne()
  res.json({ message: 'Transaction deleted' })
})

// Ringkasan: total biaya, pendapatan, dan laba per musim
export const getSummary = asyncHandler(async (req, res) => {
  const match = { owner: new mongoose.Types.ObjectId(req.user._id) }
  if (req.query.farm) {
    await getOwnedFarm(req.query.farm, req.user._id, res)
    match.farm = new mongoose.Types.ObjectId(req.query.farm)
  }
  if (req.query.season) match.season = req.query.season

  const rows = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: { season: '$season', type: '$type' }, total: { $sum: '$amount' } } },
  ])

  const seasons = {}
  for (const r of rows) {
    const s = r._id.season
    seasons[s] ??= { season: s, totalCost: 0, totalIncome: 0 }
    if (r._id.type === 'cost') seasons[s].totalCost = r.total
    else seasons[s].totalIncome = r.total
  }

  res.json(
    Object.values(seasons).map((s) => ({ ...s, profit: s.totalIncome - s.totalCost }))
  )
})