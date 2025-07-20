import dotenv from 'dotenv'
import { z } from 'zod'
import { logger } from '@/utils/logger'

// Load environment variables
dotenv.config()

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  
  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('3307'),
  DB_USER: z.string().default('kdfamily_user'),
  DB_PASSWORD: z.string().default('kdfamily_pass'),
  DB_NAME: z.string().default('kdfamily'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // Redis (optional)
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  
  // File uploads
  MAX_FILE_SIZE: z.string().transform(Number).default('5242880'), // 5MB
  UPLOAD_PATH: z.string().default('./uploads'),
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  
  // External APIs
  DICEBEAR_API_URL: z.string().default('https://api.dicebear.com/7.x'),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  SESSION_SECRET: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('app.log'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // CORS
  CORS_ORIGIN: z.string().optional(),
  
  // Feature flags
  ENABLE_SWAGGER: z.string().transform(Boolean).default('true'),
  ENABLE_METRICS: z.string().transform(Boolean).default('false'),
  ENABLE_CACHE: z.string().transform(Boolean).default('true'),
})

// Validate environment variables
const parseResult = envSchema.safeParse(process.env)

if (!parseResult.success) {
  logger.error('Environment validation failed:')
  parseResult.error.errors.forEach((error) => {
    logger.error(`${error.path.join('.')}: ${error.message}`)
  })
  process.exit(1)
}

export const config = parseResult.data

// Derived configurations
export const isDevelopment = config.NODE_ENV === 'development'
export const isProduction = config.NODE_ENV === 'production'
export const isTest = config.NODE_ENV === 'test'

// Database configuration
export const databaseConfig = {
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4',
}

// Redis configuration
export const redisConfig = config.REDIS_HOST ? {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT || 6379,
  password: config.REDIS_PASSWORD,
  db: config.REDIS_DB,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
} : null

// JWT configuration
export const jwtConfig = {
  secret: config.JWT_SECRET,
  expiresIn: config.JWT_EXPIRES_IN,
  refreshSecret: config.JWT_REFRESH_SECRET || config.JWT_SECRET,
  refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
}

// Email configuration
export const emailConfig = config.SMTP_HOST ? {
  host: config.SMTP_HOST,
  port: config.SMTP_PORT || 587,
  secure: config.SMTP_PORT === 465,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
  from: config.SMTP_FROM || config.SMTP_USER,
} : null

// File upload configuration
export const uploadConfig = {
  maxFileSize: config.MAX_FILE_SIZE,
  uploadPath: config.UPLOAD_PATH,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
}

// Log configuration summary (without sensitive data)
export const getConfigSummary = () => ({
  environment: config.NODE_ENV,
  port: config.PORT,
  database: {
    host: config.DB_HOST,
    port: config.DB_PORT,
    name: config.DB_NAME,
  },
  redis: redisConfig ? {
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db,
  } : 'disabled',
  features: {
    swagger: config.ENABLE_SWAGGER,
    metrics: config.ENABLE_METRICS,
    cache: config.ENABLE_CACHE && !!redisConfig,
    email: !!emailConfig,
  },
})

// Validate critical configurations
if (isProduction) {
  if (config.JWT_SECRET.length < 64) {
    logger.warn('JWT_SECRET should be at least 64 characters in production')
  }
  
  if (!config.CORS_ORIGIN) {
    logger.warn('CORS_ORIGIN should be set in production')
  }
}
