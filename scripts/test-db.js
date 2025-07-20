const mysql = require('mysql2/promise');
const logger = require('../server/utils/logger');

require('dotenv').config();

async function testDatabaseConnection() {
  const configs = [
    {
      name: 'Local MySQL (3306)',
      config: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: ''
      }
    },
    {
      name: 'Docker MySQL (3307)',
      config: {
        host: 'localhost',
        port: 3307,
        user: process.env.DB_USER || 'kdfamily_user',
        password: process.env.DB_PASSWORD || 'kdfamily_pass'
      }
    }
  ];

  for (const { name, config } of configs) {
    try {
      logger.info(`Testing ${name}...`);
      const connection = await mysql.createConnection({
        ...config,
        connectTimeout: 3000
      });
      
      await connection.ping();
      await connection.end();
      
      logger.info(`✅ ${name} connection successful`);
      return config;
    } catch (error) {
      logger.warn(`❌ ${name} failed: ${error.message}`);
    }
  }
  
  logger.error('No database connection available');
  return null;
}

if (require.main === module) {
  testDatabaseConnection()
    .then(config => {
      if (config) {
        logger.info('Database connection test completed successfully');
        process.exit(0);
      } else {
        logger.error('All database connections failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Database test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };