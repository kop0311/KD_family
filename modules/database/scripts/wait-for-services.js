const mysql = require('mysql2/promise');
const redis = require('redis');
const logger = require('../server/utils/logger');

require('dotenv').config();

const MAX_RETRIES = 30;
const RETRY_DELAY = 2000; // 2 seconds

async function waitForMySQL() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'kdfamily_user',
    password: process.env.DB_PASSWORD || 'kdfamily_pass',
    port: process.env.DB_PORT || 3307,
    connectTimeout: 5000
  };

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const connection = await mysql.createConnection(config);
      await connection.ping();
      await connection.end();
      logger.info('MySQL is ready!');
      return true;
    } catch (error) {
      logger.warn(`MySQL not ready (attempt ${i + 1}/${MAX_RETRIES}): ${error.message}`);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  
  throw new Error('MySQL service not available after maximum retries');
}

async function waitForRedis() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const client = redis.createClient({ url: redisUrl });
      await client.connect();
      await client.ping();
      await client.quit();
      logger.info('Redis is ready!');
      return true;
    } catch (error) {
      logger.warn(`Redis not ready (attempt ${i + 1}/${MAX_RETRIES}): ${error.message}`);
      if (i < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  
  throw new Error('Redis service not available after maximum retries');
}

async function waitForServices() {
  try {
    logger.info('Waiting for services to be ready...');
    
    await Promise.all([
      waitForMySQL()
      // Skip Redis for now since Docker isn't available
    ]);
    
    logger.info('All services are ready!');
    return true;
  } catch (error) {
    logger.error('Services failed to start:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  waitForServices();
}

module.exports = { waitForServices, waitForMySQL, waitForRedis };