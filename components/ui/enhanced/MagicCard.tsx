import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'gradient' | 'glow';
  hover?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const MagicCard: React.FC<MagicCardProps> = ({
  className,
  variant = 'default',
  hover = true,
  glow = false,
  children,
  ...props
}) => {
  const baseStyles = 'relative overflow-hidden rounded-xl transition-all duration-300';

  const variants = {
    default: 'bg-white/10 backdrop-blur-md border border-white/20',
    elevated: 'bg-white/15 backdrop-blur-md border border-white/30 shadow-xl',
    bordered: 'bg-white/5 backdrop-blur-md border-2 border-white/30',
    gradient: 'bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20',
    glow: 'bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl shadow-blue-500/20'
  };

  const hoverEffects = hover ? {
    whileHover: {
      scale: 1.02,
      y: -5,
      transition: { duration: 0.2 }
    }
  } : {};

  return (
    <motion.div
      className={cn(
        baseStyles,
        variants[variant],
        glow && 'shadow-2xl shadow-blue-500/20',
        className
      )}
      {...hoverEffects}
      {...props}
    >
      {/* Glow effect */}
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 opacity-50" />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// 特殊效果卡片变体
export const FloatingCard: React.FC<MagicCardProps> = (props) => {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <MagicCard {...props} />
    </motion.div>
  );
};

export const PulseCard: React.FC<MagicCardProps> = (props) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.02, 1]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <MagicCard {...props} glow />
    </motion.div>
  );
};

export const TiltCard: React.FC<MagicCardProps> = ({ children, ...props }) => {
  return (
    <motion.div
      whileHover={{
        rotateX: 5,
        rotateY: 5,
        scale: 1.02
      }}
      transition={{ duration: 0.2 }}
      style={{ perspective: 1000 }}
    >
      <MagicCard {...props}>
        {children}
      </MagicCard>
    </motion.div>
  );
};

// 卡片网格容器
export const CardGrid: React.FC<{
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ children, columns = 3, gap = 'md', className }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  const gaps = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div className={cn('grid', gridCols[columns], gaps[gap], className)}>
      {children}
    </div>
  );
};

// 动画卡片网格
export const AnimatedCardGrid: React.FC<{
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  staggerDelay?: number;
  className?: string;
}> = ({ children, columns = 3, gap = 'md', staggerDelay = 0.1, className }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  const gaps = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <motion.div
      className={cn('grid', gridCols[columns], gaps[gap], className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// 卡片头部组件
export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn('p-6 pb-0', className)}>
      {children}
    </div>
  );
};

// 卡片内容组件
export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
};

// 卡片底部组件
export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn('p-6 pt-0', className)}>
      {children}
    </div>
  );
};

// 统计卡片
export const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}> = ({ title, value, icon, trend, className }) => {
  return (
    <MagicCard className={cn('p-6', className)} hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm font-medium">{title}</p>
          <motion.p
            className="text-2xl font-bold text-white mt-1"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.p>
          {trend && (
            <motion.p
              className={`text-sm mt-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {trend.value}
            </motion.p>
          )}
        </div>
        {icon && (
          <motion.div
            className="text-white/50 text-3xl"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            {icon}
          </motion.div>
        )}
      </div>
    </MagicCard>
  );
};

export default MagicCard;
