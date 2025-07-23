'use client';

import React, { useRef, useEffect, forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { useAccessibility } from './AccessibilityProvider';

// Skip link component
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 glass-button glass-button-primary px-4 py-2"
  >
    {children}
  </a>
);

// Focus trap component
interface FocusTrapProps {
  active: boolean;
  children: React.ReactNode;
  restoreFocus?: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  active,
  children,
  restoreFocus = true,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the previously focused element
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

// Accessible button with enhanced keyboard support
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
  describedBy?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  ariaLabel,
  describedBy,
  className,
  onKeyDown,
  ...props
}, ref) => {
  const { announceToScreenReader } = useAccessibility();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // Enhanced keyboard support
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.currentTarget.click();
    }

    onKeyDown?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading) return;

    // Announce action to screen readers
    if (ariaLabel) {
      announceToScreenReader(`${ariaLabel} 按钮已激活`);
    }

    props.onClick?.(e);
  };

  const baseClasses = 'glass-button focus-glass font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-75';

  const variantClasses = {
    primary: 'glass-button-primary',
    secondary: 'glass-button-secondary',
    ghost: 'bg-transparent border-white/20 text-white hover:bg-white/10',
    danger: 'bg-red-500/20 border-red-300/30 text-white hover:bg-red-400/30'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      ref={ref}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (props.disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      aria-busy={loading}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="loading-spinner mr-2" role="status" aria-label="加载中"></div>
          <span className="sr-only">加载中...</span>
          {typeof children === 'string' ? '处理中...' : children}
        </div>
      ) : (
        children
      )}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

// Live region for dynamic content announcements
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'all',
  className
}) => (
  <div
    aria-live={politeness}
    aria-atomic={atomic}
    aria-relevant={relevant}
    className={clsx('sr-only', className)}
  >
    {children}
  </div>
);

// Accessible form field with comprehensive labeling
interface AccessibleFieldProps {
  children: React.ReactElement;
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  children,
  label,
  error,
  helperText,
  required,
  className
}) => {
  const fieldId = React.useId();
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;

  // Clone child element with accessibility props
  const childElement = React.cloneElement(children, {
    id: fieldId,
    'aria-describedby': [
      error ? errorId : null,
      helperText ? helperId : null
    ].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? 'true' : 'false',
    'aria-required': required
  });

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-glass mb-2"
      >
        {label}
        {required && (
          <span className="text-red-400 ml-1" aria-label="必填">*</span>
        )}
      </label>

      {childElement}

      {helperText && (
        <p id={helperId} className="text-sm text-glass-muted mt-2">
          {helperText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="text-sm text-red-400 mt-2"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible navigation with landmarks
interface AccessibleNavProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export const AccessibleNav: React.FC<AccessibleNavProps> = ({
  children,
  label,
  className
}) => (
  <nav
    role="navigation"
    aria-label={label}
    className={className}
  >
    {children}
  </nav>
);

// Breadcrumb navigation
interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const AccessibleBreadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className
}) => (
  <nav aria-label="面包屑导航" className={className}>
    <ol className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <li key={index} className="flex items-center">
          {index > 0 && (
            <span className="text-glass-muted mx-2" aria-hidden="true">
              /
            </span>
          )}
          {item.current ? (
            <span
              aria-current="page"
              className="text-white font-medium"
            >
              {item.label}
            </span>
          ) : item.href ? (
            <a
              href={item.href}
              className="text-glass hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-glass">{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

// Accessible tooltip
interface TooltipProps {
  content: string;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const AccessibleTooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const tooltipId = React.useId();

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const childElement = React.cloneElement(children, {
    'aria-describedby': tooltipId,
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: handleFocus,
    onBlur: handleBlur
  });

  const placementClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className={clsx('relative inline-block', className)}>
      {childElement}

      {(isVisible || isFocused) && (
        <div
          id={tooltipId}
          role="tooltip"
          className={clsx(
            'absolute z-50 px-3 py-2 text-sm',
            'glass-container border border-white/20',
            'text-white whitespace-nowrap',
            placementClasses[placement]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};
