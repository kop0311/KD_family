import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { Button } from '@/components/ui/Button';
import { MagicCard, AnimatedCardGrid, StatCard } from '@/components/ui/enhanced/MagicCard';
import { MagicButton, AnimatedButtonGroup } from '@/components/ui/enhanced/MagicButton';
import { AnimatedTaskCard, PageTransition, SuccessAnimation } from '@/components/ui/enhanced/AnimatedComponents';
import { useNotification } from '@/components/common/NotificationProvider';
import { taskAPI } from '@/services/api';
import { Task, TaskStatus } from '@/types/task';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Trophy,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange }) => {
  const { addNotification } = useNotification();
  const [showSuccess, setShowSuccess] = useState(false);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-400" />;
    case 'claimed':
      return <User className="w-4 h-4 text-blue-400" />;
    case 'in_progress':
      return <AlertCircle className="w-4 h-4 text-orange-400" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'approved':
      return <Trophy className="w-4 h-4 text-purple-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: TaskStatus) => {
    const statusMap = {
      pending: '待认领',
      claimed: '已认领',
      in_progress: '进行中',
      completed: '已完成',
      approved: '已批准',
      rejected: '已拒绝'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: TaskStatus) => {
    const colorMap = {
      pending: 'bg-yellow-500/20 border-yellow-300/30 text-yellow-300',
      claimed: 'bg-blue-500/20 border-blue-300/30 text-blue-300',
      in_progress: 'bg-orange-500/20 border-orange-300/30 text-orange-300',
      completed: 'bg-green-500/20 border-green-300/30 text-green-300',
      approved: 'bg-purple-500/20 border-purple-300/30 text-purple-300',
      rejected: 'bg-red-500/20 border-red-300/30 text-red-300'
    };
    return colorMap[status] || 'bg-gray-500/20 border-gray-300/30 text-gray-300';
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      onStatusChange(task.id, newStatus);
      if (newStatus === 'completed') {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
      addNotification({
        type: 'success',
        message: `任务状态已更新为${getStatusText(newStatus)}`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: '状态更新失败，请重试'
      });
    }
  };

  return (
    <>
      <MagicCard className="p-6" hover glow={task.status === 'in_progress'}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-white font-semibold text-lg">{task.title}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(task.status)}`}>
                {getStatusIcon(task.status)}
                {getStatusText(task.status)}
              </span>
            </div>
            <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
              {task.taskType}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">{task.points}</div>
            <div className="text-white/70 text-sm">积分</div>
          </div>
        </div>

        <p className="text-white/80 mb-4 line-clamp-2">{task.description}</p>

        <div className="flex items-center justify-between text-sm text-white/70 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('zh-CN') : '无截止日期'}
            </div>
            {task.assignedTo && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                已分配
              </div>
            )}
          </div>
          <div className="text-xs">
            创建于 {new Date(task.createdAt).toLocaleDateString('zh-CN')}
          </div>
        </div>

        <AnimatedButtonGroup>
          {task.status === 'pending' && (
            <MagicButton
              size="sm"
              variant="primary"
              onClick={() => handleStatusChange('claimed')}
              shimmer
            >
              认领任务
            </MagicButton>
          )}
          {task.status === 'claimed' && (
            <MagicButton
              size="sm"
              variant="secondary"
              onClick={() => handleStatusChange('in_progress')}
              shimmer
            >
              开始执行
            </MagicButton>
          )}
          {task.status === 'in_progress' && (
            <MagicButton
              size="sm"
              variant="success"
              onClick={() => handleStatusChange('completed')}
              shimmer
              glow
            >
              完成任务
            </MagicButton>
          )}
          {task.status === 'completed' && (
            <MagicButton
              size="sm"
              variant="primary"
              onClick={() => handleStatusChange('approved')}
              shimmer
            >
              批准完成
            </MagicButton>
          )}
        </AnimatedButtonGroup>
      </MagicCard>

      <SuccessAnimation
        show={showSuccess}
        onComplete={() => setShowSuccess(false)}
      />
    </>
  );
};

export const TaskList: React.FC = () => {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  // 获取任务列表
  const { data: tasksResponse, isLoading, error } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => taskAPI.getTasks()
  });

  // 更新任务状态
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: TaskStatus }) => {
      switch (status) {
      case 'claimed':
        // TODO: Implement taskAPI.claimTask when endpoint is available
        throw new Error('任务认领功能暂未实现');
      case 'completed':
        return taskAPI.completeTask(taskId);
      case 'approved':
        // TODO: Implement taskAPI.approveTask when endpoint is available
        throw new Error('任务批准功能暂未实现');
      default:
        // TODO: Implement taskAPI.updateTask when endpoint is available
        throw new Error('任务状态更新功能暂未实现');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: error.message || '操作失败，请重试'
      });
    }
  });

  const handleStatusChange = (taskId: number, status: TaskStatus) => {
    updateTaskMutation.mutate({ taskId, status });
  };

  // 获取任务数据
  const tasks = tasksResponse?.data?.data || [];
  
  // 过滤任务
  const filteredTasks = tasks.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filterOptions = [
    { value: 'all', label: '全部任务' },
    { value: 'pending', label: '待认领' },
    { value: 'claimed', label: '已认领' },
    { value: 'in_progress', label: '进行中' },
    { value: 'completed', label: '已完成' },
    { value: 'approved', label: '已批准' }
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <GlassContainer className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">加载失败</h2>
          <p className="text-white/70">无法加载任务列表，请刷新页面重试</p>
        </GlassContainer>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">任务管理</h1>
              <p className="text-white/70">管理和跟踪家庭任务进度</p>
            </div>
            <MagicButton
              variant="primary"
              onClick={() => navigate('/tasks/create')}
              className="flex items-center gap-2"
              shimmer
              glow
            >
              <Plus className="w-4 h-4" />
              创建任务
            </MagicButton>
          </div>

          {/* 过滤和搜索 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="搜索任务..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/50" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as TaskStatus | 'all')}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-slate-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 任务列表 */}
          {isLoading ? (
            <AnimatedCardGrid columns={1} gap="md">
              {[...Array(3)].map((_, i) => (
                <MagicCard key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-white/20 rounded mb-4"></div>
                    <div className="h-4 bg-white/10 rounded mb-2"></div>
                    <div className="h-4 bg-white/10 rounded w-2/3"></div>
                  </div>
                </MagicCard>
              ))}
            </AnimatedCardGrid>
          ) : filteredTasks.length > 0 ? (
            <AnimatedCardGrid columns={1} gap="md" staggerDelay={0.1}>
              {filteredTasks.map((task: Task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </AnimatedCardGrid>
          ) : (
            <MagicCard className="p-8 text-center" variant="elevated">
              <AlertCircle className="w-12 h-12 text-white/50 mx-auto mb-4" />
              <h2 className="text-white text-xl font-semibold mb-2">暂无任务</h2>
              <p className="text-white/70 mb-4">
                {searchTerm ? '没有找到匹配的任务' : '还没有创建任何任务'}
              </p>
              <MagicButton
                variant="primary"
                onClick={() => navigate('/tasks/create')}
                shimmer
              >
                创建第一个任务
              </MagicButton>
            </MagicCard>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default TaskList;
