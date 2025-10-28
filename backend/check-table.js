require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkGrievancesTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'grievance_portal'
    });

    console.log('✓ Connected to database\n');

    // Check if grievances table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'grievances'"
    );

    if (tables.length === 0) {
      console.log('❌ grievances table does NOT exist!');
      console.log('   Run database.sql to create it.\n');
      await connection.end();
      return;
    }

    console.log('✓ grievances table exists\n');

    // Get table structure
    const [columns] = await connection.query('DESCRIBE grievances');

    console.log('Current table structure:\n');
    columns.forEach(col => {
      console.log(`  ${col.Field.padEnd(20)} ${col.Type.padEnd(30)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check if user_id column exists
    const hasUserId = columns.some(col => col.Field === 'user_id');
    
    if (!hasUserId) {
      console.log('❌ Column "user_id" is MISSING!\n');
      console.log('To fix, run this SQL command:\n');
      console.log('ALTER TABLE grievances ADD COLUMN user_id VARCHAR(50) NOT NULL AFTER role;');
      console.log('\nOr drop and recreate the table by running database.sql again.');
    } else {
      console.log('✓ Column "user_id" exists!');
    }

    // Check for hash columns
    const hasGrievanceTypeHash = columns.some(col => col.Field === 'grievance_type_hash');
    const hasGrievanceHash = columns.some(col => col.Field === 'grievance_hash');

    console.log('');
    
    if (!hasGrievanceTypeHash) {
      console.log('❌ Column "grievance_type_hash" is MISSING!');
      console.log('   ALTER TABLE grievances ADD COLUMN grievance_type_hash VARCHAR(255) NOT NULL;');
    } else {
      console.log('✓ Column "grievance_type_hash" exists');
    }

    if (!hasGrievanceHash) {
      console.log('❌ Column "grievance_hash" is MISSING!');
      console.log('   ALTER TABLE grievances ADD COLUMN grievance_hash TEXT NOT NULL;');
    } else {
      console.log('✓ Column "grievance_hash" exists');
    }

    await connection.end();

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkGrievancesTable();
