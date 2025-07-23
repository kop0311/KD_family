import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'solid' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'glass',
  size = 'md',
  interactive = false,
  onClick
}) => {
  const baseClasses = 'transition-all duration-300 ease-in-out';

  const variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg',
    glass: 'glass-container',
    solid: 'bg-white rounded-lg shadow-lg',
    elevated: 'bg-white rounded-lg shadow-xl hover:shadow-2xl'
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const interactiveClasses = interactive
    ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]'
    : '';

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        interactiveClasses,
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  action
}) => (
  <div className={clsx('flex items-center justify-between mb-4', className)}>
    <div>{children}</div>
    {action && <div>{action}</div>}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className
}) => (
  <div className={className}>
    {children}
  </div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className
}) => (
  <div className={clsx('mt-4 pt-4 border-t border-white/10', className)}>
    {children}
  </div>
);

// 统计卡片组件
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  trend?: React.ReactNode;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
  className
}) => {
  const changeColorClass = change ? {
    increase: 'text-green-400',
    decrease: 'text-red-400',
    neutral: 'text-gray-400'
  }[change.type] : '';

  return (
    <Card variant="glass" className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-glass-muted text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {change && (
            <p className={clsx('text-sm flex items-center', changeColorClass)}>
              <span>{change.type === 'increase' ? '↗' : change.type === 'decrease' ? '↘' : '→'}</span>
              <span className="ml-1">{change.value}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="text-primary-400 opacity-80">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4">
          {trend}
        </div>
      )}
    </Card>
  );
};
