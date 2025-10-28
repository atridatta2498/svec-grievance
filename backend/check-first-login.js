// Script to check and reset is_first_login flag for admin users
require('dotenv').config();
const db = require('./db');

async function checkFirstLoginStatus() {
  try {
    console.log('\n=== Checking Admin Users First Login Status ===\n');
    
    const [admins] = await db.query(
      'SELECT id, username, email, full_name, role, is_first_login, last_login FROM admin_users ORDER BY id'
    );
    
    console.log('Total admin users:', admins.length);
    console.log('\nAdmin Users:');
    console.table(admins.map(a => ({
      ID: a.id,
      Username: a.username,
      'Full Name': a.full_name,
      Role: a.role,
      'First Login': a.is_first_login ? 'YES' : 'NO',
      'Last Login': a.last_login || 'Never'
    })));
    
    // Ask if user wants to reset
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\nDo you want to reset all users to first login? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        await db.query('UPDATE admin_users SET is_first_login = TRUE');
        console.log('\n✓ All admin users reset to first login status!');
        
        const [updated] = await db.query('SELECT username, is_first_login FROM admin_users');
        console.log('\nUpdated status:');
        console.table(updated.map(a => ({
          Username: a.username,
          'First Login': a.is_first_login ? 'YES' : 'NO'
        })));
      } else {
        console.log('\nNo changes made.');
      }
      
      readline.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFirstLoginStatus();
