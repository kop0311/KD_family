const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const logger = require('../server/utils/logger');

require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'kdfamily_user',
  password: process.env.DB_PASSWORD || 'kdfamily_pass',
  database: process.env.DB_NAME || 'kdfamily',
  port: process.env.DB_PORT || 3307,
  multipleStatements: true
};

async function runMigrations() {
  let connection;
  
  try {
    logger.info('Starting database migration...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    logger.info('Connected to database');
    
    // Read and execute base schema
    const schemaPath = path.join(__dirname, '../schema/init.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schema);
      logger.info('Base schema applied successfully');
    }
    
    // Read and execute enhanced schema
    const enhancedSchemaPath = path.join(__dirname, '../docs/database/enhanced-schema.sql');
    if (fs.existsSync(enhancedSchemaPath)) {
      const enhancedSchema = fs.readFileSync(enhancedSchemaPath, 'utf8');
      await connection.query(enhancedSchema);
      logger.info('Enhanced schema applied successfully');
    }
    
    // Read and execute indexes
    const indexesPath = path.join(__dirname, '../schema/indexes.sql');
    if (fs.existsSync(indexesPath)) {
      const indexes = fs.readFileSync(indexesPath, 'utf8');
      await connection.query(indexes);
      logger.info('Performance indexes applied successfully');
    }
    
    // Initialize JSON field defaults
    const jsonDefaultsPath = path.join(__dirname, 'init-json-defaults.sql');
    if (fs.existsSync(jsonDefaultsPath)) {
      const jsonDefaults = fs.readFileSync(jsonDefaultsPath, 'utf8');
      await connection.query(jsonDefaults);
      logger.info('JSON field defaults initialized successfully');
    }
    
    logger.info('Database migration completed successfully');
    
  } catch (error) {
    logger.error('Database migration failed:', error.message);
    // 在容器环境中不退出进程，返回错误码
    if (process.env.NODE_ENV === 'development' && process.env.DOCKER_CONTAINER) {
      logger.warn('Running in Docker development mode, migration failure will not stop container');
      return false;
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };