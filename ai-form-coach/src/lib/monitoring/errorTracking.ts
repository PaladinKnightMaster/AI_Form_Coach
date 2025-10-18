/**
 * Comprehensive Error Tracking and Analytics System
 * Provides detailed error monitoring, performance tracking, and user analytics
 */

export interface ErrorEvent {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  url?: string;
}

export interface PerformanceEvent {
  id: string;
  timestamp: Date;
  metric: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  userId?: string;
  sessionId?: string;
  component?: string;
  metadata?: Record<string, unknown>;
}

export interface UserAnalytics {
  userId: string;
  sessionId: string;
  timestamp: Date;
  event: string;
  properties?: Record<string, unknown>;
  page?: string;
  referrer?: string;
}

class ErrorTracker {
  private errors: ErrorEvent[] = [];
  private performanceMetrics: PerformanceEvent[] = [];
  private userAnalytics: UserAnalytics[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Global error handler
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError({
          level: 'error',
          message: event.message,
          stack: event.error?.stack,
          component: 'global',
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        });
      });

      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          level: 'error',
          message: `Unhandled Promise Rejection: ${event.reason}`,
          stack: event.reason?.stack,
          component: 'promise',
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            reason: event.reason
          }
        });
      });
    }
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor page load performance
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        this.trackPerformance({
          metric: 'page_load_time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          unit: 'ms',
          component: 'page_load',
          metadata: {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            firstPaint: this.getFirstPaintTime(),
            firstContentfulPaint: this.getFirstContentfulPaintTime()
          }
        });
      });

      // Monitor API response times
      this.interceptFetch();
    }
  }

  private getFirstPaintTime(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  private getFirstContentfulPaintTime(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
  }

  private interceptFetch(): void {
    if (typeof window !== 'undefined' && 'fetch' in window) {
      const originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        const startTime = performance.now();
        const url = args[0]?.toString() || 'unknown';
        
        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          
          this.trackPerformance({
            metric: 'api_response_time',
            value: endTime - startTime,
            unit: 'ms',
            component: 'api',
            metadata: {
              url,
              status: response.status,
              method: args[1]?.method || 'GET'
            }
          });
          
          return response;
        } catch (error) {
          const endTime = performance.now();
          
          this.trackError({
            level: 'error',
            message: `API Request Failed: ${error}`,
            component: 'api',
            metadata: {
              url,
              method: args[1]?.method || 'GET',
              responseTime: endTime - startTime
            }
          });
          
          throw error;
        }
      };
    }
  }

  public trackError(error: Omit<ErrorEvent, 'id' | 'timestamp'>): void {
    const errorEvent: ErrorEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      ...error
    };

    this.errors.push(errorEvent);
    this.sendToAnalytics('error', errorEvent);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Tracked:', errorEvent);
    }
  }

  public trackPerformance(metric: Omit<PerformanceEvent, 'id' | 'timestamp'>): void {
    const performanceEvent: PerformanceEvent = {
      id: this.generateId(),
      timestamp: new Date(),
      ...metric
    };

    this.performanceMetrics.push(performanceEvent);
    this.sendToAnalytics('performance', performanceEvent);
  }

  public trackUserEvent(event: Omit<UserAnalytics, 'sessionId' | 'timestamp'>): void {
    const userEvent: UserAnalytics = {
      sessionId: this.sessionId,
      timestamp: new Date(),
      ...event
    };

    this.userAnalytics.push(userEvent);
    this.sendToAnalytics('user_event', userEvent);
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendToAnalytics(type: string, data: unknown): Promise<void> {
    try {
      // In production, send to your analytics service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            data,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
          })
        });
      }
    } catch (error) {
      // Don't let analytics errors break the app
      console.warn('Failed to send analytics data:', error);
    }
  }

  public getErrorSummary(): {
    totalErrors: number;
    errorsByLevel: Record<string, number>;
    errorsByComponent: Record<string, number>;
    recentErrors: ErrorEvent[];
  } {
    const totalErrors = this.errors.length;
    const errorsByLevel = this.errors.reduce((acc, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByComponent = this.errors.reduce((acc, error) => {
      const component = error.component || 'unknown';
      acc[component] = (acc[component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = this.errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalErrors,
      errorsByLevel,
      errorsByComponent,
      recentErrors
    };
  }

  public getPerformanceSummary(): {
    averageResponseTime: number;
    slowestRequests: PerformanceEvent[];
    performanceByComponent: Record<string, number>;
  } {
    const apiMetrics = this.performanceMetrics.filter(m => m.metric === 'api_response_time');
    const averageResponseTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length 
      : 0;

    const slowestRequests = this.performanceMetrics
      .filter(m => m.metric === 'api_response_time')
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const performanceByComponent = this.performanceMetrics.reduce((acc, metric) => {
      const component = metric.component || 'unknown';
      if (!acc[component]) {
        acc[component] = [];
      }
      acc[component].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate averages for each component
    const avgPerformanceByComponent = Object.entries(performanceByComponent).reduce((acc, [component, values]) => {
      acc[component] = values.reduce((sum, val) => sum + val, 0) / values.length;
      return acc;
    }, {} as Record<string, number>);

    return {
      averageResponseTime,
      slowestRequests,
      performanceByComponent: avgPerformanceByComponent
    };
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public clearData(): void {
    this.errors = [];
    this.performanceMetrics = [];
    this.userAnalytics = [];
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Convenience functions
export const trackError = (error: Omit<ErrorEvent, 'id' | 'timestamp'>) => {
  errorTracker.trackError(error);
};

export const trackPerformance = (metric: Omit<PerformanceEvent, 'id' | 'timestamp'>) => {
  errorTracker.trackPerformance(metric);
};

export const trackUserEvent = (event: Omit<UserAnalytics, 'sessionId' | 'timestamp'>) => {
  errorTracker.trackUserEvent(event);
};

export const getErrorSummary = () => errorTracker.getErrorSummary();
export const getPerformanceSummary = () => errorTracker.getPerformanceSummary();
export const getSessionId = () => errorTracker.getSessionId();
