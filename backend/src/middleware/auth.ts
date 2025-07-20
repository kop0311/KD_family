import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { query } from '@/database/connection'
import { cache } from '@/database/redis'
import { jwtConfig } from '@/config/environment'
import { AuthenticationError, AuthorizationError } from './errorHandler'
import { loggers } from '@/utils/logger'
import type { User, UserRole, AuthTokenPayload, AuthenticatedRequest } from '@/types'

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      user?: User
      requestId?: string
    }
  }
}

// Token validation schema
const tokenSchema = z.object({
  userId: z.number(),
  username: z.string(),
  role: z.enum(['advisor', 'parent', 'member']),
  iat: z.number(),
  exp: z.number(),
})

// Extract token from request
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Also check cookies for token
  const cookieToken = req.cookies?.token
  if (cookieToken) {
    return cookieToken
  }
  
  return null
}

// Verify JWT token
const verifyToken = (token: string): AuthTokenPayload => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as any
    const validatedPayload = tokenSchema.parse(decoded)
    return validatedPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token')
    } else if (error instanceof z.ZodError) {
      throw new AuthenticationError('Invalid token payload')
    }
    throw new AuthenticationError('Token verification failed')
  }
}

// Get user from database with caching
const getUserById = async (userId: number): Promise<User | null> => {
  const cacheKey = `user:${userId}`
  
  // Try cache first
  const cachedUser = await cache.get<User>(cacheKey)
  if (cachedUser) {
    return cachedUser
  }
  
  // Query database
  const users = await query<User>(
    `SELECT id, username, email, full_name, role, avatar_url, group_id, 
            created_at, updated_at, last_login, is_active 
     FROM users 
     WHERE id = ? AND is_active = true`,
    [userId]
  )
  
  if (users.length === 0) {
    return null
  }
  
  const user = users[0]
  
  // Cache user for 15 minutes
  await cache.set(cacheKey, user, 15 * 60)
  
  return user
}

// Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req)
    
    if (!token) {
      throw new AuthenticationError('Access token required')
    }
    
    // Verify token
    const payload = verifyToken(token)
    
    // Get user from database
    const user = await getUserById(payload.userId)
    
    if (!user) {
      throw new AuthenticationError('User not found or inactive')
    }
    
    // Check if user role matches token
    if (user.role !== payload.role) {
      throw new AuthenticationError('Token role mismatch')
    }
    
    // Attach user to request
    req.user = user
    
    // Log authentication
    loggers.auth.debug('User authenticated', {
      userId: user.id,
      username: user.username,
      role: user.role,
      ip: req.ip,
    })
    
    next()
  } catch (error) {
    next(error)
  }
}

// Optional authentication middleware (doesn't throw if no token)
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req)
    
    if (token) {
      const payload = verifyToken(token)
      const user = await getUserById(payload.userId)
      
      if (user && user.role === payload.role) {
        req.user = user
      }
    }
    
    next()
  } catch (error) {
    // Ignore authentication errors for optional auth
    next()
  }
}

// Authorization middleware factory
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'))
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      loggers.security.warn('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
      })
      
      return next(new AuthorizationError('Insufficient permissions'))
    }
    
    next()
  }
}

// Role hierarchy check
const roleHierarchy: Record<UserRole, number> = {
  member: 1,
  parent: 2,
  advisor: 3,
}

export const authorizeMinRole = (minRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'))
    }
    
    const userRoleLevel = roleHierarchy[req.user.role]
    const minRoleLevel = roleHierarchy[minRole]
    
    if (userRoleLevel < minRoleLevel) {
      loggers.security.warn('Role hierarchy authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        userRoleLevel,
        minRole,
        minRoleLevel,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
      })
      
      return next(new AuthorizationError('Insufficient role level'))
    }
    
    next()
  }
}

// Resource ownership check
export const authorizeOwnership = (
  getResourceUserId: (req: Request) => number | Promise<number>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Authentication required'))
      }
      
      // Advisors can access all resources
      if (req.user.role === 'advisor') {
        return next()
      }
      
      const resourceUserId = await getResourceUserId(req)
      
      if (req.user.id !== resourceUserId) {
        loggers.security.warn('Resource ownership authorization failed', {
          userId: req.user.id,
          resourceUserId,
          endpoint: req.originalUrl,
          method: req.method,
          ip: req.ip,
        })
        
        return next(new AuthorizationError('Access denied to this resource'))
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}

// Generate JWT token
export const generateToken = (user: User): string => {
  const payload: Omit<AuthTokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    username: user.username,
    role: user.role,
  }
  
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  })
}

// Generate refresh token
export const generateRefreshToken = (user: User): string => {
  const payload = {
    userId: user.id,
    type: 'refresh',
  }
  
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  })
}

// Verify refresh token
export const verifyRefreshToken = (token: string): { userId: number } => {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshSecret) as any
    
    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid refresh token type')
    }
    
    return { userId: decoded.userId }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Refresh token expired')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token')
    }
    throw new AuthenticationError('Refresh token verification failed')
  }
}

// Invalidate user cache (call when user data changes)
export const invalidateUserCache = async (userId: number): Promise<void> => {
  const cacheKey = `user:${userId}`
  await cache.del(cacheKey)
}

// Middleware to add request ID
export const addRequestId = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  res.setHeader('X-Request-ID', req.requestId)
  next()
}

// Rate limiting by user
export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const requests = new Map<number, { count: number; resetTime: number }>()
  
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next()
    }
    
    const now = Date.now()
    const userId = req.user.id
    const userRequests = requests.get(userId)
    
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(userId, { count: 1, resetTime: now + windowMs })
      return next()
    }
    
    if (userRequests.count >= maxRequests) {
      loggers.security.warn('User rate limit exceeded', {
        userId,
        count: userRequests.count,
        maxRequests,
        windowMs,
        ip: req.ip,
      })
      
      return next(new AuthenticationError('Rate limit exceeded'))
    }
    
    userRequests.count++
    next()
  }
}
