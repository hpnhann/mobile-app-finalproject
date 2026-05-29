import express from 'express';

// Import các routes
import userRoutes from './user.route.js';
import categoryRoutes from './category.route.js';
import transactionRoutes from './transaction.route.js';
import budgetRoutes from './budget.route.js';
import goalRoutes from './goal.route.js';
import walletRoutes from './wallet.route.js';
import loanRoutes from './loan.route.js';
import reportRoutes from './report.route.js';
import aiRoutes from './ai.route.js';

const router = express.Router();

// Sử dụng các routes
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/goals', goalRoutes);
router.use('/wallets', walletRoutes);
router.use('/loans', loanRoutes);
router.use('/reports', reportRoutes);
router.use('/ai', aiRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    message: 'API hoạt động bình thường',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
