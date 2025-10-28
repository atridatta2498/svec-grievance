require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'grievance_portal'
  });

  console.log('Connected to database');
  
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  console.log('Disabled foreign key checks');
  
  await connection.query('DROP TABLE IF EXISTS grievances');
  console.log('Dropped old table');
  
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
  console.log('Created new table');
  
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('Re-enabled foreign key checks');
  
  const [columns] = await connection.query('DESCRIBE grievances');
  console.log('\nTable structure:');
  columns.forEach(col => console.log(`  ${col.Field}`));
  
  await connection.end();
  console.log('\nDONE! Table fixed.');
}

fixTable().catch(err => console.error('Error:', err.message));
