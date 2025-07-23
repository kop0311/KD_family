import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { store } from '../store';
import { logout, refreshAccessToken } from '../store/slices/authSlice';
import type { CreateTaskRequest } from '@/types/api';

// API base configuration - 更新为使用Next.js API Routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const state = store.getState();
      const refreshToken = state.auth.refreshToken;

      if (refreshToken) {
        try {
          await store.dispatch(refreshAccessToken(refreshToken));
          const newState = store.getState();
          const newToken = newState.auth.token;

          if (newToken) {
            original.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(original);
          }
        } catch (refreshError) {
          store.dispatch(logout());
          window.location.href = '/login';
        }
      } else {
        store.dispatch(logout());
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login', credentials),

  register: (userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => apiClient.post('/auth/register', userData),

  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  logout: () => apiClient.post('/auth/logout')
};

// User API - 更新为使用新的API结构
export const userAPI = {
  getUsers: (filters?: any) => apiClient.get('/users', { params: filters }),
  getUser: (id: number) => apiClient.get(`/users/${id}`),
  createUser: (userData: { username: string; email: string; role?: string }) =>
    apiClient.post('/users', userData),
  updateUser: (id: number, updates: any) => apiClient.put(`/users/${id}`, updates),
  getLeaderboard: () => apiClient.get('/leaderboard')
};

// Task API - 更新为使用新的API结构
export const taskAPI = {
  getTasks: (filters?: any) => apiClient.get('/tasks', { params: filters }),
  getTask: (id: number) => apiClient.get(`/tasks/${id}`),
  createTask: (taskData: CreateTaskRequest) => apiClient.post('/tasks', taskData),
  updateTask: (id: number, taskData: Partial<CreateTaskRequest>) => apiClient.put(`/tasks/${id}`, taskData),
  deleteTask: (id: number) => apiClient.delete(`/tasks/${id}`),
  assignTask: (id: number, userId: number) => apiClient.post(`/tasks/${id}/assign`, { userId }),
  claimTask: (id: number) => apiClient.post(`/tasks/${id}/claim`),
  completeTask: (id: number) => apiClient.post(`/tasks/${id}/complete`),
  approveTask: (id: number) => apiClient.post(`/tasks/${id}/approve`)
};

// Points API - 简化并指向排行榜API
export const pointsAPI = {
  getPoints: (userId?: number) => apiClient.get(userId ? `/points/${userId}` : '/points'),
  getPointsHistory: (userId: number) => apiClient.get(`/points/${userId}/history`),
  awardPoints: (data: { userId: number; points: number; reason: string }) => apiClient.post('/points/award', data),
  getLeaderboard: (period?: string) => apiClient.get(`/leaderboard${period ? `?period=${period}` : ''}`)
};

// Notification API
export const notificationAPI = {
  getNotifications: (userId: number) => apiClient.get(`/notifications/${userId}`),
  markAsRead: (id: number) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: (userId: number) => apiClient.put(`/notifications/${userId}/read-all`),
  deleteNotification: (id: number) => apiClient.delete(`/notifications/${id}`)
};

// Admin API
export const adminAPI = {
  getSystemStats: () => apiClient.get('/admin/stats'),
  getUsers: (filters?: any) => apiClient.get('/admin/users', { params: filters }),
  updateUserRole: (userId: number, role: string) =>
    apiClient.put(`/admin/users/${userId}/role`, { role }),
  deactivateUser: (userId: number) => apiClient.put(`/admin/users/${userId}/deactivate`),
  getSystemLogs: (filters?: any) => apiClient.get('/admin/logs', { params: filters })
};

export { apiClient };
export default apiClient;
