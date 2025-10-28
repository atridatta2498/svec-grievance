-- Fix Admin Password Hashes
-- This script updates all admin users with the correct password hash for 'Admin@123'

USE grievance_portal;

-- Update all admin users with the correct password hash
UPDATE admin_users 
SET password_hash = '$2b$10$zjd/ZlJmvXD18jVtZFnYUuFf/Y3v8KDZGtMvWExr4igwccO5gH32m' 
WHERE username IN ('admin1', 'admin2', 'admin3', 'moderator1', 'moderator2');

-- Verify the update
SELECT username, email, role, 
       CASE 
         WHEN password_hash = '$2b$10$zjd/ZlJmvXD18jVtZFnYUuFf/Y3v8KDZGtMvWExr4igwccO5gH32m' 
         THEN '✓ Correct' 
         ELSE '✗ Wrong' 
       END AS password_status
FROM admin_users;

-- Display admin credentials
SELECT '------- ADMIN CREDENTIALS -------' AS info;
SELECT 'Username: admin1, admin2, admin3, moderator1, moderator2' AS info;
SELECT 'Password: Admin@123' AS info;
SELECT '--------------------------------' AS info;
