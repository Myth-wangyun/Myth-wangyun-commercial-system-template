// 监控和日志工具
import type { ErrorInfo as ReactErrorInfo } from 'react'

export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  errorBoundary?: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

export interface PerformanceInfo {
  name: string;
  value: number;
  timestamp: number;
  url: string;
}

class MonitoringService {
  private errorQueue: ErrorInfo[] = [];
  private performanceQueue: PerformanceInfo[] = [];
  private maxQueueSize = 100;

  constructor() {
    this.setupErrorHandling();
    this.setupPerformanceMonitoring();
  }

  // 设置全局错误处理
  private setupErrorHandling() {
    // 捕获未处理的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    });

    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    });
  }

  // 设置性能监控
  private setupPerformanceMonitoring() {
    // 监控页面加载性能
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        this.capturePerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
        this.capturePerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
        this.capturePerformance('first_paint', this.getFirstPaint());
        this.capturePerformance('first_contentful_paint', this.getFirstContentfulPaint());
      }, 0);
    });

    // 监控资源加载性能
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.capturePerformance(`resource_${entry.name}`, entry.duration);
        }
      }
    });
    observer.observe({ entryTypes: ['resource'] });
  }

  // 获取首次绘制时间
  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  // 获取首次内容绘制时间
  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
  }

  // 捕获错误
  public captureError(error: ErrorInfo) {
    this.errorQueue.push(error);
    
    // 限制队列大小
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // 在开发环境下打印错误
    if (process.env.NODE_ENV === 'development') {
      console.error('Captured Error:', error);
    }

    // 发送错误到监控服务
    this.sendErrors();
  }

  // 捕获性能指标
  public capturePerformance(name: string, value: number) {
    const performanceInfo: PerformanceInfo = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
    };

    this.performanceQueue.push(performanceInfo);

    // 限制队列大小
    if (this.performanceQueue.length > this.maxQueueSize) {
      this.performanceQueue.shift();
    }

    // 发送性能数据到监控服务
    this.sendPerformance();
  }

  // 发送错误数据
  private async sendErrors() {
    if (this.errorQueue.length === 0) return;

    try {
      // 这里可以发送到实际的监控服务
      // 例如：Sentry, Bugsnag, 或自定义的监控API
      console.log('Sending errors to monitoring service:', this.errorQueue);
      
      // 模拟发送到监控服务
      // await fetch('/api/monitoring/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(this.errorQueue),
      // });

      // 清空队列
      this.errorQueue = [];
    } catch (error) {
      console.error('Failed to send errors to monitoring service:', error);
    }
  }

  // 发送性能数据
  private async sendPerformance() {
    if (this.performanceQueue.length === 0) return;

    try {
      // 这里可以发送到实际的监控服务
      console.log('Sending performance data to monitoring service:', this.performanceQueue);
      
      // 模拟发送到监控服务
      // await fetch('/api/monitoring/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(this.performanceQueue),
      // });

      // 清空队列
      this.performanceQueue = [];
    } catch (error) {
      console.error('Failed to send performance data to monitoring service:', error);
    }
  }

  // 手动发送所有数据
  public flush() {
    this.sendErrors();
    this.sendPerformance();
  }

  // 获取错误统计
  public getErrorStats() {
    return {
      totalErrors: this.errorQueue.length,
      errors: this.errorQueue,
    };
  }

  // 获取性能统计
  public getPerformanceStats() {
    return {
      totalMetrics: this.performanceQueue.length,
      metrics: this.performanceQueue,
    };
  }
}

// 创建全局监控实例
export const monitoring = new MonitoringService();

// 导出React错误边界Hook
export const useErrorBoundary = () => {
  const captureError = (error: Error, errorInfo?: ReactErrorInfo) => {
    monitoring.captureError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  };

  return { captureError };
};

// 导出性能监控Hook
export const usePerformanceMonitoring = () => {
  const capturePerformance = (name: string, value: number) => {
    monitoring.capturePerformance(name, value);
  };

  return { capturePerformance };
};
