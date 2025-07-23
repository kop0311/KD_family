import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface MagicButtonProps extends Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type' | 'disabled' | 'form' | 'formAction' | 'formEncType' | 'formMethod' | 'formNoValidate' | 'formTarget' | 'name' | 'value' | 'autoFocus' | 'tabIndex' | 'id' | 'className' | 'style' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'title'> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  shimmer?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const MagicButton: React.FC<MagicButtonProps> = ({
  className,
  variant = 'default',
  size = 'md',
  loading = false,
  shimmer = false,
  glow = false,
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'relative overflow-hidden rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent';

  const variants = {
    default: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 focus:ring-white/50',
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500/50',
    secondary: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 focus:ring-purple-500/50',
    success: 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 focus:ring-green-500/50',
    warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 focus:ring-yellow-500/50',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500/50',
    ghost: 'bg-transparent text-white hover:bg-white/10 focus:ring-white/50'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const glowStyles = glow ? {
    primary: 'shadow-lg shadow-blue-500/25',
    secondary: 'shadow-lg shadow-purple-500/25',
    success: 'shadow-lg shadow-green-500/25',
    warning: 'shadow-lg shadow-yellow-500/25',
    danger: 'shadow-lg shadow-red-500/25',
    default: 'shadow-lg shadow-white/10',
    ghost: ''
  } : {};

  const isDisabled = disabled || loading;

  return (
    <motion.button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        glow && glowStyles[variant],
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {/* Shimmer effect */}
      {shimmer && !isDisabled && (
        <motion.div
          className="absolute inset-0 -top-1 -left-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: '-100%', skewX: -15 }}
          animate={{ x: '200%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </span>

      {/* Ripple effect on click */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-lg"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.1 }}
      />
    </motion.button>
  );
};

// 特殊效果按钮变体
export const PulseButton: React.FC<MagicButtonProps> = (props) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <MagicButton {...props} glow />
    </motion.div>
  );
};

export const FloatingButton: React.FC<MagicButtonProps> = (props) => {
  return (
    <motion.div
      animate={{
        y: [0, -5, 0]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <MagicButton {...props} />
    </motion.div>
  );
};

export const GlowButton: React.FC<MagicButtonProps> = (props) => {
  return (
    <motion.div
      whileHover={{
        filter: 'brightness(1.2)'
      }}
      transition={{ duration: 0.2 }}
    >
      <MagicButton {...props} glow shimmer />
    </motion.div>
  );
};

// 按钮组
export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}> = ({ children, className, orientation = 'horizontal' }) => {
  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row space-x-2' : 'flex-col space-y-2',
        className
      )}
    >
      {children}
    </div>
  );
};

// 动画按钮组
export const AnimatedButtonGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className, staggerDelay = 0.1 }) => {
  return (
    <motion.div
      className={cn('flex space-x-2', className)}
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

export default MagicButton;
