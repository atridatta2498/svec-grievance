require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixPasswords() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'grievance_portal'
    });

    console.log('✓ Connected to database\n');

    const correctHash = '$2b$10$zjd/ZlJmvXD18jVtZFnYUuFf/Y3v8KDZGtMvWExr4igwccO5gH32m';

    console.log('Updating admin passwords...\n');

    const [result] = await connection.query(
      'UPDATE admin_users SET password_hash = ?',
      [correctHash]
    );

    console.log(`✓ Updated ${result.affectedRows} admin user(s)\n`);

    // Verify the update
    const [users] = await connection.query(
      'SELECT username, email, role FROM admin_users'
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ ADMIN CREDENTIALS FIXED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('You can now login with:\n');
    users.forEach(user => {
      console.log(`  Username: ${user.username}`);
      console.log(`  Password: Admin@123`);
      console.log(`  Role: ${user.role}`);
      console.log('');
    });

    await connection.end();
    console.log('Done! Try logging in now.');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixPasswords();
