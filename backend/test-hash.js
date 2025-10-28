const bcrypt = require('bcrypt');

const password = 'Admin@123';
const hashFromDB = '$2b$10$rXKHPQXo7x.EGzGLwJqVr.ZnJqH5YY8JmqKvN8F8vPfQG0XqmXYLa';

console.log('Testing bcrypt hash...\n');
console.log('Password:', password);
console.log('Hash from DB:', hashFromDB);
console.log('');

// Test if the hash matches
bcrypt.compare(password, hashFromDB, (err, result) => {
  if (err) {
    console.error('Error comparing:', err);
    return;
  }
  console.log('Does password match hash?', result);
  console.log('');
  
  if (!result) {
    console.log('Hash does NOT match! Generating new hash...\n');
    
    // Generate a new hash
    bcrypt.hash(password, 10, (err, newHash) => {
      if (err) {
        console.error('Error generating hash:', err);
        return;
      }
      console.log('New hash for "Admin@123":');
      console.log(newHash);
      console.log('');
      console.log('Update your database with this SQL:');
      console.log(`UPDATE admin_users SET password_hash = '${newHash}' WHERE username IN ('admin1', 'admin2', 'admin3', 'moderator1', 'moderator2');`);
    });
  } else {
    console.log('✓ Hash is correct! The problem might be elsewhere.');
    console.log('');
    console.log('Troubleshooting steps:');
    console.log('1. Check if database was imported (database.sql)');
    console.log('2. Check if admin_users table exists');
    console.log('3. Check if JWT_SECRET is set in .env file');
    console.log('4. Check browser console for errors');
    console.log('5. Check network tab to see the actual error response');
  }
});
