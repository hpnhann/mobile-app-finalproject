# 💰 DAU Smart Finance

Ứng dụng quản lý chi tiêu thông minh gồm **Backend API** (Node.js + MySQL) và **Mobile App** (React Native / Expo).

---

## 📁 Cấu trúc dự án

```
SourceCode/
├── BE/                  # Backend API (Node.js, Express, Sequelize, MySQL)
├── mobile-app/          # Mobile App (React Native, Expo, Expo Router)
└── smart_finance.sql    # File SQL khởi tạo database
```

---

## ⚙️ Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---|---|
| Node.js | >= 18.x |
| npm | >= 9.x |
| MySQL | >= 8.0 |
| Expo CLI | >= 0.18 |
| Git | Bất kỳ |

> **Mobile:** Cài **Expo Go** trên điện thoại ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)) hoặc dùng Android Emulator / iOS Simulator.

---

## 🚀 Hướng dẫn chạy demo

### Bước 1 — Chuẩn bị Database

1. Mở MySQL (MySQL Workbench, phpMyAdmin, hoặc terminal):

```sql
CREATE DATABASE IF NOT EXISTS dau_smart_finance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

2. Import dữ liệu mẫu từ file SQL có sẵn:

```bash
# Trong terminal (thay <password> bằng mật khẩu MySQL của bạn)
mysql -u root -p dau_smart_finance < smart_finance.sql
```

---

### Bước 2 — Chạy Backend (BE)

```bash
# 1. Di chuyển vào thư mục BE
cd BE

# 2. Cài đặt dependencies
npm install

# 3. Tạo file cấu hình môi trường
copy env.example .env
```

4. Mở file `.env` và chỉnh sửa thông tin database:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD     # ← đổi thành mật khẩu MySQL của bạn
DB_NAME=dau_smart_finance
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

PORT=5000
NODE_ENV=development

FRONTEND_URL=http://localhost:3000

# (Tuỳ chọn) Email để gửi thông báo
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

5. Khởi động server:

```bash
# Development mode (tự reload khi sửa code)
npm run dev

# Hoặc production mode
npm start
```

✅ Server chạy thành công sẽ hiển thị:
```
🚀 Server đang chạy trên port 5000
📊 API Documentation: http://localhost:5000/api/health
🌍 Environment: development
```

Kiểm tra API hoạt động: mở trình duyệt truy cập **http://localhost:5000**

---

### Bước 3 — Chạy Mobile App

> Mở **terminal mới** (giữ nguyên terminal Backend đang chạy).

```bash
# 1. Di chuyển vào thư mục mobile-app
cd mobile-app

# 2. Cài đặt dependencies
npm install

# 3. Khởi động Expo
npm start
```

Sau khi khởi động, terminal sẽ hiển thị **QR code** và menu lựa chọn:

```
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
› Scan QR │ mở trên Expo Go (điện thoại thật)
```

#### 📱 Chạy trên điện thoại thật
1. Mở app **Expo Go** trên điện thoại.
2. Quét **QR code** hiển thị trong terminal.
3. Đảm bảo điện thoại và máy tính **cùng mạng Wi-Fi**.

#### 🤖 Chạy trên Android Emulator
```bash
npm run android
```

#### 🌐 Chạy trên trình duyệt Web
```bash
npm run web
```

---

### Bước 4 — Kết nối Mobile App với Backend

Trong thư mục `mobile-app/`, tìm file cấu hình URL API (thường ở `lib/` hoặc `constants/`) và đảm bảo URL trỏ đúng về máy chủ backend:

```js
// Nếu chạy trên máy thật (Expo Go) — dùng IP LAN của máy tính
const API_URL = "http://192.168.x.x:5000/api";

// Nếu chạy trên Android Emulator
const API_URL = "http://10.0.2.2:5000/api";

// Nếu chạy trên Web (cùng máy)
const API_URL = "http://localhost:5000/api";
```

> 💡 Xem IP LAN của máy: chạy `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux).

---

## 🧪 Kiểm tra nhanh API

Dùng **Postman** với file collection có sẵn:

```
BE/postman.json
```

Import file này vào Postman, chọn môi trường `localhost:5000` và test các endpoint.

### Một số endpoint cơ bản

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `http://localhost:5000/` | Health check |
| POST | `http://localhost:5000/api/users/register` | Đăng ký tài khoản |
| POST | `http://localhost:5000/api/users/login` | Đăng nhập |
| GET | `http://localhost:5000/api/categories` | Lấy danh mục |
| GET | `http://localhost:5000/api/transactions` | Lấy giao dịch (cần auth) |

---

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** + **Express.js** — Runtime & Web framework
- **Sequelize** — ORM cho MySQL
- **MySQL** — Cơ sở dữ liệu
- **JWT** — Xác thực người dùng
- **bcryptjs** — Mã hóa mật khẩu
- **Google Generative AI** — Tính năng AI

### Mobile App
- **React Native** + **Expo** — Framework mobile cross-platform
- **Expo Router** — File-based routing
- **Axios** — HTTP client gọi API
- **React Native Paper** — UI components
- **AsyncStorage** — Lưu trữ local

---

## ❓ Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| `Cannot connect to database` | Sai thông tin DB hoặc MySQL chưa chạy | Kiểm tra `.env` và khởi động MySQL |
| `Network request failed` (mobile) | Sai API URL hoặc khác mạng | Dùng IP LAN thay `localhost` |
| `Port 5000 already in use` | Cổng 5000 đang bị chiếm | Đổi `PORT` trong `.env` sang `5001` |
| `Module not found` | Chưa cài dependencies | Chạy lại `npm install` |
| QR code không quét được | Khác mạng Wi-Fi | Đảm bảo cùng mạng, hoặc dùng `expo start --tunnel` |

---

## 📞 Liên hệ

Dự án **DAU Smart Finance** — Ứng dụng quản lý tài chính cá nhân thông minh.
