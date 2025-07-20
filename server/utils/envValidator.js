const logger = require('./logger');

const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_PORT',
  'JWT_SECRET',
  'PORT'
];

const optionalEnvVars = [
  'NODE_ENV',
  'JWT_EXPIRES_IN',
  'UPLOAD_PATH',
  'MAX_FILE_SIZE',
  'DOMAIN',
  'MYSQL_ROOT_PASSWORD'
];

function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Check required environment variables (except DB_PASSWORD for SQLite)
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      // Allow empty DB_PASSWORD for SQLite development
      if (varName === 'DB_PASSWORD' && process.env.DB_TYPE === 'sqlite') {
        return;
      }
      missing.push(varName);
    }
  });

  // Check for weak secrets
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long for security');
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.includes('your_jwt_secret')) {
    warnings.push('JWT_SECRET appears to be using default/example value - please change it');
  }

  // Check NODE_ENV
  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set, defaulting to development');
    process.env.NODE_ENV = 'development';
  }

  // Validate database port
  if (process.env.DB_PORT && isNaN(parseInt(process.env.DB_PORT))) {
    missing.push('DB_PORT must be a valid number');
  }

  // Validate application port
  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    missing.push('PORT must be a valid number');
  }

  // Log results
  if (missing.length > 0) {
    logger.error('Missing required environment variables:', missing);
    logger.error('Application cannot start. Please check your .env file.');
    return false;
  }

  if (warnings.length > 0) {
    warnings.forEach(warning => logger.warn(warning));
  }

  logger.info('Environment validation passed');
  return true;
}

function getEnvSummary() {
  const summary = {};

  [...requiredEnvVars, ...optionalEnvVars].forEach(varName => {
    if (process.env[varName]) {
      // Mask sensitive values
      if (varName.includes('PASSWORD') || varName.includes('SECRET')) {
        summary[varName] = '***masked***';
      } else {
        summary[varName] = process.env[varName];
      }
    }
  });

  return summary;
}

module.exports = {
  validateEnvironment,
  getEnvSummary
};
