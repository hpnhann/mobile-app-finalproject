import nodemailer from 'nodemailer';

// Cấu hình email transporter
const createTransporter = () => {
  // Sử dụng Gmail SMTP (bạn có thể thay đổi theo email provider khác)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Email của bạn
      pass: process.env.EMAIL_PASS  // App password của Gmail
    }
  });
};

// Gửi email reset password
export const sendResetPasswordEmail = async (email, resetToken, userName) => {
  try {
    // Kiểm tra cấu hình email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email not configured, returning success for testing');
      return { 
        success: true, 
        messageId: 'test-' + Date.now(),
        testMode: true 
      };
    }

    const transporter = createTransporter();
    
    // Tạo link reset password
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    // Nội dung email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Đặt lại mật khẩu - DAU Smart Finance',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">DAU Smart Finance</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Quản lý tài chính thông minh</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Xin chào ${userName || 'Bạn'}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. 
              Nếu bạn không yêu cầu thay đổi này, vui lòng bỏ qua email này.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                Đặt lại mật khẩu
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Hoặc copy và paste link này vào trình duyệt:
            </p>
            
            <div style="background: #e9ecef; padding: 15px; border-radius: 5px; word-break: break-all;">
              <a href="${resetLink}" style="color: #667eea; text-decoration: none;">${resetLink}</a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                <strong>Lưu ý:</strong> Link này sẽ hết hạn sau 15 phút. 
                Nếu bạn gặp vấn đề, vui lòng liên hệ với chúng tôi.
              </p>
            </div>
          </div>
          
          <div style="background: #343a40; padding: 20px; text-align: center;">
            <p style="color: #adb5bd; margin: 0; font-size: 14px;">
              © 2025 DAU Smart Finance. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      `
    };

    // Gửi email
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Gửi email chào mừng (khi đăng ký)
export const sendWelcomeEmail = async (email, userName) => {
  try {
    // Kiểm tra cấu hình email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email not configured, skipping welcome email');
      return { 
        success: true, 
        messageId: 'test-welcome-' + Date.now(),
        testMode: true 
      };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Chào mừng đến với DAU Smart Finance!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">DAU Smart Finance</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Quản lý tài chính thông minh</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Chào mừng ${userName}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Cảm ơn bạn đã đăng ký tài khoản tại DAU Smart Finance. 
              Bây giờ bạn có thể bắt đầu quản lý tài chính cá nhân một cách thông minh và hiệu quả.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                Đăng nhập ngay
              </a>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">Các tính năng chính:</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>📊 Quản lý thu chi hàng ngày</li>
                <li>💰 Lập ngân sách và theo dõi chi tiêu</li>
                <li>🎯 Đặt mục tiêu tiết kiệm</li>
                <li>📈 Báo cáo tài chính chi tiết</li>
                <li>🤖 Trợ lý AI tư vấn tài chính</li>
              </ul>
            </div>
          </div>
          
          <div style="background: #343a40; padding: 20px; text-align: center;">
            <p style="color: #adb5bd; margin: 0; font-size: 14px;">
              © 2025 DAU Smart Finance. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};
