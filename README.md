# Backend API - Recruitment Web

Backend API cho ứng dụng tuyển dụng sử dụng Express.js và Supabase.

## 🎯 Authentication with Supabase

**Important:** This backend uses **Supabase Auth** for authentication. The frontend can authenticate directly with Supabase without starting this backend.

### 📚 Complete Documentation
- 📑 **Documentation Index**: [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - Start here!
- 📖 **Quick Start**: [AUTH_QUICKSTART.md](./AUTH_QUICKSTART.md) - 5 minute setup
- 📘 **Full Integration Guide**: [FRONTEND_AUTH_INTEGRATION.md](./FRONTEND_AUTH_INTEGRATION.md)
- 🔧 **Environment Variables**: [ENV_VARIABLES_FRONTEND.md](./ENV_VARIABLES_FRONTEND.md)
- 👥 **Team Setup**: [TEAM_SETUP_GUIDE.md](./TEAM_SETUP_GUIDE.md)
- 🏗️ **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- ✅ **Migration Summary**: [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)

### Backend Purpose
- Validate JWT tokens from Supabase
- Manage user profiles and additional data
- Handle business logic and protected endpoints

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Supabase

1. Tạo tài khoản tại [Supabase](https://supabase.com/)
2. Tạo một project mới
3. Tạo file `.env` từ file `.env.example`:

```bash
cp .env.example .env
```

4. Cập nhật các biến môi trường trong file `.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=your_strong_jwt_secret_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. Cấu hình Database (Optional)

Nếu bạn muốn lưu thêm thông tin profile, tạo bảng `user_profiles` trong Supabase:

```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'candidate' CHECK (role IN ('candidate', 'employer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE
ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Chỉ cho phép user xem và cập nhật profile của chính họ
CREATE POLICY "Users can view own profile" ON user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);
```

## Chạy ứng dụng

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

Server sẽ chạy tại `http://localhost:3001`

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Đăng ký tài khoản mới

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Tên đầy đủ",
  "role": "candidate" // optional: candidate, employer, admin
}
```

**Response:**
```json
{
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Tên đầy đủ",
    "role": "candidate",
    "emailConfirmed": false
  }
}
```

#### POST `/api/auth/login`
Đăng nhập

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Đăng nhập thành công",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Tên đầy đủ",
    "role": "candidate",
    "emailConfirmed": true
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890
  }
}
```

#### GET `/api/auth/me`
Lấy thông tin user hiện tại (cần authentication)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Tên đầy đủ",
    "role": "candidate",
    "emailConfirmed": true,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

#### POST `/api/auth/logout`
Đăng xuất (cần authentication)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Đăng xuất thành công"
}
```

### Health Check

#### GET `/health`
Kiểm tra trạng thái server

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-01T00:00:00Z",
  "environment": "development"
}
```

## Cấu trúc thư mục

```
backend/
├── app.js                  # File server chính
├── package.json           
├── .env.example           # Template cho biến môi trường
├── .gitignore            
├── README.md             
├── config/
│   └── supabase.js       # Cấu hình Supabase client
├── controllers/
│   └── authController.js # Controller xử lý authentication
├── middleware/
│   └── auth.js           # Middleware xác thực và phân quyền
└── routes/
    └── auth.js           # Routes cho authentication
```

## Lưu ý bảo mật

1. **Không commit file .env** vào git
2. **Sử dụng JWT secret mạnh** cho production
3. **Cấu hình CORS** phù hợp với domain frontend
4. **Enable Row Level Security** trong Supabase
5. **Xác thực email** trước khi cho phép đăng nhập

## Troubleshooting

### Lỗi kết nối Supabase
- Kiểm tra `SUPABASE_URL` và `SUPABASE_ANON_KEY`
- Đảm bảo project Supabase đang active

### Lỗi CORS
- Kiểm tra `CORS_ORIGIN` trong file .env
- Đảm bảo frontend URL đúng

### Lỗi authentication
- Kiểm tra token trong request header
- Đảm bảo format: `Authorization: Bearer <token>`