'use client';

import { Suspense, ComponentType } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';

interface RemoteComponentLoaderProps {
  component: ComponentType<any>;
  props?: Record<string, any>;
  fallback?: React.ReactNode;
  errorFallback?: ComponentType<{ error: Error; resetError: () => void }>;
}

export function RemoteComponentLoader({
  component: Component,
  props = {},
  fallback,
  errorFallback
}: RemoteComponentLoaderProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" />
      <span className="ml-3 text-gray-600">加载远程组件中...</span>
    </div>
  );

  const defaultErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-red-900 mb-2">
          远程组件加载失败
        </h3>
        <p className="text-sm text-red-700 mb-4">
          {error.message || '无法加载远程组件，请检查网络连接或组件配置。'}
        </p>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          重试
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback || defaultErrorFallback}>
      <Suspense fallback={fallback || defaultFallback}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Higher-order component for wrapping remote components
export function withRemoteComponent<P extends object>(
  Component: ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    errorFallback?: ComponentType<{ error: Error; resetError: () => void }>;
  }
) {
  return function WrappedRemoteComponent(props: P) {
    return (
      <RemoteComponentLoader
        component={Component}
        props={props}
        fallback={options?.fallback}
        errorFallback={options?.errorFallback}
      />
    );
  };
}
