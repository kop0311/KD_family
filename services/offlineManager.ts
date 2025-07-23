import { taskAPI } from './api';
import { OfflineAction } from '@/hooks/usePWA';

export interface OfflineTaskAction extends OfflineAction {
  type: 'CREATE_TASK' | 'UPDATE_TASK' | 'COMPLETE_TASK' | 'CLAIM_TASK' | 'APPROVE_TASK';
  data: {
    id?: number;
    title?: string;
    description?: string;
    taskType?: 'PM' | 'FTL' | 'PA' | 'UBI';
    points?: number;
    dueDate?: string;
    status?: string;
    [key: string]: any;
  };
}

class OfflineManager {
  private storeName = 'offline-actions';
  private syncInProgress = false;

  /**
   * 添加离线操作到队列
   */
  async addAction(action: OfflineTaskAction): Promise<void> {
    try {
      const existingActions = await this.getStoredActions();
      const updatedActions = [...existingActions, action];
      await this.persistActions(updatedActions);
    } catch (error) {
      console.error('添加离线操作失败:', error);
      throw error;
    }
  }

  /**
   * 当网络恢复时同步所有待处理的操作
   */
  async syncWhenOnline(): Promise<void> {
    if (!navigator.onLine || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      const actions = await this.getStoredActions();
      const successfulActions: string[] = [];

      for (const action of actions) {
        try {
          await this.executeAction(action);
          successfulActions.push(action.id);
          console.log('离线操作同步成功:', action);
        } catch (error) {
          console.error('离线操作同步失败:', action, error);
          // 继续处理其他操作，不中断整个同步过程
        }
      }

      // 移除成功同步的操作
      if (successfulActions.length > 0) {
        const remainingActions = actions.filter(
          action => !successfulActions.includes(action.id)
        );
        await this.persistActions(remainingActions);
      }
    } catch (error) {
      console.error('离线同步过程出错:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 执行具体的离线操作
   */
  private async executeAction(action: OfflineTaskAction): Promise<any> {
    switch (action.type) {
    case 'CREATE_TASK':
      return await taskAPI.createTask({
        title: action.data.title!,
        description: action.data.description!,
        taskType: action.data.taskType!,
        points: action.data.points!,
        dueDate: action.data.dueDate!
      });

    case 'UPDATE_TASK':
      return await taskAPI.updateTask(action.data.id!, action.data);

    case 'COMPLETE_TASK':
      return await taskAPI.completeTask(action.data.id!);

    case 'CLAIM_TASK':
      return await taskAPI.claimTask(action.data.id!);

    case 'APPROVE_TASK':
      return await taskAPI.approveTask(action.data.id!);

    default:
      throw new Error(`未知的离线操作类型: ${action.type}`);
    }
  }

  /**
   * 获取存储的离线操作
   */
  private async getStoredActions(): Promise<OfflineTaskAction[]> {
    try {
      const stored = localStorage.getItem(this.storeName);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('读取离线操作失败:', error);
      return [];
    }
  }

  /**
   * 持久化离线操作到本地存储
   */
  private async persistActions(actions: OfflineTaskAction[]): Promise<void> {
    try {
      localStorage.setItem(this.storeName, JSON.stringify(actions));
    } catch (error) {
      console.error('保存离线操作失败:', error);
      throw error;
    }
  }

  /**
   * 移除指定的离线操作
   */
  async removeAction(actionId: string): Promise<void> {
    try {
      const actions = await this.getStoredActions();
      const filteredActions = actions.filter(action => action.id !== actionId);
      await this.persistActions(filteredActions);
    } catch (error) {
      console.error('移除离线操作失败:', error);
      throw error;
    }
  }

  /**
   * 清空所有离线操作
   */
  async clearAllActions(): Promise<void> {
    try {
      localStorage.removeItem(this.storeName);
    } catch (error) {
      console.error('清空离线操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取待处理操作的数量
   */
  async getPendingActionsCount(): Promise<number> {
    const actions = await this.getStoredActions();
    return actions.length;
  }

  /**
   * 检查是否有待处理的操作
   */
  async hasPendingActions(): Promise<boolean> {
    const count = await this.getPendingActionsCount();
    return count > 0;
  }
}

// 创建单例实例
export const offlineManager = new OfflineManager();

// 监听网络状态变化，自动同步
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('网络已连接，开始同步离线操作...');
    offlineManager.syncWhenOnline();
  });
}

// 通知管理器
class NotificationManager {
  private permission: NotificationPermission = 'default';

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('此浏览器不支持通知');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  }

  /**
   * 发送通知
   */
  async sendNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          badge: '/icons/badge-72x72.png',
          icon: '/icons/icon-192x192.png',
          requireInteraction: true,
          ...options
        });
      } else {
        new Notification(title, options);
      }
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }

  /**
   * 发送任务提醒通知
   */
  async sendTaskReminder(taskTitle: string, dueDate: Date): Promise<void> {
    const now = new Date();
    const timeUntilDue = dueDate.getTime() - now.getTime();
    const hoursUntilDue = Math.floor(timeUntilDue / (1000 * 60 * 60));

    let message = '';
    if (hoursUntilDue <= 0) {
      message = '任务已到期！';
    } else if (hoursUntilDue <= 2) {
      message = `任务将在${hoursUntilDue}小时后到期`;
    } else if (hoursUntilDue <= 24) {
      message = `任务将在${hoursUntilDue}小时后到期`;
    } else {
      const daysUntilDue = Math.floor(hoursUntilDue / 24);
      message = `任务将在${daysUntilDue}天后到期`;
    }

    await this.sendNotification('任务提醒', {
      body: `${taskTitle} - ${message}`,
      tag: `task-reminder-${taskTitle}`,
      data: { taskTitle, dueDate: dueDate.toISOString() }
    });
  }

  /**
   * 安排任务提醒
   */
  scheduleTaskReminder(taskTitle: string, dueDate: Date): void {
    const now = new Date();
    const reminderTime = new Date(dueDate.getTime() - 2 * 60 * 60 * 1000); // 2小时前提醒

    if (reminderTime > now) {
      const delay = reminderTime.getTime() - now.getTime();
      setTimeout(() => {
        this.sendTaskReminder(taskTitle, dueDate);
      }, delay);
    }
  }

  /**
   * 发送任务完成通知
   */
  async sendTaskCompletionNotification(taskTitle: string, points: number): Promise<void> {
    await this.sendNotification('任务完成！', {
      body: `恭喜完成任务"${taskTitle}"，获得${points}积分！`,
      tag: 'task-completion',
      data: { taskTitle, points }
    });
  }
}

export const notificationManager = new NotificationManager();
