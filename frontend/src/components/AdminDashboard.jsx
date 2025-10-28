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

  // Auto-dismiss success/error popup after 5 seconds
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 5000)
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
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>ID</th>
                  <th style={{ padding: '12px 8px' }}>Name</th>
                  <th style={{ padding: '12px 8px' }}>Role</th>
                  <th style={{ padding: '12px 8px' }}>Type</th>
                  <th style={{ padding: '12px 8px' }}>Grievance</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Date</th>
                  <th style={{ padding: '12px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 8px' }}>{g.id}</td>
                    <td style={{ padding: '12px 8px' }}>{g.name}</td>
                    <td style={{ padding: '12px 8px' }}>{g.role}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {g.grievance_type || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 8px', maxWidth: '400px', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                      {g.grievance || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
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
                    <td style={{ padding: '12px 8px', fontSize: '0.875rem' }}>
                      {new Date(g.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select 
                          value={g.status} 
                          onChange={e => updateStatus(g.id, e.target.value, g.status)}
                          disabled={g.status === 'resolved' || g.status === 'rejected'}
                          title={g.status === 'resolved' || g.status === 'rejected' ? 'Final status' : undefined}
                          style={{ padding: '4px 8px', fontSize: '0.875rem' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        {(g.status === 'resolved' || g.status === 'rejected') && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Final</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
