import React from "react";
import { config } from "@/lib/config";

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  context?: Record<string, unknown>;
}

interface UserAction {
  action: string;
  duration?: number;
  success: boolean;
  context?: Record<string, unknown>;
}

// Performance tracking
export function trackPageLoad(
  pageName: string,
  additionalContext?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;

  try {
    const loadTime = performance.now();
    const navigationEntry = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;

    const metrics: PerformanceMetric = {
      name: "page_load",
      value: Math.round(loadTime),
      timestamp: new Date(),
      context: {
        pageName,
        domContentLoaded:
          navigationEntry?.domContentLoadedEventEnd -
          navigationEntry?.domContentLoadedEventStart,
        loadComplete:
          navigationEntry?.loadEventEnd - navigationEntry?.loadEventStart,
        ...additionalContext,
      },
    };

    // Send to analytics in production
    if (config.monitoring.enablePerformanceTracking) {
      sendToAnalytics("performance", metrics);
    }

    // Log in development
    if (config.features.enableDebugMode) {
      console.group("📊 Performance Metrics");
      console.log("Page:", pageName);
      console.log("Load Time:", Math.round(loadTime), "ms");
      console.log(
        "DOM Content Loaded:",
        metrics.context?.domContentLoaded,
        "ms"
      );
      console.log("Load Complete:", metrics.context?.loadComplete, "ms");
      console.groupEnd();
    }
  } catch (error) {
    console.warn("Failed to track page load performance:", error);
  }
}

export function trackUserAction(
  action: string,
  properties?: Record<string, unknown>,
  success: boolean = true
) {
  if (typeof window === "undefined") return;

  try {
    const userAction: UserAction = {
      action,
      success,
      context: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent.slice(0, 100), // Truncate for privacy
        ...properties,
      },
    };

    // Send to analytics in production
    if (config.monitoring.enablePerformanceTracking) {
      sendToAnalytics("user_action", userAction);
    }

    // Log in development
    if (config.features.enableDebugMode) {
      console.log("🎯 User Action:", action, success ? "✅" : "❌", properties);
    }
  } catch (error) {
    console.warn("Failed to track user action:", error);
  }
}

export function trackComponentRender(
  componentName: string,
  renderTime: number
) {
  if (typeof window === "undefined") return;

  try {
    const metric: PerformanceMetric = {
      name: "component_render",
      value: renderTime,
      timestamp: new Date(),
      context: {
        componentName,
        url: window.location.pathname,
      },
    };

    // Only track slow renders
    if (renderTime > 16) {
      // More than one frame at 60fps
      if (config.monitoring.enablePerformanceTracking) {
        sendToAnalytics("performance", metric);
      }

      if (config.features.enableDebugMode) {
        console.warn(
          `🐌 Slow render detected: ${componentName} took ${renderTime}ms`
        );
      }
    }
  } catch (error) {
    console.warn("Failed to track component render:", error);
  }
}

export function trackApiCall(
  endpoint: string,
  method: string,
  duration: number,
  success: boolean,
  statusCode?: number
) {
  try {
    const metric: PerformanceMetric = {
      name: "api_call",
      value: duration,
      timestamp: new Date(),
      context: {
        endpoint,
        method,
        success,
        statusCode,
      },
    };

    // Send to analytics in production
    if (config.monitoring.enablePerformanceTracking) {
      sendToAnalytics("performance", metric);
    }

    // Log slow or failed API calls in development
    if (config.features.enableDebugMode && (!success || duration > 2000)) {
      console.warn(`🌐 API Call ${success ? "slow" : "failed"}:`, {
        endpoint,
        method,
        duration: `${duration}ms`,
        success,
        statusCode,
      });
    }
  } catch (error) {
    console.warn("Failed to track API call:", error);
  }
}

// Core Web Vitals tracking
export function trackCoreWebVitals() {
  if (typeof window === "undefined") return;

  try {
    // Track First Contentful Paint (FCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          trackMetric("core_web_vitals", "FCP", entry.startTime);
        }
      });
    }).observe({ entryTypes: ["paint"] });

    // Track Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        trackMetric("core_web_vitals", "LCP", entry.startTime);
      });
    }).observe({ entryTypes: ["largest-contentful-paint"] });

    // Track Cumulative Layout Shift (CLS)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let clsValue = 0;
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      if (clsValue > 0) {
        trackMetric("core_web_vitals", "CLS", clsValue);
      }
    }).observe({ entryTypes: ["layout-shift"] });

    // Track First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        trackMetric(
          "core_web_vitals",
          "FID",
          entry.processingStart - entry.startTime
        );
      });
    }).observe({ entryTypes: ["first-input"] });
  } catch (error) {
    console.warn("Failed to track Core Web Vitals:", error);
  }
}

// Memory usage tracking
export function trackMemoryUsage() {
  if (typeof window === "undefined" || !("memory" in performance)) return;

  try {
    const memory = (performance as any).memory;
    const memoryMetric: PerformanceMetric = {
      name: "memory_usage",
      value: memory.usedJSHeapSize,
      timestamp: new Date(),
      context: {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      },
    };

    // Only track if memory usage is high
    const usagePercentage = memoryMetric.context?.usagePercentage as number;
    if (usagePercentage > 70) {
      if (config.monitoring.enablePerformanceTracking) {
        sendToAnalytics("performance", memoryMetric);
      }

      if (config.features.enableDebugMode) {
        console.warn("🧠 High memory usage detected:", memoryMetric.context);
      }
    }
  } catch (error) {
    console.warn("Failed to track memory usage:", error);
  }
}

// Bundle size tracking
export function trackBundleLoad(bundleName: string, loadTime: number) {
  try {
    const metric: PerformanceMetric = {
      name: "bundle_load",
      value: loadTime,
      timestamp: new Date(),
      context: {
        bundleName,
      },
    };

    if (config.monitoring.enablePerformanceTracking) {
      sendToAnalytics("performance", metric);
    }

    if (config.features.enableDebugMode) {
      console.log(`📦 Bundle loaded: ${bundleName} (${loadTime}ms)`);
    }
  } catch (error) {
    console.warn("Failed to track bundle load:", error);
  }
}

// Utility function to send metrics to analytics service
function sendToAnalytics(type: string, data: any) {
  try {
    // TODO: Replace with actual analytics service integration
    // Examples: Google Analytics, Mixpanel, Amplitude, etc.

    // For now, we'll use console.log in non-development environments
    if (!config.features.enableDebugMode) {
      console.log(`Analytics [${type}]:`, data);
    }

    // Example integrations:

    // Google Analytics 4
    // if (typeof gtag !== 'undefined') {
    //   gtag('event', type, {
    //     custom_parameter_1: data.name,
    //     custom_parameter_2: data.value,
    //     custom_parameter_3: JSON.stringify(data.context),
    //   });
    // }

    // Mixpanel
    // if (typeof mixpanel !== 'undefined') {
    //   mixpanel.track(type, data);
    // }

    // Custom analytics endpoint
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ type, data }),
    // });
  } catch (error) {
    console.warn("Failed to send analytics:", error);
  }
}

// Helper function for tracking metrics
function trackMetric(category: string, name: string, value: number) {
  const metric: PerformanceMetric = {
    name: `${category}_${name}`,
    value,
    timestamp: new Date(),
    context: {
      category,
      metricName: name,
    },
  };

  if (config.monitoring.enablePerformanceTracking) {
    sendToAnalytics("performance", metric);
  }

  if (config.features.enableDebugMode) {
    console.log(`📈 ${category} ${name}:`, `${value}ms`);
  }
}

// React hook for component performance tracking
export function usePerformanceTracker(componentName: string) {
  const startTime = performance.now();

  return {
    track: () => {
      const renderTime = performance.now() - startTime;
      trackComponentRender(componentName, renderTime);
    },
  };
}

// Higher-order component for automatic performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const name =
      componentName || Component.displayName || Component.name || "Unknown";
    const { track } = usePerformanceTracker(name);

    React.useEffect(() => {
      track();
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceTracking(${
    componentName || "Component"
  })`;

  return WrappedComponent;
}
