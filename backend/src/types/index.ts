import { Request } from 'express'

// User Types
export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  group_id?: number
  created_at: Date
  updated_at: Date
  last_login?: Date
  is_active: boolean
}

export type UserRole = 'advisor' | 'parent' | 'member'

export interface CreateUserData {
  username: string
  email: string
  password: string
  full_name: string
  role?: UserRole
  group_id?: number
}

export interface UpdateUserData {
  username?: string
  email?: string
  full_name?: string
  role?: UserRole
  avatar_url?: string
  group_id?: number
  is_active?: boolean
}

// Authentication Types
export interface AuthTokenPayload {
  userId: number
  username: string
  role: UserRole
  iat: number
  exp: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  user: Omit<User, 'password'>
  token: string
  refreshToken?: string
}

// Request Types
export interface AuthenticatedRequest extends Request {
  user: User
}

export interface PaginationQuery {
  page?: string
  limit?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Task Types
export interface Task {
  id: number
  title: string
  description?: string
  points: number
  category: string
  status: TaskStatus
  priority: TaskPriority
  created_by: number
  assigned_to?: number
  due_date?: Date
  created_at: Date
  updated_at: Date
  completed_at?: Date
  approved_at?: Date
  approved_by?: number
  creator?: User
  assignee?: User
  approver?: User
}

export type TaskStatus = 'available' | 'claimed' | 'completed' | 'approved' | 'rejected'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface CreateTaskData {
  title: string
  description?: string
  points: number
  category: string
  priority?: TaskPriority
  due_date?: Date
  assigned_to?: number
}

export interface UpdateTaskData {
  title?: string
  description?: string
  points?: number
  category?: string
  priority?: TaskPriority
  status?: TaskStatus
  assigned_to?: number
  due_date?: Date
}

// Points and Statistics Types
export interface UserStats {
  user_id: number
  total_points: number
  week_points: number
  month_points: number
  year_points: number
  total_tasks: number
  completed_tasks: number
  current_streak: number
  best_streak: number
  rank: number
  last_activity?: Date
}

export interface LeaderboardEntry {
  user: User
  stats: UserStats
  rank: number
}

// Achievement Types
export interface Achievement {
  id: number
  title: string
  description: string
  icon?: string
  image_url?: string
  points_required?: number
  tasks_required?: number
  streak_required?: number
  category: string
  is_active: boolean
  created_at: Date
}

export interface UserAchievement {
  id: number
  user_id: number
  achievement_id: number
  earned_at: Date
  achievement: Achievement
}

// Notification Types
export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: NotificationType
  read: boolean
  created_at: Date
  action_url?: string
  metadata?: Record<string, unknown>
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'task' | 'achievement'

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

export interface ApiError {
  message: string
  code?: string
  statusCode: number
  details?: unknown
}

// Database Types
export interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  connectionLimit?: number
  acquireTimeout?: number
  timeout?: number
}

// Cache Types
export interface CacheConfig {
  host: string
  port: number
  password?: string
  db?: number
  keyPrefix?: string
}

// Job Types
export interface JobData {
  type: string
  payload: Record<string, unknown>
  userId?: number
  priority?: number
  delay?: number
  attempts?: number
}

// File Upload Types
export interface UploadedFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
  buffer?: Buffer
}

// Environment Types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: number
  DB_HOST: string
  DB_PORT: number
  DB_USER: string
  DB_PASSWORD: string
  DB_NAME: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  REDIS_HOST?: string
  REDIS_PORT?: number
  REDIS_PASSWORD?: string
  SMTP_HOST?: string
  SMTP_PORT?: number
  SMTP_USER?: string
  SMTP_PASS?: string
  MAX_FILE_SIZE: number
  UPLOAD_PATH: string
}

// Utility Types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type Partial<T> = { [P in keyof T]?: T[P] }
export type Required<T> = { [P in keyof T]-?: T[P] }

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type AsyncReturnType<T extends (...args: unknown[]) => Promise<unknown>> = T extends (
  ...args: unknown[]
) => Promise<infer R>
  ? R
  : unknown
