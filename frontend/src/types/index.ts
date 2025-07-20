// User Types
export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: 'advisor' | 'parent' | 'member'
  avatar_url?: string
  group_id?: number
  created_at: string
  updated_at?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  fullName: string
  role?: 'advisor' | 'parent' | 'member'
}

// Task Types
export interface Task {
  id: number
  title: string
  description?: string
  points: number
  category: string
  status: 'available' | 'claimed' | 'completed' | 'approved'
  created_by: number
  assigned_to?: number
  due_date?: string
  created_at: string
  updated_at?: string
  completed_at?: string
  approved_at?: string
  creator?: User
  assignee?: User
}

export interface CreateTaskData {
  title: string
  description?: string
  points: number
  category: string
  due_date?: string
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: Task['status']
  assigned_to?: number
}

// Points and Statistics Types
export interface UserStats {
  total_points: number
  week_points: number
  month_points: number
  total_tasks: number
  completed_tasks: number
  current_streak: number
  best_streak: number
  rank: number
}

export interface LeaderboardEntry {
  user: User
  total_points: number
  week_points: number
  month_points: number
  rank: number
  tasks_completed: number
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
  created_at: string
}

export interface UserAchievement {
  id: number
  user_id: number
  achievement_id: number
  earned_at: string
  achievement: Achievement
}

// Notification Types
export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
  action_url?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form Types
export interface FormErrors {
  [key: string]: string | undefined
}

// Component Props Types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Store Types
export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateUser: (data: Partial<User>) => void
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
}
