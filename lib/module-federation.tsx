import { ComponentType, lazy } from 'react';

// Type definitions for remote components
export interface RemoteComponentProps {
  [key: string]: any;
}

// Dynamic import function for remote components
export function loadRemoteComponent<T = RemoteComponentProps>(
  remoteName: string,
  componentName: string
): ComponentType<T> {
  return lazy(() => {
    // @ts-ignore - Module Federation dynamic import
    return import(`${remoteName}/${componentName}`).catch((error) => {
      console.error(`Failed to load remote component ${remoteName}/${componentName}:`, error);
      // Return a fallback component
      return {
        default: () => (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-semibold">组件加载失败</h3>
            <p className="text-red-600 text-sm mt-1">
              无法加载远程组件 {remoteName}/{componentName}
            </p>
          </div>
        ),
      };
    });
  });
}

// Utility to check if a remote is available
export async function isRemoteAvailable(remoteName: string): Promise<boolean> {
  try {
    // @ts-ignore - Module Federation runtime check
    const container = window[remoteName];
    if (!container) return false;
    
    await container.init(__webpack_share_scopes__.default);
    return true;
  } catch (error) {
    console.warn(`Remote ${remoteName} is not available:`, error);
    return false;
  }
}

// Remote component registry
export const remoteComponents = {
  analytics: {
    AnalyticsDashboard: () => loadRemoteComponent('analytics', 'AnalyticsDashboard'),
    ReportsView: () => loadRemoteComponent('analytics', 'ReportsView'),
  },
  reporting: {
    ReportBuilder: () => loadRemoteComponent('reporting', 'ReportBuilder'),
    DataExporter: () => loadRemoteComponent('reporting', 'DataExporter'),
  },
} as const;

// Hook to use remote components with error handling
export function useRemoteComponent<T = RemoteComponentProps>(
  remoteName: keyof typeof remoteComponents,
  componentName: string
) {
  const remoteConfig = remoteComponents[remoteName];
  
  if (!remoteConfig || !(componentName in remoteConfig)) {
    console.error(`Remote component ${remoteName}/${componentName} not found in registry`);
    return null;
  }

  // @ts-ignore - Dynamic component access
  return remoteConfig[componentName]() as ComponentType<T>;
}

// Error boundary for remote components
export function RemoteComponentErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}) {
  return (
    <div className="remote-component-boundary">
      {children}
    </div>
  );
}
