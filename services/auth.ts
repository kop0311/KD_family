import { apiClient } from './api';
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  MeResponse
} from '@/types/api';
import type { User } from '@/types/user';

export class AuthService {
  private static readonly TOKEN_KEY = 'authToken';
  private static readonly USER_KEY = 'currentUser';

  /**
   * Login user with username and password
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      const data = response.data;

      // Store token and user info
      this.setToken(data.token);
      this.setUser(data.user);

      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>('/auth/register', userData);
      const data = response.data;

      // Store token and user info
      this.setToken(data.token);
      this.setUser(data.user);

      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      // Call logout endpoint if token exists
      if (this.getToken()) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local storage
      this.clearAuth();
    }
  }

  /**
   * Get current user info from server
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<MeResponse>('/auth/me');
      const data = response.data;

      // Transform backend user format to frontend format
      const user: User = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role as 'advisor' | 'parent' | 'member',
        avatar: data.user.avatar_url,
        totalPoints: 0, // Will be loaded separately
        createdAt: '', // Will be loaded separately
        updatedAt: '' // Will be loaded separately
      };

      this.setUser(user);
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      this.clearAuth();
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }

  /**
   * Get stored auth token
   */
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored user info
   */
  static getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      return null;
    }
  }

  /**
   * Store auth token
   */
  private static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Store user info
   */
  private static setUser(user: any): void {
    // Transform backend user format to frontend format if needed
    const normalizedUser: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatarUrl || user.avatar_url,
      totalPoints: user.totalPoints || 0,
      createdAt: user.createdAt || '',
      updatedAt: user.updatedAt || ''
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedUser));
  }

  /**
   * Clear all auth data
   */
  private static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Validate token format (basic check)
   */
  static isValidTokenFormat(token: string): boolean {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Check if token is expired (basic check)
   */
  static isTokenExpired(token: string): boolean {
    try {
      if (!this.isValidTokenFormat(token)) {
        return true;
      }

      // Decode JWT payload (without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp && payload.exp < currentTime;
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true;
    }
  }

  /**
   * Auto-refresh token if needed
   */
  static async refreshTokenIfNeeded(): Promise<boolean> {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      // Token is expired, need to re-authenticate
      this.clearAuth();
      return false;
    }

    // Token is still valid
    return true;
  }

  /**
   * Initialize auth state on app startup
   */
  static async initializeAuth(): Promise<User | null> {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    if (this.isTokenExpired(token)) {
      this.clearAuth();
      return null;
    }

    // Token exists and is not expired, verify with server
    return await this.getCurrentUser();
  }
}

export default AuthService;
