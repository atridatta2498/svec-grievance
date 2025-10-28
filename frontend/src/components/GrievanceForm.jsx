import React, { useState, useEffect } from 'react'

// Backend API URL (Node.js server)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const roles = [
  { value: 'student', label: 'Student' },
  { value: 'teaching', label: 'Teaching Faculty' },
  { value: 'non-teaching', label: 'Non-teaching Staff' }
]

const departments = [
  'Artificial Intelligence and Data Science',
  'Basic Sciences and Humanities',
  'Civil Engineering',
  'CSE(Artificial Intelligence)',
  'CSE(Data Science)',
  'Computer Science and Engineering',
  'Computer Science and Technology',
  'Electrical and Electronics Engineering',
  'Electronics and Communication Engineering',
  'Electronics and Communication Technology',
  'Master of Business Administration',
  'Mechanical Engineering']

const grievanceTypes = [
  { value: 'INFRASTRUCTURE', label: 'Infrastructure Related' },
  { value: 'WOMEN GRIEVANCE', label: 'Women Grievance / Sexual Harassment Related' },
  { value: 'RAGGING', label: 'Ragging Related' },
  { value: 'FACULTY', label: 'Faculty Related' },
  { value: 'HOSTEL', label: 'Hostel Related' },
  { value: 'EXAMINATION', label: 'Examination Related' },
  { value: 'OTHER', label: 'Other' }
]

export default function GrievanceForm() {
  const [form, setForm] = useState({
    name: '',
    role: 'student',
    id: '',
    department: departments[0],
    year: '1',
    email: '',
    mobile: '',
    grievanceType: grievanceTypes[0].value,
    grievance: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [trackingId, setTrackingId] = useState('')
  const [trackingResult, setTrackingResult] = useState(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [submittedTrackingId, setSubmittedTrackingId] = useState(null)

  // Auto-dismiss success/error popup after 3 seconds
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [message])

  // Validation functions

  const validateFacultyId = (facId) => {
    // Format: 1 char - 2/3/4 chars - 1/2/3 digits
    // Examples: T-AB-1, T-ABC-12, T-ABCD-123
    const pattern = /^[A-Z]-[A-Z]{2,4}-\d{1,3}$/
    return pattern.test(facId.toUpperCase())
  }

  const validateNonTeachingId = (staffId) => {
    // Format: 2 chars - 3/4 chars - 1/2/3 digits
    // Examples: NT-ABC-1, NT-ABCD-12, ST-ABCD-123
    const pattern = /^[A-Z]{2}-[A-Z]{3,4}-\d{1,3}$/
    return pattern.test(staffId.toUpperCase())
  }

  const validateEmail = (email, role) => {
    // Faculty (teaching/non-teaching): @srivasaviengg.ac.in
    // Students: @sves.org.in
    const emailLower = email.toLowerCase()
    if (role === 'student') {
      return emailLower.endsWith('@sves.org.in')
    } else {
      // teaching or non-teaching
      return emailLower.endsWith('@srivasaviengg.ac.in')
    }
  }

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSendOTP() {
    setMessage(null)

    // Validate required fields
    if (!form.name || !form.id || !form.email || !form.mobile || !form.grievance) {
      setMessage({ type: 'error', text: 'Please fill all required fields.' })
      return
    }

    // Validate ID format
    if (form.role === 'teaching') {
      if (!validateFacultyId(form.id)) {
        setMessage({ type: 'error', text: 'Invalid Faculty ID format. Use format: T-AB-1, T-ABC-12, or T-ABCD-123' })
        return
      }
    } else if (form.role === 'non-teaching') {
      if (!validateNonTeachingId(form.id)) {
        setMessage({ type: 'error', text: 'Invalid Staff ID format. Use format: NT-ABC-1, NT-ABCD-12, or ST-ABCD-123' })
        return
      }
    }

    // Validate email domain
    if (!validateEmail(form.email, form.role)) {
      const expectedDomain = form.role === 'student' ? '@sves.org.in' : '@srivasaviengg.ac.in'
      setMessage({ type: 'error', text: `Email must be from ${expectedDomain} domain for ${form.role === 'student' ? 'students' : 'faculty'}.` })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: form.email })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setOtpSent(true)
        setMessage({ type: 'success', text: data.message || 'OTP sent to your email. Please check your inbox.' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send OTP' })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Failed to send OTP: ' + (err.message || err) })
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP() {
    if (!otp || otp.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit OTP.' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: form.email, otp })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setOtpVerified(true)
        setMessage({ type: 'success', text: data.message || 'OTP verified successfully! You can now submit your grievance.' })
      } else {
        setMessage({ type: 'error', text: data.message || 'OTP verification failed' })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'OTP verification failed' })
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setMessage(null)

    if (!otpVerified) {
      setMessage({ type: 'error', text: 'Please verify your email with OTP first.' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/submit-grievance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSubmittedTrackingId(data.trackingId)
        setMessage({ 
          type: 'success', 
          text: `Grievance submitted successfully! Your Tracking ID is ${data.trackingId}. Check your email for details.` 
        })
        
        // Reset form
        setForm({
          name: '',
          role: 'student',
          id: '',
          department: departments[0],
          year: '1',
          email: '',
          mobile: '',
          grievanceType: grievanceTypes[0].value,
          grievance: ''
        })
        setOtpSent(false)
        setOtp('')
        setOtpVerified(false)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit grievance' })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Failed to submit grievance: ' + (err.message || err) })
    } finally {
      setLoading(false)
    }
  }

  const handleTrackStatus = async () => {
    if (!trackingId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a tracking ID' })
      return
    }

    setTrackingLoading(true)
    setMessage(null)
    setTrackingResult(null)

    try {
      const res = await fetch(`${API_BASE_URL}/grievances/track/${trackingId.trim()}`)
      const data = await res.json()
      
      if (res.ok) {
        setTrackingResult(data)
      } else {
        setMessage({ type: 'error', text: data.message || 'Grievance not found' })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Failed to track grievance status' })
    } finally {
      setTrackingLoading(false)
    }
  }

  return (
    <>
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '3px',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(102, 126, 234, 0.1)',
      marginBottom: '40px'
    }}>
      <form className="grievance-form" onSubmit={onSubmit} style={{
        background: 'white',
        borderRadius: '18px',
        padding: '48px 40px',
        margin: 0
      }}>
        {/* Form Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
            transform: 'rotate(-5deg)',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-5deg)'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          
          <h2 style={{ 
            margin: '0 0 8px 0',
            fontSize: '2rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px'
          }}>
            Submit Grievance
          </h2>
          
          <p style={{ 
            margin: 0,
            color: '#6b7280',
            fontSize: '0.9375rem',
            fontWeight: '500'
          }}>
            We're here to help resolve your concerns
          </p>
        </div>

        {message && <div className={`msg ${message.type}`}>{message.text}</div>}

        {submittedTrackingId && (
          <div className="tracking-success-box">
            <h3>✓ Grievance Submitted Successfully!</h3>
            <p>Your Tracking ID:</p>
            <div className="tracking-id-display">{submittedTrackingId}</div>
            <p className="tracking-info">
              Please save this ID to track your grievance status. A confirmation email with your tracking ID has been sent to your email address.
            </p>
            <button 
              type="button" 
              className="close-tracking-btn"
              onClick={() => setSubmittedTrackingId(null)}
            >
              Submit Another Grievance
            </button>
          </div>
        )}

        <label style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px',
            color: '#374151',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Full name
          </div>
          <input name="name" value={form.name} onChange={onChange} required disabled={otpVerified} 
            placeholder="Enter your full name"
            style={{
              fontSize: '1rem',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              transition: 'all 0.2s ease',
              background: otpVerified ? '#f3f4f6' : '#f9fafb'
            }}
          />
        </label>

        <label style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px',
            color: '#374151',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <polyline points="16 11 18 13 22 9"></polyline>
            </svg>
            Role
          </div>
          <select name="role" value={form.role} onChange={onChange} disabled={otpVerified}
            style={{
              fontSize: '1rem',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              transition: 'all 0.2s ease',
              background: otpVerified ? '#f3f4f6' : '#f9fafb'
            }}
          >
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>

        <label style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px',
            color: '#374151',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            {form.role === 'student' ? 'Roll Number' : form.role === 'teaching' ? 'Faculty ID' : 'Staff ID'}
          </div>
          <input 
            name="id" 
            value={form.id} 
            onChange={onChange} 
            required 
            disabled={otpVerified}
            placeholder={
              form.role === 'student' ? 'Your Roll Number' : 
              form.role === 'teaching' ? 'e.g., T-AB-1' : 
              'e.g., NT-ABC-1'
            }
            style={{
              fontSize: '1rem',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              transition: 'all 0.2s ease',
              background: otpVerified ? '#f3f4f6' : '#f9fafb'
            }}
          />
          {form.role === 'student' && null}
          {form.role === 'teaching' && (
            <small className="field-hint">
              Format: T-AB-1, T-ABC-12, or T-ABCD-123
            </small>
          )}
          {form.role === 'non-teaching' && (
            <small className="field-hint">
              Format: NT-ABC-1, NT-ABCD-12, or ST-ABCD-123
            </small>
          )}
        </label>

        <label style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px',
            color: '#374151',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Department
          </div>
          <select name="department" value={form.department} onChange={onChange} disabled={otpVerified}
            style={{
              fontSize: '1rem',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              transition: 'all 0.2s ease',
              background: otpVerified ? '#f3f4f6' : '#f9fafb'
            }}
          >
            {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
          </select>
        </label>

        {form.role === 'student' && (
          <label style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '10px',
              color: '#374151',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
              Year of study
            </div>
            <select name="year" value={form.year} onChange={onChange} disabled={otpVerified}
              style={{
                fontSize: '1rem',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                transition: 'all 0.2s ease',
                background: otpVerified ? '#f3f4f6' : '#f9fafb'
              }}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </label>
        )}

        <label style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px',
            color: '#374151',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            Email address
          </div>
          <input 
            name="email" 
            type="email" 
            value={form.email} 
            onChange={onChange} 
            required 
            disabled={otpVerified}
            placeholder={
              form.role === 'student' 
                ? 'yourname@sves.org.in' 
                : 'yourname@srivasaviengg.ac.in'
            }
            style={{
              fontSize: '1rem',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              transition: 'all 0.2s ease',
              background: otpVerified ? '#f3f4f6' : '#f9fafb'
            }}
          />
          <small className="field-hint">
            {form.role === 'student' 
              ? 'Students must use @sves.org.in email' 
              : 'Faculty must use @srivasaviengg.ac.in email'}
          </small>
        </label>

        <label style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px',
            color: '#374151',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Mobile number
          </div>
          <input 
            name="mobile" 
            type="tel" 
            value={form.mobile} 
            onChange={onChange} 
            required 
            disabled={otpVerified}
            placeholder="10-digit mobile number"
            style={{
              fontSize: '1rem',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              transition: 'all 0.2s ease',
              background: otpVerified ? '#f3f4f6' : '#f9fafb'
            }}
          />
        </label>

        <label style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px',
            color: '#374151',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Grievance type
          </div>
          <select name="grievanceType" value={form.grievanceType} onChange={onChange} disabled={otpVerified}
            style={{
              fontSize: '1rem',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              transition: 'all 0.2s ease',
              background: otpVerified ? '#f3f4f6' : '#f9fafb'
            }}
          >
            {grievanceTypes.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </label>

        <label style={{ marginBottom: '28px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '10px',
            color: '#374151',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Grievance details
          </div>
          <textarea 
            name="grievance" 
            value={form.grievance} 
            onChange={onChange} 
            rows={6} 
            required 
            disabled={otpVerified}
            placeholder="Describe your grievance in detail..."
            style={{
              fontSize: '1rem',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              transition: 'all 0.2s ease',
              background: otpVerified ? '#f3f4f6' : '#f9fafb',
              fontFamily: 'inherit'
            }}
          />
        </label>

        {!otpSent && !otpVerified && (
          <div className="actions" style={{ marginTop: '32px' }}>
            <button type="button" onClick={handleSendOTP} disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1.0625rem',
                fontWeight: '700',
                background: loading 
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading 
                  ? 'none'
                  : '0 10px 25px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              {loading ? 'Sending OTP...' : 'Send OTP to Email'}
            </button>
          </div>
        )}

        {otpSent && !otpVerified && (
          <>
            <label style={{ marginBottom: '24px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '10px',
                color: '#374151',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Enter OTP
              </div>
              <input 
                type="text" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                style={{
                  fontSize: '1.125rem',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '2px solid #667eea',
                  transition: 'all 0.2s ease',
                  background: '#f9fafb',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  fontWeight: '700'
                }}
              />
            </label>
            <div className="actions" style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <button type="button" onClick={handleVerifyOTP} disabled={loading}
                style={{
                  flex: 1,
                  padding: '16px',
                  fontSize: '1.0625rem',
                  fontWeight: '700',
                  background: loading 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 10px 25px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'Verifying...' : '✓ Verify OTP'}
              </button>
              <button type="button" onClick={handleSendOTP} disabled={loading}
                style={{
                  padding: '16px 24px',
                  fontSize: '1.0625rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                🔄 Resend
              </button>
            </div>
          </>
        )}

        {otpVerified && (
          <div className="actions" style={{ marginTop: '32px' }}>
            <button type="submit" disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '1.125rem',
                fontWeight: '700',
                background: loading 
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading 
                  ? 'none'
                  : '0 15px 35px rgba(16, 185, 129, 0.5)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
              {loading ? 'Submitting Grievance...' : 'Submit Grievance'}
            </button>
          </div>
        )}
      </form>
    </div>

    {/* Tracking Status Section */}
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '3px',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(102, 126, 234, 0.1)',
      marginTop: '40px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '18px',
        padding: '48px 40px',
        margin: 0
      }}>
        {/* Tracking Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
            transform: 'rotate(-5deg)',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-5deg)'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          
          <h2 style={{ 
            margin: '0 0 8px 0',
            fontSize: '2rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px'
          }}>
            Track Your Status
          </h2>
          
          <p style={{ 
            margin: 0,
            color: '#6b7280',
            fontSize: '0.9375rem',
            fontWeight: '500'
          }}>
            Enter your tracking ID to check grievance status
          </p>
        </div>

        {/* Tracking Input */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ marginBottom: 0 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '10px',
              color: '#374151',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Tracking ID
            </div>
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter Your Tracking ID"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleTrackStatus()
                }
              }}
              style={{
                width: '100%',
                fontSize: '1.125rem',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '2px solid #3b82f6',
                transition: 'all 0.2s ease',
                background: '#f9fafb',
                letterSpacing: '2px',
                textAlign: 'center',
                fontWeight: '700',
                textTransform: 'uppercase'
              }}
            />
          </label>
        </div>
        
        {/* Track Button */}
        <button
          type="button"
          onClick={handleTrackStatus}
          disabled={trackingLoading}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '1.0625rem',
            fontWeight: '700',
            background: trackingLoading 
              ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            cursor: trackingLoading ? 'not-allowed' : 'pointer',
            boxShadow: trackingLoading 
              ? 'none'
              : '0 10px 25px rgba(59, 130, 246, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
          onMouseEnter={(e) => {
            if (!trackingLoading) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.5)'
            }
          }}
          onMouseLeave={(e) => {
            if (!trackingLoading) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.4)'
            }
          }}
        >
          {trackingLoading ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              TRACKING...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              TRACK STATUS
            </>
          )}
        </button>

        {/* Tracking Result */}
        {trackingResult && (
          <div style={{
            marginTop: '32px',
            padding: '32px',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '16px',
            border: '2px solid #3b82f6',
            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.15)'
          }}>
            <h3 style={{
              margin: '0 0 24px 0',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Grievance Details
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{
                padding: '16px 20px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Tracking ID
                </span>
                <span style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '700', 
                  color: '#1e40af',
                  letterSpacing: '1px'
                }}>
                  #{trackingResult.id}
                </span>
              </div>

              <div style={{
                padding: '16px 20px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Name
                </span>
                <span style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#1f2937'
                }}>
                  {trackingResult.name}
                </span>
              </div>

              <div style={{
                padding: '16px 20px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Department
                </span>
                <span style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#1f2937'
                }}>
                  {trackingResult.department}
                </span>
              </div>

              <div style={{
                padding: '16px 20px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Status
                </span>
                <span style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: 
                    trackingResult.status === 'pending' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                    trackingResult.status === 'in-progress' ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' :
                    trackingResult.status === 'resolved' ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' : 
                    'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                  color: 'white',
                  boxShadow: 
                    trackingResult.status === 'pending' ? '0 4px 12px rgba(251, 191, 36, 0.4)' :
                    trackingResult.status === 'in-progress' ? '0 4px 12px rgba(59, 130, 246, 0.4)' :
                    trackingResult.status === 'resolved' ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 
                    '0 4px 12px rgba(239, 68, 68, 0.4)'
                }}>
                  {trackingResult.status}
                </span>
              </div>

              <div style={{
                padding: '16px 20px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Submitted
                </span>
                <span style={{ 
                  fontSize: '0.9375rem', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {new Date(trackingResult.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
    </>
  )
}
