-- Reset is_first_login flag for all admin users
-- This will force them to change password on next login

USE grievance_portal;

-- Reset all admin users to first login state
UPDATE admin_users SET is_first_login = TRUE;

-- If you want to reset only specific users, use:
-- UPDATE admin_users SET is_first_login = TRUE WHERE username IN ('admin1', 'admin2');

-- Verify the update
SELECT username, email, role, is_first_login FROM admin_users;
