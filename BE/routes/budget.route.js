import express from 'express';
import {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetStats
} from '../api/budget.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticateToken);

// CRUD operations
router.get('/', getBudgets);
router.get('/stats', getBudgetStats);
router.get('/progress', getBudgetStats); // Sử dụng getBudgetStats cho progress
router.get('/:budgetId', getBudgetById);
router.post('/', createBudget);
router.put('/:budgetId', updateBudget);
router.delete('/:budgetId', deleteBudget);

export default router;