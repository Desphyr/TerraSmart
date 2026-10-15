import express from 'express'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.get('/ping', protect, authorize('admin'), (req, res) => {
  res.json({ message: `Welcome, admin ${req.user.name}` })
})

export default router