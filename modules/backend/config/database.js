const { Pool } = require('pg');
const logger = require('../server/utils/logger');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'kdfamily_user',
  password: process.env.DB_PASSWORD || 'kdfamily_pass',
  database: process.env.DB_NAME || 'kdfamily',
  port: process.env.DB_PORT || 5432,
  max: 10, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

let pool;

async function initDatabase() {
  try {
    pool = new Pool(dbConfig);

    // 测试连接
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('PostgreSQL database connected successfully');
    return pool;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
}

async function query(sql, params = []) {
  try {
    if (!pool) {
      logger.warn('Database pool not initialized, initializing now...');
      await initDatabase();
    }
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
}

async function transaction(callback) {
  if (!pool) {
    logger.warn('Database pool not initialized, initializing now...');
    await initDatabase();
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  initDatabase,
  getPool,
  query,
  transaction
};