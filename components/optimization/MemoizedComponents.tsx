'use client';

import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

// Memoized list item component
interface ListItemProps {
  id: string;
  title: string;
  description?: string;
  status?: 'active' | 'inactive' | 'pending';
  onClick?: (id: string) => void;
  className?: string;
}

export const MemoizedListItem = memo<ListItemProps>(({ 
  id, 
  title, 
  description, 
  status = 'active', 
  onClick, 
  className 
}) => {
  const handleClick = useCallback(() => {
    onClick?.(id);
  }, [id, onClick]);

  const statusStyles = useMemo(() => ({
    active: 'border-green-400/30 bg-green-500/10 text-green-300',
    inactive: 'border-gray-400/30 bg-gray-500/10 text-gray-300', 
    pending: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-300',
  }), []);

  return (
    <div
      className={clsx(
        'glass-container p-4 cursor-pointer transition-all duration-200',
        'hover:scale-[1.02] hover:bg-white/15',
        statusStyles[status],
        className
      )}
      onClick={handleClick}
    >
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-glass-muted">{description}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs px-2 py-1 rounded-full bg-white/10">
          {status}
        </span>
      </div>
    </div>
  );
});

MemoizedListItem.displayName = 'MemoizedListItem';

// Optimized data list with virtualization
interface OptimizedListProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  emptyComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  loading?: boolean;
  onItemClick?: (item: T, index: number) => void;
}

export function OptimizedList<T>({
  data,
  keyExtractor,
  renderItem,
  className,
  emptyComponent,
  loadingComponent,
  loading = false,
  onItemClick,
}: OptimizedListProps<T>) {
  // Memoize the rendered items
  const renderedItems = useMemo(() => {
    return data.map((item, index) => {
      const key = keyExtractor(item, index);
      return (
        <div 
          key={key}
          onClick={() => onItemClick?.(item, index)}
        >
          {renderItem(item, index)}
        </div>
      );
    });
  }, [data, keyExtractor, renderItem, onItemClick]);

  if (loading) {
    return (
      <div className={className}>
        {loadingComponent || (
          <div className="flex items-center justify-center py-8">
            <div className="loading-spinner mr-2"></div>
            <span className="text-glass-muted">加载中...</span>
          </div>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={className}>
        {emptyComponent || (
          <div className="text-center py-8 text-glass-muted">
            暂无数据
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {renderedItems}
    </div>
  );
}

// Memoized form component
interface MemoizedFormProps {
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  children: React.ReactNode;
  className?: string;
}

export const MemoizedForm = memo<MemoizedFormProps>(({
  initialValues,
  onSubmit,
  children,
  className,
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoized form handlers
  const handleInputChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  }, [values, onSubmit]);

  // Memoized form context
  const formContext = useMemo(() => ({
    values,
    errors,
    handleInputChange,
  }), [values, errors, handleInputChange]);

  return (
    <form onSubmit={handleSubmit} className={className}>
      <FormContext.Provider value={formContext}>
        {children}
      </FormContext.Provider>
    </form>
  );
});

MemoizedForm.displayName = 'MemoizedForm';

// Form context
const FormContext = React.createContext<{
  values: Record<string, any>;
  errors: Record<string, string>;
  handleInputChange: (name: string, value: any) => void;
} | null>(null);

export const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within MemoizedForm');
  }
  return context;
};

// Debounced search component
interface DebouncedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

export const DebouncedSearch = memo<DebouncedSearchProps>(({
  onSearch,
  placeholder = '搜索...',
  delay = 300,
  className,
}) => {
  const [query, setQuery] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search effect
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(query);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, onSearch, delay]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <input
      type="text"
      value={query}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={clsx('glass-input w-full', className)}
    />
  );
});

DebouncedSearch.displayName = 'DebouncedSearch';

// Memoized chart wrapper
interface ChartWrapperProps {
  data: any[];
  type: 'bar' | 'line' | 'pie';
  title?: string;
  className?: string;
  options?: any;
}

export const MemoizedChartWrapper = memo<ChartWrapperProps>(({
  data,
  type,
  title,
  className,
  options,
}) => {
  // Memoize chart configuration
  const chartConfig = useMemo(() => ({
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...options,
    },
  }), [data, type, options]);

  return (
    <div className={clsx('glass-container p-6', className)}>
      {title && (
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      )}
      <div className="h-64 relative">
        {/* Chart component would go here */}
        <div className="w-full h-full bg-white/5 rounded-lg flex items-center justify-center">
          <span className="text-glass-muted">图表组件 ({type})</span>
        </div>
      </div>
    </div>
  );
});

MemoizedChartWrapper.displayName = 'MemoizedChartWrapper';

// Custom hooks for performance optimization
export const useStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(((...args: any[]) => callbackRef.current(...args)) as T, []);
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};