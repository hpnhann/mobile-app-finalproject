import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  deleteUser,
  forgotPassword,
  resetPassword
} from '../api/user.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateUser } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateUser, register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.use(authenticateToken); // Tất cả routes bên dưới cần authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Admin only routes
router.get('/all', requireAdmin, getAllUsers);
router.delete('/:userId', requireAdmin, deleteUser);

export default router;
