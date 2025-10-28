# Backend Setup Instructions (Node.js + Express + MySQL)

This backend uses Node.js with Express framework, MySQL database, and Nodemailer for SMTP email functionality.

## Prerequisites
- Node.js 16+ installed (download from https://nodejs.org/)
- MySQL installed (XAMPP or standalone MySQL)
- Gmail account (or other SMTP provider)

## Setup Steps

### 1. Install Dependencies

Open Command Prompt in the backend folder:
```cmd
cd C:\Users\Sripad\Desktop\Grievance\grievance-portal\backend
npm install
```

This will install:
- express - Web framework
- mysql2 - MySQL client
- nodemailer - Email sending
- cors - Cross-origin requests
- dotenv - Environment variables
- body-parser - Request body parsing

### 2. Create MySQL Database

1. Start MySQL (via XAMPP or standalone)
2. Open MySQL command line or phpMyAdmin
3. Run the SQL from `database.sql`:
   - Creates `grievance_portal` database
   - Creates `grievances` table
   - Creates `otps` table
   - Creates `admin_users` table (optional)

**Via MySQL Command Line:**
```cmd
mysql -u root -p < database.sql
```

**Via phpMyAdmin:**
- Open http://localhost/phpmyadmin
- Click "Import" → Select `database.sql` → Click "Go"

### 3. Configure Environment Variables

Edit the `.env` file with your settings:

**Database Configuration:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=grievance_portal
```

**Server Configuration:**
```env
PORT=5000
```

**SMTP Configuration (Gmail):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@srivasaviengg.ac.in
SMTP_FROM_NAME=Grievance Portal
```

**Email Domain Validation:**
```env
ALLOWED_DOMAINS=@srivasaviengg.ac.in,@sves.org.in
```

**OTP Settings:**
```env
OTP_EXPIRY_MINUTES=5
```

### 4. Gmail App Password Setup

1. Go to Google Account Settings: https://myaccount.google.com/
2. Security → 2-Step Verification (enable it)
3. Security → App Passwords
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Paste it in `.env` as `SMTP_PASS`

### 5. Start the Backend Server

**Development mode (with auto-restart):**
```cmd
npm run dev
```

**Production mode:**
```cmd
npm start
```

You should see:
```
✓ Database connected successfully
✓ SMTP server ready to send emails
🚀 Server running on http://localhost:5000
📧 SMTP configured for smtp.gmail.com
🗄️  Database: grievance_portal
```

### 6. Test the API

Open a new terminal and test endpoints:

**Health Check:**
```cmd
curl http://localhost:5000/api/health
```

**Send OTP (using PowerShell):**
```powershell
$body = @{ email = "student@srivasaviengg.ac.in" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/send-otp" -Method POST -Body $body -ContentType "application/json"
```

**Or use Postman/Insomnia to test:**
- POST `http://localhost:5000/api/send-otp`
- Body: `{ "email": "student@srivasaviengg.ac.in" }`

### 7. Start the React Frontend

Open a new terminal:
```cmd
cd C:\Users\Sripad\Desktop\Grievance\grievance-portal
npm run dev
```

The React app will connect to the Node.js backend at `http://localhost:5000/api`

## API Endpoints

### `GET /api/health`
Health check endpoint
- Response: `{ success: true, message: "Server is running" }`

### `POST /api/send-otp`
Send OTP to email
- Body: `{ "email": "user@srivasaviengg.ac.in" }`
- Response: `{ "success": true, "message": "OTP sent to your email" }`

### `POST /api/verify-otp`
Verify OTP code
- Body: `{ "email": "user@srivasaviengg.ac.in", "otp": "123456" }`
- Response: `{ "success": true, "message": "OTP verified successfully" }`

### `POST /api/submit-grievance`
Submit grievance (requires verified OTP)
- Body: All form fields
- Response: `{ "success": true, "message": "Grievance submitted successfully", "grievanceId": 123 }`

### `GET /api/grievances`
Get all grievances (for admin)
- Response: `{ "success": true, "data": [...] }`

### `GET /api/grievances/:id`
Get specific grievance by ID
- Response: `{ "success": true, "data": {...} }`

## File Structure

```
backend/
├── .env                 # Environment configuration
├── package.json         # Node.js dependencies
├── server.js           # Main Express server
├── db.js               # MySQL connection pool
├── mailer.js           # Email sending functions
├── database.sql        # Database schema
└── README.md           # This file
```

## Troubleshooting

### Port already in use
Change the port in `.env`:
```env
PORT=5001
```
And update frontend API URL in `src/components/GrievanceForm.jsx`

### Email not sending
1. Check SMTP credentials in `.env`
2. Use Gmail App Password (not regular password)
3. Enable "Less secure app access" if using regular Gmail (not recommended)
4. Check firewall/antivirus blocking port 587
5. Try port 465 with `SMTP_SECURE=true`

### Database connection error
1. Make sure MySQL is running
2. Check database credentials in `.env`
3. Verify database exists: `SHOW DATABASES;`
4. Test connection: `mysql -u root -p`

### CORS errors
The backend has CORS enabled for all origins. If issues persist:
1. Make sure both servers are running
2. Check browser console for exact error
3. Verify API_BASE_URL in React frontend

### Module not found
Run `npm install` in the backend folder to install all dependencies

## Production Deployment

### Heroku Deployment
```cmd
# Install Heroku CLI
heroku login
heroku create grievance-portal-backend
heroku addons:create cleardb:ignite
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASS=your-app-password
git push heroku main
```

### Environment Variables in Production
Set all `.env` variables as environment variables on your hosting platform

### Security Best Practices
1. Never commit `.env` to version control
2. Use strong database passwords
3. Enable HTTPS in production
4. Implement rate limiting (e.g., express-rate-limit)
5. Add request validation middleware
6. Use helmet.js for security headers
7. Implement proper logging (e.g., winston, morgan)

## Additional Features to Implement

- Admin authentication and dashboard
- Grievance status updates
- Email notifications on status changes
- File attachments support
- Search and filter grievances
- Analytics and reporting
- Rate limiting for OTP requests
- CAPTCHA integration

## Support

For issues or questions:
- Check logs in terminal
- Enable debug mode: `DEBUG=* npm start`
- Check MySQL logs
- Verify email in spam folder

## Prerequisites
- XAMPP installed (download from https://www.apachefriends.org/)
- PHP 7.4 or higher
- MySQL

## Setup Steps

### 1. Copy Backend Files
Copy the entire `backend` folder to your XAMPP `htdocs` directory:
```
C:\xampp\htdocs\grievance-portal\backend\
```

### 2. Create Database
1. Start XAMPP Control Panel
2. Start Apache and MySQL services
3. Open phpMyAdmin: http://localhost/phpmyadmin
4. Import the `database.sql` file to create the database and tables
   - Or run the SQL commands from `database.sql` manually

### 3. Configure Backend Settings

Edit `backend/config.php` and update:

**Database Configuration:**
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');          // Your MySQL username
define('DB_PASS', '');              // Your MySQL password (default is empty)
define('DB_NAME', 'grievance_portal');
```

**SMTP Configuration:**

For Gmail:
```php
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);  // Use 465 for SSL
define('SMTP_USERNAME', 'your-email@gmail.com');
define('SMTP_PASSWORD', 'your-app-password');  // Use App Password, not regular password
define('SMTP_FROM_EMAIL', 'noreply@srivasaviengg.ac.in');
define('SMTP_FROM_NAME', 'Grievance Portal');
```

**Gmail App Password Setup:**
1. Go to Google Account Settings
2. Security → 2-Step Verification (enable it)
3. Security → App Passwords
4. Generate a new app password for "Mail"
5. Use this 16-character password in config.php

For other SMTP providers (e.g., Outlook, custom SMTP):
- Update `SMTP_HOST` and `SMTP_PORT` accordingly
- Outlook: smtp-mail.outlook.com, port 587
- Custom: Ask your email provider

### 4. Install PHPMailer (Recommended for Production)

For better email delivery, install PHPMailer:

1. Open Command Prompt in the backend folder:
```cmd
cd C:\xampp\htdocs\grievance-portal\backend
```

2. Install Composer (if not installed): https://getcomposer.org/download/

3. Install PHPMailer:
```cmd
composer require phpmailer/phpmailer
```

4. Uncomment the PHPMailer code in `smtp-mailer.php` (lines 20-50)
5. Comment out the basic mail() function (lines 6-15)

### 5. Test the Backend

Open your browser and test:

**Send OTP:**
```
http://localhost/grievance-portal/backend/send-otp.php
```
POST request with JSON body:
```json
{
  "email": "student@srivasaviengg.ac.in"
}
```

**Verify OTP:**
```
http://localhost/grievance-portal/backend/verify-otp.php
```
POST request with JSON body:
```json
{
  "email": "student@srivasaviengg.ac.in",
  "otp": "123456"
}
```

### 6. Update Frontend API URL

In `src/components/GrievanceForm.jsx`, the API URL is already set to:
```javascript
const API_BASE_URL = 'http://localhost/grievance-portal/backend'
```

If your XAMPP htdocs structure is different, update this URL accordingly.

### 7. Enable CORS (if needed)

If you get CORS errors, make sure these headers are in `config.php`:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

## Troubleshooting

### Email not sending:
1. Check SMTP credentials in `config.php`
2. Make sure Gmail "Less secure app access" is enabled OR use App Password
3. Check PHP error logs: `C:\xampp\php\logs\php_error_log`
4. Install PHPMailer for better reliability

### Database connection error:
1. Make sure MySQL is running in XAMPP
2. Check database credentials in `config.php`
3. Verify database exists in phpMyAdmin

### OTP not received:
1. Check spam/junk folder
2. Check email in console logs (PHP error log)
3. Test SMTP settings with a simple email script

## API Endpoints

### POST `/send-otp.php`
Send OTP to email
- Body: `{ "email": "user@domain.com" }`
- Response: `{ "success": true/false, "message": "..." }`

### POST `/verify-otp.php`
Verify OTP
- Body: `{ "email": "user@domain.com", "otp": "123456" }`
- Response: `{ "success": true/false, "message": "..." }`

### POST `/submit-grievance.php`
Submit grievance (requires verified OTP)
- Body: All form fields
- Response: `{ "success": true/false, "message": "...", "grievanceId": 123 }`

## Security Notes

- Never commit `config.php` with real credentials to version control
- Use environment variables in production
- Enable HTTPS in production
- Implement rate limiting for OTP requests
- Add CAPTCHA to prevent abuse
- Validate and sanitize all inputs (already done in PHP files)

## Production Deployment

1. Use a proper email service (SendGrid, Mailgun, AWS SES)
2. Enable HTTPS
3. Set up proper database user with limited privileges
4. Use environment variables for sensitive config
5. Enable PHP error logging but hide errors from users
6. Implement proper session management
7. Add admin dashboard for grievance management
