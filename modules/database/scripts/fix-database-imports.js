const fs = require('fs');
const path = require('path');

const files = [
  '/home/kop/coding/KD_Family/server/services/userService.js',
  '/home/kop/coding/KD_Family/server/services/cronJobs.js',
  '/home/kop/coding/KD_Family/server/routes/notifications.js',
  '/home/kop/coding/KD_Family/server/routes/points.js',
  '/home/kop/coding/KD_Family/server/routes/tasks.js',
  '/home/kop/coding/KD_Family/server/routes/admin.js',
  '/home/kop/coding/KD_Family/server/routes/users.js',
  '/home/kop/coding/KD_Family/server/middleware/auth.js'
];

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the import statement
    content = content.replace(
      /const \{ ([^}]+) \} = require\(['"]\.\.\/\.\.\/config\/database['"]\);/g,
      "const { getDatabase } = require('../database/connection');"
    );
    
    // Add database initialization at the start of async functions that use query
    const lines = content.split('\n');
    let modified = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for async function definitions followed by query usage
      if (line.includes('async') && (line.includes('(req, res') || line.includes('function'))) {
        // Check if this function uses query in the next few lines
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          if (lines[j].includes('await query(') || lines[j].includes('query(')) {
            // Insert database initialization after the try statement
            for (let k = i + 1; k < j; k++) {
              if (lines[k].trim().includes('try {')) {
                lines.splice(k + 1, 0, '    const db = await getDatabase();');
                modified = true;
                break;
              }
            }
            break;
          }
        }
      }
    }
    
    if (modified) {
      content = lines.join('\n');
    }
    
    // Replace query calls with db.query
    content = content.replace(/await query\(/g, 'await db.query(');
    content = content.replace(/query\(/g, 'db.query(');
    
    // Replace transaction calls with db (note: SQLite doesn't have transactions in this simple implementation)
    content = content.replace(/await transaction\(/g, 'await db.query(');
    content = content.replace(/transaction\(/g, 'db.query(');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${path.basename(filePath)}`);
  } catch (error) {
    console.log(`❌ Error updating ${path.basename(filePath)}: ${error.message}`);
  }
});

console.log('Database import updates completed!');