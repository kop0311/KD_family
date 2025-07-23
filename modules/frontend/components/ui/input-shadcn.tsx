import * as React from 'react';
import { cn } from '@/lib/utils';
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

const InputShadcn = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    success,
    helperText,
    variant = 'default',
    size = 'md',
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    disabled,
    required,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const inputType = showPasswordToggle && type === 'password'
      ? showPassword ? 'text' : 'password'
      : type;

    const baseClasses = 'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-md border bg-transparent transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';

    const variantClasses = {
      default: 'border-input dark:bg-input/30 shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
      glass: `glass-input border-glass focus:border-primary-400 focus:shadow-glass ${
        error ? 'border-red-400' : success ? 'border-green-400' : ''
      }`,
      solid: 'bg-white border border-gray-300 focus:border-primary-500 focus:bg-gray-50'
    };

    const sizeClasses = {
      sm: 'h-8 px-3 py-1 text-sm file:h-6',
      md: 'h-9 px-3 py-1 text-base file:h-7 md:text-sm',
      lg: 'h-10 px-4 py-2 text-lg file:h-8'
    };

    const containerClasses = cn(
      'relative',
      disabled && 'opacity-50 cursor-not-allowed'
    );

    const inputClasses = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      leftIcon && 'pl-10',
      (rightIcon || showPasswordToggle) && 'pr-10',
      disabled && 'cursor-not-allowed',
      className
    );

    const labelClasses = cn(
      'block text-sm font-medium mb-2 transition-colors duration-200',
      variant === 'glass' ? 'text-glass' : 'text-foreground',
      error ? 'text-destructive' : success ? 'text-green-400' : '',
      isFocused && !error && !success && 'text-primary'
    );

    return (
      <div className={containerClasses}>
        {label && (
          <label className={labelClasses}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
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
                  className="text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
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
                className="text-sm text-destructive animate-slide-down"
                role="alert"
              >
                {error}
              </p>
            )}
            {!error && helperText && (
              <p
                id={`${props.id}-helper`}
                className={cn(
                  'text-sm',
                  variant === 'glass' ? 'text-glass-muted' : 'text-muted-foreground'
                )}
              >
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

InputShadcn.displayName = 'InputShadcn';

export { InputShadcn };
