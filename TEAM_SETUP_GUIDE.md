# 🚀 Team Setup Guide - Supabase Auth

## For Frontend Team

### What You Need
1. **Environment Variables** (get from backend team):
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Documentation**:
   - 📖 Quick Start: [AUTH_QUICKSTART.md](./AUTH_QUICKSTART.md)
   - 📘 Full Guide: [FRONTEND_AUTH_INTEGRATION.md](./FRONTEND_AUTH_INTEGRATION.md)

### Install & Setup (2 minutes)

```bash
# Install Supabase
npm install @supabase/supabase-js

# Add to .env
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

### Basic Usage

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Login
const { data } = await supabase.auth.signInWithPassword({
  email: 'user@email.com',
  password: 'password123'
})

// Get token for API calls
const token = data.session.access_token

// Call backend API
fetch('http://localhost:3000/api/jobs', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

---

## For Backend Team

### Environment Variables Required

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
```

### Share with Frontend
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (NOT the service role key!)

### Start Backend

```bash
npm install
npm start
```

---

## How Authentication Works Now

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ 1. Auth directly
       ▼
┌─────────────┐
│  Supabase   │ ◄── No backend needed for login!
└──────┬──────┘
       │ 2. Get token
       │
       ▼
┌─────────────┐
│   Backend   │ ◄── 3. Use token for API calls
└─────────────┘
```

### Key Points
- ✅ Login/Register works WITHOUT backend running
- ✅ Backend only validates tokens for protected routes
- ✅ Tokens auto-refresh (no manual handling needed)

---

## Testing

### Test Auth (Frontend Only)
```javascript
// This works without backend!
const { data, error } = await supabase.auth.signUp({
  email: 'test@test.com',
  password: 'password123'
})
console.log('Success!', data.user)
```

### Test API Call (Frontend + Backend)
```javascript
// Get token
const { data: { session } } = await supabase.auth.getSession()

// Call backend
const response = await fetch('http://localhost:3000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${session.access_token}` }
})
const userData = await response.json()
console.log('User from backend:', userData)
```

---

## Troubleshooting

### "Invalid JWT" error
- Token expired or invalid
- Check if Supabase project is active
- Verify backend has correct `SUPABASE_SERVICE_ROLE_KEY`

### CORS error
- Backend needs to allow frontend URL
- Check backend CORS configuration

### Can't login
- Verify environment variables
- Check Supabase dashboard for auth logs
- Ensure email confirmation is configured correctly

---

## 📚 Full Documentation

- **Quick Start**: [AUTH_QUICKSTART.md](./AUTH_QUICKSTART.md)
- **Complete Guide**: [FRONTEND_AUTH_INTEGRATION.md](./FRONTEND_AUTH_INTEGRATION.md)
- **Migration Info**: [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)

---

## Support

1. Check documentation files above
2. Review Supabase Auth logs in dashboard
3. Verify environment variables
4. Check backend terminal for errors

**Ready to go! 🎉**
