# 🚀 Recruitment Web Backend Setup Guide

## 📋 Database Setup

### Bước 1: Cấu hình Supabase Service Role Key

1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** > **API** 
4. Copy **service_role** key
5. Cập nhật file `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

### Bước 2: Chạy Migration (Tự động)

```bash
# Chạy migration tạo tables và seed data
npm run db:migrate
```

### Bước 3: Setup thủ công (nếu migration tự động thất bại)

1. Truy cập **Supabase Dashboard** > **SQL Editor**
2. Chạy file `scripts/01_create_tables.sql` 
3. Chạy file `scripts/02_seed_data.sql`

## 🗄️ Database Schema

### Tables được tạo:

1. **user_profiles** - Thông tin chi tiết user
2. **provinces** - Danh sách tỉnh thành
3. **districts** - Danh sách quận huyện  
4. **business_fields** - Lĩnh vực kinh doanh
5. **company_descriptions** - Mô tả loại hình công ty
6. **companies** - Thông tin công ty (cho employer)
7. **user_business_fields** - Liên kết user với lĩnh vực
8. **user_company_descriptions** - Liên kết user với mô tả công ty

## 🔌 API Endpoints

### Auth Endpoints

#### POST `/api/auth/register`

**Request Body:**
```json
{
  "role": "candidate|employer",
  "email": "user@example.com",
  "password": "Password123",
  "firstName": "Nguyen",
  "lastName": "Van A", 
  "phone": "0987654321",
  "dateOfBirth": "1990-01-01",
  "gender": "male|female|other",
  "address": "123 ABC Street",
  "companyName": "ABC Company", // chỉ cho employer
  "province": "hanoi", 
  "district": "ba-dinh",
  "businessField": ["tu-van", "cong-nghe"],
  "companyDescription": ["cong-nghe-thong-tin"],
  "knowAboutUs": "Giới thiệu bạn bè",
  "lookingFor": "UI/UX Designer",
  "salaryRange": "15-20", 
  "companySize": "51-200"
}
```

#### POST `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

### Data Endpoints

- `GET /api/data/provinces` - Lấy danh sách tỉnh thành
- `GET /api/data/districts/:provinceCode` - Lấy quận huyện theo tỉnh
- `GET /api/data/business-fields` - Lấy lĩnh vực kinh doanh  
- `GET /api/data/company-descriptions` - Lấy mô tả công ty
- `GET /api/data/profile/:userId` - Lấy profile user đầy đủ

## 🧪 Testing

### Chạy test tự động:
```bash
node test_new_form.js
```

### Test thủ công với curl:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "role": "candidate",
    "email": "test@example.com", 
    "password": "Password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## 📝 Validation Rules

### Required Fields:
- ✅ **email** (phải đúng format)
- ✅ **password** (tối thiểu 8 ký tự)
- ✅ **firstName** 
- ✅ **lastName**

### Optional Fields:
- phone (validate format số điện thoại)
- dateOfBirth (không được là tương lai)
- gender (male/female/other)
- address, province, district
- businessField (array of codes)
- companyDescription (array of codes)  
- companyName (bắt buộc nếu role = employer)

## 🔧 Available Scripts

```bash
npm start          # Chạy server production
npm run dev        # Chạy server development với nodemon
npm run db:migrate # Chạy migration database
npm run db:setup   # Alias cho db:migrate
```

## 🌟 Features

- ✅ **Complete user registration** với thông tin đầy đủ
- ✅ **Multi-select fields** (business fields, company descriptions)
- ✅ **Location support** (provinces/districts)
- ✅ **Role-based features** (candidate/employer)
- ✅ **Company creation** cho employer
- ✅ **Data validation** comprehensive
- ✅ **Auto migration scripts** 
- ✅ **RESTful API endpoints** cho frontend
- ✅ **Roadmap CRUD** với nested sections, lessons, skills, resources

## 📊 Database Relationships

```
auth.users (Supabase)
    ↓
user_profiles
    ↓
┌─ companies (if employer)
├─ user_business_fields → business_fields  
├─ user_company_descriptions → company_descriptions
├─ provinces
├─ districts
└─ roadmaps
    ├─ roadmap_sections
    │   └─ roadmap_lessons
    │       ├─ roadmap_skills
    │       └─ roadmap_resources
    └─ user_roadmap_progress
```

## 🗺️ Roadmap API Endpoints

### Roadmap CRUD

- `GET /api/roadmaps` - Lấy danh sách roadmaps (query: status, category, page, limit)
- `GET /api/roadmaps/stats` - Lấy thống kê tiến độ
- `GET /api/roadmaps/:id` - Lấy chi tiết roadmap với sections, lessons, skills, resources
- `POST /api/roadmaps` - Tạo roadmap mới
- `PUT /api/roadmaps/:id` - Cập nhật roadmap
- `DELETE /api/roadmaps/:id` - Xóa roadmap

### Section Operations

- `POST /api/roadmaps/:roadmapId/sections` - Thêm section
- `PUT /api/roadmaps/sections/:sectionId` - Cập nhật section
- `DELETE /api/roadmaps/sections/:sectionId` - Xóa section

### Lesson Operations

- `POST /api/roadmaps/sections/:sectionId/lessons` - Thêm lesson
- `PUT /api/roadmaps/lessons/:lessonId/status` - Cập nhật trạng thái lesson

### Roadmap Tables

Chạy file `scripts/03_create_roadmap_tables.sql` trong Supabase SQL Editor để tạo:
- `roadmaps` - Lộ trình chính
- `roadmap_sections` - Các phần của lộ trình
- `roadmap_lessons` - Bài học trong section
- `roadmap_skills` - Kỹ năng trong lesson
- `roadmap_resources` - Tài nguyên học tập
- `user_roadmap_progress` - Theo dõi tiến độ user