<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:4f46e5,100:06b6d4&height=220&section=header&text=DAU%20Smart%20Finance&fontSize=52&fontColor=ffffff&fontAlignY=38&desc=Personal%20Finance%20Management%20App&descAlignY=58&descSize=18&animation=fadeIn" width="100%" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=18&pause=1000&color=4f46e5&center=true&vCenter=true&width=600&lines=Backend+API+%7C+Node.js+%2B+Express+%2B+MySQL;Mobile+App+%7C+React+Native+%2B+Expo;JWT+Authentication+%7C+Google+AI+Integration" alt="Typing SVG" />
</p>

---

## Công nghệ sử dụng

### Backend
| Thành phần | Công nghệ |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| ORM | Sequelize |
| Database | MySQL |
| Authentication | JWT + bcryptjs |
| AI | Google Generative AI |
| Khác | Nodemailer, Multer, Morgan, Helmet |

### Mobile App
| Thành phần | Công nghệ |
|---|---|
| Framework | React Native + Expo |
| Routing | Expo Router |
| HTTP Client | Axios |
| UI | React Native Paper |
| Storage | AsyncStorage |
| Ngôn ngữ | TypeScript |

---

## Hướng dẫn chạy demo

### 1. Chuẩn bị Database

Tạo database trong MySQL:

```sql
CREATE DATABASE IF NOT EXISTS dau_smart_finance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Import dữ liệu mẫu:

```bash
mysql -u root -p dau_smart_finance < "smart_finance (1).sql"
```

---

### 2. Chạy Backend

```bash
cd BE
npm install
copy env.example .env
```

Mở file `.env` và cập nhật thông tin kết nối:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dau_smart_finance
DB_PORT=3306

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

PORT=5000
NODE_ENV=development
```

Khởi động server:

```bash
npm run dev
```

Server chạy tại `http://localhost:5000`

---

### 3. Chạy Mobile App

Mở terminal mới (giữ nguyên terminal Backend):

```bash
cd mobile-app
npm install
npm start
```

Chọn nền tảng muốn chạy:

- Nhấn `a` — Android Emulator
- Nhấn `i` — iOS Simulator
- Nhấn `w` — Trình duyệt Web
- Quét QR — Expo Go trên điện thoại thật (cần cài [Expo Go](https://expo.dev/go))

> Khi chạy trên điện thoại thật, máy tính và điện thoại phải cùng mạng Wi-Fi.

---

### 4. Kết nối Mobile App vào Backend

Trong `mobile-app/lib/api.ts`, cập nhật địa chỉ API phù hợp với môi trường:

```ts
// Điện thoại thật (dùng IP LAN của máy tính)
const API_URL = "http://192.168.x.x:5000/api";

// Android Emulator
const API_URL = "http://10.0.2.2:5000/api";

// Web hoặc iOS Simulator
const API_URL = "http://localhost:5000/api";
```

Xem IP LAN bằng lệnh `ipconfig` (Windows) hoặc `ifconfig` (macOS/Linux).

---

### 5. Test API với Postman

Import file collection có sẵn:

```
BE/postman.json
```

Các endpoint chính:

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/users/register` | Đăng ký tài khoản |
| POST | `/api/users/login` | Đăng nhập |
| GET | `/api/categories` | Danh sách danh mục |
| GET | `/api/transactions` | Danh sách giao dịch (cần auth) |
| GET | `/api/budgets` | Danh sách ngân sách (cần auth) |
| GET | `/api/goals` | Danh sách mục tiêu (cần auth) |

Sau khi đăng nhập, thêm header vào mỗi request cần xác thực:

```
Authorization: Bearer <token>
```
