'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  XIcon
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  onClose: (id: string) => void;
}

const toastIcons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon
};

const toastVariants = {
  success: {
    container: 'bg-green-500/10 border-green-400/30 text-green-300',
    icon: 'text-green-400',
    progress: 'bg-green-400'
  },
  error: {
    container: 'bg-red-500/10 border-red-400/30 text-red-300',
    icon: 'text-red-400',
    progress: 'bg-red-400'
  },
  warning: {
    container: 'bg-yellow-500/10 border-yellow-400/30 text-yellow-300',
    icon: 'text-yellow-400',
    progress: 'bg-yellow-400'
  },
  info: {
    container: 'bg-blue-500/10 border-blue-400/30 text-blue-300',
    icon: 'text-blue-400',
    progress: 'bg-blue-400'
  }
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  persistent = false,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  const Icon = toastIcons[type];
  const variant = toastVariants[type];

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (persistent || isHovered) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setProgress((remaining / duration) * 100);

      if (remaining <= 0) {
        handleClose();
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, persistent, isHovered]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={clsx(
        'relative glass-container border rounded-lg p-4 mb-3',
        'transform transition-all duration-300 ease-in-out',
        'hover:scale-105 cursor-pointer',
        variant.container,
        isVisible
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClose}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <Icon className={clsx('h-5 w-5 mr-3 mt-0.5 flex-shrink-0', variant.icon)} />

        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold mb-1 text-white">
              {title}
            </p>
          )}
          <p className="text-sm">{message}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="ml-3 text-white/60 hover:text-white transition-colors"
          aria-label="关闭通知"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {!persistent && (
        <div
          className={clsx(
            'absolute bottom-0 left-0 h-1 rounded-b-lg transition-all duration-100',
            variant.progress
          )}
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
};

// Toast Container
interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right'
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  if (toasts.length === 0) return null;

  return createPortal(
    <div className={clsx(
      'fixed z-50 pointer-events-none',
      'w-full max-w-md',
      positionClasses[position]
    )}>
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>,
    document.body
  );
};

// Toast Hook
interface ToastOptions {
  title?: string;
  duration?: number;
  persistent?: boolean;
}

let toastCount = 0;
const toastCallbacks = new Set<(toasts: ToastProps[]) => void>();
let currentToasts: ToastProps[] = [];

const addToast = (type: ToastType, message: string, options: ToastOptions = {}) => {
  const id = `toast-${++toastCount}`;
  const toast: ToastProps = {
    id,
    type,
    message,
    ...options,
    onClose: removeToast
  };

  currentToasts = [toast, ...currentToasts];
  toastCallbacks.forEach(callback => callback(currentToasts));
};

const removeToast = (id: string) => {
  currentToasts = currentToasts.filter(toast => toast.id !== id);
  toastCallbacks.forEach(callback => callback(currentToasts));
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>(currentToasts);

  useEffect(() => {
    toastCallbacks.add(setToasts);
    return () => {
      toastCallbacks.delete(setToasts);
    };
  }, []);

  return {
    toasts,
    toast: {
      success: (message: string, options?: ToastOptions) =>
        addToast('success', message, options),
      error: (message: string, options?: ToastOptions) =>
        addToast('error', message, options),
      warning: (message: string, options?: ToastOptions) =>
        addToast('warning', message, options),
      info: (message: string, options?: ToastOptions) =>
        addToast('info', message, options)
    },
    removeToast
  };
};
