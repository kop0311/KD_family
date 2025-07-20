import { apiClient } from './api'
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types'

export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    return response
  },

  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    return response
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{ user: User }>('/auth/me')
    return response.user
  },

  // Logout user (if needed for server-side logout)
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  // Refresh token (if implemented)
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh')
    return response
  },

  // Change password
  changePassword: async (data: {
    currentPassword: string
    newPassword: string
  }): Promise<void> => {
    await apiClient.post('/auth/change-password', data)
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email })
  },

  // Reset password with token
  resetPassword: async (data: {
    token: string
    password: string
  }): Promise<void> => {
    await apiClient.post('/auth/reset-password', data)
  },
}
