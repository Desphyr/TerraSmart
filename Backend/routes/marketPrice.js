import express from 'express'
import { getMarketPrices } from '../controllers/marketPriceController.js'

const router = express.Router()

router.get('/', getMarketPrices)

export default router
