export interface User {
  id: number;
  username: string;
  email: string;
  role: 'advisor' | 'parent' | 'member';
  avatar?: string;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: {
    email: boolean;
    push: boolean;
    taskReminders: boolean;
    pointsUpdates: boolean;
  };
  privacy?: {
    showProfile: boolean;
    showStats: boolean;
  };
}

export interface UserStats {
  totalPoints: number;
  completedTasks: number;
  pendingTasks: number;
  rank: number;
  weeklyPoints: number;
  monthlyPoints: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'tasks' | 'points' | 'streak' | 'special';
}

export interface UserActivity {
  id: number;
  type: 'task_completed' | 'points_earned' | 'achievement_unlocked' | 'task_assigned';
  description: string;
  points?: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

// Auth related types
export interface AuthUser extends User {
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// User roles and permissions
export type UserRole = 'advisor' | 'parent' | 'member';

export interface RolePermissions {
  canCreateTasks: boolean;
  canAssignTasks: boolean;
  canApproveTasks: boolean;
  canManageUsers: boolean;
  canViewAllStats: boolean;
  canDeleteTasks: boolean;
  canModifyPoints: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  advisor: {
    canCreateTasks: true,
    canAssignTasks: true,
    canApproveTasks: true,
    canManageUsers: true,
    canViewAllStats: true,
    canDeleteTasks: true,
    canModifyPoints: true,
  },
  parent: {
    canCreateTasks: true,
    canAssignTasks: true,
    canApproveTasks: true,
    canManageUsers: false,
    canViewAllStats: true,
    canDeleteTasks: false,
    canModifyPoints: false,
  },
  member: {
    canCreateTasks: false,
    canAssignTasks: false,
    canApproveTasks: false,
    canManageUsers: false,
    canViewAllStats: false,
    canDeleteTasks: false,
    canModifyPoints: false,
  },
};
