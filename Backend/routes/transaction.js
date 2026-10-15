import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  createTransaction, getTransactions, updateTransaction, deleteTransaction, getSummary,
} from '../controllers/transactionController.js'

const router = express.Router()
router.use(protect, authorize('farmer'))

router.get('/summary', getSummary)
router.route('/').get(getTransactions).post(createTransaction)
router.route('/:id').put(updateTransaction).delete(deleteTransaction)

export default router