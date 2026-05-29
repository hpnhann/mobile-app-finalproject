-- Migration: Thêm các field cho chức năng reset password
-- Chạy script này để cập nhật bảng Users

USE dau_smart_finance;

-- Thêm các cột mới cho reset password
ALTER TABLE Users 
ADD COLUMN ResetToken VARCHAR(255) NULL,
ADD COLUMN ResetTokenExpires TIMESTAMP NULL;

-- Tạo index cho ResetToken để tìm kiếm nhanh hơn
CREATE INDEX idx_users_reset_token ON Users(ResetToken);

-- Kiểm tra kết quả
DESCRIBE Users;
