-- Thêm cột Icon vào bảng Categories
ALTER TABLE Categories ADD COLUMN Icon VARCHAR(50) DEFAULT '📝';

-- Cập nhật dữ liệu mẫu với icons
UPDATE Categories SET Icon = '💰' WHERE Name = 'Lương';
UPDATE Categories SET Icon = '🎁' WHERE Name = 'Thưởng';
UPDATE Categories SET Icon = '🍕' WHERE Name = 'Ăn uống';
UPDATE Categories SET Icon = '🚗' WHERE Name = 'Đi lại';
UPDATE Categories SET Icon = '🎬' WHERE Name = 'Giải trí';

-- Thêm thêm categories mẫu với icons
INSERT INTO Categories (Name, Type, Icon) VALUES 
('Cafe', 'expense', '☕'),
('Mua sắm', 'expense', '🛒'),
('Xăng xe', 'expense', '⛽'),
('Ăn sáng', 'expense', '🥐'),
('Ăn trưa', 'expense', '🍜'),
('Ăn tối', 'expense', '🍽️'),
('Đi chợ', 'expense', '🛍️'),
('Thu nhập phụ', 'income', '💼'),
('Đầu tư', 'income', '📈'),
('Quà tặng', 'income', '🎁'),
('Bán đồ', 'income', '💰'),
('Hóa đơn', 'expense', '📄'),
('Y tế', 'expense', '🏥'),
('Giáo dục', 'expense', '📚'),
('Nhà ở', 'expense', '🏠'),
('Điện thoại', 'expense', '📱'),
('Internet', 'expense', '🌐'),
('Bảo hiểm', 'expense', '🛡️'),
('Tiết kiệm', 'income', '💎'),
('Lãi ngân hàng', 'income', '🏦');
