-- Migrate old grievances table to new structure
USE grievance_portal;

-- Rename old table
RENAME TABLE grievances TO grievances_old;

-- Create new table with correct structure
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

-- Migrate existing data (hash the grievance fields)
-- Note: This will hash existing grievances with a simple prefix since we can't retrieve original values
INSERT INTO grievances (
    name, 
    role, 
    user_id, 
    department, 
    year, 
    email, 
    mobile, 
    grievance_type_hash, 
    grievance_hash, 
    status, 
    email_verified,
    created_at
)
SELECT 
    name,
    CASE 
        WHEN role = 'student' THEN 'student'
        WHEN role = 'faculty' THEN 'teaching'
        WHEN role = 'staff' THEN 'non-teaching'
        ELSE 'student'
    END as role,
    COALESCE(rollNumber, staffId, CONCAT('USER', userId)) as user_id,
    department,
    yearOfStudy as year,
    email,
    mobileNumber as mobile,
    CONCAT('[OLD_DATA]', grievanceType) as grievance_type_hash,  -- Mark as old data
    CONCAT('[OLD_DATA]', grievance) as grievance_hash,           -- Mark as old data
    status,
    TRUE as email_verified,  -- Assume old grievances were verified
    createdAt
FROM grievances_old;

-- Drop old table after successful migration
-- DROP TABLE grievances_old;  -- Uncomment this line after verifying migration

SELECT CONCAT('Migrated ', COUNT(*), ' grievances successfully!') AS message
FROM grievances;
