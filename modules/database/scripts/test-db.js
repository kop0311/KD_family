const { Client } = require('pg');
const logger = require('../server/utils/logger');

require('dotenv').config();

async function testDatabaseConnection() {
  const configs = [
    {
      name: 'Local PostgreSQL (5432)',
      config: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '',
        database: 'postgres'
      }
    },
    {
      name: 'Docker PostgreSQL (5433)',
      config: {
        host: 'localhost',
        port: 5433,
        user: process.env.DB_USER || 'kdfamily_user',
        password: process.env.DB_PASSWORD || 'kdfamily_pass',
        database: process.env.DB_NAME || 'kdfamily'
      }
    }
  ];

  for (const { name, config } of configs) {
    try {
      logger.info(`Testing ${name}...`);
      const client = new Client({
        ...config,
        connectionTimeoutMillis: 3000
      });

      await client.connect();
      await client.query('SELECT NOW()');
      await client.end();

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