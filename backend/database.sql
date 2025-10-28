-- Create Database
CREATE DATABASE IF NOT EXISTS grievance_portal;
USE grievance_portal;

-- Grievances Table
CREATE TABLE IF NOT EXISTS grievances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role ENUM('student', 'teaching', 'non-teaching') NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    department VARCHAR(255) NOT NULL,
    year VARCHAR(10) DEFAULT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    grievance_type_hash VARCHAR(255) NOT NULL,
    grievance_hash TEXT NOT NULL,
    status ENUM('pending', 'in-progress', 'resolved', 'rejected') DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- OTPs Table
CREATE TABLE IF NOT EXISTS otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_expires_at (expires_at)
);

-- Admin Users Table (optional for future use)
CREATE TABLE IF NOT EXISTS admin_users (
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

-- Insert 5 default admin users with password 'Admin@123' (hashed using bcrypt)
-- Password: Admin@123
-- Hash: $2b$10$zjd/ZlJmvXD18jVtZFnYUuFf/Y3v8KDZGtMvWExr4igwccO5gH32m
INSERT INTO admin_users (username, password_hash, email, full_name, role, is_first_login) VALUES
('admin1', '$2b$10$zjd/ZlJmvXD18jVtZFnYUuFf/Y3v8KDZGtMvWExr4igwccO5gH32m', 'admin1@srivasaviengg.ac.in', 'Administrator One', 'super_admin', TRUE),
('admin2', '$2b$10$zjd/ZlJmvXD18jVtZFnYUuFf/Y3v8KDZGtMvWExr4igwccO5gH32m', 'admin2@srivasaviengg.ac.in', 'Administrator Two', 'admin', TRUE),
('admin3', '$2b$10$zjd/ZlJmvXD18jVtZFnYUuFf/Y3v8KDZGtMvWExr4igwccO5gH32m', 'admin3@srivasaviengg.ac.in', 'Administrator Three', 'admin', TRUE),
('moderator1', '$2b$10$zjd/ZlJmvXD18jVtZFnYUuFf/Y3v8KDZGtMvWExr4igwccO5gH32m', 'moderator1@srivasaviengg.ac.in', 'Moderator One', 'moderator', TRUE),
('moderator2', '$2b$10$zjd/ZlJmvXD18jVtZFnYUuFf/Y3v8KDZGtMvWExr4igwccO5gH32m', 'moderator2@srivasaviengg.ac.in', 'Moderator Two', 'moderator', TRUE);
