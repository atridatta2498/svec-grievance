# Admin Authentication System Documentation

This document describes the admin authentication system with default users, password change functionality, and secure password storage.

## Features

### 1. **Default Admin Users**
5 pre-configured admin users with default credentials:

| Username | Password | Role | Email |
|----------|----------|------|-------|
| admin1 | Admin@123 | super_admin | admin1@srivasaviengg.ac.in |
| admin2 | Admin@123 | admin | admin2@srivasaviengg.ac.in |
| admin3 | Admin@123 | admin | admin3@srivasaviengg.ac.in |
| moderator1 | Admin@123 | moderator | moderator1@srivasaviengg.ac.in |
| moderator2 | Admin@123 | moderator | moderator2@srivasaviengg.ac.in |

### 2. **Password Security**
- Passwords are hashed using **bcrypt** with 10 salt rounds
- Default password hash stored in database
- Cannot retrieve original password (one-way hash)

### 3. **First Login Flow**
- On first login, `is_first_login` flag is `TRUE`
- User is forced to change password
- After successful password change, flag is set to `FALSE`
- Cannot access dashboard until password is changed

### 4. **Password Requirements**
New passwords must meet these criteria:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*(),.?":{}|<>)

### 5. **JWT Authentication**
- Login returns a JWT token
- Token expires after 24 hours (configurable)
- Token must be sent in Authorization header: `Bearer <token>`
- Token contains: admin ID, username, and role

## Database Schema

### `admin_users` Table

```sql
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    is_first_login BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
);
```

### Fields Explained

- **id**: Auto-incrementing primary key
- **username**: Unique username for login
- **password_hash**: Bcrypt hashed password (60 characters)
- **email**: Admin email address
- **full_name**: Display name
- **role**: Access level (super_admin, admin, moderator)
- **is_first_login**: TRUE until password is changed
- **last_login**: Timestamp of last successful login
- **created_at**: Account creation timestamp
- **updated_at**: Last update timestamp

## API Endpoints

### 1. Admin Login
**POST** `/api/admin/login`

Request:
```json
{
  "username": "admin1",
  "password": "Admin@123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "username": "admin1",
    "email": "admin1@srivasaviengg.ac.in",
    "fullName": "Administrator One",
    "role": "super_admin",
    "isFirstLogin": true
  }
}
```

### 2. Change Password
**POST** `/api/admin/change-password`

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "currentPassword": "Admin@123",
  "newPassword": "NewSecure@Pass123"
}
```

Response:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 3. Get Profile
**GET** `/api/admin/profile`

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin1",
    "email": "admin1@srivasaviengg.ac.in",
    "full_name": "Administrator One",
    "role": "super_admin",
    "is_first_login": false,
    "last_login": "2025-10-27T12:00:00.000Z",
    "created_at": "2025-10-27T10:00:00.000Z"
  }
}
```

### 4. Verify Token
**GET** `/api/admin/verify-token`

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "message": "Token is valid",
  "admin": {
    "id": 1,
    "username": "admin1",
    "role": "super_admin"
  }
}
```

### 5. Get Grievances (Protected)
**GET** `/api/grievances`

Headers:
```
Authorization: Bearer <token>
```

Query Parameters:
- `status` (optional): pending, in-progress, resolved, rejected
- `role` (optional): student, teaching, non-teaching
- `search` (optional): search by name, email, or grievance text

Response:
```json
{
  "success": true,
  "data": [...],
  "count": 25
}
```

### 6. Update Grievance Status (Protected)
**PATCH** `/api/grievances/:id/status`

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "status": "resolved"
}
```

Response:
```json
{
  "success": true,
  "message": "Grievance status updated successfully"
}
```

### 7. Get Statistics (Protected)
**GET** `/api/admin/statistics`

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": [
      { "status": "pending", "count": 45 },
      { "status": "in-progress", "count": 30 },
      { "status": "resolved", "count": 65 },
      { "status": "rejected", "count": 10 }
    ],
    "byRole": [
      { "role": "student", "count": 120 },
      { "role": "teaching", "count": 20 },
      { "role": "non-teaching", "count": 10 }
    ],
    "byType": [
      { "grievance_type": "INFRASTRUCTURE", "count": 45 },
      { "grievance_type": "EXAMINATION", "count": 38 }
    ],
    "recentCount": 12
  }
}
```

## React Components

### 1. AdminLogin.jsx
- Login form with username and password
- Shows default credentials for testing
- Stores token in localStorage
- Redirects to dashboard or password change

### 2. ChangePassword.jsx
- Password change form
- Current password verification
- New password validation (strength check)
- Confirm password matching
- Shows on first login or when manually triggered

### 3. AdminDashboard.jsx
- Statistics cards (total, pending, in-progress, resolved, rejected)
- Filters (status, role, search)
- Grievances table with status update dropdown
- Logout button
- Protected by JWT authentication

## Usage Flow

### First Time Login
1. User opens app and clicks "Admin Login"
2. Enters username: `admin1`, password: `Admin@123`
3. System detects `is_first_login = TRUE`
4. Redirects to "Change Password" screen
5. User enters current password and new password
6. Password is validated and hashed with bcrypt
7. Database updated: `is_first_login = FALSE`
8. User redirected to dashboard

### Subsequent Logins
1. User enters credentials
2. System verifies password with bcrypt.compare()
3. JWT token generated and returned
4. Token stored in localStorage
5. User redirected directly to dashboard

### Auto-Login on Refresh
1. App checks localStorage for token and admin info
2. If found and `is_first_login = FALSE`, go to dashboard
3. If `is_first_login = TRUE`, go to change password
4. If not found, show login screen

## Security Best Practices

### Implemented
✅ Password hashing with bcrypt (10 salt rounds)  
✅ JWT authentication with expiry  
✅ Password strength validation  
✅ Protected API endpoints  
✅ HTTPS recommended for production  
✅ No password in logs or responses  

### Recommended for Production
- [ ] Rate limiting on login endpoint (prevent brute force)
- [ ] Account lockout after failed attempts
- [ ] 2FA (Two-Factor Authentication)
- [ ] Password expiry (force change every 90 days)
- [ ] Session management (single session per user)
- [ ] Audit logging (track all admin actions)
- [ ] IP whitelisting for admin access
- [ ] CAPTCHA on login form

## Configuration

### Environment Variables (.env)

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production-use-long-random-string
JWT_EXPIRY=24h
```

**Important**: Change `JWT_SECRET` to a strong, random string in production!

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Troubleshooting

### Cannot login
- Check username spelling (case-sensitive)
- Verify database has default users inserted
- Check bcrypt is installed: `npm install bcrypt`
- Look for errors in backend terminal

### Token invalid/expired
- Token expires after 24h by default
- Clear localStorage and login again
- Check JWT_SECRET is same in server

### Password change fails
- Current password must be correct
- New password must meet strength requirements
- Check bcrypt version compatibility

### Dashboard not loading
- Ensure token is in localStorage
- Check Authorization header is sent
- Verify middleware verifyToken is working

## Adding New Admin Users

### Via SQL
```sql
-- Password: Admin@123
INSERT INTO admin_users (username, password_hash, email, full_name, role) 
VALUES (
  'newadmin',
  '$2b$10$rXKHPQXo7x.EGzGLwJqVr.ZnJqH5YY8JmqKvN8F8vPfQG0XqmXYLa',
  'newadmin@srivasaviengg.ac.in',
  'New Administrator',
  'admin'
);
```

### Via Node.js Script
```javascript
const bcrypt = require('bcrypt');

async function createAdmin() {
  const password = 'Admin@123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash:', hash);
  
  // Insert this hash in database
}

createAdmin();
```

## Role-Based Access Control (Future Enhancement)

Currently all authenticated admins have same access. Future implementation:

- **super_admin**: Full access, can create/delete admin users
- **admin**: View and update grievances, cannot manage users
- **moderator**: View only access, cannot update

Add role checks in middleware:
```javascript
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.admin.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};
```

## Support

For issues related to admin authentication:
1. Check backend logs for detailed error messages
2. Verify database schema is up to date
3. Ensure all npm packages are installed
4. Test API endpoints with Postman/curl
5. Check browser console for frontend errors
