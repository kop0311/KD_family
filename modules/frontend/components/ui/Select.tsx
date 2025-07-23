'use client';

import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  error?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  variant?: 'default' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  maxHeight?: number;
  className?: string;
  onChange?: (value: string | string[]) => void;
  onSearch?: (searchTerm: string) => void;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  defaultValue,
  placeholder = '请选择...',
  disabled = false,
  multiple = false,
  searchable = false,
  clearable = false,
  loading = false,
  error,
  helperText,
  label,
  required,
  variant = 'glass',
  size = 'md',
  maxHeight = 300,
  className,
  onChange,
  onSearch
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(
    multiple
      ? (Array.isArray(value) ? value : [])
      : (value || defaultValue ? [value || defaultValue!] : [])
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const filteredOptions = searchable && searchTerm
    ? options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : options;

  const selectedOptions = options.filter(option => selectedValues.includes(option.value));

  const displayText = selectedOptions.length > 0
    ? multiple
      ? `已选择 ${selectedOptions.length} 项`
      : selectedOptions[0].label
    : placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    if (onSearch) {
      onSearch(searchTerm);
    }
  }, [searchTerm, onSearch]);

  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      setFocusedIndex(-1);
    }
  };

  const handleOptionClick = (option: SelectOption) => {
    if (option.disabled) return;

    let newValues: string[];

    if (multiple) {
      newValues = selectedValues.includes(option.value)
        ? selectedValues.filter(v => v !== option.value)
        : [...selectedValues, option.value];
    } else {
      newValues = [option.value];
      setIsOpen(false);
    }

    setSelectedValues(newValues);
    setSearchTerm('');

    if (onChange) {
      onChange(multiple ? newValues : newValues[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedValues([]);
    if (onChange) {
      onChange(multiple ? [] : '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
    case 'Enter':
      e.preventDefault();
      if (isOpen && focusedIndex >= 0) {
        handleOptionClick(filteredOptions[focusedIndex]);
      } else {
        handleToggle();
      }
      break;
    case 'Escape':
      setIsOpen(false);
      setFocusedIndex(-1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setFocusedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (isOpen) {
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
      }
      break;
    }
  };

  const variantClasses = {
    default: 'bg-white border border-gray-300 focus:border-primary-500',
    glass: 'glass-input border-glass'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const selectClasses = clsx(
    'relative w-full cursor-pointer transition-all duration-200',
    'flex items-center justify-between',
    variantClasses[variant],
    sizeClasses[size],
    error && 'border-red-400',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  return (
    <div ref={selectRef} className="relative">
      {label && (
        <label className={clsx(
          'block text-sm font-medium mb-2',
          variant === 'glass' ? 'text-glass' : 'text-gray-700',
          error && 'text-red-400'
        )}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <div
        className={selectClasses}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={label ? `${label}-label` : undefined}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1">
          {multiple && selectedOptions.length > 0 ? (
            selectedOptions.map(option => (
              <span
                key={option.value}
                className="inline-flex items-center px-2 py-1 bg-primary-500/20 text-primary-300 text-sm rounded-md"
              >
                {option.label}
              </span>
            ))
          ) : (
            <span className={clsx(
              selectedValues.length === 0 && 'text-gray-400',
              variant === 'glass' && selectedValues.length === 0 && 'text-glass-muted'
            )}>
              {displayText}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {clearable && selectedValues.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
          <ChevronDownIcon
            className={clsx(
              'h-4 w-4 text-gray-400 transition-transform duration-200',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </div>

      {isOpen && (
        <div
          ref={optionsRef}
          className="absolute z-50 w-full mt-2 glass-container border border-white/20 rounded-lg shadow-lg"
          style={{ maxHeight }}
        >
          {searchable && (
            <div className="p-2 border-b border-white/10">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索..."
                className="w-full px-3 py-2 bg-transparent text-white placeholder-glass-muted focus:outline-none"
              />
            </div>
          )}

          <div className="max-h-60 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="loading-spinner"></div>
                <span className="ml-2 text-glass-muted">加载中...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-glass-muted">
                {searchTerm ? '未找到匹配项' : '暂无选项'}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={clsx(
                    'px-4 py-3 cursor-pointer transition-colors duration-150',
                    'flex items-center justify-between',
                    'hover:bg-white/10',
                    focusedIndex === index && 'bg-white/10',
                    option.disabled && 'opacity-50 cursor-not-allowed',
                    selectedValues.includes(option.value) && 'bg-primary-500/20'
                  )}
                  onClick={() => handleOptionClick(option)}
                  role="option"
                  aria-selected={selectedValues.includes(option.value)}
                >
                  <div>
                    <div className="text-white">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-glass-muted">{option.description}</div>
                    )}
                  </div>
                  {selectedValues.includes(option.value) && (
                    <CheckIcon className="h-4 w-4 text-primary-400" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {(error || helperText) && (
        <div className="mt-2">
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          {!error && helperText && (
            <p className={clsx(
              'text-sm',
              variant === 'glass' ? 'text-glass-muted' : 'text-gray-500'
            )}>
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
