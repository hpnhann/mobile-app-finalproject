import express from 'express';
import {
  getLoans,
  createLoan,
  makeLoanPayment,
  getLoanTransactions,
  updateLoan,
  deleteLoan,
  getLoanStats
} from '../api/loan.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticateToken);

// CRUD operations
router.get('/', getLoans);
router.get('/stats', getLoanStats);
router.get('/:loanId/transactions', getLoanTransactions);
router.post('/', createLoan);
router.put('/:loanId', updateLoan);
router.post('/:loanId/payment', makeLoanPayment);
router.delete('/:loanId', deleteLoan);

export default router;
