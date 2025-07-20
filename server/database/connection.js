const logger = require('../utils/logger');

let database = null;

async function getDatabase() {
  if (database) {
    return database;
  }

  const dbType = process.env.DB_TYPE || 'mysql';
  
  if (dbType === 'sqlite') {
    logger.info('Using SQLite database for development');
    const sqlite = require('./sqlite');
    await sqlite.connect();
    database = sqlite;
  } else {
    logger.info('Using MySQL database');
    const mysql = require('mysql2/promise');
    
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kdfamily',
      port: parseInt(process.env.DB_PORT) || 3306
    };
    
    database = await mysql.createConnection(dbConfig);
  }
  
  return database;
}

async function closeDatabase() {
  if (database) {
    await database.close();
    database = null;
  }
}

module.exports = {
  getDatabase,
  closeDatabase
};