# Environment Variables for Frontend Team

## Required Variables

Frontend developers need these environment variables to connect to Supabase:

### For Vite/React
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_BASE_URL=http://localhost:3000/api
```

### For Next.js
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### For Create React App
```env
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_API_BASE_URL=http://localhost:3000/api
```

---

## How to Get These Values

### Backend Team Should Provide:

1. **SUPABASE_URL**: Your Supabase project URL
   - Found in: Supabase Dashboard → Settings → API → Project URL
   - Format: `https://xxxxxxxxxxxxx.supabase.co`

2. **SUPABASE_ANON_KEY**: Public anonymous key (safe for frontend)
   - Found in: Supabase Dashboard → Settings → API → anon/public key
   - This is the **public** key (NOT the service_role key)
   - Safe to use in frontend code

3. **API_BASE_URL**: Your backend API endpoint
   - Development: `http://localhost:3000/api`
   - Production: `https://your-domain.com/api`

---

## ⚠️ Important Security Notes

### ✅ Safe to Share (Public Keys)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (anon/public key)
- These are designed to be exposed in frontend code

### ❌ Never Share (Secret Keys)
- `SUPABASE_SERVICE_ROLE_KEY` - Backend only!
- Database passwords
- Other service role keys

---

## Setup Instructions

### 1. Create Environment File

```bash
# In your frontend project root
touch .env.local  # or .env
```

### 2. Add Variables

Copy the appropriate template above and paste your actual values.

### 3. Restart Dev Server

```bash
npm run dev
# or
yarn dev
```

### 4. Verify Setup

```javascript
// Test if environment variables are loaded
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Has Anon Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
```

---

## Different Environments

### Development (.env.development)
```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev_key...
VITE_API_BASE_URL=http://localhost:3000/api
```

### Production (.env.production)
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod_key...
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

---

## Troubleshooting

### Variables Not Loading

**Vite/React:**
- Prefix must be `VITE_`
- Restart dev server after changes
- File must be `.env` or `.env.local`

**Next.js:**
- Prefix must be `NEXT_PUBLIC_`
- Restart dev server after changes

**Create React App:**
- Prefix must be `REACT_APP_`
- Restart dev server after changes

### "Invalid API Key" Error

- Double-check you're using the **anon key**, not service_role key
- Ensure no extra spaces in the .env file
- Verify the key is for the correct Supabase project

### CORS Errors

- Check `VITE_API_BASE_URL` is correct
- Ensure backend is running
- Backend must have CORS configured for your frontend URL

---

## Example .env.local File

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xjqxzqjkfzqzqjkfzq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcXh6cWprZnpxenFqa2Z6cSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwMDAwMDAwLCJleHAiOjE5NTU1NzYwMDB9.example-key-here

# Backend API
VITE_API_BASE_URL=http://localhost:3000/api

# Optional: Feature flags
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG_MODE=true
```

---

## Git Configuration

### Add to .gitignore

```gitignore
# Environment variables
.env
.env.local
.env.development
.env.production
.env*.local

# Keep example file
!.env.example
```

### Create .env.example

```env
# Copy this file to .env.local and fill in your values

# Supabase Configuration (get from backend team)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Backend API URL
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## Quick Test

After setting up environment variables, test the connection:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Test connection
async function testConnection() {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('❌ Connection failed:', error.message)
  } else {
    console.log('✅ Successfully connected to Supabase!')
  }
}

testConnection()
```

---

## Contact Backend Team

If you need these values, ask your backend team for:
1. Supabase Project URL
2. Supabase Anon Key (public key)
3. Backend API URL

They can find these in:
- Supabase Dashboard → Settings → API
- Backend `.env` file (they'll share the public values)

---

**Ready to develop!** 🚀

See [AUTH_QUICKSTART.md](./AUTH_QUICKSTART.md) for usage examples.
