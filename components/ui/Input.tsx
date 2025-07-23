import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  variant?: 'default' | 'glass' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  type = 'text',
  label,
  error,
  success,
  helperText,
  variant = 'glass',
  size = 'md',
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  disabled,
  required,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle && type === 'password'
    ? showPassword ? 'text' : 'password'
    : type;

  const baseClasses = 'w-full transition-all duration-200 focus:outline-none focus:ring-0';

  const variantClasses = {
    default: 'border border-gray-300 bg-white focus:border-primary-500',
    glass: `glass-input border-glass focus:border-primary-400 focus:shadow-glass ${
      error ? 'border-red-400' : success ? 'border-green-400' : ''
    }`,
    solid: 'bg-white border border-gray-300 focus:border-primary-500 focus:bg-gray-50'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const containerClasses = clsx(
    'relative',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  const inputClasses = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    leftIcon && 'pl-10',
    (rightIcon || showPasswordToggle) && 'pr-10',
    disabled && 'cursor-not-allowed',
    className
  );

  const labelClasses = clsx(
    'block text-sm font-medium mb-2 transition-colors duration-200',
    variant === 'glass' ? 'text-glass' : 'text-gray-700',
    error ? 'text-red-400' : success ? 'text-green-400' : '',
    isFocused && !error && !success && 'text-primary-400'
  );

  return (
    <div className={containerClasses}>
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          type={inputType}
          className={inputClasses}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${props.id}-error` :
              helperText ? `${props.id}-helper` : undefined
          }
          {...props}
        />

        {(rightIcon || showPasswordToggle) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {showPasswordToggle && type === 'password' ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            ) : (
              rightIcon
            )}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <div className="mt-2">
          {error && (
            <p
              id={`${props.id}-error`}
              className="text-sm text-red-400 animate-slide-down"
              role="alert"
            >
              {error}
            </p>
          )}
          {!error && helperText && (
            <p
              id={`${props.id}-helper`}
              className={clsx(
                'text-sm',
                variant === 'glass' ? 'text-glass-muted' : 'text-gray-500'
              )}
            >
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';
