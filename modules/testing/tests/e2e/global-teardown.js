const mysql = require('mysql2/promise');

async function globalTeardown() {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  try {
    // Clean up test data
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3307'),
      user: process.env.DB_USER || 'kdfamily_user',
      password: process.env.DB_PASSWORD || 'kdfamily_pass',
      database: process.env.DB_NAME || 'kdfamily_test'
    });
    
    // Remove test data
    await connection.execute('DELETE FROM users WHERE email LIKE "%test%"');
    await connection.execute('DELETE FROM tasks WHERE title LIKE "%Test%"');
    await connection.execute('DELETE FROM points_history WHERE description LIKE "%Test%"');
    
    await connection.end();
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid failing the test suite
  }
}

module.exports = globalTeardown;
