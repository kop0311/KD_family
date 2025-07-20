import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { config, isDevelopment, isProduction } from '@/config/environment'

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`
    }
    
    return log
  })
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`
    
    // Add metadata if present (but keep it concise)
    if (Object.keys(meta).length > 0) {
      const metaStr = JSON.stringify(meta, null, 2)
      if (metaStr.length < 200) {
        log += ` ${metaStr}`
      } else {
        log += ` [metadata: ${Object.keys(meta).join(', ')}]`
      }
    }
    
    // Add stack trace for errors
    if (stack && isDevelopment) {
      log += `\n${stack}`
    }
    
    return log
  })
)

// Create transports
const transports: winston.transport[] = []

// Console transport (always enabled in development)
if (isDevelopment || !isProduction) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.LOG_LEVEL,
    })
  )
}

// File transports for production
if (isProduction) {
  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  )

  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    })
  )

  // Console for production (with less verbose format)
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      level: 'info',
    })
  )
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
  // Handle uncaught exceptions
  exceptionHandlers: isProduction ? [
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  ] : [],
  // Handle unhandled promise rejections
  rejectionHandlers: isProduction ? [
    new DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  ] : [],
})

// Add request ID to logs if available
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId })
}

// Structured logging helpers
export const loggers = {
  // Database operations
  database: logger.child({ component: 'database' }),
  
  // Authentication
  auth: logger.child({ component: 'auth' }),
  
  // API requests
  api: logger.child({ component: 'api' }),
  
  // Background jobs
  jobs: logger.child({ component: 'jobs' }),
  
  // Cache operations
  cache: logger.child({ component: 'cache' }),
  
  // Email service
  email: logger.child({ component: 'email' }),
  
  // File uploads
  upload: logger.child({ component: 'upload' }),
  
  // Security events
  security: logger.child({ component: 'security' }),
}

// Performance logging helper
export const logPerformance = (
  operation: string,
  startTime: number,
  metadata?: Record<string, any>
) => {
  const duration = Date.now() - startTime
  logger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...metadata,
  })
  
  // Warn on slow operations
  if (duration > 1000) {
    logger.warn(`Slow operation detected: ${operation}`, {
      duration: `${duration}ms`,
      ...metadata,
    })
  }
}

// Error logging helper with context
export const logError = (
  error: Error | unknown,
  context?: string,
  metadata?: Record<string, any>
) => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined
  
  logger.error(context ? `${context}: ${errorMessage}` : errorMessage, {
    stack: errorStack,
    ...metadata,
  })
}

// Security event logging
export const logSecurityEvent = (
  event: string,
  details: Record<string, any>,
  level: 'info' | 'warn' | 'error' = 'warn'
) => {
  loggers.security[level](`Security event: ${event}`, {
    timestamp: new Date().toISOString(),
    ...details,
  })
}

// API request logging
export const logApiRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: number,
  userAgent?: string,
  ip?: string
) => {
  const level = statusCode >= 400 ? 'warn' : 'info'
  
  loggers.api[level](`${method} ${url}`, {
    statusCode,
    duration: `${duration}ms`,
    userId,
    userAgent,
    ip,
  })
}

// Database query logging
export const logDatabaseQuery = (
  query: string,
  duration: number,
  rowCount?: number,
  error?: Error
) => {
  const truncatedQuery = query.length > 100 ? query.substring(0, 100) + '...' : query
  
  if (error) {
    loggers.database.error('Database query failed', {
      query: truncatedQuery,
      duration: `${duration}ms`,
      error: error.message,
    })
  } else {
    loggers.database.debug('Database query executed', {
      query: truncatedQuery,
      duration: `${duration}ms`,
      rowCount,
    })
  }
}

// Startup logging
export const logStartup = (message: string, details?: Record<string, any>) => {
  logger.info(`🚀 ${message}`, details)
}

// Shutdown logging
export const logShutdown = (message: string, details?: Record<string, any>) => {
  logger.info(`🛑 ${message}`, details)
}

// Health check logging
export const logHealthCheck = (
  service: string,
  status: 'healthy' | 'unhealthy',
  details?: Record<string, any>
) => {
  const level = status === 'healthy' ? 'info' : 'error'
  const emoji = status === 'healthy' ? '✅' : '❌'
  
  logger[level](`${emoji} Health check: ${service} is ${status}`, details)
}

// Export default logger
export default logger
