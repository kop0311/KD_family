import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'datetime-local';
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  validator?: (value: string) => string | null;
  options?: { value: string; label: string }[];
  className?: string;
  rows?: number;
  min?: number;
  max?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  validator,
  options = [],
  className,
  rows = 3,
  min,
  max
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // 实时验证
  useEffect(() => {
    if (validator && touched && value !== '') {
      const validationError = validator(String(value));
      setInternalError(validationError);
    } else if (touched && value === '' && required) {
      setInternalError(`${label}不能为空`);
    } else {
      setInternalError(null);
    }
  }, [value, validator, touched, required, label]);

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value;
    onChange(newValue);
  };

  const displayError = error || internalError;
  const hasError = !!displayError;

  const baseInputClasses = cn(
    'w-full px-4 py-3 rounded-lg transition-all duration-200',
    'bg-white/10 backdrop-blur-md border text-white placeholder-white/50',
    'focus:outline-none focus:ring-2 focus:ring-blue-400/50',
    hasError
      ? 'border-red-400/50 focus:border-red-400'
      : 'border-white/20 focus:border-blue-400/50 hover:border-white/30',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  const renderInput = () => {
    switch (type) {
    case 'textarea':
      return (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={baseInputClasses}
        />
      );

    case 'select':
      return (
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        >
          <option value="" disabled>
            {placeholder || `请选择${label}`}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    default:
      return (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          className={baseInputClasses}
        />
      );
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-white text-sm font-medium"
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {renderInput()}

      {hasError && (
        <p className="text-red-400 text-sm flex items-center">
          <svg
            className="w-4 h-4 mr-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {displayError}
        </p>
      )}
    </div>
  );
};

// 表单容器组件
export interface FormContainerProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  onSubmit,
  className
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className={cn('space-y-6', className)}
      noValidate
    >
      {children}
    </form>
  );
};

// 表单按钮组
export interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('flex justify-end space-x-4 pt-4', className)}>
      {children}
    </div>
  );
};
