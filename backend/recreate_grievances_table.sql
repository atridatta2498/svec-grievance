-- Drop old table and recreate with correct structure
USE grievance_portal;

-- Drop old grievances table
DROP TABLE IF EXISTS grievances;

-- Create new grievances table with correct column names
CREATE TABLE grievances (
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

SELECT 'Grievances table recreated successfully!' AS message;
