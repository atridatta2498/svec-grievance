-- Migration: Update grievances table to use hashed fields
-- Run this if you already have an existing grievances table

-- Step 1: Add new hashed columns
ALTER TABLE grievances 
ADD COLUMN grievance_type_hash VARCHAR(255) AFTER mobile,
ADD COLUMN grievance_hash TEXT AFTER grievance_type_hash;

-- Step 2: If you want to keep existing data, you cannot hash it retroactively
-- Bcrypt hashing is one-way and requires the original plaintext
-- Option A: Delete existing grievances (if test data)
-- TRUNCATE TABLE grievances;

-- Option B: Keep old data but mark as legacy (add a flag)
-- ALTER TABLE grievances ADD COLUMN is_legacy BOOLEAN DEFAULT FALSE;
-- UPDATE grievances SET is_legacy = TRUE WHERE grievance_type_hash IS NULL;

-- Step 3: After migration, you can drop old columns if no longer needed
-- WARNING: This will delete all grievance content permanently!
-- ALTER TABLE grievances DROP COLUMN grievance_type;
-- ALTER TABLE grievances DROP COLUMN grievance;

-- Step 4: Make the hashed columns NOT NULL (after ensuring all new entries use them)
-- ALTER TABLE grievances MODIFY grievance_type_hash VARCHAR(255) NOT NULL;
-- ALTER TABLE grievances MODIFY grievance_hash TEXT NOT NULL;

-- Note: For fresh installations, use the main database.sql file instead
