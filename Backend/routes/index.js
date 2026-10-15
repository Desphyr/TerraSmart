import express from 'express'
import userRoutes from './user.js'
import adminRoutes from './admin.js'
import farmRoutes from './farm.js'
import activityRoutes from './activity.js'
import transactionRoutes from './transaction.js'

const router = express.Router()

router.use('/users', userRoutes)
router.use('/admin', adminRoutes)
router.use('/farms', farmRoutes)
router.use('/activities', activityRoutes)
router.use('/transactions', transactionRoutes)

export default router