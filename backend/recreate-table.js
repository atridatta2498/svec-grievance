require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function recreateTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'grievance_portal'
    });

    console.log('✓ Connected to database\n');

    // Disable foreign key checks
    console.log('Disabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Check if old grievances exist
    try {
      const [rows] = await connection.query('SELECT COUNT(*) as count FROM grievances');
      const hasData = rows[0].count > 0;

      if (hasData) {
        console.log(`⚠️  WARNING: Found ${rows[0].count} existing grievance(s)\n`);
        console.log('This will DELETE all existing grievances!');
        console.log('\nProceeding in 3 seconds...\n');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (err) {
      // Table might not exist
    }

    console.log('Dropping old grievances table...');
    await connection.query('DROP TABLE IF EXISTS grievances');
    console.log('✓ Old table dropped\n');

    console.log('Creating new grievances table...');
    await connection.query(`
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
      )
    `);
    console.log('✓ New table created\n');

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Foreign key checks re-enabled\n');

    // Verify new structure
    const [columns] = await connection.query('DESCRIBE grievances');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ GRIEVANCES TABLE RECREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('New table structure:\n');
    columns.forEach(col => {
      const check = ['user_id', 'grievance_type_hash', 'grievance_hash', 'created_at'].includes(col.Field) ? '✓' : ' ';
      console.log(`  ${check} ${col.Field.padEnd(22)} ${col.Type.padEnd(30)}`);
    });

    console.log('\n✓ Table is now compatible with the application!\n');
    console.log('You can now submit grievances through the frontend.');

    await connection.end();

  } catch (error) {
    console.error('Error:', error.message);
  }
}

recreateTable();
