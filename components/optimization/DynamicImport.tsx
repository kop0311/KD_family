'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Dynamic import with error boundary
interface DynamicImportProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  delay?: number;
  timeout?: number;
  children?: React.ReactNode;
}

export const DynamicImport: React.FC<DynamicImportProps> = ({
  loader,
  fallback: Fallback = LoadingSpinner,
  errorFallback: ErrorFallback,
  delay = 200,
  timeout = 10000,
  children,
  ...props
}) => {
  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  // Create lazy component with error handling
  const LazyComponent = React.useMemo(() => {
    return lazy(async () => {
      try {
        const startTime = Date.now();

        // Add minimum delay to prevent flash
        const delayPromise = new Promise(resolve =>
          setTimeout(resolve, delay)
        );

        // Add timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Component load timeout')), timeout)
        );

        const [moduleResult] = await Promise.all([
          Promise.race([loader(), timeoutPromise]),
          delayPromise
        ]);

        // Reset error state on successful load
        setError(null);
        return moduleResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load component');
        setError(error);
        throw error;
      }
    });
  }, [loader, delay, timeout, retryCount]);

  const retry = React.useCallback(() => {
    setError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  if (error && ErrorFallback) {
    return <ErrorFallback error={error} retry={retry} />;
  }

  return (
    <Suspense fallback={<Fallback />}>
      <LazyComponent {...props}>
        {children}
      </LazyComponent>
    </Suspense>
  );
};

// Prebuilt dynamic components for common use cases
export const DynamicModal = (props: any) => (
  <DynamicImport
    loader={() => import('@/components/ui/Modal')}
    {...props}
  />
);

// TODO: Create Chart component before enabling this
// export const DynamicChart = (props: any) => (
//   <DynamicImport
//     loader={() => import('@/components/charts/Chart')}
//     fallback={() => (
//       <div className="h-64 glass-container flex items-center justify-center">
//         <div className="text-center">
//           <div className="loading-spinner mb-2"></div>
//           <p className="text-glass-muted">加载图表组件中...</p>
//         </div>
//       </div>
//     )}
//     {...props}
//   />
// );

// HOC for dynamic imports
export function withDynamicImport<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    fallback?: ComponentType;
    errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
  }
) {
  return function DynamicComponent(props: P) {
    return (
      <DynamicImport
        loader={loader}
        fallback={options?.fallback}
        errorFallback={options?.errorFallback}
        {...props}
      />
    );
  };
}

// Code splitting by route
export const createRouteComponent = (
  importFunction: () => Promise<{ default: ComponentType<any> }>
) => {
  return lazy(() =>
    importFunction().catch(error => {
      console.error('Route component failed to load:', error);
      // Return fallback component
      return {
        default: () => (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-400 mb-4">加载失败</h1>
              <p className="text-glass-muted mb-4">页面组件无法加载</p>
              <button
                onClick={() => window.location.reload()}
                className="glass-button glass-button-primary"
              >
                刷新页面
              </button>
            </div>
          </div>
        )
      };
    })
  );
};

// Bundle analyzer helper
export const BundleAnalyzer: React.FC<{
  children: React.ReactNode;
  chunkName?: string;
}> = ({ children, chunkName }) => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && chunkName) {
      console.log(`🎯 Bundle chunk loaded: ${chunkName}`);
    }
  }, [chunkName]);

  return <>{children}</>;
};
