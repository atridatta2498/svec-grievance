# Grievance Portal (React + Node.js + MySQL)

This is a full-stack Student & Faculty Grievance Portal built with React (Vite) for the frontend and Node.js/Express with MySQL for the backend. It uses Nodemailer for SMTP email delivery and implements OTP-based email verification.

## Features

### Frontend (React + Vite)
- Role selection: Student / Teaching Faculty / Non-teaching Staff
- Roll number / Faculty ID / Staff ID validation
- Department dropdown with multiple departments
- Year of study (shown only for students)
- Email and mobile number fields
- Grievance type dropdown with 7 categories
- OTP-based email verification
- Responsive design with mobile support
- Modern gradient UI with smooth animations

### Backend (Node.js + Express + MySQL)
- RESTful API endpoints
- MySQL database with connection pooling
- OTP generation and verification (5-minute expiry)
- Email domain validation (@srivasaviengg.ac.in, @sves.org.in)
- SMTP email sending with HTML templates
- CORS enabled
- Error handling and validation

### Validation Rules
- **Student Roll Number:** `23A51A0501` or `23A5` format
- **Faculty ID:** `T-ABCD123` format (T- + 4 letters + 1-3 digits)
- **Email Domains:** Only @srivasaviengg.ac.in or @sves.org.in
- **OTP:** 6-digit code, valid for 5 minutes

## Quick Start

### 1. Install Frontend Dependencies
```cmd
cd C:\Users\Sripad\Desktop\Grievance\grievance-portal\frontend
npm install
```

### 2. Install Backend Dependencies
```cmd
cd ..\backend
npm install
```

### 3. Setup MySQL Database
- Start MySQL (via XAMPP or standalone)
- Import `backend/database.sql` to create database and tables

### 4. Configure Backend Environment
Copy `backend/.env.example` to `backend/.env` and configure:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=grievance_portal

# Server
PORT=5000

# SMTP (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@srivasaviengg.ac.in
SMTP_FROM_NAME=Grievance Portal

# Security
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRY=24h
ALLOWED_DOMAINS=@srivasaviengg.ac.in,@sves.org.in
OTP_EXPIRY_MINUTES=5
```

### 5. Configure Frontend Environment
Copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ALLOWED_DOMAINS=@srivasaviengg.ac.in,@sves.org.in
VITE_OTP_EXPIRY_MINUTES=5
```

### 6. Start Backend Server
```cmd
cd backend
npm run dev
```
Server runs on http://localhost:5000

### 7. Start Frontend Development Server
```cmd
cd ..\frontend
npm run dev
```
Frontend runs on http://localhost:5173

## Project Structure

```
grievance-portal/
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── GrievanceForm.jsx      # User grievance form
│   │   │   ├── AdminLogin.jsx         # Admin login page
│   │   │   ├── ChangePassword.jsx     # Password change page
│   │   │   └── AdminDashboard.jsx     # Admin dashboard
│   │   ├── App.jsx                    # App container
│   │   ├── main.jsx                   # React entry point
│   │   ├── index.css                  # Global styles
│   │   └── firebase.js                # (Legacy - not used)
│   ├── index.html                     # HTML entry
│   ├── package.json                   # Frontend dependencies
│   └── vite.config.js                 # Vite configuration
│
├── backend/                    # Node.js Backend
│   ├── .env                           # Environment configuration
│   ├── .gitignore                     # Git ignore for backend
│   ├── package.json                   # Backend dependencies
│   ├── server.js                      # Express server & API routes
│   ├── db.js                          # MySQL connection pool
│   ├── mailer.js                      # Email sending functions
│   ├── database.sql                   # Database schema
│   ├── migration_hash_grievances.sql  # Migration script
│   ├── README.md                      # Backend setup guide
│   ├── ADMIN_SYSTEM.md                # Admin authentication docs
│   └── HASHING_SYSTEM.md              # Data privacy docs
│
└── README.md                   # This file
```

## API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/send-otp` | Send OTP to email |
| POST | `/api/verify-otp` | Verify OTP code |
| POST | `/api/submit-grievance` | Submit grievance (hashed) |

### Admin Endpoints (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login (returns JWT) |
| POST | `/api/admin/change-password` | Change password |
| POST | `/api/admin/verify-token` | Verify JWT token |
| GET | `/api/admin/profile` | Get admin profile |
| GET | `/api/grievances` | Get all grievances (metadata only) |
| GET | `/api/grievances/:id` | Get grievance by ID |
| PUT | `/api/grievances/:id/status` | Update grievance status |
| GET | `/api/admin/statistics` | Get statistics dashboard |

## Database Schema

### `grievances` Table
- id, name, role, user_id, department, year, email, mobile
- **grievance_type_hash** (VARCHAR 255), **grievance_hash** (TEXT) - Hashed for privacy
- status (pending/in-progress/resolved/rejected), email_verified
- created_at, updated_at

### `otps` Table
- id, email, otp, verified, expires_at, created_at

### `admin_users` Table
- id, username, password_hash, email, full_name
- role (super_admin/admin/moderator), is_first_login, last_login
- created_at, updated_at

**Default Admin Accounts:**
- admin1, admin2, admin3, moderator1, moderator2
- Default password: `Admin@123` (must change on first login)

## Configuration

### Backend Environment Variables

All backend configuration is in `backend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | localhost |
| `DB_USER` | MySQL username | root |
| `DB_PASSWORD` | MySQL password | (empty) |
| `DB_NAME` | Database name | grievance_portal |
| `PORT` | Server port | 5000 |
| `SMTP_HOST` | SMTP server | smtp.gmail.com |
| `SMTP_PORT` | SMTP port | 587 |
| `SMTP_USER` | Email address | - |
| `SMTP_PASS` | Email password/app password | - |
| `SMTP_FROM_EMAIL` | Sender email | noreply@srivasaviengg.ac.in |
| `SMTP_FROM_NAME` | Sender name | Grievance Portal |
| `JWT_SECRET` | JWT secret key | (change in production) |
| `JWT_EXPIRY` | JWT token expiry | 24h |
| `ALLOWED_DOMAINS` | Allowed email domains (comma-separated) | @srivasaviengg.ac.in,@sves.org.in |
| `OTP_EXPIRY_MINUTES` | OTP validity duration | 5 |

### Frontend Environment Variables

All frontend configuration is in `frontend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | http://localhost:5000/api |
| `VITE_APP_NAME` | Application name | Grievance Portal |
| `VITE_APP_VERSION` | Application version | 1.0.0 |
| `VITE_ALLOWED_DOMAINS` | Allowed email domains | @srivasaviengg.ac.in,@sves.org.in |
| `VITE_OTP_EXPIRY_MINUTES` | OTP expiry (display only) | 5 |

**Note:** Vite requires environment variables to be prefixed with `VITE_` to be accessible in the frontend.

### Email Domain Validation
Edit `backend/.env` and `frontend/.env`:
```env
ALLOWED_DOMAINS=@srivasaviengg.ac.in,@sves.org.in
VITE_ALLOWED_DOMAINS=@srivasaviengg.ac.in,@sves.org.in
```

### OTP Expiry Time
Edit `backend/.env`:
```env
OTP_EXPIRY_MINUTES=5
```

### Server Port
Edit `backend/.env`:
```env
PORT=5000
```
And update `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Gmail SMTP Setup

1. Enable 2-Step Verification in Google Account
2. Generate App Password:
   - Go to https://myaccount.google.com/security
   - App Passwords → Select "Mail" → Generate
3. Copy the 16-character password
4. Use it as `SMTP_PASS` in `.env`

## Development

### Frontend Development
```cmd
cd frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```cmd
cd backend
npm run dev          # Start with nodemon (auto-restart)
npm start            # Start server normally
```

## Troubleshooting

### Port Already in Use
- Change `PORT` in `backend/.env`
- Update `API_BASE_URL` in React frontend

### Email Not Sending
- Verify Gmail App Password
- Check SMTP credentials
- Check firewall settings
- Look for emails in spam folder

### Database Connection Error
- Ensure MySQL is running
- Verify credentials in `.env`
- Check if database exists

### CORS Errors
- Ensure backend server is running
- Check `API_BASE_URL` in frontend matches backend port

## Production Deployment

### Backend
- Deploy to Heroku, Railway, or DigitalOcean
- Set environment variables on hosting platform
- Use production MySQL database (ClearDB, PlanetScale, AWS RDS)

### Frontend
- Build: `npm run build`
- Deploy `dist/` folder to Vercel, Netlify, or Cloudflare Pages
- Update `API_BASE_URL` to production backend URL

## Future Enhancements

- [x] Admin dashboard for managing grievances ✅
- [x] Grievance data privacy protection (bcrypt hashing) ✅
- [x] JWT authentication system ✅
- [ ] Status update notifications via email
- [ ] File attachment support
- [ ] Advanced search and filtering
- [ ] Analytics and reporting
- [ ] Multi-language support
- [ ] SMS notifications
- [ ] CAPTCHA integration
- [ ] Rate limiting on API endpoints
- [ ] 2FA for admin accounts
- [ ] Audit logging for admin actions

## Technologies Used

**Frontend:**
- React 18
- Vite 5
- Modern CSS (Flexbox, Grid, Custom Properties)

**Backend:**
- Node.js
- Express.js
- MySQL2 (with promises)
- Nodemailer
- bcrypt (password & data hashing)
- jsonwebtoken (JWT authentication)
- CORS
- dotenv

## License

MIT License - feel free to use this project for educational purposes.

## Support

For detailed backend setup, see `backend/README.md`
For admin authentication details, see `backend/ADMIN_SYSTEM.md`
For data privacy system details, see `backend/HASHING_SYSTEM.md`

For issues:
1. Check both frontend and backend terminals for errors
2. Verify MySQL is running
3. Check `.env` configuration
4. Test API endpoints with Postman/curl
5. Ensure JWT_SECRET is set in backend `.env`

