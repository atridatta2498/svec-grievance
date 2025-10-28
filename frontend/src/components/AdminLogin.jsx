import React, { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export default function AdminLogin({ onLoginSuccess }) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  function onChange(e) {
    const { name, value } = e.target
    setCredentials(prev => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setMessage(null)

    if (!credentials.username || !credentials.password) {
      setMessage({ type: 'error', text: 'Please enter username and password' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Store token and admin info in localStorage
        localStorage.setItem('adminToken', data.token)
        localStorage.setItem('adminInfo', JSON.stringify(data.admin))
        
        setMessage({ type: 'success', text: 'Login successful!' })
        
        // Call parent callback
        if (onLoginSuccess) {
          onLoginSuccess(data.admin, data.token)
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Login failed' })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Login failed: ' + (err.message || err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto' }}>
      <div className="grievance-form">
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Admin Login</h2>
        
        {message && <div className={`msg ${message.type}`}>{message.text}</div>}

        <form onSubmit={onSubmit}>
          <label>
            Username
            <input 
              name="username" 
              value={credentials.username} 
              onChange={onChange}
              autoComplete="username"
              autoFocus
            />
          </label>

          <label>
            Password
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                name="password" 
                value={credentials.password} 
                onChange={onChange}
                autoComplete="current-password"
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  width: 'auto',
                  height: 'auto',
                  lineHeight: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280'
                }}
              >
                {showPassword ? (
                  // Eye off icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.6-1.36 1.49-2.62 2.57-3.68" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                    <path d="M23 23 1 1" />
                    <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8- .34.77-.78 1.49-1.3 2.15" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '20px', fontSize: '0.875rem', color: '#666' }}>
         
          
          <p style={{ marginTop: '8px', fontSize: '0.8125rem', fontStyle: 'italic' }}>
            You will be prompted to change your password on first login.
          </p>
        </div>
      </div>
    </div>
  )
}
