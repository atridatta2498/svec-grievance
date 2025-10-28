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

  // Auto-dismiss success/error popup after 5 seconds
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 5000)
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
    <form className="grievance-form" onSubmit={onSubmit}>
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

      <label>
        Full name
        <input name="name" value={form.name} onChange={onChange} required disabled={otpVerified} />
      </label>

      <label>
        Role
        <select name="role" value={form.role} onChange={onChange} disabled={otpVerified}>
          {roles.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </label>

      <label>
        {form.role === 'student' ? 'Roll Number' : form.role === 'teaching' ? 'Faculty ID' : 'Staff ID'}
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

      <label>
        Department
        <select name="department" value={form.department} onChange={onChange} disabled={otpVerified}>
          {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
        </select>
      </label>

      {form.role === 'student' && (
        <label>
          Year of study
          <select name="year" value={form.year} onChange={onChange} disabled={otpVerified}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
      )}

      <label>
        Email address
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
        />
        <small className="field-hint">
          {form.role === 'student' 
            ? 'Students must use @sves.org.in email' 
            : 'Faculty must use @srivasaviengg.ac.in email'}
        </small>
      </label>

      <label>
        Mobile number
        <input 
          name="mobile" 
          type="tel" 
          value={form.mobile} 
          onChange={onChange} 
          required 
          disabled={otpVerified}
          placeholder="10-digit mobile number"
        />
      </label>

      <label>
        Grievance type
        <select name="grievanceType" value={form.grievanceType} onChange={onChange} disabled={otpVerified}>
          {grievanceTypes.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </label>

      <label>
        Grievance details
        <textarea 
          name="grievance" 
          value={form.grievance} 
          onChange={onChange} 
          rows={6} 
          required 
          disabled={otpVerified}
          placeholder="Describe your grievance in detail..."
        />
      </label>

      {!otpSent && !otpVerified && (
        <div className="actions">
          <button type="button" onClick={handleSendOTP} disabled={loading}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </div>
      )}

      {otpSent && !otpVerified && (
        <>
          <label>
            Enter OTP
            <input 
              type="text" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              maxLength={6}
              placeholder="Enter 6-digit OTP"
            />
          </label>
          <div className="actions">
            <button type="button" onClick={handleVerifyOTP} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button" onClick={handleSendOTP} disabled={loading}>
              Resend OTP
            </button>
          </div>
        </>
      )}

      {otpVerified && (
        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Grievance'}
          </button>
        </div>
      )}
    </form>

    {/* Tracking Status Section */}
    <div className="tracking-section">
      <div className="tracking-input-group">
        <label className="tracking-label">
          Track Your Status :
        </label>
        <input
          type="text"
          className="tracking-input"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          placeholder="Enter Your Tracking Id"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleTrackStatus()
            }
          }}
        />
      </div>
      
      <div className="tracking-button-wrapper">
        <button
          type="button"
          className="tracking-button"
          onClick={handleTrackStatus}
          disabled={trackingLoading}
        >
          {trackingLoading ? 'TRACKING...' : 'TRACK'}
        </button>
      </div>

      {trackingResult && (
        <div className="tracking-result">
          <h3>Grievance Details</h3>
          <div className="tracking-details">
            <p><strong>Tracking ID:</strong> {trackingResult.id}</p>
            <p><strong>Name:</strong> {trackingResult.name}</p>
            <p><strong>Department:</strong> {trackingResult.department}</p>
            <p><strong>Status:</strong> <span className={`status-badge status-${trackingResult.status}`}>
              {trackingResult.status.toUpperCase()}
            </span></p>
            <p><strong>Submitted:</strong> {new Date(trackingResult.created_at).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
