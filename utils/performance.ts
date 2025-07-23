/**
 * 性能监控和优化工具
 */
import React from 'react';

// 性能指标接口
export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

// 性能监控类
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  /**
   * 初始化性能观察器
   */
  private initializeObservers() {
    if (typeof window === 'undefined') return;

    try {
      // 监控导航性能
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric(`navigation-${entry.name}`, {
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            metadata: {
              type: entry.entryType,
              transferSize: (entry as any).transferSize,
              encodedBodySize: (entry as any).encodedBodySize
            }
          });
        });
      });

      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // 监控资源加载性能
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 100) { // 只记录耗时超过100ms的资源
            this.recordMetric(`resource-${entry.name}`, {
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration,
              metadata: {
                type: entry.entryType,
                transferSize: (entry as any).transferSize,
                initiatorType: (entry as any).initiatorType
              }
            });
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // 监控用户交互性能
      const measureObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric(`measure-${entry.name}`, {
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            metadata: {
              type: entry.entryType
            }
          });
        });
      });

      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);

    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }

  /**
   * 开始性能测量
   */
  startMeasure(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetrics = {
      name,
      startTime: performance.now(),
      metadata
    };
    this.metrics.set(name, metric);
  }

  /**
   * 结束性能测量
   */
  endMeasure(name: string): PerformanceMetrics | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance measure "${name}" not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // 创建Performance API标记
    if (typeof window !== 'undefined' && window.performance) {
      try {
        performance.mark(`${name}-start`);
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (error) {
        console.warn('Failed to create performance marks:', error);
      }
    }

    return metric;
  }

  /**
   * 记录性能指标
   */
  recordMetric(name: string, metric: Partial<PerformanceMetrics>): void {
    const fullMetric: PerformanceMetrics = {
      name,
      startTime: performance.now(),
      ...metric
    };
    this.metrics.set(name, fullMetric);
  }

  /**
   * 获取所有性能指标
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 获取特定性能指标
   */
  getMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name);
  }

  /**
   * 清除所有性能指标
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * 生成性能报告
   */
  generateReport(): {
    summary: {
      totalMetrics: number;
      averageDuration: number;
      slowestOperation: PerformanceMetrics | null;
      fastestOperation: PerformanceMetrics | null;
    };
    details: PerformanceMetrics[];
  } {
    const metrics = this.getMetrics();
    const metricsWithDuration = metrics.filter(m => m.duration !== undefined);

    const totalDuration = metricsWithDuration.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = metricsWithDuration.length > 0 ? totalDuration / metricsWithDuration.length : 0;

    const slowestOperation = metricsWithDuration.reduce((slowest, current) => {
      return (current.duration || 0) > (slowest?.duration || 0) ? current : slowest;
    }, null as PerformanceMetrics | null);

    const fastestOperation = metricsWithDuration.reduce((fastest, current) => {
      return (current.duration || 0) < (fastest?.duration || Infinity) ? current : fastest;
    }, null as PerformanceMetrics | null);

    return {
      summary: {
        totalMetrics: metrics.length,
        averageDuration,
        slowestOperation,
        fastestOperation
      },
      details: metrics
    };
  }

  /**
   * 销毁监控器
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 性能装饰器
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const measureName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startMeasure(measureName, {
        className: target.constructor.name,
        methodName: propertyKey,
        args: args.length
      });

      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endMeasure(measureName);
        return result;
      } catch (error) {
        performanceMonitor.endMeasure(measureName);
        throw error;
      }
    };

    return descriptor;
  };
}

// React组件性能监控Hook
export function usePerformanceMonitor(componentName: string) {
  React.useEffect(() => {
    const mountTime = `${componentName}-mount`;
    performanceMonitor.startMeasure(mountTime);

    return () => {
      performanceMonitor.endMeasure(mountTime);
    };
  }, [componentName]);

  const measureRender = React.useCallback((renderName: string = 'render') => {
    const measureName = `${componentName}-${renderName}`;
    performanceMonitor.startMeasure(measureName);

    // 在下一个事件循环中结束测量
    setTimeout(() => {
      performanceMonitor.endMeasure(measureName);
    }, 0);
  }, [componentName]);

  return { measureRender };
}

// 内存使用监控
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} | null {
  if (typeof window === 'undefined' || !(performance as any).memory) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
  };
}

// 网络性能监控
export function measureNetworkRequest(url: string, options?: RequestInit) {
  const measureName = `network-${url}`;
  performanceMonitor.startMeasure(measureName, {
    url,
    method: options?.method || 'GET'
  });

  return fetch(url, options)
    .then(response => {
      performanceMonitor.endMeasure(measureName);
      return response;
    })
    .catch(error => {
      performanceMonitor.endMeasure(measureName);
      throw error;
    });
}

// 图片加载性能监控
export function measureImageLoad(src: string): Promise<HTMLImageElement> {
  const measureName = `image-${src}`;
  performanceMonitor.startMeasure(measureName, { src });

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      performanceMonitor.endMeasure(measureName);
      resolve(img);
    };
    
    img.onerror = (error) => {
      performanceMonitor.endMeasure(measureName);
      reject(error);
    };
    
    img.src = src;
  });
}

// 延迟加载工具
export function createLazyLoader<T>(
  loader: () => Promise<T>,
  name: string
): () => Promise<T> {
  let loadPromise: Promise<T> | null = null;

  return () => {
    if (!loadPromise) {
      const measureName = `lazy-load-${name}`;
      performanceMonitor.startMeasure(measureName);
      
      loadPromise = loader().then(result => {
        performanceMonitor.endMeasure(measureName);
        return result;
      }).catch(error => {
        performanceMonitor.endMeasure(measureName);
        loadPromise = null; // 重置以允许重试
        throw error;
      });
    }
    
    return loadPromise;
  };
}

// 防抖函数（性能优化）
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 节流函数（性能优化）
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
