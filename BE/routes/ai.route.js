import express from 'express';
import { geminiChat } from '../api/ai.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Tất cả các routes AI đều cần đăng nhập
router.use(authenticateToken);

router.post('/chat', geminiChat);

export default router;
