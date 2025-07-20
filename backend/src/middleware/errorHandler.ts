import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { ValidationError } from 'express-validator'
import { logger, logError } from '@/utils/logger'
import { isDevelopment } from '@/config/environment'
import type { ApiResponse } from '@/types'

// Custom error classes
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean
  public code?: string

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.code = code

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public errors: Record<string, string[]>

  constructor(message: string, errors: Record<string, string[]>) {
    super(message, 422, 'VALIDATION_ERROR')
    this.errors = errors
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR')
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR')
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR')
  }
}

// Error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500
  let message = 'Internal server error'
  let code = 'INTERNAL_ERROR'
  let errors: Record<string, string[]> | undefined

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
    code = error.code || 'APP_ERROR'
    
    if (error instanceof ValidationError) {
      errors = error.errors
    }
  } else if (error instanceof ZodError) {
    statusCode = 422
    message = 'Validation failed'
    code = 'VALIDATION_ERROR'
    errors = error.errors.reduce((acc, err) => {
      const path = err.path.join('.')
      if (!acc[path]) acc[path] = []
      acc[path].push(err.message)
      return acc
    }, {} as Record<string, string[]>)
  } else if (error.name === 'ValidationError' && 'errors' in error) {
    // Mongoose validation error
    statusCode = 422
    message = 'Validation failed'
    code = 'VALIDATION_ERROR'
    errors = Object.keys((error as any).errors).reduce((acc, key) => {
      acc[key] = [(error as any).errors[key].message]
      return acc
    }, {} as Record<string, string[]>)
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
    code = 'INVALID_TOKEN'
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
    code = 'TOKEN_EXPIRED'
  } else if (error.name === 'MulterError') {
    statusCode = 400
    code = 'FILE_UPLOAD_ERROR'
    
    switch ((error as any).code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large'
        break
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files'
        break
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field'
        break
      default:
        message = 'File upload error'
    }
  } else if (error.name === 'CastError') {
    statusCode = 400
    message = 'Invalid ID format'
    code = 'INVALID_ID'
  } else if ((error as any).code === 'ER_DUP_ENTRY') {
    statusCode = 409
    message = 'Duplicate entry'
    code = 'DUPLICATE_ENTRY'
  } else if ((error as any).code === 'ECONNREFUSED') {
    statusCode = 503
    message = 'Service unavailable'
    code = 'SERVICE_UNAVAILABLE'
  }

  // Log error
  const errorContext = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    statusCode,
    code,
  }

  if (statusCode >= 500) {
    logError(error, 'Unhandled server error', errorContext)
  } else if (statusCode >= 400) {
    logger.warn('Client error', {
      message,
      ...errorContext,
    })
  }

  // Prepare response
  const response: ApiResponse = {
    success: false,
    error: message,
    ...(code && { code }),
    ...(errors && { errors }),
  }

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    (response as any).stack = error.stack
  }

  // Add request ID if available
  const requestId = (req as any).requestId
  if (requestId) {
    (response as any).requestId = requestId
  }

  res.status(statusCode).json(response)
}

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`)
  next(error)
}

// Validation error helper
export const createValidationError = (
  field: string,
  message: string
): ValidationError => {
  return new ValidationError('Validation failed', {
    [field]: [message],
  })
}

// Database error helper
export const handleDatabaseError = (error: any): AppError => {
  if (error.code === 'ER_DUP_ENTRY') {
    const match = error.sqlMessage?.match(/Duplicate entry '(.+)' for key '(.+)'/)
    if (match) {
      const [, value, key] = match
      return new ConflictError(`${key.replace('_', ' ')} '${value}' already exists`)
    }
    return new ConflictError('Duplicate entry')
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return new AppError('Referenced record does not exist', 400)
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return new AppError('Cannot delete record that is referenced by other records', 400)
  }

  if (error.code === 'ER_DATA_TOO_LONG') {
    return new AppError('Data too long for field', 400)
  }

  if (error.code === 'ER_BAD_NULL_ERROR') {
    return new AppError('Required field cannot be null', 400)
  }

  // Default database error
  logger.error('Unhandled database error:', error)
  return new AppError('Database operation failed', 500)
}

// Global error handlers for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
