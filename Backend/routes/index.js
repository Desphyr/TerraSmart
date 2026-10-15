import express from 'express'
import userRoutes from './user.js'
import farmRoutes from './farm.js'
import activityRoutes from './activity.js'
import transactionRoutes from './transaction.js'
import weatherRoutes from './weather.js'
import marketPriceRoutes from './marketPrice.js'

const router = express.Router()

router.use('/users', userRoutes)
router.use('/farms', farmRoutes)
router.use('/activities', activityRoutes)
router.use('/transactions', transactionRoutes)
router.use('/weather', weatherRoutes)
router.use('/market-prices', marketPriceRoutes)

export default router