const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/kdfamily.db');

async function checkSchema() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection failed:', err);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      // Check users table schema
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          console.error('Failed to get table info:', err);
          reject(err);
          return;
        }
        
        console.log('\n=== USERS TABLE SCHEMA ===');
        columns.forEach(col => {
          console.log(`${col.name} (${col.type}) - Required: ${col.notnull ? 'YES' : 'NO'} - Default: ${col.dflt_value || 'NULL'}`);
        });
        
        const hasAvatarUrl = columns.some(col => col.name === 'avatar_url');
        console.log(`\nAvatar URL column exists: ${hasAvatarUrl ? 'YES' : 'NO'}`);
        
        if (!hasAvatarUrl) {
          console.log('\n=== ADDING AVATAR_URL COLUMN ===');
          db.run("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)", (err) => {
            if (err) {
              console.error('Failed to add avatar_url column:', err);
            } else {
              console.log('Successfully added avatar_url column');
            }
            
            db.close((err) => {
              if (err) {
                console.error('Close error:', err);
              } else {
                console.log('Database connection closed');
              }
              resolve();
            });
          });
        } else {
          db.close((err) => {
            if (err) {
              console.error('Close error:', err);
            } else {
              console.log('Database connection closed');
            }
            resolve();
          });
        }
      });
    });
  });
}

if (require.main === module) {
  checkSchema()
    .then(() => {
      console.log('Schema check completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Schema check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkSchema };