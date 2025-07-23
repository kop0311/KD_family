import React from 'react';
import { clsx } from 'clsx';

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'card' | 'modal' | 'sidebar';
  hover?: boolean;
  onClick?: () => void;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  className,
  variant = 'default',
  hover = false,
  onClick
}) => {
  const baseClasses = 'glass-container';

  const variantClasses = {
    default: '',
    card: 'glass-card',
    modal: 'p-6 max-w-md mx-auto',
    sidebar: 'h-full'
  };

  const hoverClasses = hover ? 'hover:bg-white/15 hover:scale-[1.02] transition-all duration-300' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        hoverClasses,
        clickableClasses,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
