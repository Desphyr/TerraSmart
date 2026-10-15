import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  createActivity, getActivities, updateActivity, deleteActivity,
} from '../controllers/activityController.js'

const router = express.Router()
router.use(protect, authorize('farmer'))

router.route('/').get(getActivities).post(createActivity)
router.route('/:id').put(updateActivity).delete(deleteActivity)

export default router