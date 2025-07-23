// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Error Types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// Request Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role?: 'advisor' | 'parent' | 'member';
}

// Auth Response Types
export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
  };
}

export interface RegisterResponse {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface MeResponse {
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
    avatar_url?: string;
    group_id?: number;
  };
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  taskType: 'PM' | 'FTL' | 'PA' | 'UBI';
  points: number;
  assignedTo?: number;
  dueDate?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: number;
  status?: 'pending' | 'claimed' | 'in_progress' | 'completed' | 'approved';
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  avatar?: string;
  preferences?: Record<string, any>;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API Client Configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}
