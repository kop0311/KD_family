'use client';

import React from 'react';
import { clsx } from 'clsx';
import { SunIcon, MoonIcon, MonitorIcon } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'switch';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  size = 'md',
  showLabel = false,
  className
}) => {
  const { theme, activeTheme, setTheme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={clsx(
          'glass-button',
          'flex items-center justify-center',
          'transition-all duration-300',
          'hover:scale-105 hover:rotate-12',
          sizeClasses[size],
          className
        )}
        aria-label={`切换到${activeTheme === 'light' ? '深色' : '浅色'}模式`}
        title={`当前: ${activeTheme === 'light' ? '浅色' : '深色'}模式`}
      >
        {activeTheme === 'light' ? (
          <MoonIcon className={clsx(iconSizeClasses[size], 'text-yellow-400')} />
        ) : (
          <SunIcon className={clsx(iconSizeClasses[size], 'text-yellow-400')} />
        )}
      </button>
    );
  }

  if (variant === 'switch') {
    return (
      <div className={clsx('flex items-center space-x-3', className)}>
        {showLabel && (
          <span className="text-sm font-medium text-glass">
            {activeTheme === 'light' ? '浅色模式' : '深色模式'}
          </span>
        )}
        <button
          onClick={toggleTheme}
          className={clsx(
            'relative inline-flex items-center justify-center',
            'w-12 h-6 rounded-full',
            'transition-all duration-300 ease-in-out',
            'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
            activeTheme === 'light'
              ? 'bg-gray-200'
              : 'bg-primary-600'
          )}
          role="switch"
          aria-checked={activeTheme === 'dark'}
          aria-label="切换主题"
        >
          <span
            className={clsx(
              'inline-block w-4 h-4 rounded-full',
              'transform transition-transform duration-300 ease-in-out',
              'flex items-center justify-center',
              'bg-white shadow-lg',
              activeTheme === 'light' ? 'translate-x-1' : 'translate-x-7'
            )}
          >
            {activeTheme === 'light' ? (
              <SunIcon className="w-3 h-3 text-yellow-500" />
            ) : (
              <MoonIcon className="w-3 h-3 text-blue-600" />
            )}
          </span>
        </button>
      </div>
    );
  }

  if (variant === 'dropdown') {
    const [isOpen, setIsOpen] = React.useState(false);

    const themeOptions = [
      {
        value: 'light' as const,
        label: '浅色模式',
        icon: SunIcon,
        description: '经典的浅色界面'
      },
      {
        value: 'dark' as const,
        label: '深色模式',
        icon: MoonIcon,
        description: '护眼的深色界面'
      },
      {
        value: 'system' as const,
        label: '跟随系统',
        icon: MonitorIcon,
        description: '根据系统设置自动切换'
      }
    ];

    const currentOption = themeOptions.find(option => option.value === theme);
    const CurrentIcon = currentOption?.icon || SunIcon;

    return (
      <div className={clsx('relative', className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            'glass-button',
            'flex items-center space-x-2 px-3 py-2',
            'transition-all duration-200',
            'hover:scale-105',
            isOpen && 'bg-white/20'
          )}
          aria-label="选择主题"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <CurrentIcon className={clsx(iconSizeClasses[size], 'text-yellow-400')} />
          {showLabel && (
            <>
              <span className="text-sm font-medium text-white">
                {currentOption?.label}
              </span>
              <svg
                className={clsx(
                  'w-4 h-4 text-white transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </>
          )}
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-56 glass-container border border-white/20 rounded-lg shadow-lg z-50">
              <div className="py-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = option.value === theme;

                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTheme(option.value);
                        setIsOpen(false);
                      }}
                      className={clsx(
                        'w-full flex items-center px-4 py-3',
                        'text-left transition-colors duration-200',
                        'hover:bg-white/10',
                        isSelected && 'bg-primary-500/20'
                      )}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <Icon className={clsx(
                        'w-4 h-4 mr-3',
                        isSelected ? 'text-primary-400' : 'text-white/70'
                      )} />
                      <div className="flex-1">
                        <div className={clsx(
                          'text-sm font-medium',
                          isSelected ? 'text-primary-300' : 'text-white'
                        )}>
                          {option.label}
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                          {option.description}
                        </div>
                      </div>
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-primary-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};
