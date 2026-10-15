import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  createFarm, getFarms, getFarmById, updateFarm, deleteFarm,
} from '../controllers/farmController.js'

const router = express.Router()
router.use(protect, authorize('farmer'))

router.route('/').get(getFarms).post(createFarm)
router.route('/:id').get(getFarmById).put(updateFarm).delete(deleteFarm)

export default router