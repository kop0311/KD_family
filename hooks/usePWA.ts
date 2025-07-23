import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAState {
  isOnline: boolean;
  updateAvailable: boolean;
  canInstall: boolean;
  isInstalled: boolean;
  installPWA: () => Promise<void>;
  updateApp: () => void;
}

export const usePWA = (): PWAState => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 检查是否已安装为PWA
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkIfInstalled();

    // 监听在线/离线状态
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听PWA安装提示
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 监听PWA安装完成
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Service Worker 更新检测
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });

      // 检查现有的Service Worker
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async (): Promise<void> => {
    if (!deferredPrompt) {
      throw new Error('PWA安装提示不可用');
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('PWA安装失败:', error);
      throw error;
    }
  };

  const updateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  return {
    isOnline,
    updateAvailable,
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    installPWA,
    updateApp
  };
};

// 离线数据管理Hook
export interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

export const useOfflineManager = () => {
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const { isOnline } = usePWA();

  useEffect(() => {
    // 从localStorage加载待处理的离线操作
    const loadPendingActions = () => {
      try {
        const stored = localStorage.getItem('offline-actions');
        if (stored) {
          setPendingActions(JSON.parse(stored));
        }
      } catch (error) {
        console.error('加载离线操作失败:', error);
      }
    };

    loadPendingActions();
  }, []);

  useEffect(() => {
    // 保存待处理的操作到localStorage
    try {
      localStorage.setItem('offline-actions', JSON.stringify(pendingActions));
    } catch (error) {
      console.error('保存离线操作失败:', error);
    }
  }, [pendingActions]);

  const addOfflineAction = (type: string, data: any) => {
    const action: OfflineAction = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: Date.now()
    };

    setPendingActions(prev => [...prev, action]);
  };

  const removeOfflineAction = (id: string) => {
    setPendingActions(prev => prev.filter(action => action.id !== id));
  };

  const syncPendingActions = async (syncFunction: (action: OfflineAction) => Promise<void>) => {
    if (!isOnline || pendingActions.length === 0) return;

    const actionsToSync = [...pendingActions];
    
    for (const action of actionsToSync) {
      try {
        await syncFunction(action);
        removeOfflineAction(action.id);
      } catch (error) {
        console.error('同步离线操作失败:', action, error);
      }
    }
  };

  return {
    pendingActions,
    addOfflineAction,
    removeOfflineAction,
    syncPendingActions,
    hasPendingActions: pendingActions.length > 0
  };
};

// 推送通知Hook
export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  };

  const sendNotification = async (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        badge: '/icons/badge-72x72.png',
        icon: '/icons/icon-192x192.png',
        ...options
      });
    } else {
      new Notification(title, options);
    }
  };

  const scheduleNotification = (title: string, options: NotificationOptions, delay: number) => {
    setTimeout(() => {
      sendNotification(title, options);
    }, delay);
  };

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    scheduleNotification,
    canSendNotifications: permission === 'granted'
  };
};
