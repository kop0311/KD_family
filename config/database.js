const mysql = require('mysql2/promise');
const logger = require('../server/utils/logger');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'kdfamily_user',
  password: process.env.DB_PASSWORD || 'kdfamily_pass',
  database: process.env.DB_NAME || 'kdfamily',
  port: process.env.DB_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    
    const connection = await pool.getConnection();
    logger.info('Database connected successfully');
    connection.release();
    
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
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
}

async function transaction(callback) {
  if (!pool) {
    console.log('Database pool not initialized, initializing now...');
    await initDatabase();
  }
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  initDatabase,
  getPool,
  query,
  transaction
};