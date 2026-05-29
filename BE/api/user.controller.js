import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User } from '../models/index.js';
import TryCatch from '../utils/trycatch.js';
import { sendResetPasswordEmail, sendWelcomeEmail } from '../services/emailService.js';

// Đăng ký user mới
export const register = TryCatch(async (req, res) => {
  const { fullName, email, password } = req.body;

  // Kiểm tra email đã tồn tại chưa
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: 'Email đã được sử dụng' });
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Tạo user mới
  const user = await User.create({
    fullName,
    email,
    passwordHash
  });

  // Tạo JWT token
  const token = jwt.sign(
    { userId: user.userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Gửi email chào mừng (không cần đợi)
  sendWelcomeEmail(email, fullName).catch(error => {
    console.error('Error sending welcome email:', error);
  });

  res.status(201).json({
    message: 'Đăng ký thành công',
    token,
    user: {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  });
});

// Đăng nhập
export const login = TryCatch(async (req, res) => {
  const { email, password } = req.body;

  // Tìm user theo email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  }

  // Kiểm tra password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  }

  // Tạo JWT token
  const token = jwt.sign(
    { userId: user.userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    message: 'Đăng nhập thành công',
    token,
    user: {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  });
});

// Lấy thông tin user hiện tại
export const getProfile = TryCatch(async (req, res) => {
  const user = await User.findByPk(req.user.userId, {
    attributes: { exclude: ['passwordHash'] }
  });

  res.json({
    user
  });
});

// Cập nhật thông tin user
export const updateProfile = TryCatch(async (req, res) => {
  const { fullName, email } = req.body;
  const userId = req.user.userId;

  // Kiểm tra email đã tồn tại chưa (nếu thay đổi email)
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }
  }

  await User.update(
    { fullName, email },
    { where: { userId } }
  );

  res.json({ message: 'Cập nhật thông tin thành công' });
});

// Đổi mật khẩu
export const changePassword = TryCatch(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  // Lấy user với password hash
  const user = await User.findByPk(userId);
  
  // Kiểm tra mật khẩu hiện tại
  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValidPassword) {
    return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
  }

  // Hash mật khẩu mới
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  // Cập nhật mật khẩu
  await User.update(
    { passwordHash },
    { where: { userId } }
  );

  res.json({ message: 'Đổi mật khẩu thành công' });
});

// Lấy danh sách tất cả users (admin only)
export const getAllUsers = TryCatch(async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ['passwordHash'] },
    order: [['createdAt', 'DESC']]
  });

  res.json({ users });
});

// Xóa user (admin only)
export const deleteUser = TryCatch(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ message: 'User không tồn tại' });
  }

  await User.destroy({ where: { userId } });

  res.json({ message: 'Xóa user thành công' });
});

// Quên mật khẩu - Gửi email reset
export const forgotPassword = TryCatch(async (req, res) => {
  const { email } = req.body;

  try {
    console.log('Forgot password request for email:', email);
    
    // Kiểm tra email có tồn tại không
    const user = await User.findOne({ 
      where: { email },
      attributes: ['userId', 'email', 'fullName'] // Chỉ lấy các field cần thiết
    });
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      });
    }

    console.log('User found:', user.userId, user.email);

    // Tạo token reset đơn giản
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    console.log('Generated reset token:', resetToken);

    // Gửi email reset password
    const emailResult = await sendResetPasswordEmail(user.email, resetToken, user.fullName);
    
    if (emailResult.success) {
      const response = {
        success: true,
        message: emailResult.testMode 
          ? 'Email reset mật khẩu đã được gửi (Test Mode - chưa cấu hình email)'
          : 'Email reset mật khẩu đã được gửi đến hộp thư của bạn',
        resetToken: resetToken, // Chỉ để test - xóa trong production
        userEmail: user.email
      };
      
      if (emailResult.testMode) {
        response.testMode = true;
        response.resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
      }
      
      res.json(response);
    } else {
      console.error('Failed to send email:', emailResult.error);
      res.status(500).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau.',
        error: emailResult.error
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi email reset mật khẩu',
      error: error.message
    });
  }
});

// Reset mật khẩu
export const resetPassword = TryCatch(async (req, res) => {
  const { token, newPassword, email } = req.body;

  try {
    console.log('Reset password request with token:', token, 'email:', email);
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token và mật khẩu mới là bắt buộc'
      });
    }

    // Tìm user bằng email (tạm thời để test)
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else {
      // Nếu không có email, tìm user đầu tiên để test
      user = await User.findOne();
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user để reset mật khẩu'
      });
    }

    console.log('Resetting password for user:', user.email);

    // Mã hóa mật khẩu mới
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Cập nhật mật khẩu
    await user.update({ 
      passwordHash: newPasswordHash
    });

    console.log('Password reset successfully');

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt lại mật khẩu',
      error: error.message
    });
  }
});
