# Frontend Authentication Integration Guide

## Overview

This application uses **Supabase Auth** for authentication. The frontend handles all authentication operations directly with Supabase, eliminating the need to start the backend server for authentication purposes.

## Table of Contents

1. [Setup](#setup)
2. [Authentication Methods](#authentication-methods)
3. [Making Authenticated API Requests](#making-authenticated-api-requests)
4. [Session Management](#session-management)
5. [Best Practices](#best-practices)
6. [Code Examples](#code-examples)

---

## Setup

### 1. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. Environment Variables

Create a `.env` file in your frontend project root:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note:** Replace `VITE_` prefix with your framework's prefix (e.g., `REACT_APP_`, `NEXT_PUBLIC_`, etc.)

### 3. Initialize Supabase Client

Create a `supabase.js` file in your utils or config folder:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

---

## Authentication Methods

### 1. Sign Up (Registration)

```javascript
import { supabase } from './utils/supabase'

async function signUp(email, password, userData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        full_name: `${userData.firstName} ${userData.lastName}`,
        role: userData.role || 'candidate'
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })

  if (error) {
    console.error('Sign up error:', error)
    throw error
  }

  // After successful signup, create user profile via backend API
  if (data.user) {
    try {
      const token = data.session?.access_token
      await createUserProfile(data.user.id, userData, token)
    } catch (profileError) {
      console.error('Profile creation error:', profileError)
    }
  }

  return data
}

// Call backend to create full user profile
async function createUserProfile(userId, userData, token) {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      userId,
      ...userData
    })
  })

  if (!response.ok) {
    throw new Error('Failed to create user profile')
  }

  return response.json()
}
```

### 2. Sign In (Login)

```javascript
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('Sign in error:', error)
    throw error
  }

  return data
}

// Usage
try {
  const { user, session } = await signIn('user@example.com', 'password123')
  console.log('User:', user)
  console.log('Access Token:', session.access_token)
  
  // Store user data in your state management (Redux, Zustand, Context, etc.)
  // The session is automatically stored by Supabase client
} catch (error) {
  alert(error.message)
}
```

### 3. Sign Out (Logout)

```javascript
async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

// Usage
try {
  await signOut()
  // Redirect to login page
  window.location.href = '/login'
} catch (error) {
  console.error('Logout failed:', error)
}
```

### 4. Get Current Session

```javascript
async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Get session error:', error)
    return null
  }
  
  return session
}

// Get current user
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Get user error:', error)
    return null
  }
  
  return user
}
```

### 5. Password Reset

```javascript
// Request password reset email
async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  
  if (error) {
    console.error('Password reset error:', error)
    throw error
  }
}

// Update password after reset
async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) {
    console.error('Update password error:', error)
    throw error
  }
}
```

### 6. Email Verification

```javascript
// Resend verification email
async function resendVerificationEmail(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  if (error) {
    console.error('Resend verification error:', error)
    throw error
  }
}
```

---

## Making Authenticated API Requests

When making requests to protected backend endpoints, include the Supabase access token in the Authorization header:

```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  // Add Authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}

// Example usage
async function getUserProfile() {
  return makeAuthenticatedRequest('http://localhost:3000/api/auth/me')
}

async function createApplication(jobId, applicationData) {
  return makeAuthenticatedRequest('http://localhost:3000/api/applications', {
    method: 'POST',
    body: JSON.stringify({ jobId, ...applicationData })
  })
}
```

---

## Session Management

### Listen for Auth State Changes

```javascript
import { supabase } from './utils/supabase'

// Set up auth state listener (in your main App component)
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('Auth event:', event)
      
      if (event === 'SIGNED_IN') {
        // User signed in
        console.log('User signed in:', session.user)
        // Update your app state
      }
      
      if (event === 'SIGNED_OUT') {
        // User signed out
        console.log('User signed out')
        // Clear app state and redirect
      }
      
      if (event === 'TOKEN_REFRESHED') {
        // Token was automatically refreshed
        console.log('Token refreshed')
      }
      
      if (event === 'USER_UPDATED') {
        // User data was updated
        console.log('User updated:', session.user)
      }
    }
  )

  // Cleanup subscription
  return () => {
    subscription.unsubscribe()
  }
}, [])
```

### Protected Route Component (React Example)

```javascript
import { Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />
  }
  
  return children
}

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### Custom Auth Hook (React Example)

```javascript
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

---

## Best Practices

### 1. Token Management

- **Automatic Refresh**: Supabase automatically refreshes tokens before they expire
- **Persist Session**: Sessions are stored in localStorage by default
- **Token in Requests**: Always include the access token in API requests to protected endpoints

### 2. Security

- **Never expose**: Don't commit `.env` files or expose your Supabase keys
- **Use ANON key**: Use the public anon key in the frontend (not the service role key)
- **Validate on backend**: Always validate tokens on the backend for protected routes
- **HTTPS only**: Use HTTPS in production

### 3. Error Handling

```javascript
async function handleAuthAction(action) {
  try {
    const result = await action()
    return { success: true, data: result }
  } catch (error) {
    console.error('Auth error:', error)
    
    // Handle specific error types
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Email hoặc mật khẩu không đúng' }
    }
    
    if (error.message.includes('Email not confirmed')) {
      return { success: false, error: 'Vui lòng xác thực email trước khi đăng nhập' }
    }
    
    return { success: false, error: 'Đã xảy ra lỗi, vui lòng thử lại' }
  }
}
```

### 4. User Profile Data

After authentication, fetch additional user profile data from your backend:

```javascript
async function getUserFullProfile() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  // Fetch from backend
  const response = await fetch('http://localhost:3000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch profile')
  }

  return response.json()
}
```

---

## Code Examples

### Complete Login Form (React)

```javascript
import { useState } from 'react'
import { supabase } from '../utils/supabase'
import { useNavigate } from 'react-router-dom'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Success - redirect to dashboard
      navigate('/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Đăng nhập</h2>
      
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <input
        type="password"
        placeholder="Mật khẩu"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  )
}
```

### Complete Registration Form (React)

```javascript
import { useState } from 'react'
import { supabase } from '../utils/supabase'

function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'candidate'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
            role: formData.role
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      // Create full profile via backend
      if (data.user && data.session) {
        await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`
          },
          body: JSON.stringify({
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role
          })
        })
      }

      setMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Đăng ký</h2>
      
      {message && <div className="message">{message}</div>}
      
      <input
        type="text"
        placeholder="Tên"
        value={formData.firstName}
        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        required
      />
      
      <input
        type="text"
        placeholder="Họ"
        value={formData.lastName}
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        required
      />
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      
      <input
        type="password"
        placeholder="Mật khẩu (tối thiểu 8 ký tự)"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        minLength={8}
      />
      
      <select
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
      >
        <option value="candidate">Ứng viên</option>
        <option value="employer">Nhà tuyển dụng</option>
      </select>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
      </button>
    </form>
  )
}
```

### API Service Helper

```javascript
// api.js
import { supabase } from './supabase'

const API_BASE_URL = 'http://localhost:3000/api'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
}

export const api = {
  // Auth endpoints
  async getMe() {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/auth/me`, { headers })
    return response.json()
  },

  // Jobs endpoints
  async getJobs(filters = {}) {
    const queryParams = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/jobs?${queryParams}`)
    return response.json()
  },

  async getJob(id) {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`)
    return response.json()
  },

  async createJob(jobData) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(jobData)
    })
    return response.json()
  },

  // Applications endpoints
  async getMyApplications() {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/applications/my`, { headers })
    return response.json()
  },

  async createApplication(jobId, applicationData) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jobId, ...applicationData })
    })
    return response.json()
  },

  // Saved jobs endpoints
  async getSavedJobs() {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/saved-jobs`, { headers })
    return response.json()
  },

  async saveJob(jobId) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/saved-jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jobId })
    })
    return response.json()
  },

  async unsaveJob(jobId) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/saved-jobs/${jobId}`, {
      method: 'DELETE',
      headers
    })
    return response.json()
  }
}
```

---

## Environment Configuration

### Development

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:3000/api
```

### Production

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-production-domain.com/api
```

---

## Troubleshooting

### Issue: "Invalid JWT" error

**Solution**: The token might be expired. Supabase automatically refreshes tokens, but you can manually trigger a refresh:

```javascript
const { data, error } = await supabase.auth.refreshSession()
```

### Issue: Email confirmation not working

**Solution**: Check your Supabase project settings:
1. Go to Authentication > Settings
2. Ensure "Enable email confirmations" is toggled on
3. Configure email templates if needed

### Issue: CORS errors when calling backend

**Solution**: Ensure your backend has CORS configured properly:

```javascript
// In your Express app
const cors = require('cors')

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))
```

### Issue: Session not persisting

**Solution**: Check localStorage permissions and ensure you're not in incognito mode. You can also configure session storage:

```javascript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    persistSession: true
  }
})
```

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client Reference](https://supabase.com/docs/reference/javascript/introduction)
- [Backend API Routes Documentation](./README.md)

---

## Support

For issues or questions:
- Check backend logs for authentication errors
- Review Supabase Auth logs in your Supabase Dashboard
- Ensure environment variables are correctly configured
- Verify that backend middleware is properly validating tokens

---

**Last Updated**: January 16, 2026
