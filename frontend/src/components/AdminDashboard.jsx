import React, { useState, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export default function AdminDashboard({ admin, token, onLogout }) {
  const [grievances, setGrievances] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', role: '', search: '' })
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchStatistics()
    fetchGrievances()
  }, [filter])

  // Auto-dismiss success/error popup after 3 seconds
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [message])

  async function fetchStatistics() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setStatistics(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
    }
  }

  async function fetchGrievances() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.status) params.append('status', filter.status)
      if (filter.role) params.append('role', filter.role)
      if (filter.search) params.append('search', filter.search)

      const response = await fetch(`${API_BASE_URL}/grievances?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setGrievances(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch grievances:', err)
      setMessage({ type: 'error', text: 'Failed to load grievances' })
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(grievanceId, newStatus, currentStatus) {
    // Prevent client-side changes if already final
    if (currentStatus === 'resolved' || currentStatus === 'rejected') {
      setMessage({ type: 'error', text: 'Status is final and cannot be changed.' })
      return
    }
    try {
      const response = await fetch(`${API_BASE_URL}/grievances/${grievanceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Status updated successfully' })
        fetchGrievances()
        fetchStatistics()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update status' })
    }
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '20px auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '12px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0' }}>Admin Dashboard</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Welcome, {admin.fullName} ({admin.role})
          </p>
        </div>
        <button 
          onClick={onLogout}
          style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white' }}
        >
          Logout
        </button>
      </div>

      {message && <div className={`msg ${message.type}`}>{message.text}</div>}

      {/* Statistics Cards */}
      {statistics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="grievance-form" style={{ padding: '16px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '2rem', color: '#667eea' }}>{statistics.total}</h3>
            <p style={{ margin: 0, color: '#666' }}>Total Grievances</p>
          </div>
          <div className="grievance-form" style={{ padding: '16px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '2rem', color: '#f59e0b' }}>
              {statistics.byStatus.find(s => s.status === 'pending')?.count || 0}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>Pending</p>
          </div>
          <div className="grievance-form" style={{ padding: '16px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '2rem', color: '#3b82f6' }}>
              {statistics.byStatus.find(s => s.status === 'in-progress')?.count || 0}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>In Progress</p>
          </div>
          <div className="grievance-form" style={{ padding: '16px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '2rem', color: '#10b981' }}>
              {statistics.byStatus.find(s => s.status === 'resolved')?.count || 0}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>Resolved</p>
          </div>
          <div className="grievance-form" style={{ padding: '16px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '2rem', color: '#ef4444' }}>
              {statistics.byStatus.find(s => s.status === 'rejected')?.count || 0}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>Rejected</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grievance-form" style={{ marginBottom: '20px', padding: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
          <select value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={filter.role} onChange={e => setFilter({...filter, role: e.target.value})}>
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="teaching">Teaching Faculty</option>
            <option value="non-teaching">Non-teaching Staff</option>
          </select>
          <input 
            type="text" 
            placeholder="Search by name, email, or text..." 
            value={filter.search}
            onChange={e => setFilter({...filter, search: e.target.value})}
          />
        </div>
      </div>

      {/* Grievances Table */}
      <div className="grievance-form">
        <h3 style={{ margin: '0 0 16px 0' }}>
          Grievances ({grievances.length})
        </h3>
        {loading ? (
          <p>Loading...</p>
        ) : grievances.length === 0 ? (
          <p>No grievances found.</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                    color: 'white',
                    textAlign: 'left'
                  }}>
                    <th style={{ padding: '14px 10px', fontWeight: '600', fontSize: '0.875rem' }}>ID</th>
                    <th style={{ padding: '14px 10px', fontWeight: '600', fontSize: '0.875rem' }}>Name</th>
                    <th style={{ padding: '14px 10px', fontWeight: '600', fontSize: '0.875rem' }}>Role</th>
                    <th style={{ padding: '14px 10px', fontWeight: '600', fontSize: '0.875rem' }}>Roll/ID</th>
                    <th style={{ padding: '14px 10px', fontWeight: '600', fontSize: '0.875rem' }}>Department</th>
                    <th style={{ padding: '14px 10px', fontWeight: '600', fontSize: '0.875rem' }}>Year</th>
                    <th style={{ padding: '14px 10px', fontWeight: '600', fontSize: '0.875rem' }}>Type</th>
                    <th style={{ padding: '14px 10px', fontWeight: '600', fontSize: '0.875rem' }}>Grievance</th>
                    <th style={{ padding: '14px 10px', fontWeight: '600', fontSize: '0.875rem' }}>Status</th>
                    <th style={{ padding: '14px 10px', fontWeight: '600', fontSize: '0.875rem' }}>Date</th>
                    <th style={{ padding: '14px 10px', fontWeight: '600', fontSize: '0.875rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grievances.map((g, index) => (
                    <tr key={g.id} style={{ 
                      borderBottom: '1px solid #e5e7eb',
                      background: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#f9fafb'}
                    >
                      <td style={{ padding: '12px 10px', fontWeight: '600', color: '#667eea' }}>#{g.id}</td>
                      <td style={{ padding: '12px 10px', fontWeight: '500' }}>{g.name}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: g.role === 'student' ? '#e0e7ff' : g.role === 'teaching' ? '#dbeafe' : '#fce7f3',
                          color: g.role === 'student' ? '#3730a3' : g.role === 'teaching' ? '#1e40af' : '#9f1239'
                        }}>
                          {g.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '0.875rem', color: '#4b5563' }}>{g.user_id || 'N/A'}</td>
                      <td style={{ padding: '12px 10px', fontSize: '0.875rem', color: '#4b5563' }}>{g.department || 'N/A'}</td>
                      <td style={{ padding: '12px 10px', fontSize: '0.875rem', color: '#4b5563' }}>{g.year || 'N/A'}</td>
                      <td style={{ padding: '12px 10px', fontSize: '0.875rem', color: '#6b7280' }}>
                        {g.grievance_type || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 10px', maxWidth: '300px', wordWrap: 'break-word', whiteSpace: 'normal', fontSize: '0.875rem', color: '#374151' }}>
                        {g.grievance || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: 
                            g.status === 'pending' ? '#fef3c7' :
                            g.status === 'in-progress' ? '#dbeafe' :
                            g.status === 'resolved' ? '#d1fae5' : '#fee2e2',
                          color:
                            g.status === 'pending' ? '#92400e' :
                            g.status === 'in-progress' ? '#1e3a8a' :
                            g.status === 'resolved' ? '#065f46' : '#991b1b'
                        }}>
                          {g.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '0.875rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {new Date(g.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <select 
                            value={g.status} 
                            onChange={e => updateStatus(g.id, e.target.value, g.status)}
                            disabled={g.status === 'resolved' || g.status === 'rejected'}
                            title={g.status === 'resolved' || g.status === 'rejected' ? 'Final status' : undefined}
                            style={{ 
                              padding: '6px 10px', 
                              fontSize: '0.875rem',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              background: 'white',
                              cursor: g.status === 'resolved' || g.status === 'rejected' ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          {(g.status === 'resolved' || g.status === 'rejected') && (
                            <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '500' }}>🔒 Final</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-cards">
              {grievances.map((g, index) => (
                <div key={g.id} className="mobile-grievance-card" style={{
                  background: index % 2 === 0 
                    ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' 
                    : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                  border: '2px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '16px',
                  boxShadow: '0 4px 6px rgba(102, 126, 234, 0.15), 0 2px 4px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s ease'
                }}>
                  {/* Header with ID and Status */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <div>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        color: '#9ca3af', 
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Grievance ID
                      </span>
                      <h4 style={{ 
                        margin: '4px 0', 
                        fontSize: '1.25rem', 
                        fontWeight: '700', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        #{g.id}
                      </h4>
                    </div>
                    <span style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: 
                        g.status === 'pending' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                        g.status === 'in-progress' ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' :
                        g.status === 'resolved' ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' : 
                        'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                      color: 'white',
                      boxShadow: 
                        g.status === 'pending' ? '0 4px 12px rgba(251, 191, 36, 0.4)' :
                        g.status === 'in-progress' ? '0 4px 12px rgba(59, 130, 246, 0.4)' :
                        g.status === 'resolved' ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 
                        '0 4px 12px rgba(239, 68, 68, 0.4)'
                    }}>
                      {g.status}
                    </span>
                  </div>

                  {/* User Details Section */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      marginBottom: '10px',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      borderRadius: '8px',
                      borderLeft: '4px solid #3b82f6'
                    }}>
                      <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: '600' }}>👤 NAME</span>
                      <div style={{ fontSize: '0.95rem', color: '#1e3a8a', fontWeight: '700', marginTop: '2px' }}>{g.name}</div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: g.role === 'student' 
                          ? 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' 
                          : g.role === 'teaching' 
                          ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' 
                          : 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
                        color: 'white',
                        boxShadow: g.role === 'student' 
                          ? '0 4px 10px rgba(99, 102, 241, 0.3)' 
                          : g.role === 'teaching' 
                          ? '0 4px 10px rgba(59, 130, 246, 0.3)' 
                          : '0 4px 10px rgba(236, 72, 153, 0.3)'
                      }}>
                        {g.role}
                      </span>
                      <div style={{ 
                        padding: '6px 12px',
                        background: '#f3f4f6',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#1f2937',
                        fontWeight: '600'
                      }}>
                        <span style={{ color: '#6b7280' }}>ID:</span> {g.user_id || 'N/A'}
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '10px', 
                      flexWrap: 'wrap',
                      padding: '8px 0'
                    }}>
                      <div style={{ 
                        flex: '1 1 auto',
                        minWidth: '140px',
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}>
                        <span style={{ color: '#92400e', fontWeight: '600' }}>🏢 Dept:</span>
                        <div style={{ color: '#78350f', fontWeight: '700', marginTop: '2px' }}>{g.department || 'N/A'}</div>
                      </div>
                      {g.year && (
                        <div style={{ 
                          flex: '1 1 auto',
                          minWidth: '100px',
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{ color: '#5b21b6', fontWeight: '600' }}>📚 Year:</span>
                          <div style={{ color: '#4c1d95', fontWeight: '700', marginTop: '2px' }}>{g.year}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grievance Content */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                    padding: '14px', 
                    borderRadius: '12px',
                    marginBottom: '16px',
                    borderLeft: '4px solid #10b981',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
                  }}>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: '#047857', 
                      marginBottom: '6px', 
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      📋 Type: <span style={{ color: '#065f46' }}>{g.grievance_type || 'N/A'}</span>
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#064e3b', 
                      lineHeight: '1.6',
                      fontWeight: '500'
                    }}>
                      {g.grievance || 'N/A'}
                    </div>
                  </div>

                  {/* Footer with Date and Actions */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    paddingTop: '14px', 
                    borderTop: '2px solid #e5e7eb',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ 
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      color: '#374151',
                      fontWeight: '600',
                      border: '1px solid #d1d5db'
                    }}>
                      📅 {new Date(g.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select 
                        value={g.status} 
                        onChange={e => updateStatus(g.id, e.target.value, g.status)}
                        disabled={g.status === 'resolved' || g.status === 'rejected'}
                        title={g.status === 'resolved' || g.status === 'rejected' ? 'Final status' : undefined}
                        style={{ 
                          padding: '8px 12px', 
                          fontSize: '0.875rem',
                          borderRadius: '8px',
                          border: '2px solid #667eea',
                          background: 'white',
                          color: '#667eea',
                          fontWeight: '600',
                          cursor: g.status === 'resolved' || g.status === 'rejected' ? 'not-allowed' : 'pointer',
                          opacity: g.status === 'resolved' || g.status === 'rejected' ? '0.6' : '1'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      {(g.status === 'resolved' || g.status === 'rejected') && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: '#ef4444',
                          fontWeight: '600',
                          padding: '4px 8px',
                          background: '#fee2e2',
                          borderRadius: '6px'
                        }}>
                          🔒 Final
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
