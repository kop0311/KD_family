import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagicCard } from '@/components/ui/enhanced/MagicCard';
import { MagicButton } from '@/components/ui/enhanced/MagicButton';
import { usePWA, useOfflineManager, useNotifications } from '@/hooks/usePWA';
import { useNotification } from '@/components/common/NotificationProvider';
import {
  WifiOff,
  Download,
  RefreshCw,
  Bell,
  X,
  Smartphone,
  Wifi,
  CloudOff
} from 'lucide-react';

// 离线指示器
export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();
  const { hasPendingActions } = useOfflineManager();

  if (isOnline) return null;

  return (
    <motion.div
      className="fixed top-4 right-4 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <MagicCard className="p-3 bg-orange-500/20 border-orange-300/30" variant="elevated">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-4 h-4 text-orange-300" />
          <span className="text-white text-sm">离线模式</span>
          {hasPendingActions && (
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
          )}
        </div>
      </MagicCard>
    </motion.div>
  );
};

// PWA安装提示
export const InstallPrompt: React.FC = () => {
  const { canInstall, installPWA } = usePWA();
  const { addNotification } = useNotification();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 检查是否已经被用户关闭过
    const isDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    setDismissed(isDismissed);

    if (canInstall && !isDismissed) {
      // 延迟显示安装提示
      const timer = setTimeout(() => setShowPrompt(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [canInstall]);

  const handleInstall = async () => {
    try {
      await installPWA();
      setShowPrompt(false);
      addNotification({
        type: 'success',
        message: 'PWA安装成功！'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'PWA安装失败，请重试'
      });
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <MagicCard className="p-4" variant="elevated" glow>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">安装应用</h3>
                <p className="text-white/70 text-sm">
                  将KD Family添加到主屏幕
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/50 hover:text-white/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-white/80 text-sm mb-4">
            获得更快的访问速度和更好的使用体验
          </p>

          <div className="flex space-x-2">
            <MagicButton
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="flex-1"
            >
              稍后
            </MagicButton>
            <MagicButton
              variant="primary"
              size="sm"
              onClick={handleInstall}
              className="flex-1"
              shimmer
            >
              <Download className="w-4 h-4 mr-2" />
              安装
            </MagicButton>
          </div>
        </MagicCard>
      </motion.div>
    </AnimatePresence>
  );
};

// 应用更新提示
export const UpdatePrompt: React.FC = () => {
  const { updateAvailable, updateApp } = usePWA();
  const { addNotification } = useNotification();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setShowPrompt(true);
    }
  }, [updateAvailable]);

  const handleUpdate = () => {
    updateApp();
    addNotification({
      type: 'success',
      message: '应用正在更新...'
    });
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <MagicCard className="p-4 bg-blue-500/20 border-blue-300/30" variant="elevated">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 text-blue-300" />
              <div>
                <h3 className="font-semibold text-white">应用更新</h3>
                <p className="text-white/70 text-sm">
                  有新版本可用
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <MagicButton
                variant="ghost"
                size="sm"
                onClick={() => setShowPrompt(false)}
              >
                稍后
              </MagicButton>
              <MagicButton
                variant="primary"
                size="sm"
                onClick={handleUpdate}
                shimmer
              >
                更新
              </MagicButton>
            </div>
          </div>
        </MagicCard>
      </motion.div>
    </AnimatePresence>
  );
};

// 通知权限请求
export const NotificationPermissionPrompt: React.FC = () => {
  const { permission, requestPermission, isSupported } = useNotifications();
  const { addNotification } = useNotification();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isSupported && permission === 'default') {
      // 延迟显示通知权限请求
      const timer = setTimeout(() => setShowPrompt(true), 15000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleRequest = async () => {
    const granted = await requestPermission();
    setShowPrompt(false);

    if (granted) {
      addNotification({
        type: 'success',
        message: '通知权限已开启'
      });
    } else {
      addNotification({
        type: 'warning',
        message: '通知权限被拒绝'
      });
    }
  };

  if (!showPrompt || !isSupported || permission !== 'default') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <MagicCard className="p-6 max-w-sm w-full" variant="elevated">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">
              开启通知
            </h3>

            <p className="text-white/70 text-sm mb-6">
              允许KD Family发送通知，及时了解任务更新和重要提醒
            </p>

            <div className="flex space-x-3">
              <MagicButton
                variant="ghost"
                onClick={() => setShowPrompt(false)}
                className="flex-1"
              >
                稍后
              </MagicButton>
              <MagicButton
                variant="primary"
                onClick={handleRequest}
                className="flex-1"
                shimmer
              >
                允许
              </MagicButton>
            </div>
          </div>
        </MagicCard>
      </motion.div>
    </AnimatePresence>
  );
};

// 连接状态指示器
export const ConnectionStatus: React.FC = () => {
  const { isOnline } = usePWA();
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // 当连接状态改变时显示指示器
    setShowStatus(true);
    const timer = setTimeout(() => setShowStatus(false), 3000);
    return () => clearTimeout(timer);
  }, [isOnline]);

  if (!showStatus) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed top-20 right-4 z-40"
      >
        <MagicCard
          className={`p-3 ${isOnline ? 'bg-green-500/20 border-green-300/30' : 'bg-red-500/20 border-red-300/30'}`}
          variant="elevated"
        >
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-300" />
            ) : (
              <CloudOff className="w-4 h-4 text-red-300" />
            )}
            <span className="text-white text-sm">
              {isOnline ? '已连接' : '连接断开'}
            </span>
          </div>
        </MagicCard>
      </motion.div>
    </AnimatePresence>
  );
};
