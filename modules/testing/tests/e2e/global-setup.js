const mysql = require('mysql2/promise');

async function globalSetup() {
  console.log('🚀 Starting global setup for E2E tests...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = process.env.DB_HOST || 'localhost';
  process.env.DB_PORT = process.env.DB_PORT || '3307';
  process.env.DB_USER = process.env.DB_USER || 'kdfamily_user';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'kdfamily_pass';
  process.env.DB_NAME = process.env.DB_NAME || 'kdfamily_test';
  process.env.JWT_SECRET = 'test_jwt_secret_for_e2e_testing';
  process.env.JWT_EXPIRES_IN = '7d';
  
  try {
    // Wait for database to be ready
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    // Clean up test data
    await connection.execute('DELETE FROM users WHERE email LIKE "%test%"');
    await connection.execute('DELETE FROM tasks WHERE title LIKE "%Test%"');
    await connection.execute('DELETE FROM points_history WHERE description LIKE "%Test%"');
    
    // Create test users
    const bcrypt = require('bcryptjs');
    const testPassword = await bcrypt.hash('testpass123', 10);
    
    // Create advisor user
    await connection.execute(`
      INSERT IGNORE INTO users (username, email, password, role, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `, ['e2e_advisor', 'advisor@test.com', testPassword, 'advisor']);
    
    // Create parent user
    await connection.execute(`
      INSERT IGNORE INTO users (username, email, password, role, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `, ['e2e_parent', 'parent@test.com', testPassword, 'parent']);
    
    // Create member user
    await connection.execute(`
      INSERT IGNORE INTO users (username, email, password, role, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `, ['e2e_member', 'member@test.com', testPassword, 'member']);
    
    await connection.end();
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

module.exports = globalSetup;
