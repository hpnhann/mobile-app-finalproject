import express from 'express';
import {
  getWallets,
  getInvestmentWallets,
  getWalletById,
  createWallet,
  updateWallet,
  deleteWallet,
  getWalletStats,
  transferBetweenWallets
} from '../api/wallet.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authenticateToken);

// CRUD operations
router.get('/', getWallets); // Lấy ví ngân sách
router.get('/investment', getInvestmentWallets); // Lấy ví đầu tư
router.get('/stats', getWalletStats);
router.get('/:walletId', getWalletById); // Lấy ví theo ID
router.post('/', createWallet);
router.put('/:walletId', updateWallet);
router.delete('/:walletId', deleteWallet);
router.post('/transfer', transferBetweenWallets); // Chuyển tiền giữa các ví

export default router;
