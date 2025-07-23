import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
  count?: number;
  showZero?: boolean;
  maxCount?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  offset?: [number, number];
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
  count,
  showZero = false,
  maxCount = 99,
  position = 'top-right',
  offset = [0, 0]
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200';

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    primary: 'bg-primary-500/20 text-primary-300 border border-primary-400/30',
    secondary: 'bg-blue-500/20 text-blue-300 border border-blue-400/30',
    success: 'bg-green-500/20 text-green-300 border border-green-400/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30',
    danger: 'bg-red-500/20 text-red-300 border border-red-400/30',
    info: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs rounded-md',
    md: 'px-3 py-1 text-sm rounded-lg',
    lg: 'px-4 py-1.5 text-base rounded-lg'
  };

  const shouldShowBadge = count !== undefined && (count > 0 || showZero);
  const displayCount = count !== undefined && maxCount && count > maxCount
    ? `${maxCount}+`
    : count;

  if (count !== undefined || dot) {
    const positionClasses = {
      'top-right': 'top-0 right-0',
      'top-left': 'top-0 left-0',
      'bottom-right': 'bottom-0 right-0',
      'bottom-left': 'bottom-0 left-0'
    };

    return (
      <div className="relative inline-block">
        {children}
        {(shouldShowBadge || dot) && (
          <span
            className={clsx(
              'absolute transform translate-x-1/2 -translate-y-1/2',
              positionClasses[position],
              dot
                ? 'w-2 h-2 bg-red-500 rounded-full'
                : clsx(
                  baseClasses,
                  'min-w-[20px] h-5 px-1.5 text-xs rounded-full',
                  'bg-red-500 text-white'
                )
            )}
            style={{
              transform: `translate(${offset[0]}px, ${offset[1]}px)`
            }}
          >
            {!dot && displayCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <span className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  );
};

// 状态徽章
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed';
  children?: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  showDot = true,
  className
}) => {
  const statusConfig = {
    active: {
      variant: 'success' as const,
      label: '活跃',
      dotColor: 'bg-green-400'
    },
    inactive: {
      variant: 'default' as const,
      label: '未活跃',
      dotColor: 'bg-gray-400'
    },
    pending: {
      variant: 'warning' as const,
      label: '待处理',
      dotColor: 'bg-yellow-400'
    },
    completed: {
      variant: 'success' as const,
      label: '已完成',
      dotColor: 'bg-green-400'
    },
    failed: {
      variant: 'danger' as const,
      label: '失败',
      dotColor: 'bg-red-400'
    }
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {showDot && (
        <span className={clsx('w-2 h-2 rounded-full mr-2', config.dotColor)} />
      )}
      {children || config.label}
    </Badge>
  );
};

// 数字徽章
interface CountBadgeProps {
  count: number;
  maxCount?: number;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  maxCount = 99,
  variant = 'danger',
  className
}) => {
  const displayCount = count > maxCount ? `${maxCount}+` : count;

  if (count <= 0) return null;

  return (
    <Badge variant={variant} size="sm" className={className}>
      {displayCount}
    </Badge>
  );
};
