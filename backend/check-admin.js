require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function checkAdminUsers() {
  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'grievance_portal'
    });

    console.log('✓ Connected to database\n');

    // Check if admin_users table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'admin_users'"
    );

    if (tables.length === 0) {
      console.log('❌ admin_users table does NOT exist!');
      console.log('   Run database.sql to create it.\n');
      await connection.end();
      return;
    }

    console.log('✓ admin_users table exists\n');

    // Get all admin users
    const [users] = await connection.query(
      'SELECT username, password_hash, email, role FROM admin_users'
    );

    if (users.length === 0) {
      console.log('❌ No admin users found in database!');
      console.log('   Run the INSERT statements from database.sql\n');
      await connection.end();
      return;
    }

    console.log(`Found ${users.length} admin user(s):\n`);

    // Test password for each user
    const testPassword = 'Admin@123';
    
    for (const user of users) {
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      const status = isValid ? '✓ CORRECT' : '❌ WRONG';
      
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Password Hash: ${user.password_hash.substring(0, 20)}...`);
      console.log(`Test Password "Admin@123": ${status}`);
      console.log('');
    }

    // Provide solution if passwords are wrong
    const allValid = await Promise.all(
      users.map(u => bcrypt.compare(testPassword, u.password_hash))
    );

    if (allValid.includes(false)) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  SOME PASSWORDS ARE INCORRECT!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('To fix, run this SQL command:');
      console.log('');
      
      const correctHash = '$2b$10$zjd/ZlJmvXD18jVtZFnYUuFf/Y3v8KDZGtMvWExr4igwccO5gH32m';
      console.log(`UPDATE admin_users SET password_hash = '${correctHash}';`);
      console.log('');
      console.log('Or run: mysql -u root -p grievance_portal < fix_admin_passwords.sql');
      console.log('');
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✓ ALL PASSWORDS ARE CORRECT!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('Login with:');
      console.log('  Username: admin1 (or admin2, admin3, moderator1, moderator2)');
      console.log('  Password: Admin@123');
      console.log('');
      console.log('If still getting 401, check:');
      console.log('  1. Frontend is using correct API URL (check .env)');
      console.log('  2. Backend server is running');
      console.log('  3. Browser console for other errors');
      console.log('  4. Network tab to see the exact error message');
    }

    await connection.end();

  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n❌ Database "grievance_portal" does not exist!');
      console.log('   Create it by running database.sql');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n❌ Cannot connect to MySQL!');
      console.log('   Make sure MySQL/XAMPP is running');
    }
  }
}

checkAdminUsers();
