const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');
const { sendEmail, generateOTPEmail } = require('./mailer');
const { encrypt, decrypt } = require('./encryption');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Validation helpers
const validateEmail = (email, role) => {
  // Faculty (teaching/non-teaching): @srivasaviengg.ac.in
  // Students: @sves.org.in
  const emailLower = email.toLowerCase();
  if (role === 'student') {
    return emailLower.endsWith('@sves.org.in');
  } else {
    // teaching or non-teaching
    return emailLower.endsWith('@srivasaviengg.ac.in');
  }
};

// Note: Student roll number validation intentionally removed as per latest requirements

const validateFacultyId = (facId) => {
  // Format: 1 char - 2/3/4 chars - 1/2/3 digits
  // Examples: T-AB-1, T-ABC-12, T-ABCD-123
  const pattern = /^[A-Z]-[A-Z]{2,4}-\d{1,3}$/;
  return pattern.test(facId.toUpperCase());
};

const validateNonTeachingId = (staffId) => {
  // Format: 2 chars - 3/4 chars - 1/2/3 digits
  // Examples: NT-ABC-1, NT-ABCD-12, ST-ABCD-123
  const pattern = /^[A-Z]{2}-[A-Z]{3,4}-\d{1,3}$/;
  return pattern.test(staffId.toUpperCase());
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Safely decrypt values that might be legacy plain text
function tryDecryptMaybePlain(value) {
  if (!value) return '';
  const dec = decrypt(value);
  // If decryption failed or returned empty, assume legacy plain text
  if (!dec || dec === '[Decryption Failed]') {
    return value;
  }
  return dec;
}

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // Add admin info to request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// ============================================
// ADMIN AUTHENTICATION ROUTES
// ============================================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Get admin user from database
    const [rows] = await db.query(
      'SELECT id, username, password_hash, email, full_name, role, is_first_login FROM admin_users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const admin = rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Update last login
    await db.query('UPDATE admin_users SET last_login = NOW() WHERE id = ?', [admin.id]);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role,
        isFirstLogin: admin.is_first_login
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Change Password (requires authentication)
app.post('/api/admin/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 8 characters long' 
      });
    }

    // Password strength check
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must contain uppercase, lowercase, number, and special character' 
      });
    }

    // Get current password hash
    const [rows] = await db.query(
      'SELECT password_hash FROM admin_users WHERE id = ?',
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and set is_first_login to false
    await db.query(
      'UPDATE admin_users SET password_hash = ?, is_first_login = FALSE WHERE id = ?',
      [newPasswordHash, adminId]
    );

    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Get Admin Profile (requires authentication)
app.get('/api/admin/profile', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, full_name, role, is_first_login, last_login, created_at FROM admin_users WHERE id = ?',
      [req.admin.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Verify Token (check if token is still valid)
app.get('/api/admin/verify-token', verifyToken, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Token is valid',
    admin: {
      id: req.admin.id,
      username: req.admin.username,
      role: req.admin.role
    }
  });
});

// ============================================
// GRIEVANCE ROUTES (PUBLIC)
// ============================================

// Send OTP
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Validate email domain (accept both domains for OTP endpoint)
    const emailLower = email.toLowerCase();
    const isValidDomain = emailLower.endsWith('@srivasaviengg.ac.in') || emailLower.endsWith('@sves.org.in');
    
    if (!isValidDomain) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email must be from @srivasaviengg.ac.in or @sves.org.in domain' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Delete old OTPs for this email
    await db.query('DELETE FROM otps WHERE email = ?', [email]);

    // Insert new OTP
    await db.query(
      'INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    // Send email
    const emailHtml = generateOTPEmail(otp);
    const emailResult = await sendEmail(email, 'Your OTP for Grievance Portal', emailHtml);

    if (emailResult.success) {
      res.json({ success: true, message: 'OTP sent to your email' });
    } else {
      console.error('Send OTP mailer error:', emailResult.error || 'Unknown error');
      res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Get OTP from database
    const [rows] = await db.query(
      'SELECT otp, expires_at, verified FROM otps WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No OTP found for this email' });
    }

    const otpData = rows[0];

    // Check if already verified
    if (otpData.verified) {
      return res.status(400).json({ success: false, message: 'OTP already used' });
    }

    // Check if expired
    const currentTime = new Date();
    const expiresAt = new Date(otpData.expires_at);
    if (currentTime > expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Verify OTP
    if (otp !== otpData.otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Mark as verified
    await db.query(
      'UPDATE otps SET verified = TRUE WHERE email = ? AND otp = ?',
      [email, otp]
    );

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Submit Grievance
app.post('/api/submit-grievance', async (req, res) => {
  try {
    const { name, role, id, department, year, email, mobile, grievanceType, grievance } = req.body;

    // Validate required fields
    if (!name || !role || !id || !department || !email || !mobile || !grievanceType || !grievance) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Validate role
    if (!['student', 'teaching', 'non-teaching'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Validate email domain based on role
    if (!validateEmail(email, role)) {
      const expectedDomain = role === 'student' ? '@sves.org.in' : '@srivasaviengg.ac.in';
      return res.status(400).json({ 
        success: false, 
        message: `Invalid email domain. ${role === 'student' ? 'Students' : 'Faculty'} must use ${expectedDomain} email.` 
      });
    }

    // Validate ID format
    // Student roll number validation removed (accept any non-empty ID)

    if (role === 'teaching' && !validateFacultyId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Faculty ID format. Use format: T-AB-1, T-ABC-12, or T-ABCD-123' 
      });
    }

    if (role === 'non-teaching' && !validateNonTeachingId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Staff ID format. Use format: NT-ABC-1, NT-ABCD-12, or ST-ABCD-123' 
      });
    }

    // Check if OTP was verified
    const [otpRows] = await db.query(
      'SELECT verified FROM otps WHERE email = ? AND verified = TRUE ORDER BY created_at DESC LIMIT 1',
      [email]
    );

    if (otpRows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Email not verified. Please verify OTP first.' 
      });
    }

    // Encrypt sensitive grievance data before storing
    const encryptedType = encrypt(grievanceType);
    const encryptedText = encrypt(grievance);

    // Insert grievance
    const [result] = await db.query(
      `INSERT INTO grievances 
       (name, role, user_id, department, year, email, mobile, grievance_type_hash, grievance_hash, email_verified, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'pending')`,
      [name, role, id, department, year, email, mobile, encryptedType, encryptedText]
    );

    const trackingId = result.insertId;

    // Send tracking ID email
    try {
      const { generateTrackingEmail } = require('./mailer');
      const emailHtml = generateTrackingEmail(trackingId, name, grievanceType);
      await sendEmail(
        email, 
        'Grievance Submitted - Tracking ID: ' + trackingId, 
        emailHtml
      );
      console.log('Tracking email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send tracking email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ 
      success: true, 
      message: 'Grievance submitted successfully! Check your email for tracking ID.', 
      trackingId: trackingId
    });
  } catch (error) {
    console.error('Submit grievance error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Track grievance status (public endpoint - no auth required)
app.get('/api/grievances/track/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT id, name, department, grievance_type_hash, status, created_at, updated_at 
       FROM grievances 
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Grievance not found. Please check your tracking ID.' 
      });
    }

    const row = rows[0];
    // Return decrypted grievance type to the user; no admin_response column in schema
    const response = {
      id: row.id,
      name: row.name,
      department: row.department,
      grievance_type: tryDecryptMaybePlain(row.grievance_type_hash),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    res.json(response);
  } catch (error) {
    console.error('Track grievance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all grievances (for admin dashboard - future use)
app.get('/api/grievances', verifyToken, async (req, res) => {
  try {
    const { status, role, search } = req.query;
    
    let query = 'SELECT id, name, role, user_id, department, year, email, mobile, grievance_type_hash, grievance_hash, status, email_verified, created_at, updated_at FROM grievances WHERE 1=1';
    const params = [];

    // Filter by status
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Filter by role
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    // Search by name or email
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, params);
    
    // Include both decrypted aliases and original encrypted fields for admin display
    const grievancesData = rows.map(row => {
      const decryptedType = tryDecryptMaybePlain(row.grievance_type_hash);
      const decryptedGrievance = tryDecryptMaybePlain(row.grievance_hash);
      
      // Debug log for first row to verify decryption
      if (row.id === rows[0]?.id) {
        console.log('Sample decryption check:');
        console.log('  Encrypted type:', row.grievance_type_hash?.substring(0, 50) + '...');
        console.log('  Decrypted type:', decryptedType);
        console.log('  Encrypted grievance:', row.grievance_hash?.substring(0, 50) + '...');
        console.log('  Decrypted grievance:', decryptedGrievance?.substring(0, 100) + '...');
      }
      
      return {
        ...row,
        grievance_type: decryptedType,
        grievance: decryptedGrievance
      };
    });
    
    res.json({ 
      success: true, 
      data: grievancesData, 
      count: grievancesData.length
    });
  } catch (error) {
    console.error('Get grievances error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Get grievance by ID
app.get('/api/grievances/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, role, user_id, department, year, email, mobile, grievance_type_hash, grievance_hash, status, email_verified, created_at, updated_at FROM grievances WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }
    
    // Include both decrypted aliases and original encrypted fields
    const grievance = {
      ...rows[0],
      grievance_type: tryDecryptMaybePlain(rows[0].grievance_type_hash),
      grievance: tryDecryptMaybePlain(rows[0].grievance_hash)
    };
    
    res.json({ 
      success: true, 
      data: grievance
    });
  } catch (error) {
    console.error('Get grievance error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Update grievance status (admin only)
app.patch('/api/grievances/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const grievanceId = req.params.id;

    if (!status || !['pending', 'in-progress', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be: pending, in-progress, resolved, or rejected' 
      });
    }

    // Fetch current status to enforce immutability for final states
    const [rows] = await db.query('SELECT status FROM grievances WHERE id = ?', [grievanceId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    const currentStatus = rows[0].status;

    // If already resolved or rejected, prevent any further changes
    if (currentStatus === 'resolved' || currentStatus === 'rejected') {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is final and cannot be changed after it is resolved or rejected.' 
      });
    }

    // No-op change
    if (currentStatus === status) {
      return res.json({ success: true, message: 'Status unchanged' });
    }

    const [result] = await db.query(
      'UPDATE grievances SET status = ? WHERE id = ?',
      [status, grievanceId]
    );

    res.json({ 
      success: true, 
      message: 'Grievance status updated successfully' 
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Get grievance statistics (admin dashboard)
app.get('/api/admin/statistics', verifyToken, async (req, res) => {
  try {
    // Total grievances
    const [totalResult] = await db.query('SELECT COUNT(*) as total FROM grievances');
    
    // By status
    const [statusResult] = await db.query(
      'SELECT status, COUNT(*) as count FROM grievances GROUP BY status'
    );
    
    // By role
    const [roleResult] = await db.query(
      'SELECT role, COUNT(*) as count FROM grievances GROUP BY role'
    );
    
    // By grievance type - Cannot group by hashed values
    // Commenting out as grievance_type is now hashed
    // const [typeResult] = await db.query(
    //   'SELECT grievance_type, COUNT(*) as count FROM grievances GROUP BY grievance_type ORDER BY count DESC'
    // );
    
    // Recent grievances (last 7 days)
    const [recentResult] = await db.query(
      'SELECT COUNT(*) as count FROM grievances WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );

    res.json({ 
      success: true, 
      data: {
        total: totalResult[0].total,
        byStatus: statusResult,
        byRole: roleResult,
        recentCount: recentResult[0].count,
        note: 'Grievance type statistics unavailable due to hashing'
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 SMTP configured for ${process.env.SMTP_HOST}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}\n`);
});

module.exports = app;
