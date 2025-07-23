import * as React from 'react';

import { cn } from '@/lib/utils';

const CardShadcn = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'glass' | 'solid' | 'elevated'
    interactive?: boolean
  }
>(({ className, variant = 'default', interactive = false, onClick, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card"
    className={cn(
      'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm transition-all duration-300 ease-in-out',
      variant === 'glass' && 'glass-container',
      variant === 'solid' && 'bg-white rounded-lg shadow-lg',
      variant === 'elevated' && 'bg-white rounded-lg shadow-xl hover:shadow-2xl',
      interactive && 'cursor-pointer hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]',
      className
    )}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(e as any);
      }
    } : undefined}
    {...props}
  />
));
CardShadcn.displayName = 'CardShadcn';

const CardHeaderShadcn = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    action?: React.ReactNode
  }
>(({ className, action, children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-header"
    className={cn(
      '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
      className
    )}
    {...props}
  >
    <div>{children}</div>
    {action && (
      <div
        data-slot="card-action"
        className="col-start-2 row-span-2 row-start-1 self-start justify-self-end"
      >
        {action}
      </div>
    )}
  </div>
));
CardHeaderShadcn.displayName = 'CardHeaderShadcn';

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-title"
    className={cn('leading-none font-semibold', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-description"
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContentShadcn = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-content"
    className={cn('px-6', className)}
    {...props}
  />
));
CardContentShadcn.displayName = 'CardContentShadcn';

const CardFooterShadcn = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-footer"
    className={cn('flex items-center px-6 [.border-t]:pt-6 mt-4 pt-4 border-t border-white/10', className)}
    {...props}
  />
));
CardFooterShadcn.displayName = 'CardFooterShadcn';

// Enhanced StatsCard with shadcn/ui design
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

const StatsCardShadcn: React.FC<StatsCardProps> = ({
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
    <CardShadcn variant="glass" className={className}>
      <CardContentShadcn>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-muted-foreground text-sm font-medium mb-2">{title}</p>
            <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
            {change && (
              <p className={cn('text-sm flex items-center', changeColorClass)}>
                <span>{change.type === 'increase' ? '↗' : change.type === 'decrease' ? '↘' : '→'}</span>
                <span className="ml-1">{change.value}</span>
              </p>
            )}
          </div>
          {icon && (
            <div className="text-primary opacity-80">
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4">
            {trend}
          </div>
        )}
      </CardContentShadcn>
    </CardShadcn>
  );
};

export {
  CardShadcn,
  CardHeaderShadcn,
  CardFooterShadcn,
  CardTitle,
  CardDescription,
  CardContentShadcn,
  StatsCardShadcn
};
