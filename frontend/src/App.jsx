import React, { useState, useEffect } from 'react'
import GrievanceForm from './components/GrievanceForm'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import ChangePassword from './components/ChangePassword'

export default function App() {
  // Initialize view based on URL hash immediately
  const getInitialView = () => {
    const hash = window.location.hash
    if (hash === '#admin' || hash === '#admin-login') {
      return 'admin-login'
    }
    
    // Check if admin is already logged in
    const savedToken = localStorage.getItem('adminToken')
    const savedAdmin = localStorage.getItem('adminInfo')
    
    if (savedToken && savedAdmin) {
      try {
        const adminInfo = JSON.parse(savedAdmin)
        return adminInfo.isFirstLogin ? 'change-password' : 'admin-dashboard'
      } catch (err) {
        console.error('Failed to parse admin info:', err)
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminInfo')
      }
    }
    
    return 'user'
  }

  const [view, setView] = useState(getInitialView)
  const [admin, setAdmin] = useState(() => {
    const savedAdmin = localStorage.getItem('adminInfo')
    if (savedAdmin) {
      try {
        return JSON.parse(savedAdmin)
      } catch {
        return null
      }
    }
    return null
  })
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'))

  useEffect(() => {
    // Listen for hash changes
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#admin' || hash === '#admin-login') {
        setView('admin-login')
      } else if (hash === '') {
        // Only go back to user if not logged in as admin
        if (!admin) {
          setView('user')
        }
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [admin])

  function handleLoginSuccess(adminInfo, authToken) {
    console.log('Login success - Admin info:', adminInfo)
    console.log('isFirstLogin flag:', adminInfo.isFirstLogin)
    
    setAdmin(adminInfo)
    setToken(authToken)
    
    // Store in localStorage
    localStorage.setItem('adminToken', authToken)
    localStorage.setItem('adminInfo', JSON.stringify(adminInfo))
    
    if (adminInfo.isFirstLogin) {
      console.log('Redirecting to change password')
      setView('change-password')
    } else {
      console.log('Redirecting to admin dashboard')
      setView('admin-dashboard')
    }
  }

  function handlePasswordChanged() {
    // Update admin info
    const updatedAdmin = { ...admin, isFirstLogin: false }
    setAdmin(updatedAdmin)
    localStorage.setItem('adminInfo', JSON.stringify(updatedAdmin))
    setView('admin-dashboard')
  }

  function handleLogout() {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminInfo')
    setAdmin(null)
    setToken(null)
     window.location.hash = ''
    setView('user')
  }

   // Header Component
   const Header = () => (
     <div style={{ 
       textAlign: 'center', 
       marginBottom: '32px',
       padding: '24px',
       background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
       borderRadius: '12px'
     }}>
       <div style={{
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         gap: '18px',
         marginBottom: '10px'
       }}>
         <img src="/public/logo192.png" alt="SVEC Logo" style={{ height: '80px', width: '80px', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 2px 8px rgba(102,126,234,0.10)' }} />
         <h1 style={{ 
           margin: 0, 
           fontSize: '2.2rem',
           color: '#667eea',
           fontWeight: 800,
           letterSpacing: '1px'
         }}>
           SVEC Grievance Portal
         </h1>
       </div>
     </div>
   )

   // Footer Component
   const Footer = () => (
     <footer style={{
       textAlign: 'center',
       padding: '20px',
       marginTop: '40px',
       borderTop: '1px solid #e5e7eb',
       background: '#f9fafb',
       color: '#6b7280',
       fontSize: '0.875rem'
     }}>
       <p style={{ margin: 0 }}>
         © {new Date().getFullYear()} Grievance Portal Developed by <strong style={{ color: '#667eea' }}>AtriDatta</strong>. All rights reserved.
       </p>
     </footer>
   )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {view === 'user' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
             <Header />
            <div style={{ 
               textAlign: 'center',
               marginBottom: '32px'
            }}>
              <h2 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '1.4rem',
                color: '#333',
                fontWeight: 600
              }}>
                Submit Your Grievance
              </h2>
              <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '1rem' }}>
                Fill the form below to submit a grievance. An OTP will be sent to your email for verification.
              </p>
            </div>
            <GrievanceForm />
          </div>
        )}

        {view === 'admin-login' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
             <Header />
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button 
                 onClick={() => {
                   window.location.hash = ''
                   setView('user')
                 }}
                style={{ 
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                ← Back to User Portal
              </button>
            </div>
            <AdminLogin onLoginSuccess={handleLoginSuccess} />
          </div>
        )}

        {view === 'change-password' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
             <Header />
            <ChangePassword 
              token={token}
              onPasswordChanged={handlePasswordChanged}
              onCancel={null}
            />
          </div>
        )}

        {view === 'admin-dashboard' && (
           <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
             <Header />
             <AdminDashboard 
            admin={admin}
            token={token}
            onLogout={handleLogout}
          />
           </div>
        )}
      </main>

       <Footer />
    </div>
  )
}
