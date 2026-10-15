import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  getAdminActivities,
  getAdminFarms,
  getAdminStats,
  getAdminUsers,
} from '../controllers/adminController.js'

const router = express.Router()

router.use(protect, authorize('admin'))

router.get('/stats', getAdminStats)
router.get('/users', getAdminUsers)
router.get('/farms', getAdminFarms)
router.get('/activities', getAdminActivities)
router.get('/ping', (req, res) => {
  res.json({ message: `Welcome, admin ${req.user.name}` })
})

export default router