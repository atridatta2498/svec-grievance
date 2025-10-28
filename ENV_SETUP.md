# Environment Variables Setup Guide

This document explains how to configure environment variables for both frontend and backend.

## Quick Setup

### Backend Setup
```cmd
cd backend
copy .env.example .env
```
Then edit `backend\.env` with your actual values.

### Frontend Setup
```cmd
cd frontend
copy .env.example .env
```
Frontend `.env` usually works with defaults for local development.

---

## Backend Environment Variables (`backend/.env`)

### Database Configuration
```env
DB_HOST=localhost          # MySQL server host
DB_USER=root              # MySQL username
DB_PASSWORD=              # MySQL password (empty for XAMPP default)
DB_NAME=grievance_portal  # Database name
```

### Server Configuration
```env
PORT=5000                 # Backend server port
```

### SMTP Email Configuration
```env
SMTP_HOST=smtp.gmail.com               # SMTP server
SMTP_PORT=587                          # SMTP port
SMTP_SECURE=false                      # Use TLS (true for port 465)
SMTP_USER=your-email@gmail.com         # Your email address
SMTP_PASS=your-app-password            # Gmail App Password (not regular password)
SMTP_FROM_EMAIL=noreply@srivasaviengg.ac.in  # Sender email
SMTP_FROM_NAME=Grievance Portal        # Sender name
```

**Gmail App Password Setup:**
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" and generate
4. Copy the 16-character password to `SMTP_PASS`

### Security Configuration
```env
JWT_SECRET=your-secret-key-change-this-in-production-use-long-random-string
JWT_EXPIRY=24h                         # Token expiry (24 hours)
```

**Important:** Change `JWT_SECRET` to a long, random string in production!

### Validation Configuration
```env
ALLOWED_DOMAINS=@srivasaviengg.ac.in,@sves.org.in  # Comma-separated email domains
OTP_EXPIRY_MINUTES=5                               # OTP validity duration
```

---

## Frontend Environment Variables (`frontend/.env`)

### API Configuration
```env
VITE_API_BASE_URL=http://localhost:5000/api  # Backend API URL
```

**Production:** Change to your production backend URL:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Application Info
```env
VITE_APP_NAME=Grievance Portal
VITE_APP_VERSION=1.0.0
```

### Validation Configuration
```env
VITE_ALLOWED_DOMAINS=@srivasaviengg.ac.in,@sves.org.in  # Must match backend
VITE_OTP_EXPIRY_MINUTES=5                               # Must match backend
```

---

## Environment-Specific Configurations

### Development (Default)
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`
- Database: Local MySQL (XAMPP)

### Production
1. **Backend `.env`:**
   ```env
   DB_HOST=your-production-db-host
   DB_USER=your-production-db-user
   DB_PASSWORD=your-production-db-password
   PORT=5000
   JWT_SECRET=very-long-random-production-secret-key
   ```

2. **Frontend `.env`:**
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```

3. Build frontend:
   ```cmd
   cd frontend
   npm run build
   ```

---

## Troubleshooting

### Backend won't start
- ✅ Check `.env` file exists in `backend/` folder
- ✅ Verify MySQL is running
- ✅ Confirm database credentials in `.env`
- ✅ Ensure `JWT_SECRET` is set

### Frontend can't connect to backend
- ✅ Check `VITE_API_BASE_URL` in `frontend/.env`
- ✅ Verify backend server is running on correct port
- ✅ Check browser console for CORS errors

### Emails not sending
- ✅ Verify SMTP credentials in `backend/.env`
- ✅ Use Gmail App Password, not regular password
- ✅ Check firewall allows SMTP connection
- ✅ Look for emails in spam folder

### OTP not working
- ✅ Ensure `OTP_EXPIRY_MINUTES` matches in both `.env` files
- ✅ Check email delivery
- ✅ Verify email domain in `ALLOWED_DOMAINS`

### Environment variables not loading
**Frontend:**
- ✅ Variable names MUST start with `VITE_`
- ✅ Restart dev server after changing `.env`
- ✅ Access with `import.meta.env.VITE_VARIABLE_NAME`

**Backend:**
- ✅ Restart server after changing `.env`
- ✅ Access with `process.env.VARIABLE_NAME`

---

## Security Best Practices

1. **Never commit `.env` files to Git**
   - `.gitignore` includes `.env` by default
   - Share `.env.example` instead

2. **Use strong JWT_SECRET in production**
   - Minimum 32 characters
   - Use random string generator
   - Example: `openssl rand -base64 32`

3. **Use environment-specific configurations**
   - `.env.development` for development
   - `.env.production` for production
   - `.env.local` for local overrides (git-ignored)

4. **Rotate secrets regularly**
   - Change `JWT_SECRET` periodically
   - Update SMTP passwords
   - Use different credentials for dev/prod

---

## Accessing Environment Variables

### Backend (Node.js/Express)
```javascript
// After loading dotenv
const port = process.env.PORT || 5000
const dbHost = process.env.DB_HOST
const jwtSecret = process.env.JWT_SECRET
```

### Frontend (React + Vite)
```javascript
// Must be prefixed with VITE_
const apiUrl = import.meta.env.VITE_API_BASE_URL
const appName = import.meta.env.VITE_APP_NAME
```

---

## Additional Resources

- [dotenv Documentation](https://www.npmjs.com/package/dotenv)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
