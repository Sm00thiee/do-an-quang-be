# Deploy Backend lên Render.com

## 1. Tạo tài khoản Render

1. Truy cập https://render.com
2. Đăng ký bằng GitHub (khuyến nghị)

## 2. Tạo Web Service

1. Click **"New +"** → **"Web Service"**
2. Kết nối với GitHub repository của bạn
3. Chọn repository `recruitment_web`

## 4. Cấu hình Service

| Field | Value |
|-------|-------|
| **Name** | `nextstep-api` |
| **Region** | Singapore (gần VN nhất) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

## 5. Thêm Environment Variables

Trong tab **Environment**, thêm các biến sau:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `SUPABASE_URL` | (copy từ Supabase Dashboard) |
| `SUPABASE_ANON_KEY` | (copy từ Supabase Dashboard) |
| `SUPABASE_SERVICE_ROLE_KEY` | (copy từ Supabase Dashboard) |
| `JWT_SECRET` | (tạo một chuỗi bí mật dài) |
| `CORS_ORIGIN` | (URL của frontend sau khi deploy, vd: https://your-app.vercel.app) |

## 6. Deploy

1. Click **"Create Web Service"**
2. Chờ build hoàn thành (khoảng 2-3 phút)
3. Sau khi deploy xong, bạn sẽ có URL như: `https://nextstep-api.onrender.com`

## Lưu ý quan trọng

- **Free tier** sẽ spin down sau 15 phút không hoạt động
- Request đầu tiên sau khi spin down sẽ mất ~30 giây
- Không giới hạn số lượng requests
