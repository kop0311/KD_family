export interface Task {
  id: number;
  title: string;
  description: string;
  taskType: TaskType;
  points: number;
  status: TaskStatus;
  createdBy: number;
  assignedTo?: number;
  claimedBy?: number;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  approvedAt?: string;
  metadata?: TaskMetadata;
}

export type TaskType = 'PM' | 'FTL' | 'PA' | 'UBI';

export type TaskStatus = 
  | 'pending'     // 待认领
  | 'claimed'     // 已认领
  | 'in_progress' // 进行中
  | 'completed'   // 已完成
  | 'approved'    // 已批准
  | 'rejected';   // 已拒绝

export interface TaskMetadata {
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: number; // in minutes
  category?: string;
  tags?: string[];
  attachments?: string[];
  notes?: string;
}

export interface TaskFilter {
  status?: TaskStatus[];
  taskType?: TaskType[];
  assignedTo?: number[];
  createdBy?: number[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'points' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface TaskStats {
  total: number;
  pending: number;
  claimed: number;
  inProgress: number;
  completed: number;
  approved: number;
  rejected: number;
  totalPoints: number;
  averagePoints: number;
}

export interface TaskHistory {
  id: number;
  taskId: number;
  userId: number;
  action: TaskAction;
  previousStatus?: TaskStatus;
  newStatus?: TaskStatus;
  comment?: string;
  createdAt: string;
}

export type TaskAction = 
  | 'created'
  | 'claimed'
  | 'started'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'assigned'
  | 'updated'
  | 'deleted';

// Task type configurations
export interface TaskTypeConfig {
  name: string;
  description: string;
  color: string;
  icon: string;
  defaultPoints: number;
  maxPoints: number;
}

export const TASK_TYPE_CONFIG: Record<TaskType, TaskTypeConfig> = {
  PM: {
    name: '项目管理',
    description: '项目管理相关任务',
    color: '#3B82F6',
    icon: '📋',
    defaultPoints: 50,
    maxPoints: 100,
  },
  FTL: {
    name: '家务劳动',
    description: '日常家务劳动',
    color: '#10B981',
    icon: '🏠',
    defaultPoints: 25,
    maxPoints: 75,
  },
  PA: {
    name: '个人成长',
    description: '个人能力提升',
    color: '#8B5CF6',
    icon: '📚',
    defaultPoints: 30,
    maxPoints: 80,
  },
  UBI: {
    name: '特殊任务',
    description: '特殊或临时任务',
    color: '#F59E0B',
    icon: '⭐',
    defaultPoints: 40,
    maxPoints: 120,
  },
};

// Task status configurations
export interface TaskStatusConfig {
  name: string;
  description: string;
  color: string;
  icon: string;
  canTransitionTo: TaskStatus[];
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, TaskStatusConfig> = {
  pending: {
    name: '待认领',
    description: '任务已创建，等待认领',
    color: '#6B7280',
    icon: '⏳',
    canTransitionTo: ['claimed', 'assigned'],
  },
  claimed: {
    name: '已认领',
    description: '任务已被认领，准备开始',
    color: '#3B82F6',
    icon: '👋',
    canTransitionTo: ['in_progress', 'pending'],
  },
  in_progress: {
    name: '进行中',
    description: '任务正在执行中',
    color: '#F59E0B',
    icon: '🔄',
    canTransitionTo: ['completed', 'claimed'],
  },
  completed: {
    name: '已完成',
    description: '任务已完成，等待审核',
    color: '#10B981',
    icon: '✅',
    canTransitionTo: ['approved', 'rejected', 'in_progress'],
  },
  approved: {
    name: '已批准',
    description: '任务已完成并获得批准',
    color: '#059669',
    icon: '🎉',
    canTransitionTo: [],
  },
  rejected: {
    name: '已拒绝',
    description: '任务完成质量不符合要求',
    color: '#DC2626',
    icon: '❌',
    canTransitionTo: ['in_progress', 'claimed'],
  },
};
