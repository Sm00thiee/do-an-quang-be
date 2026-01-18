# Auth Quick Start Guide

## For Frontend Developers

### 🚀 Quick Setup (5 minutes)

#### 1. Install Supabase

```bash
npm install @supabase/supabase-js
```

#### 2. Create Supabase Config

Create `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'YOUR_SUPABASE_URL',      // Get from backend team
  'YOUR_SUPABASE_ANON_KEY'  // Get from backend team
)
```

#### 3. Sign Up

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@email.com',
  password: 'password123',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe',
      role: 'candidate'
    }
  }
})
```

#### 4. Sign In

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@email.com',
  password: 'password123'
})

// Access token for API calls
const token = data.session.access_token
```

#### 5. Make API Requests

```javascript
const { data: { session } } = await supabase.auth.getSession()

fetch('http://localhost:3000/api/jobs', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})
```

#### 6. Sign Out

```javascript
await supabase.auth.signOut()
```

---

## Key Points

✅ **No backend needed** for login/register/logout  
✅ **Automatic token refresh** - Supabase handles it  
✅ **Session persistence** - Stored in localStorage  
✅ **Use token** for protected API endpoints  

---

## Environment Variables

Ask backend team for:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

---

## Common Patterns

### Check if user is logged in

```javascript
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  console.log('Logged in:', user.email)
}
```

### Listen for auth changes

```javascript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // User logged in
  }
  if (event === 'SIGNED_OUT') {
    // User logged out
  }
})
```

### Protected route (React)

```javascript
function ProtectedPage() {
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/login')
      } else {
        setUser(user)
      }
    })
  }, [])
  
  if (!user) return <div>Loading...</div>
  
  return <div>Protected content</div>
}
```

---

## Full Documentation

See [FRONTEND_AUTH_INTEGRATION.md](./FRONTEND_AUTH_INTEGRATION.md) for complete guide.

---

## Need Help?

1. Check [FRONTEND_AUTH_INTEGRATION.md](./FRONTEND_AUTH_INTEGRATION.md)
2. Check Supabase logs in dashboard
3. Ask backend team for environment variables
