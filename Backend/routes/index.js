import express from 'express'
import userRoutes from './user.js'
import adminRoutes from './admin.js'


const router = express.Router()

router.use('/users', userRoutes)
router.use('/admin', adminRoutes)


export default router