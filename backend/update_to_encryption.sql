-- Update grievances table to use plain text columns (rename hash columns)
USE grievance_portal;

-- First, check if the table exists
SET FOREIGN_KEY_CHECKS = 0;

-- Drop old table and recreate with correct columns
DROP TABLE IF EXISTS grievances;

CREATE TABLE grievances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role ENUM('student', 'teaching', 'non-teaching') NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    department VARCHAR(255) NOT NULL,
    year VARCHAR(10) DEFAULT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    grievance_type_hash TEXT NOT NULL COMMENT 'Encrypted grievance type',
    grievance_hash TEXT NOT NULL COMMENT 'Encrypted grievance content',
    status ENUM('pending', 'in-progress', 'resolved', 'rejected') DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Table updated! Grievances will now be stored encrypted (admins can decrypt and view)' AS status;
