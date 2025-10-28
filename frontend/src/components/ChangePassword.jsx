import React, { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export default function ChangePassword({ token, onPasswordChanged, onCancel }) {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  function onChange(e) {
    const { name, value } = e.target
    setPasswords(prev => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setMessage(null)

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill all fields' })
      return
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwords.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' })
      return
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(passwords.newPassword)
    const hasLowerCase = /[a-z]/.test(passwords.newPassword)
    const hasNumber = /[0-9]/.test(passwords.newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwords.newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setMessage({ 
        type: 'error', 
        text: 'Password must contain uppercase, lowercase, number, and special character' 
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' })
        setTimeout(() => {
          if (onPasswordChanged) {
            onPasswordChanged()
          }
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to change password' })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Failed to change password: ' + (err.message || err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto' }}>
      <div className="grievance-form">
        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Change Password</h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '0.875rem', marginBottom: '20px' }}>
          For security reasons, please change your password on first login.
        </p>
        
        {message && <div className={`msg ${message.type}`}>{message.text}</div>}

        <form onSubmit={onSubmit}>
          <label>
            Current Password
            <input 
              type="password"
              name="currentPassword" 
              value={passwords.currentPassword} 
              onChange={onChange}
              autoComplete="current-password"
            />
          </label>

          <label>
            New Password
            <input 
              type="password"
              name="newPassword" 
              value={passwords.newPassword} 
              onChange={onChange}
              autoComplete="new-password"
            />
            <small style={{color: '#6b7280', fontSize: '0.8125rem', marginTop: '4px', display: 'block'}}>
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </small>
          </label>

          <label>
            Confirm New Password
            <input 
              type="password"
              name="confirmPassword" 
              value={passwords.confirmPassword} 
              onChange={onChange}
              autoComplete="new-password"
            />
          </label>

          <div className="actions" style={{ gap: '10px' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} style={{ background: '#6b7280' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
