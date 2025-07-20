import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { query } from '@/database/connection'
import { authenticate, generateToken, generateRefreshToken } from '@/middleware/auth'
import { asyncHandler } from '@/middleware/errorHandler'
import { validateRequest } from '@/middleware/validation'
import { AuthenticationError, ConflictError } from '@/middleware/errorHandler'
import { loggers } from '@/utils/logger'
import type { User, AuthResponse } from '@/types'

const router = Router()

// Validation schemas
const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
})

const registerSchema = z.object({
  body: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must be at most 100 characters'),
    role: z.enum(['advisor', 'parent', 'member']).default('member'),
  }),
})

// Login endpoint
router.post('/login', validateRequest(loginSchema), asyncHandler(async (req, res) => {
  const { username, password } = req.body

  // Find user by username or email
  const users = await query<User & { password: string }>(
    `SELECT id, username, email, full_name, role, avatar_url, group_id, 
            created_at, updated_at, last_login, is_active, password
     FROM users 
     WHERE (username = ? OR email = ?) AND is_active = true`,
    [username, username]
  )

  if (users.length === 0) {
    throw new AuthenticationError('Invalid credentials')
  }

  const user = users[0]

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    loggers.security.warn('Failed login attempt', {
      username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    })
    throw new AuthenticationError('Invalid credentials')
  }

  // Update last login
  await query(
    'UPDATE users SET last_login = NOW() WHERE id = ?',
    [user.id]
  )

  // Remove password from user object
  const { password: _, ...userWithoutPassword } = user

  // Generate tokens
  const token = generateToken(userWithoutPassword)
  const refreshToken = generateRefreshToken(userWithoutPassword)

  // Log successful login
  loggers.auth.info('User logged in', {
    userId: user.id,
    username: user.username,
    role: user.role,
    ip: req.ip,
  })

  const response: AuthResponse = {
    user: userWithoutPassword,
    token,
    refreshToken,
  }

  res.json({
    success: true,
    data: response,
    message: 'Login successful',
  })
}))

// Register endpoint
router.post('/register', validateRequest(registerSchema), asyncHandler(async (req, res) => {
  const { username, email, password, fullName, role } = req.body

  // Check if username or email already exists
  const existingUsers = await query<{ username: string; email: string }>(
    'SELECT username, email FROM users WHERE username = ? OR email = ?',
    [username, email]
  )

  if (existingUsers.length > 0) {
    const existing = existingUsers[0]
    if (existing.username === username) {
      throw new ConflictError('Username already exists')
    }
    if (existing.email === email) {
      throw new ConflictError('Email already exists')
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const result = await query(
    `INSERT INTO users (username, email, password, full_name, role, created_at, updated_at, is_active)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW(), true)`,
    [username, email, hashedPassword, fullName, role]
  )

  const userId = (result as any).insertId

  // Get created user
  const users = await query<User>(
    `SELECT id, username, email, full_name, role, avatar_url, group_id, 
            created_at, updated_at, last_login, is_active
     FROM users 
     WHERE id = ?`,
    [userId]
  )

  const user = users[0]

  // Generate tokens
  const token = generateToken(user)
  const refreshToken = generateRefreshToken(user)

  // Log registration
  loggers.auth.info('User registered', {
    userId: user.id,
    username: user.username,
    role: user.role,
    ip: req.ip,
  })

  const response: AuthResponse = {
    user,
    token,
    refreshToken,
  }

  res.status(201).json({
    success: true,
    data: response,
    message: 'Registration successful',
  })
}))

// Get current user endpoint
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
    message: 'User retrieved successfully',
  })
}))

// Logout endpoint (optional - mainly for logging)
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  loggers.auth.info('User logged out', {
    userId: req.user!.id,
    username: req.user!.username,
    ip: req.ip,
  })

  res.json({
    success: true,
    message: 'Logout successful',
  })
}))

export default router
