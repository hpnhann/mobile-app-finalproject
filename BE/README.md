# DAU Smart Finance Backend API

Backend API cho ứng dụng quản lý chi tiêu thông minh sử dụng Node.js, Express, Sequelize và MySQL.

## 🚀 Cài đặt

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
```bash
# Copy file env.example thành .env
cp env.example .env

# Chỉnh sửa file .env với thông tin database của bạn
```

### 3. Tạo database
```sql
CREATE DATABASE IF NOT EXISTS dau_smart_finance
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### 4. Chạy ứng dụng
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📁 Cấu trúc thư mục

```
BE/
├── api/                    # Controllers xử lý logic business
│   ├── user.controller.js
│   ├── transaction.controller.js
│   ├── category.controller.js
│   ├── budget.controller.js
│   └── goal.controller.js
├── config/                 # Cấu hình database
│   └── database.js
├── middleware/             # Middleware functions
│   ├── auth.js
│   └── validation.js
├── models/                 # Sequelize models
│   ├── User.js
│   ├── Category.js
│   ├── Transaction.js
│   ├── Budget.js
│   ├── Goal.js
│   └── index.js
├── routes/                 # API routes
│   ├── user.route.js
│   ├── transaction.route.js
│   ├── category.route.js
│   ├── budget.route.js
│   ├── goal.route.js
│   └── index.js
├── utils/                  # Utility functions
│   └── trycatch.js
├── server.js              # Entry point
├── package.json
└── README.md
```

## 🔗 API Endpoints

### Authentication
- `POST /api/users/register` - Đăng ký user mới
- `POST /api/users/login` - Đăng nhập
- `GET /api/users/profile` - Lấy thông tin profile (cần auth)
- `PUT /api/users/profile` - Cập nhật profile (cần auth)
- `PUT /api/users/change-password` - Đổi mật khẩu (cần auth)

### Categories
- `GET /api/categories` - Lấy tất cả danh mục
- `GET /api/categories/type/:type` - Lấy danh mục theo loại (income/expense)
- `GET /api/categories/:categoryId` - Lấy danh mục theo ID
- `POST /api/categories` - Tạo danh mục mới (admin only)
- `PUT /api/categories/:categoryId` - Cập nhật danh mục (admin only)
- `DELETE /api/categories/:categoryId` - Xóa danh mục (admin only)

### Transactions
- `POST /api/transactions` - Tạo giao dịch mới (cần auth)
- `GET /api/transactions` - Lấy danh sách giao dịch (cần auth)
- `GET /api/transactions/:transactionId` - Lấy giao dịch theo ID (cần auth)
- `PUT /api/transactions/:transactionId` - Cập nhật giao dịch (cần auth)
- `DELETE /api/transactions/:transactionId` - Xóa giao dịch (cần auth)
- `GET /api/transactions/stats/monthly` - Thống kê theo tháng (cần auth)
- `GET /api/transactions/stats/category` - Thống kê theo danh mục (cần auth)

### Budgets
- `POST /api/budgets` - Tạo ngân sách mới (cần auth)
- `GET /api/budgets` - Lấy danh sách ngân sách (cần auth)
- `GET /api/budgets/:budgetId` - Lấy ngân sách theo ID (cần auth)
- `PUT /api/budgets/:budgetId` - Cập nhật ngân sách (cần auth)
- `DELETE /api/budgets/:budgetId` - Xóa ngân sách (cần auth)
- `GET /api/budgets/stats` - Thống kê ngân sách (cần auth)

### Goals
- `POST /api/goals` - Tạo mục tiêu mới (cần auth)
- `GET /api/goals` - Lấy danh sách mục tiêu (cần auth)
- `GET /api/goals/:goalId` - Lấy mục tiêu theo ID (cần auth)
- `PUT /api/goals/:goalId` - Cập nhật mục tiêu (cần auth)
- `PUT /api/goals/:goalId/progress` - Cập nhật tiến độ mục tiêu (cần auth)
- `DELETE /api/goals/:goalId` - Xóa mục tiêu (cần auth)
- `GET /api/goals/stats` - Thống kê mục tiêu (cần auth)

## 🔐 Authentication

API sử dụng JWT (JSON Web Token) để xác thực. Sau khi đăng nhập thành công, bạn sẽ nhận được token cần gửi kèm trong header:

```
Authorization: Bearer <your_jwt_token>
```

## 📊 Database Schema

### Users
- `UserID` (INT, PK, AUTO_INCREMENT)
- `FullName` (VARCHAR(100))
- `Email` (VARCHAR(100), UNIQUE)
- `PasswordHash` (VARCHAR(255))
- `Role` (ENUM: 'admin', 'user')
- `CreatedAt` (TIMESTAMP)

### Categories
- `CategoryID` (INT, PK, AUTO_INCREMENT)
- `Name` (VARCHAR(100))
- `Type` (ENUM: 'income', 'expense')

### Transactions
- `TransactionID` (INT, PK, AUTO_INCREMENT)
- `UserID` (INT, FK)
- `CategoryID` (INT, FK)
- `Amount` (DECIMAL(15,2))
- `TransactionDate` (DATE)
- `Note` (TEXT)
- `CreatedAt` (TIMESTAMP)

### Budgets
- `BudgetID` (INT, PK, AUTO_INCREMENT)
- `UserID` (INT, FK)
- `CategoryID` (INT, FK)
- `Amount` (DECIMAL(15,2))
- `Month` (INT)
- `Year` (INT)

### Goals
- `GoalID` (INT, PK, AUTO_INCREMENT)
- `UserID` (INT, FK)
- `Title` (VARCHAR(100))
- `TargetAmount` (DECIMAL(15,2))
- `CurrentAmount` (DECIMAL(15,2))
- `Deadline` (DATE)
- `CreatedAt` (TIMESTAMP)

## 🛠️ Công nghệ sử dụng

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM cho MySQL
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logger

## 📝 Ghi chú

- API sử dụng ES6 modules (import/export)
- Tất cả responses đều trả về JSON
- Error handling được xử lý tự động
- Rate limiting được áp dụng để bảo vệ API
- CORS được cấu hình để cho phép frontend kết nối
