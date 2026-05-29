import express from 'express';
import { 
  createTransaction, 
  getAllTransactions, 
  getTransactionById, 
  updateTransaction, 
  deleteTransaction, 
  getTransactionStats,
  getTransactionsByWallet
} from '../api/transaction.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateTransaction } from '../middleware/validation.js';

const router = express.Router();

// Tất cả routes cần authentication
router.use(authenticateToken);

router.post('/', validateTransaction, createTransaction);
router.get('/', getAllTransactions);
router.get('/stats', getTransactionStats);
router.get('/wallet/:walletId', getTransactionsByWallet);
router.get('/:transactionId', getTransactionById);
router.put('/:transactionId', validateTransaction, updateTransaction);
router.delete('/:transactionId', deleteTransaction);

export default router;
