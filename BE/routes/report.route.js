import express from 'express';
import {
  getOverviewReport,
  getExpenseByCategoryReport,
  getIncomeByCategoryReport,
  getMonthlyReport,
  getWalletReport
} from '../api/report.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes cần authentication
router.use(authenticateToken);

// Báo cáo tổng quan
router.get('/overview', getOverviewReport);

// Báo cáo chi tiêu theo danh mục
router.get('/expense-by-category', getExpenseByCategoryReport);

// Báo cáo thu nhập theo danh mục
router.get('/income-by-category', getIncomeByCategoryReport);

// Báo cáo theo tháng
router.get('/monthly', getMonthlyReport);

// Báo cáo ví
router.get('/wallets', getWalletReport);

export default router;
