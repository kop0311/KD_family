'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  fcp?: number;
  renderTime?: number;
  memoryUsage?: number;
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  enableDevMode?: boolean;
  trackUserInteractions?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  onMetricsUpdate,
  enableDevMode = process.env.NODE_ENV === 'development',
  trackUserInteractions = true
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const observerRef = useRef<PerformanceObserver | null>(null);
  const interactionCountRef = useRef(0);

  // Core Web Vitals measurement
  const measureWebVitals = useCallback(() => {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            const lcp = lastEntry.startTime;
            setMetrics(prev => ({ ...prev, lcp }));
            onMetricsUpdate?.({ ...metrics, lcp });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            const fcp = fcpEntry.startTime;
            setMetrics(prev => ({ ...prev, fcp }));
            onMetricsUpdate?.({ ...metrics, fcp });
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          setMetrics(prev => ({ ...prev, cls: clsValue }));
          onMetricsUpdate?.({ ...metrics, cls: clsValue });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        observerRef.current = lcpObserver;
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }

    // Time to First Byte (TTFB)
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, ttfb }));
    }
  }, [metrics, onMetricsUpdate]);

  // First Input Delay (FID) measurement
  const measureFID = useCallback(() => {
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            const fid = entry.processingStart - entry.startTime;
            setMetrics(prev => ({ ...prev, fid }));
            onMetricsUpdate?.({ ...metrics, fid });
            break; // Only measure the first input
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('FID measurement not supported:', error);
      }
    }
  }, [metrics, onMetricsUpdate]);

  // Memory usage monitoring
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      setMetrics(prev => ({ ...prev, memoryUsage }));
      onMetricsUpdate?.({ ...metrics, memoryUsage });
    }
  }, [metrics, onMetricsUpdate]);

  // Interaction tracking
  const trackInteraction = useCallback((type: string) => {
    if (!trackUserInteractions) return;

    interactionCountRef.current++;

    if (enableDevMode) {
      console.log(`🎯 User interaction: ${type} (Total: ${interactionCountRef.current})`);
    }
  }, [trackUserInteractions, enableDevMode]);

  // Component render time measurement
  const measureRenderTime = useCallback(() => {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, renderTime }));
      onMetricsUpdate?.({ ...metrics, renderTime });

      if (enableDevMode && renderTime > 16) { // > 16ms might cause frame drops
        console.warn(`⚠️ Slow render detected: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [metrics, onMetricsUpdate, enableDevMode]);

  useEffect(() => {
    measureWebVitals();
    measureFID();

    // Memory monitoring interval
    const memoryInterval = setInterval(measureMemoryUsage, 5000);

    // Add interaction listeners
    if (trackUserInteractions) {
      const handleClick = () => trackInteraction('click');
      const handleKeydown = () => trackInteraction('keydown');
      const handleScroll = () => trackInteraction('scroll');

      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleKeydown);
      document.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        document.removeEventListener('click', handleClick);
        document.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('scroll', handleScroll);
        clearInterval(memoryInterval);
        observerRef.current?.disconnect();
      };
    }

    return () => {
      clearInterval(memoryInterval);
      observerRef.current?.disconnect();
    };
  }, [measureWebVitals, measureFID, measureMemoryUsage, trackInteraction, trackUserInteractions]);

  // Development mode performance panel
  if (enableDevMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50 glass-container p-3 text-xs max-w-xs">
        <div className="font-semibold text-primary-300 mb-2">性能指标</div>
        <div className="space-y-1 text-glass">
          {metrics.lcp && (
            <div className="flex justify-between">
              <span>LCP:</span>
              <span className={metrics.lcp > 2500 ? 'text-red-400' : metrics.lcp > 1200 ? 'text-yellow-400' : 'text-green-400'}>
                {metrics.lcp.toFixed(0)}ms
              </span>
            </div>
          )}
          {metrics.fid && (
            <div className="flex justify-between">
              <span>FID:</span>
              <span className={metrics.fid > 300 ? 'text-red-400' : metrics.fid > 100 ? 'text-yellow-400' : 'text-green-400'}>
                {metrics.fid.toFixed(0)}ms
              </span>
            </div>
          )}
          {metrics.cls !== undefined && (
            <div className="flex justify-between">
              <span>CLS:</span>
              <span className={metrics.cls > 0.25 ? 'text-red-400' : metrics.cls > 0.1 ? 'text-yellow-400' : 'text-green-400'}>
                {metrics.cls.toFixed(3)}
              </span>
            </div>
          )}
          {metrics.fcp && (
            <div className="flex justify-between">
              <span>FCP:</span>
              <span className={metrics.fcp > 3000 ? 'text-red-400' : metrics.fcp > 1800 ? 'text-yellow-400' : 'text-green-400'}>
                {metrics.fcp.toFixed(0)}ms
              </span>
            </div>
          )}
          {metrics.memoryUsage && (
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className={metrics.memoryUsage > 50 ? 'text-red-400' : 'text-green-400'}>
                {metrics.memoryUsage.toFixed(1)}MB
              </span>
            </div>
          )}
          {metrics.renderTime && (
            <div className="flex justify-between">
              <span>Render:</span>
              <span className={metrics.renderTime > 16 ? 'text-red-400' : 'text-green-400'}>
                {metrics.renderTime.toFixed(1)}ms
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Interactions:</span>
            <span className="text-blue-400">{interactionCountRef.current}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Hook for performance monitoring
export const usePerformanceMonitoring = (componentName?: string) => {
  const renderStartTime = useRef(performance.now());
  const [renderTime, setRenderTime] = useState<number | null>(null);

  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - renderStartTime.current;
    setRenderTime(duration);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${componentName || 'Component'} render time: ${duration.toFixed(2)}ms`);

      if (duration > 16) {
        console.warn(`⚠️ ${componentName || 'Component'} slow render: ${duration.toFixed(2)}ms`);
      }
    }
  }, [componentName]);

  return { renderTime };
};

// Component wrapper for performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const PerformanceWrappedComponent = (props: P) => {
    const { renderTime } = usePerformanceMonitoring(componentName || WrappedComponent.name);

    return <WrappedComponent {...props} />;
  };

  PerformanceWrappedComponent.displayName = `withPerformanceTracking(${componentName || WrappedComponent.name})`;

  return PerformanceWrappedComponent;
}
